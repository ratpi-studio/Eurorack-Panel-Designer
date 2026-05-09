import { put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const ID_BYTES = 5;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_BASE_EUR = 8;
const DEFAULT_PER_HP_EUR = 1.5;

interface IncomingOrderBody {
  panelJson?: unknown;
  thumbnailDataUrl?: unknown;
  panelColor?: unknown;
  designColor?: unknown;
  widthHp?: unknown;
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_REGEX.test(value);
}

function parseEnvNumber(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function calculatePriceEur(widthHp: number): number {
  const base = parseEnvNumber(process.env.PRICE_BASE_EUR, DEFAULT_BASE_EUR);
  const perHp = parseEnvNumber(process.env.PRICE_PER_HP_EUR, DEFAULT_PER_HP_EUR);
  const total = base + widthHp * perHp;
  return Math.round(total * 100) / 100;
}

function generateId(): string {
  return randomBytes(ID_BYTES).toString("hex");
}

function decodeDataUrl(dataUrl: string): Buffer | null {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return null;
  }
  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  const rawLength = Number(req.headers["content-length"] ?? 0);
  if (Number.isFinite(rawLength) && rawLength > MAX_BODY_BYTES) {
    res.status(413).send("Payload too large");
    return;
  }

  const body = req.body as IncomingOrderBody | undefined;
  if (!body || typeof body !== "object") {
    res.status(400).send("Invalid body");
    return;
  }

  const { panelJson, thumbnailDataUrl, panelColor, designColor, widthHp } = body;

  if (
    typeof panelJson !== "string" ||
    panelJson.length === 0 ||
    panelJson.length > MAX_BODY_BYTES
  ) {
    res.status(400).send("Invalid panelJson");
    return;
  }
  try {
    JSON.parse(panelJson);
  } catch {
    res.status(400).send("panelJson is not valid JSON");
    return;
  }

  if (!isHexColor(panelColor) || !isHexColor(designColor)) {
    res.status(400).send("Invalid color");
    return;
  }

  const widthHpValue = typeof widthHp === "number" ? widthHp : Number(widthHp);
  if (!Number.isFinite(widthHpValue) || widthHpValue < 1 || widthHpValue > 128) {
    res.status(400).send("Invalid widthHp");
    return;
  }

  if (typeof thumbnailDataUrl !== "string") {
    res.status(400).send("Missing thumbnail");
    return;
  }
  const thumbnailBuffer = decodeDataUrl(thumbnailDataUrl);
  if (!thumbnailBuffer || thumbnailBuffer.length > MAX_BODY_BYTES) {
    res.status(400).send("Invalid thumbnail");
    return;
  }

  const id = generateId();
  const priceEur = calculatePriceEur(widthHpValue);
  const createdAt = new Date().toISOString();

  const panelMetadata = JSON.stringify({
    panelJson,
    panelColor,
    designColor,
    widthHp: widthHpValue,
    priceEur,
    createdAt,
  });

  try {
    const [panelBlob, thumbBlob] = await Promise.all([
      put(`orders/${id}/panel.json`, panelMetadata, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      }),
      put(`orders/${id}/thumb.png`, thumbnailBuffer, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
      }),
    ]);

    res.status(201).json({
      id,
      panelUrl: panelBlob.url,
      thumbnailUrl: thumbBlob.url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).send(`Upload failed: ${message}`);
  }
}
