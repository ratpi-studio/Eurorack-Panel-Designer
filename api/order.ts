import { randomBytes } from "node:crypto";

import { get, put } from "@vercel/blob";

// Stores the designs sent from the order dialog under a short code, which buyers paste into the
// Etsy listing's personalization field, and serves them back to the order page.
// New designs are only accepted while the VITE_ORDERING_ENABLED flag is on. Reading stays open, so
// the codes already given keep working, and pending orders can be printed, once ordering is off.

// Mirrors src/lib/orderCatalog.ts; the order API tests check that both agree.
const MAX_WIDTH_HP = 42;
const FILAMENT_IDS: readonly string[] = ["white", "black", "skyBlue"];

const MAX_BODY_CHARS = 2 * 1024 * 1024;
const MAX_APP_FIELD_LENGTH = 64;
// Crockford base32 has no I, L, O or U, so codes survive being retyped from a screen.
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;
const CODE_PREFIX = "EPD";

interface Filaments {
  panel: string;
  details: string;
}

/** Same flag as the order button (src/lib/order.ts), read at runtime here. */
function isOrderingEnabled(): boolean {
  const flag = process.env.VITE_ORDERING_ENABLED?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function textResponse(message: string, status: number): Response {
  return new Response(message, { status, headers: { "Cache-Control": "no-store" } });
}

function generateCode(): string {
  return Array.from(randomBytes(CODE_LENGTH), (byte) => CODE_ALPHABET[byte & 31]).join("");
}

function formatCode(code: string): string {
  return `${CODE_PREFIX}-${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Reads a code the way people type it: any case, with or without prefix and dashes, O for 0. */
function normalizeCode(input: string): string | null {
  let code = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (code.length === CODE_PREFIX.length + CODE_LENGTH && code.startsWith(CODE_PREFIX)) {
    code = code.slice(CODE_PREFIX.length);
  }
  code = code.replace(/O/g, "0").replace(/[IL]/g, "1");
  if (code.length !== CODE_LENGTH || [...code].some((char) => !CODE_ALPHABET.includes(char))) {
    return null;
  }
  return code;
}

function designPath(code: string): string {
  return `orders/${code}/design.json`;
}

/** The panel width of a serialized design, or null when it does not look like one. */
function readWidthHp(design: unknown): number | null {
  if (typeof design !== "object" || design === null) {
    return null;
  }
  const { version, model } = design as { version?: unknown; model?: unknown };
  if (typeof version !== "number" || typeof model !== "object" || model === null) {
    return null;
  }
  const { dimensions, elements } = model as { dimensions?: unknown; elements?: unknown };
  if (!Array.isArray(elements) || typeof dimensions !== "object" || dimensions === null) {
    return null;
  }
  const { widthHp } = dimensions as { widthHp?: unknown };
  return typeof widthHp === "number" ? widthHp : null;
}

function readFilaments(value: unknown): Filaments | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { panel, details } = value as { panel?: unknown; details?: unknown };
  if (
    typeof panel !== "string" ||
    typeof details !== "string" ||
    !FILAMENT_IDS.includes(panel) ||
    !FILAMENT_IDS.includes(details)
  ) {
    return null;
  }
  return { panel, details };
}

/** Which version of the app made the design, to reproduce it if exports change later. */
function readAppInfo(value: unknown): { version: string; commit: string } {
  const source = typeof value === "object" && value !== null ? value : {};
  const field = (key: "version" | "commit") => {
    const raw = (source as Record<string, unknown>)[key];
    return typeof raw === "string" ? raw.slice(0, MAX_APP_FIELD_LENGTH) : "";
  };
  return { version: field("version"), commit: field("commit") };
}

export async function POST(request: Request): Promise<Response> {
  if (!isOrderingEnabled()) {
    return textResponse("Not found", 404);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_CHARS) {
    return textResponse("Payload too large", 413);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return textResponse("Payload too large", 413);
  }

  let body: { design?: unknown; filaments?: unknown; app?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return textResponse("Invalid JSON", 400);
  }
  if (typeof body !== "object" || body === null) {
    return textResponse("Invalid body", 400);
  }

  const widthHp = readWidthHp(body.design);
  if (widthHp === null) {
    return textResponse("Invalid design", 400);
  }
  if (!Number.isInteger(widthHp) || widthHp < 1 || widthHp > MAX_WIDTH_HP) {
    return textResponse("Width not available", 400);
  }
  const filaments = readFilaments(body.filaments);
  if (!filaments) {
    return textResponse("Invalid filaments", 400);
  }

  const createdAt = new Date().toISOString();
  const app = readAppInfo(body.app);
  // `put` refuses to overwrite an existing design: on a clash, try once more with another code.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const code = generateCode();
    const record = {
      code: formatCode(code),
      createdAt,
      widthHp,
      filaments,
      app,
      design: body.design,
    };
    try {
      await put(designPath(code), JSON.stringify(record), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      });
      return new Response(JSON.stringify({ code: record.code }), {
        status: 201,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    } catch (error) {
      console.error("Could not store the design", error);
    }
  }
  return textResponse("Could not store the design", 500);
}

export async function GET(request: Request): Promise<Response> {
  const code = normalizeCode(new URL(request.url).searchParams.get("code") ?? "");
  if (!code) {
    return textResponse("Invalid code", 400);
  }

  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(designPath(code), { access: "public" });
  } catch (error) {
    console.error("Could not read the design", error);
    return textResponse("Could not read the design", 502);
  }
  if (!result || result.statusCode !== 200) {
    return textResponse("Design not found", 404);
  }
  // A design never changes once stored.
  return new Response(result.stream, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
    },
  });
}
