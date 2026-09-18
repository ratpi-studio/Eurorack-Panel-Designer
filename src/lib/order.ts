import { changelogEntries } from "@lib/changelog";
import { hasDesignElements } from "@lib/designLayer";
import { computeElementMountingHoles } from "@lib/elementMountingHoles";
import { getVisibleElements, isElementHidden, withoutHiddenElements } from "@lib/elementVisibility";
import { generateMountingHoles } from "@lib/mountingHoles";
import { ORDER_MAX_WIDTH_HP, isOrderableWidth, type FilamentId } from "@lib/orderCatalog";
import {
  isLabelElement,
  type MountingHole,
  type PanelModel,
  type SerializedPanel,
} from "@lib/panelTypes";
import { deserializePanelModel, serializePanelModel } from "@lib/serialization";
import { assessTextPrintability } from "@lib/text/textLayout";

export interface OrderFilaments {
  panel: FilamentId;
  details: FilamentId;
}

/** A design stored for an order, as the order page shows it. */
export interface OrderRecord {
  code: string;
  createdAt: string;
  widthHp: number;
  /** Filament ids; ones the catalog no longer lists are kept as they were chosen. */
  filaments: { panel: string; details: string };
  app: { version: string; commit: string };
  model: PanelModel;
}

export type OrderIssue =
  | { kind: "tooWide"; widthHp: number; maxWidthHp: number }
  | { kind: "sameFilament" }
  | { kind: "textPrint"; count: number }
  | { kind: "hiddenElements"; count: number };

/** Failed order request, with the HTTP status (0 when the request did not reach the server). */
export class OrderRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OrderRequestError";
    this.status = status;
  }
}

/** The Etsy listing buyers are sent to. */
export function getEtsyListingUrl(): string | null {
  const url = (import.meta.env.VITE_ETSY_LISTING_URL as string | undefined)?.trim();
  return url || null;
}

function isFlagOn(value: unknown): boolean {
  const flag = typeof value === "string" ? value.trim().toLowerCase() : "";
  return flag === "true" || flag === "1";
}

/**
 * Whether this deployment takes orders: the VITE_ORDERING_ENABLED flag is on and there is an Etsy
 * listing to send buyers to. Both are read at build time, so changing them needs a new deployment.
 */
export function isOrderingEnabled(): boolean {
  return isFlagOn(import.meta.env.VITE_ORDERING_ENABLED) && getEtsyListingUrl() !== null;
}

/** The version of the app that made a design, stored with it to reproduce it later. */
export function getAppInfo(): OrderRecord["app"] {
  return {
    version: changelogEntries[0]?.version ?? "",
    commit: (import.meta.env.VITE_SENTRY_RELEASE as string | undefined) ?? "",
  };
}

/**
 * Panel mounting holes plus the ones around the elements that print, as the editor exports them.
 */
export function computeOrderMountingHoles(model: PanelModel): MountingHole[] {
  const panelHoles = generateMountingHoles({
    widthHp: model.dimensions.widthHp,
    widthMm: model.dimensions.widthMm,
    heightMm: model.dimensions.heightMm,
    config: model.mountingHoleConfig,
  });
  return [
    ...panelHoles,
    ...computeElementMountingHoles(getVisibleElements(model.elements), model.elementHoleConfig),
  ];
}

/** Texts that are likely to print badly: too small, too thin, or with characters left out. */
function countHardToPrintTexts(elements: PanelModel["elements"]): number {
  return elements.filter(isLabelElement).filter((element) => {
    const printability = assessTextPrintability(element.properties);
    return (
      printability.tooSmall || printability.thinStrokes || printability.missingCharacters.length > 0
    );
  }).length;
}

/**
 * What stops the design from being ordered (`tooWide`), or deserves a second look. Hidden elements
 * are not printed. Characters missing from a font are only known once the font has loaded.
 */
export function listOrderIssues(model: PanelModel, filaments: OrderFilaments): OrderIssue[] {
  const issues: OrderIssue[] = [];
  const printedElements = getVisibleElements(model.elements);
  if (!isOrderableWidth(model.dimensions.widthHp)) {
    issues.push({
      kind: "tooWide",
      widthHp: model.dimensions.widthHp,
      maxWidthHp: ORDER_MAX_WIDTH_HP,
    });
  }
  if (filaments.panel === filaments.details && hasDesignElements(printedElements)) {
    issues.push({ kind: "sameFilament" });
  }
  const hardToPrintTexts = countHardToPrintTexts(printedElements);
  if (hardToPrintTexts > 0) {
    issues.push({ kind: "textPrint", count: hardToPrintTexts });
  }
  const hiddenElements = model.elements.filter(isElementHidden).length;
  if (hiddenElements > 0) {
    issues.push({ kind: "hiddenElements", count: hiddenElements });
  }
  return issues;
}

export function isBlockingIssue(issue: OrderIssue): boolean {
  return issue.kind === "tooWide";
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return text || `Order request failed (${response.status}).`;
}

/**
 * Stores the design for an order, without its hidden elements, and returns its code, e.g.
 * "EPD-7K3Q-9XMB".
 */
export async function createOrder(model: PanelModel, filaments: OrderFilaments): Promise<string> {
  const design = JSON.parse(serializePanelModel(withoutHiddenElements(model))) as SerializedPanel;
  let response: Response;
  try {
    response = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ design, filaments, app: getAppInfo() }),
    });
  } catch (error) {
    throw new OrderRequestError(error instanceof Error ? error.message : String(error), 0);
  }
  if (!response.ok) {
    throw new OrderRequestError(await readErrorMessage(response), response.status);
  }
  const { code } = (await response.json()) as { code?: unknown };
  if (typeof code !== "string" || !code) {
    throw new OrderRequestError("The order response has no code.", response.status);
  }
  return code;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Loads the design stored under an order code. */
export async function fetchOrder(code: string): Promise<OrderRecord> {
  let response: Response;
  try {
    response = await fetch(`/api/order?code=${encodeURIComponent(code)}`);
  } catch (error) {
    throw new OrderRequestError(error instanceof Error ? error.message : String(error), 0);
  }
  if (!response.ok) {
    throw new OrderRequestError(await readErrorMessage(response), response.status);
  }
  const record = (await response.json()) as Record<string, unknown>;
  const filaments = (record.filaments ?? {}) as Record<string, unknown>;
  const app = (record.app ?? {}) as Record<string, unknown>;
  const model = deserializePanelModel(record.design as SerializedPanel);
  return {
    code: readString(record.code) || code,
    createdAt: readString(record.createdAt),
    widthHp: typeof record.widthHp === "number" ? record.widthHp : model.dimensions.widthHp,
    filaments: { panel: readString(filaments.panel), details: readString(filaments.details) },
    app: { version: readString(app.version), commit: readString(app.commit) },
    model,
  };
}
