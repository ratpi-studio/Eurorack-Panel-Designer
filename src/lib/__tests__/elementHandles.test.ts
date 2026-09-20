import { describe, expect, it } from "vite-plus/test";

import { getLabelSizeMm } from "../canvas/elementGeometry";
import {
  findElementHandleAtPoint,
  getElementFrameRotationDeg,
  getElementHandleLayout,
  getElementResizeMode,
  resizeElementFromHandle,
} from "../canvas/elementHandles";
import type { CanvasTransform } from "../canvas/transform";
import { createPanelElement } from "../elements";
import { PanelElementType, withElementProperties, type PanelElement } from "../panelTypes";

const CORNERS = ["top-left", "top-right", "bottom-right", "bottom-left"];
const transform: CanvasTransform = {
  origin: { x: 0, y: 0 },
  scale: 2,
  panelSizePx: { x: 400, y: 400 },
};

function createElement(
  type: PanelElementType,
  {
    rotationDeg = 0,
    properties,
  }: { rotationDeg?: number; properties?: Partial<PanelElement["properties"]> } = {},
): PanelElement {
  const element = { ...createPanelElement(type, { x: 50, y: 50 }), rotationDeg };
  return properties
    ? withElementProperties(element, {
        ...element.properties,
        ...properties,
      } as PanelElement["properties"])
    : element;
}

function sizeOf(element: PanelElement) {
  return element.properties as { widthMm: number; heightMm: number };
}

describe("element handle layout", () => {
  it("maps each element type to a resize behaviour", () => {
    expect(getElementResizeMode(createElement(PanelElementType.Jack))).toBe("diameter");
    expect(getElementResizeMode(createElement(PanelElementType.Insert))).toBe("diameter");
    expect(getElementResizeMode(createElement(PanelElementType.Triangle))).toBe("box");
    expect(getElementResizeMode(createElement(PanelElementType.Label))).toBe("font");
    expect(getElementResizeMode(createElement(PanelElementType.SvgArtwork))).toBe("artwork");
  });

  it("keeps the frame of round elements axis-aligned", () => {
    expect(
      getElementFrameRotationDeg(createElement(PanelElementType.Jack, { rotationDeg: 30 })),
    ).toBe(0);
    expect(
      getElementFrameRotationDeg(createElement(PanelElementType.Rectangle, { rotationDeg: 30 })),
    ).toBe(30);
  });

  it("enlarges the frame of tiny elements and keeps only corner handles", () => {
    const layout = getElementHandleLayout(createElement(PanelElementType.Led), 1);

    expect(layout.halfSizePx).toEqual({ x: 10, y: 10 });
    expect(layout.handles).toEqual(CORNERS);
    expect(layout.hasRotationHandle).toBe(false);
  });

  it("adds edge handles only on sides long enough to hold them", () => {
    const large = getElementHandleLayout(createElement(PanelElementType.Rectangle), 5);
    expect(large.halfSizePx).toEqual({ x: 30, y: 50 });
    expect(large.handles).toEqual([...CORNERS, "top", "bottom", "right", "left"]);

    const slim = getElementHandleLayout(
      createElement(PanelElementType.Rectangle, { properties: { widthMm: 4, heightMm: 20 } }),
      5,
    );
    expect(slim.handles).toEqual([...CORNERS, "right", "left"]);
  });

  it("gives labels corner handles only", () => {
    const label = createElement(PanelElementType.Label, { properties: { fontSizePt: 40 } });

    expect(getElementHandleLayout(label, 5).handles).toEqual(CORNERS);
  });

  it("keeps artwork handles on its real edges, with a rotation handle", () => {
    const layout = getElementHandleLayout(createElement(PanelElementType.SvgArtwork), 0.5);

    expect(layout.halfSizePx).toEqual({ x: 5, y: 5 });
    expect(layout.handles).toHaveLength(8);
    expect(layout.hasRotationHandle).toBe(true);
  });
});

describe("findElementHandleAtPoint", () => {
  const square = { properties: { widthMm: 20, heightMm: 20 } };

  it("finds the handle under the pointer", () => {
    const rectangle = createElement(PanelElementType.Rectangle, square);

    expect(findElementHandleAtPoint(rectangle, transform, { x: 123, y: 101 })).toBe("right");
    expect(findElementHandleAtPoint(rectangle, transform, { x: 80, y: 80 })).toBe("top-left");
    expect(findElementHandleAtPoint(rectangle, transform, { x: 100, y: 100 })).toBeNull();
    expect(findElementHandleAtPoint(rectangle, transform, { x: 140, y: 100 })).toBeNull();
  });

  it("follows the element rotation, except for round elements", () => {
    const rectangle = createElement(PanelElementType.Rectangle, { ...square, rotationDeg: 90 });
    expect(findElementHandleAtPoint(rectangle, transform, { x: 100, y: 121 })).toBe("right");

    const jack = createElement(PanelElementType.Jack, {
      rotationDeg: 90,
      properties: { diameterMm: 20 },
    });
    expect(findElementHandleAtPoint(jack, transform, { x: 120, y: 100 })).toBe("right");
  });

  it("finds the artwork rotation handle above the frame", () => {
    const artwork = createElement(PanelElementType.SvgArtwork);

    expect(findElementHandleAtPoint(artwork, transform, { x: 100, y: 57 })).toBe("rotate");
  });

  it("ignores a collapsed canvas", () => {
    const rectangle = createElement(PanelElementType.Rectangle);

    expect(
      findElementHandleAtPoint(rectangle, { ...transform, scale: 0 }, { x: 0, y: 0 }),
    ).toBeNull();
  });
});

