import { getAppInfo } from "@lib/order";
import { type PanelModel, type SerializedPanel } from "@lib/panelTypes";
import { deserializePanelModel, serializePanelModel } from "@lib/serialization";

/** The page a design is shared at: /p/<code>. vercel.json sends it to api/share-page.ts. */
export const SHARE_PATH_PREFIX = "/p/";

/**
 * The editor opens the shared design this query parameter names, then drops it from the address.
 * api/share-page.ts falls back on it when it cannot serve the shared page.
 */
export const OPEN_DESIGN_PARAM = "design";

/** The site's address as the share card prints it: production's, whichever deployment draws it. */
export const SHARE_CARD_SITE = "eurorackpanel.com";

/** A panel's size as people name it: in HP on Eurorack, in cm on Kosmo, in mm for a custom size. */
export type PanelSize =
  | { kind: "eurorack"; widthHp: number; rackUnits: number }
  | { kind: "kosmo"; widthCm: number }
  | { kind: "custom"; widthMm: number; heightMm: number };

export function describePanelSize(model: PanelModel): PanelSize {
  const { dimensions, format } = model;
  if (format.custom) {
    return { kind: "custom", widthMm: dimensions.widthMm, heightMm: dimensions.heightMm };
  }
  if (format.system === "kosmo") {
    return { kind: "kosmo", widthCm: dimensions.widthCm };
  }
  return { kind: "eurorack", widthHp: dimensions.widthHp, rackUnits: format.rackUnits };
}

/** A design shared by link, as its page shows it. */
export interface SharedDesign {
  code: string;
  name: string;
  /** The size as the person who shared it read it, e.g. "12 HP". */
  size: string;
  createdAt: string;
  app: { version: string; commit: string };
  model: PanelModel;
}

/** Failed share request, with the HTTP status (0 when the request did not reach the server). */
export class ShareRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ShareRequestError";
    this.status = status;
  }
}

function readCodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment) || null;
  } catch {
    return segment || null;
  }
}

/** The code of a shared design's page, from its path, or null on any other page. */
export function readShareCodeFromPath(pathname: string): string | null {
  if (!pathname.startsWith(SHARE_PATH_PREFIX)) {
    return null;
  }
  return readCodeSegment(pathname.slice(SHARE_PATH_PREFIX.length).split("/")[0] ?? "");
}

/** The shared design the editor was asked to open, from the query string, or null. */
export function readOpenDesignParam(search: string): string | null {
  const code = new URLSearchParams(search).get(OPEN_DESIGN_PARAM)?.trim();
  return code || null;
}

export function sharePageUrl(code: string, origin: string): string {
  return `${origin}${SHARE_PATH_PREFIX}${encodeURIComponent(code)}`;
}

/** Where the editor opens a copy of a shared design. */
export function openDesignUrl(code: string): string {
  return `/?${OPEN_DESIGN_PARAM}=${encodeURIComponent(code)}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return text || `Share request failed (${response.status}).`;
}

interface CreateShareInput {
  /** The design as it is shared: hidden components are left out by the caller. */
  model: PanelModel;
  name: string;
  size: string;
  /** The card the link shows, as a PNG data URL. */
  cardDataUrl: string;
}

/** Stores a design and its card, and returns the code of its page, e.g. "7K3Q9XMB". */
export async function createShare({
  model,
  name,
  size,
  cardDataUrl,
}: CreateShareInput): Promise<string> {
  const design = JSON.parse(serializePanelModel(model)) as SerializedPanel;
  const card = cardDataUrl.slice(cardDataUrl.indexOf(",") + 1);
  let response: Response;
  try {
    response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ design, name, size, card, app: getAppInfo() }),
    });
  } catch (error) {
    throw new ShareRequestError(error instanceof Error ? error.message : String(error), 0);
  }
  if (!response.ok) {
    throw new ShareRequestError(await readErrorMessage(response), response.status);
  }
  const { code } = (await response.json()) as { code?: unknown };
  if (typeof code !== "string" || !code) {
    throw new ShareRequestError("The share response has no code.", response.status);
  }
  return code;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Loads the design shared under a code. */
export async function fetchSharedDesign(code: string): Promise<SharedDesign> {
  let response: Response;
  try {
    response = await fetch(`/api/share?code=${encodeURIComponent(code)}`);
  } catch (error) {
    throw new ShareRequestError(error instanceof Error ? error.message : String(error), 0);
  }
  if (!response.ok) {
    throw new ShareRequestError(await readErrorMessage(response), response.status);
  }
  const record = (await response.json()) as Record<string, unknown>;
  const app = (record.app ?? {}) as Record<string, unknown>;
  return {
    code: readString(record.code) || code,
    name: readString(record.name),
    size: readString(record.size),
    createdAt: readString(record.createdAt),
    app: { version: readString(app.version), commit: readString(app.commit) },
    model: deserializePanelModel(record.design as SerializedPanel),
  };
}
