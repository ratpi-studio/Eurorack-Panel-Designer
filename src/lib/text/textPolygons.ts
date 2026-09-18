// polygon-clipping stays out of the startup bundle: only modules loaded on demand import this one.
import polygonClipping from "polygon-clipping";

import { reportDegradation } from "@lib/monitoring";
import type { LabelElement } from "@lib/panelTypes";
import type { SurfaceMultiPolygon, SurfacePolygon, SurfaceRing } from "@lib/panelSurface";

import type { TextFont, TextGlyph } from "./textFontLoader";
import { getGlyphContours, labelPointToPanel, type LabelTextLayout } from "./textLayout";

const glyphPolygonCache = new WeakMap<TextGlyph, SurfaceMultiPolygon>();
const layoutPolygonCache = new WeakMap<LabelTextLayout, SurfaceMultiPolygon>();

function signedArea(ring: SurfaceRing): number {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[(index + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/** Even-odd test. */
function isInsideRing([x, y]: [number, number], ring: SurfaceRing): boolean {
  let inside = false;
  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index, index += 1
  ) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Fallback for glyphs polygon-clipping fails on: nests the contours by containment, which matches
 * the nonzero rule as long as contours do not overlap.
 */
function nestContours(rings: SurfaceRing[]): SurfaceMultiPolygon {
  const depths = rings.map(
    (ring, index) =>
      rings.filter((other, otherIndex) => otherIndex !== index && isInsideRing(ring[0], other))
        .length,
  );
  const polygons = new Map<number, SurfacePolygon>();
  rings.forEach((ring, index) => {
    if (depths[index] % 2 === 0) {
      polygons.set(index, [ring]);
    }
  });
  rings.forEach((ring, index) => {
    if (depths[index] % 2 === 0) {
      return;
    }
    // The hole belongs to the innermost outer contour around it.
    const parent = rings.findIndex(
      (other, otherIndex) =>
        depths[otherIndex] === depths[index] - 1 && isInsideRing(ring[0], other),
    );
    polygons.get(parent)?.push(ring);
  });
  return [...polygons.values()];
}

/**
 * The inked area of a glyph, in font units. Fonts fill glyphs with the nonzero rule: contours that
 * turn like the outermost one add ink, the others remove it. Applied from the largest contour to
 * the smallest, each contour comes after the ones around it; overlapping contours, common in fonts
 * built from variable masters, merge instead of cancelling each other.
 */
export function buildGlyphPolygons(glyph: TextGlyph, font: TextFont): SurfaceMultiPolygon {
  const cached = glyphPolygonCache.get(glyph);
  if (cached) {
    return cached;
  }
  const contours = getGlyphContours(glyph, font.unitsPerEm)
    .rings.map((ring) => ({ ring: ring as SurfaceRing, area: signedArea(ring as SurfaceRing) }))
    .filter(({ area }) => area !== 0)
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

  let polygons: SurfaceMultiPolygon = [];
  if (contours.length === 1) {
    polygons = [[contours[0].ring]];
  } else if (contours.length > 1) {
    const inkSign = Math.sign(contours[0].area);
    try {
      let index = 0;
      while (index < contours.length) {
        const addsInk = Math.sign(contours[index].area) === inkSign;
        const batch: SurfacePolygon[] = [];
        while (
          index < contours.length &&
          (Math.sign(contours[index].area) === inkSign) === addsInk
        ) {
          batch.push([contours[index].ring]);
          index += 1;
        }
        if (addsInk) {
          const geoms: Array<polygonClipping.Polygon | polygonClipping.MultiPolygon> =
            polygons.length ? [polygons, ...batch] : batch;
          polygons =
            geoms.length > 1
              ? (polygonClipping.union(geoms[0], ...geoms.slice(1)) as SurfaceMultiPolygon)
              : batch;
        } else if (polygons.length) {
          polygons = polygonClipping.difference(
            polygons as polygonClipping.MultiPolygon,
            ...(batch as polygonClipping.Polygon[]),
          ) as SurfaceMultiPolygon;
        }
      }
    } catch (error) {
      reportDegradation(error, "text-font", "glyph-outline");
      polygons = nestContours(contours.map(({ ring }) => ring));
    }
  }
  glyphPolygonCache.set(glyph, polygons);
  return polygons;
}

/**
 * The text of a label as polygons in the label frame (mm, y down). Glyphs are kept apart: the
 * design layer merges everything that overlaps when it clips it to the panel.
 */
export function buildLabelTextPolygons(layout: LabelTextLayout): SurfaceMultiPolygon {
  const cached = layoutPolygonCache.get(layout);
  if (cached) {
    return cached;
  }
  const polygons: SurfaceMultiPolygon = [];
  for (const { glyph, x } of layout.glyphs) {
    const offsetXMm = layout.originXMm + x * layout.scale;
    for (const polygon of buildGlyphPolygons(glyph, layout.font)) {
      polygons.push(
        polygon.map((ring) =>
          ring.map(([px, py]): [number, number] => [
            offsetXMm + px * layout.scale,
            layout.baselineYMm - py * layout.scale,
          ]),
        ),
      );
    }
  }
  layoutPolygonCache.set(layout, polygons);
  return polygons;
}

/** The text of a label as polygons in panel coordinates. */
export function placeLabelTextPolygons(
  element: LabelElement,
  layout: LabelTextLayout,
): SurfaceMultiPolygon {
  return buildLabelTextPolygons(layout).map((polygon) =>
    polygon.map((ring) => ring.map(([x, y]) => labelPointToPanel(element, x, y))),
  );
}