describe("resizeElementFromHandle", () => {
  const free = { snap: false };
  const snapped = { snap: true };

  it("grows round elements around their center", () => {
    const jack = createElement(PanelElementType.Jack, { properties: { diameterMm: 8 } });

    const fromEdge = resizeElementFromHandle(jack, "right", { x: 2, y: 5 }, free);
    expect(fromEdge.properties).toMatchObject({ diameterMm: 12 });
    expect(fromEdge.positionMm).toEqual({ x: 50, y: 50 });

    const fromCorner = resizeElementFromHandle(jack, "bottom-right", { x: 1, y: 3 }, free);
    expect(fromCorner.properties).toMatchObject({ diameterMm: 12 });
  });

  it("snaps and clamps diameters", () => {
    const jack = createElement(PanelElementType.Jack, { properties: { diameterMm: 8 } });

    expect(
      resizeElementFromHandle(jack, "right", { x: 0.3, y: 0 }, snapped).properties,
    ).toMatchObject({ diameterMm: 8.5 });
    expect(resizeElementFromHandle(jack, "right", { x: 0.3, y: 0 }, free).properties).toMatchObject(
      {
        diameterMm: 8.6,
      },
    );
    expect(resizeElementFromHandle(jack, "left", { x: 10, y: 0 }, free).properties).toMatchObject({
      diameterMm: 0.5,
    });
  });

  it("resizes switches with a round hole by their diameter, around their center", () => {
    const toggle = createElement(PanelElementType.Switch, { rotationDeg: 30 });

    expect(getElementResizeMode(toggle)).toBe("diameter");
    expect(getElementFrameRotationDeg(toggle)).toBe(0);
    const resized = resizeElementFromHandle(toggle, "right", { x: 1, y: 0 }, free);
    expect(resized.properties).toMatchObject({ diameterMm: 7 });
    expect(resized.positionMm).toEqual({ x: 50, y: 50 });
  });

  it("never shrinks an insert below its inner hole", () => {
    const insert = createElement(PanelElementType.Insert);

    expect(
      resizeElementFromHandle(insert, "right", { x: -5, y: 0 }, free).properties,
    ).toMatchObject({ outerDiameterMm: 2.7 });
  });

  it("keeps the side opposite to the dragged handle in place", () => {
    const rectangle = createElement(PanelElementType.Rectangle);

    const right = resizeElementFromHandle(rectangle, "right", { x: 4, y: 7 }, free);
    expect(sizeOf(right)).toMatchObject({ widthMm: 16, heightMm: 20 });
    expect(right.positionMm).toEqual({ x: 52, y: 50 });

    const left = resizeElementFromHandle(rectangle, "left", { x: -4, y: 0 }, free);
    expect(sizeOf(left)).toMatchObject({ widthMm: 16, heightMm: 20 });
    expect(left.positionMm).toEqual({ x: 48, y: 50 });

    const corner = resizeElementFromHandle(rectangle, "top-left", { x: -2, y: -3 }, free);
    expect(sizeOf(corner)).toMatchObject({ widthMm: 14, heightMm: 23 });
    expect(corner.positionMm).toEqual({ x: 49, y: 48.5 });
  });

  it("resizes rotated elements along their own axes", () => {
    const rectangle = createElement(PanelElementType.Rectangle, { rotationDeg: 90 });

    const resized = resizeElementFromHandle(rectangle, "right", { x: 0, y: 4 }, free);
    expect(sizeOf(resized).widthMm).toBeCloseTo(16);
    expect(sizeOf(resized).heightMm).toBe(20);
    expect(resized.positionMm.x).toBeCloseTo(50);
    expect(resized.positionMm.y).toBeCloseTo(52);
  });

  it("snaps side lengths to half millimeters, or keeps two decimals when free", () => {
    const rectangle = createElement(PanelElementType.Rectangle);

    const stepped = resizeElementFromHandle(rectangle, "right", { x: 0.3, y: 0 }, snapped);
    expect(sizeOf(stepped).widthMm).toBe(12.5);
    expect(stepped.positionMm.x).toBeCloseTo(50.25);

    const unsnapped = resizeElementFromHandle(rectangle, "right", { x: 0.123456, y: 0 }, free);
    expect(sizeOf(unsnapped).widthMm).toBe(12.12);
  });

  it("scales label fonts from the opposite corner", () => {
    const label = createElement(PanelElementType.Label);
    const start = getLabelSizeMm(label.properties as Parameters<typeof getLabelSizeMm>[0]);

    const resized = resizeElementFromHandle(
      label,
      "bottom-right",
      { x: start.widthMm, y: start.heightMm },
      snapped,
    );
    const end = getLabelSizeMm(resized.properties as Parameters<typeof getLabelSizeMm>[0]);

    expect(resized.properties).toMatchObject({ fontSizePt: 20 });
    expect(resized.positionMm.x - end.widthMm / 2).toBeCloseTo(50 - start.widthMm / 2);
    expect(resized.positionMm.y - end.heightMm / 2).toBeCloseTo(50 - start.heightMm / 2);
  });

  it("leaves artwork to its aspect-ratio resize", () => {
    const artwork = createElement(PanelElementType.SvgArtwork);

    expect(resizeElementFromHandle(artwork, "right", { x: 4, y: 0 }, free)).toBe(artwork);
  });
});
