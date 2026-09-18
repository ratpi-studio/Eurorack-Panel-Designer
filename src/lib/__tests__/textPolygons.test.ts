import { beforeAll, describe, expect, it } from "vite-plus/test";

import { createPanelElement } from "@lib/elements";
import type { SurfaceMultiPolygon, SurfaceRing } from "@lib/panelSurface";
import { PanelElementType, type LabelElement } from "@lib/panelTypes";
import type { TextFont } from "@lib/text/textFontLoader";
import { getLabelTextLayout, layoutLabelText } from "@lib/text/textLayout";
import {
  buildGlyphPolygons,
  buildLabelTextPolygons,
  placeLabelTextPolygons,
} from "@lib/text/textPolygons";

import { contour, createTestFont, loadTestFont, square } from "./textFontFixtures";

function ringArea(ring: SurfaceRing): number {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[(index + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

/** Inked area: outer rings minus holes. */
function area(polygons: SurfaceMultiPolygon): number {
  return polygons.reduce(
    (total, [outer, ...holes]) =>
      total + ringArea(outer) - holes.reduce((sum, hole) => sum + ringArea(hole), 0),
    0,
  );
}

function bounds(polygons: SurfaceMultiPolygon) {
  const points = polygons.flat(2);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

let roboto: TextFont;

beforeAll(async () => {
  roboto = await loadTestFont("roboto");
});

describe("buildGlyphPolygons", () => {
  it("turns counters into holes", () => {
    const o = buildGlyphPolygons(roboto.glyphForChar("O")!, roboto);
    const b = buildGlyphPolygons(roboto.glyphForChar("B")!, roboto);

    expect(o).toHaveLength(1);
    expect(o[0]).toHaveLength(2);
    expect(b).toHaveLength(1);
    expect(b[0]).toHaveLength(3);
  });

  it("keeps separate parts apart", () => {
    const i = buildGlyphPolygons(roboto.glyphForChar("i")!, roboto);

    expect(i).toHaveLength(2);
    expect(i.every((polygon) => polygon.length === 1)).toBe(true);
  });

  it("follows the nonzero rule whatever way the font winds its outlines", () => {
    const font = createTestFont({
      // Two overlapping strokes turning the same way: one shape, no hole where they cross.
      x: [...square(0, 0, 600), ...square(300, 300, 600)],
      // A frame and its counter, in either winding convention.
      o: [...square(0, 0, 900), ...square(300, 300, 300, true)],
      c: [...square(0, 0, 900, true), ...square(300, 300, 300)],
      // A ring holding an island: the island stays ink.
      r: [...square(0, 0, 900), ...square(100, 100, 700, true), ...square(300, 300, 300)],
    });

    const overlap = buildGlyphPolygons(font.glyphForChar("x")!, font);
    expect(overlap).toHaveLength(1);
    expect(area(overlap)).toBeCloseTo(600 * 600 * 2 - 300 * 300);

    for (const char of ["o", "c"]) {
      const framed = buildGlyphPolygons(font.glyphForChar(char)!, font);
      expect(framed).toHaveLength(1);
      expect(framed[0]).toHaveLength(2);
      expect(area(framed)).toBeCloseTo(900 * 900 - 300 * 300);
    }

    const ring = buildGlyphPolygons(font.glyphForChar("r")!, font);
    expect(ring).toHaveLength(2);
    expect(area(ring)).toBeCloseTo(900 * 900 - 700 * 700 + 300 * 300);
  });

  it("skips degenerate contours", () => {
    const font = createTestFont({
      l: [
        ...contour([
          [0, 0],
          [100, 0],
          [200, 0],
        ]),
        ...square(0, 0, 100),
      ],
    });

    expect(buildGlyphPolygons(font.glyphForChar("l")!, font)).toEqual([
      [
        [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100],
        ],
      ],
    ]);
  });
});

describe("text polygons", () => {
  it("lays the glyphs out in millimeters, like the text layout", () => {
    const layout = layoutLabelText(roboto, "HI", 10);

    const polygons = buildLabelTextPolygons(layout);
    const box = bounds(polygons);

    expect(polygons).toHaveLength(2);
    expect(box.minX).toBeCloseTo(layout.inkBounds!.minX, 2);
    expect(box.maxX).toBeCloseTo(layout.inkBounds!.maxX, 2);
    expect(box.minY).toBeCloseTo(layout.inkBounds!.minY, 2);
    expect(box.maxY).toBeCloseTo(layout.inkBounds!.maxY, 2);
  });

  it("places the text at the label position, turned like the canvas", () => {
    const element = {
      ...createPanelElement(PanelElementType.Label, { x: 20, y: 50 }),
      rotationDeg: 90,
    } as LabelElement;
    element.properties = { ...element.properties, text: "IN", fontSizePt: 12 };
    const layout = getLabelTextLayout(element.properties)!;

    const box = bounds(placeLabelTextPolygons(element, layout));

    // A quarter turn clockwise: the text reads downward, its top toward positive x.
    expect(box.minX).toBeCloseTo(20 - layout.inkBounds!.maxY, 2);
    expect(box.maxX).toBeCloseTo(20 - layout.inkBounds!.minY, 2);
    expect(box.minY).toBeCloseTo(50 + layout.inkBounds!.minX, 2);
    expect(box.maxY).toBeCloseTo(50 + layout.inkBounds!.maxX, 2);
  });
});
