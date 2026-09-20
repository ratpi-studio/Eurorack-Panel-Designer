import { describe, expect, it } from "vite-plus/test";

import {
  formatBoxLabel,
  formatDiameterLabel,
  formatDimensionMm,
  getElementDimensions,
  getInlineLabelPlacement,
  getReadableTextFlip,
} from "../canvas/elementDimensions";
import { createPanelElement } from "../elements";
import { PanelElementType, withElementProperties, type PanelElement } from "../panelTypes";

function createElement(
  type: PanelElementType,
  properties?: Partial<PanelElement["properties"]>,
): PanelElement {
  const element = createPanelElement(type, { x: 50, y: 50 });
  return properties
    ? withElementProperties(element, {
        ...element.properties,
        ...properties,
      } as PanelElement["properties"])
    : element;
}

describe("getElementDimensions", () => {
  it("measures round elements by their diameter", () => {
    expect(getElementDimensions(createElement(PanelElementType.Jack, { diameterMm: 8 }))).toEqual({
      kind: "diameter",
      diameterMm: 8,
    });
    expect(getElementDimensions(createElement(PanelElementType.Insert))).toEqual({
      kind: "diameter",
      diameterMm: 5.3,
    });
  });

  it("measures box-shaped elements by their sides", () => {
    expect(getElementDimensions(createElement(PanelElementType.Rectangle))).toEqual({
      kind: "box",
      widthMm: 12,
      heightMm: 20,
    });
    expect(getElementDimensions(createElement(PanelElementType.SvgArtwork))).toEqual({
      kind: "box",
      widthMm: 20,
      heightMm: 20,
    });
  });

  it("has no measurement for text labels", () => {
    expect(getElementDimensions(createElement(PanelElementType.Label))).toBeNull();
  });
});

describe("dimension formatting", () => {
  it("keeps at most two decimals without trailing zeros", () => {
    expect(formatDimensionMm(8)).toBe("8");
    expect(formatDimensionMm(5.3)).toBe("5.3");
    expect(formatDimensionMm(6.35)).toBe("6.35");
    expect(formatDimensionMm(12.3456)).toBe("12.35");
    expect(formatDimensionMm(0.1 + 0.2)).toBe("0.3");
  });

  it("builds diameter and box labels", () => {
    expect(formatDiameterLabel(8)).toBe("Ø8");
    expect(formatBoxLabel(12, 20.5)).toBe("12 × 20.5");
  });
});

describe("getInlineLabelPlacement", () => {
  it("places text inside a circle only when its corners stay within the radius", () => {
    const jack = createElement(PanelElementType.Jack);

    expect(getInlineLabelPlacement(jack, { x: 2, y: 1 })).toEqual({
      offsetMm: { x: 0, y: 0 },
      vertical: false,
    });
    expect(getInlineLabelPlacement(jack, { x: 3.5, y: 2 })).toBeNull();
  });

  it("turns the text along the long side of tall rectangles", () => {
    const rectangle = createElement(PanelElementType.Rectangle, { widthMm: 6, heightMm: 20 });

    expect(getInlineLabelPlacement(rectangle, { x: 2, y: 1 })?.vertical).toBe(false);
    expect(getInlineLabelPlacement(rectangle, { x: 6, y: 1 })?.vertical).toBe(true);
    expect(getInlineLabelPlacement(rectangle, { x: 12, y: 1 })).toBeNull();
  });

  it("uses the ellipse outline for ovals", () => {
    const oval = createElement(PanelElementType.Oval, { widthMm: 20, heightMm: 10 });

    expect(getInlineLabelPlacement(oval, { x: 6, y: 2 })).not.toBeNull();
    // Fits the bounding box but not the rounded outline.
    expect(getInlineLabelPlacement(oval, { x: 9, y: 4 })).toBeNull();
  });

  it("uses the capsule outline for slots", () => {
    const slot = createElement(PanelElementType.Slot, { widthMm: 20, heightMm: 6 });

    expect(getInlineLabelPlacement(slot, { x: 8, y: 2 })?.vertical).toBe(false);
    // Too long for the rounded ends, too thick to turn across the slot.
    expect(getInlineLabelPlacement(slot, { x: 9.8, y: 2.9 })).toBeNull();
    expect(getInlineLabelPlacement(slot, { x: 4, y: 3.5 })).toBeNull();
  });

  it("centers text on the triangle centroid and lowers it when it is wide", () => {
    const triangle = createElement(PanelElementType.Triangle, { widthMm: 12, heightMm: 12 });

    expect(getInlineLabelPlacement(triangle, { x: 1, y: 1 })?.offsetMm).toEqual({ x: 0, y: 2 });
    expect(getInlineLabelPlacement(triangle, { x: 4, y: 1 })?.offsetMm.y).toBeCloseTo(3);
    expect(getInlineLabelPlacement(triangle, { x: 5.5, y: 1 })).toBeNull();
  });

  it("never places inline text on labels or artwork", () => {
    const half = { x: 0.1, y: 0.1 };
    expect(getInlineLabelPlacement(createElement(PanelElementType.Label), half)).toBeNull();
    expect(getInlineLabelPlacement(createElement(PanelElementType.SvgArtwork), half)).toBeNull();
  });
});

describe("getReadableTextFlip", () => {
  it("keeps text that already reads left to right or bottom to top", () => {
    expect(getReadableTextFlip(0)).toBe(0);
    expect(getReadableTextFlip(Math.PI / 3)).toBe(0);
    expect(getReadableTextFlip(-Math.PI / 2)).toBe(0);
    expect(getReadableTextFlip(Math.PI * 2 + 0.1)).toBe(0);
  });

  it("flips text that would read upside down or top to bottom", () => {
    expect(getReadableTextFlip(Math.PI)).toBe(Math.PI);
    expect(getReadableTextFlip(Math.PI / 2)).toBe(Math.PI);
    expect(getReadableTextFlip((150 * Math.PI) / 180)).toBe(Math.PI);
    expect(getReadableTextFlip((-150 * Math.PI) / 180)).toBe(Math.PI);
  });
});
