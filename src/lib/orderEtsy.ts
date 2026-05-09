import { generateMountingHoles } from "@lib/mountingHoles";
import { buildPanelPngDataUrl } from "@lib/canvas/exportPng";
import { calculatePriceEur } from "@lib/pricing";
import { serializePanelModel } from "@lib/serialization";
import { type PanelModel } from "@lib/panelTypes";

export interface OrderPayload {
  panelJson: string;
  thumbnailDataUrl: string;
  panelColor: string;
  designColor: string;
  widthHp: number;
  priceEur: number;
}

export interface OrderResponse {
  id: string;
  panelUrl: string;
  thumbnailUrl: string;
}

const THUMBNAIL_MAX_WIDTH_PX = 600;

function deriveMountingHoles(model: PanelModel) {
  return generateMountingHoles({
    widthHp: model.dimensions.widthHp,
    widthMm: model.dimensions.widthMm,
    heightMm: model.dimensions.heightMm,
    config: model.mountingHoleConfig,
  });
}

export async function buildOrderPayload(model: PanelModel): Promise<OrderPayload> {
  const mountingHoles = deriveMountingHoles(model);
  const thumbnail = await buildPanelPngDataUrl(model, mountingHoles, {
    maxWidthPx: THUMBNAIL_MAX_WIDTH_PX,
  });
  if (!thumbnail) {
    throw new Error("Could not generate panel thumbnail.");
  }
  return {
    panelJson: serializePanelModel(model),
    thumbnailDataUrl: thumbnail,
    panelColor: model.panelColor,
    designColor: model.designColor,
    widthHp: model.dimensions.widthHp,
    priceEur: calculatePriceEur(model.dimensions.widthHp),
  };
}

export async function submitOrder(payload: OrderPayload): Promise<OrderResponse> {
  const response = await fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Order request failed (${response.status}).`);
  }
  const data = (await response.json()) as Partial<OrderResponse>;
  if (!data.id || !data.panelUrl || !data.thumbnailUrl) {
    throw new Error("Order response is missing required fields.");
  }
  return data as OrderResponse;
}
