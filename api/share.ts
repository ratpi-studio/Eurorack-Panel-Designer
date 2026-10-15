import { randomBytes } from "node:crypto";

import { get, put } from "@vercel/blob";

import {
  SHARE_CODE_ALPHABET,
  SHARE_CODE_LENGTH,
  readShareCode,
  shareCardPath,
  shareDesignPath,
} from "./_share";

// Stores the designs shared by link, with the card their link shows in chats and forums, under a
// short code: /p/<code> opens a read-only page of the design, /p/<code>/card.png is its card.
// Anyone may share without an account, so sizes are capped here, and /api/share deserves the same
// Vercel Firewall rate limit as /api/order: each share costs Blob operations, capped on Hobby.

// Vercel refuses request bodies over 4.5 MB before the function runs.
const MAX_BODY_CHARS = 4 * 1024 * 1024;
const MAX_CARD_BYTES = 1.5 * 1024 * 1024;
const MAX_NAME_LENGTH = 80;
const MAX_SIZE_LENGTH = 40;
const MAX_APP_FIELD_LENGTH = 64;
const DEFAULT_NAME = "Untitled panel";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// A share never changes once stored.
const IMMUTABLE = "public, max-age=3600, s-maxage=31536000, immutable";

function textResponse(message: string, status: number): Response {
  return new Response(message, { status, headers: { "Cache-Control": "no-store" } });
}

function generateCode(): string {
  return Array.from(randomBytes(SHARE_CODE_LENGTH), (byte) => SHARE_CODE_ALPHABET[byte & 31]).join(
    "",
  );
}

/** Whether a body looks like a serialized design: a version, and a model with dimensions and elements. */
function isSerializedDesign(design: unknown): boolean {
  if (typeof design !== "object" || design === null) {
    return false;
  }
  const { version, model } = design as { version?: unknown; model?: unknown };
  if (typeof version !== "number" || typeof model !== "object" || model === null) {
    return false;
  }
  const { dimensions, elements } = model as { dimensions?: unknown; elements?: unknown };
  return Array.isArray(elements) && typeof dimensions === "object" && dimensions !== null;
}

/** A short text on one line, or "" when absent. */
function readText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

/** The card's PNG bytes from their base64, or null when they are not a PNG of a sensible size. */
function readCard(value: unknown): Buffer | null {
  if (typeof value !== "string" || value.length > Math.ceil(MAX_CARD_BYTES / 3) * 4) {
    return null;
  }
  const bytes = Buffer.from(value, "base64");
  if (bytes.length <= PNG_SIGNATURE.length || bytes.length > MAX_CARD_BYTES) {
    return null;
  }
  return bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ? bytes : null;
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
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_CHARS) {
    return textResponse("Payload too large", 413);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return textResponse("Payload too large", 413);
  }

  let body: { design?: unknown; name?: unknown; size?: unknown; card?: unknown; app?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return textResponse("Invalid JSON", 400);
  }
  if (typeof body !== "object" || body === null) {
    return textResponse("Invalid body", 400);
  }
  if (!isSerializedDesign(body.design)) {
    return textResponse("Invalid design", 400);
  }
  const card = readCard(body.card);
  if (!card) {
    return textResponse("Invalid card", 400);
  }

  const name = readText(body.name, MAX_NAME_LENGTH) || DEFAULT_NAME;
  const size = readText(body.size, MAX_SIZE_LENGTH);
  const createdAt = new Date().toISOString();
  const app = readAppInfo(body.app);
  // `put` refuses to overwrite an existing share: on a clash, try once more with another code.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const code = generateCode();
    const record = { code, createdAt, name, size, app, design: body.design };
    try {
      await put(shareDesignPath(code), JSON.stringify(record), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      });
    } catch (error) {
      console.error("Could not store the shared design", error);
      continue;
    }
    // The design stores first: without its card, the link still works and shows the site's card.
    try {
      await put(shareCardPath(code), card, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
      });
    } catch (error) {
      console.error("Could not store the share card", error);
    }
    return new Response(JSON.stringify({ code }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  return textResponse("Could not store the design", 500);
}

/** The shared design as JSON, or with `card` (or at /p/<code>/card.png) its card as a PNG. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = readShareCode(url);
  if (!code) {
    return textResponse("Invalid code", 400);
  }
  const wantsCard = url.searchParams.has("card") || url.pathname.endsWith("/card.png");

  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(wantsCard ? shareCardPath(code) : shareDesignPath(code), {
      access: "public",
    });
  } catch (error) {
    console.error("Could not read the share", error);
    return textResponse("Could not read the share", 502);
  }
  if (!result || result.statusCode !== 200) {
    // A share whose card did not store still gets a preview: the site's own.
    return wantsCard
      ? Response.redirect(new URL("/images/og.png", url), 302)
      : textResponse("Design not found", 404);
  }
  return new Response(result.stream, {
    status: 200,
    headers: {
      "Content-Type": wantsCard ? "image/png" : "application/json",
      "Cache-Control": IMMUTABLE,
    },
  });
}
