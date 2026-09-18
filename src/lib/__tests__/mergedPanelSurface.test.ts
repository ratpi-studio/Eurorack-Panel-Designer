import { describe, expect, it } from "vite-plus/test";

import { buildMergedPanelSurfacePathData, mergePanelSurface } from "@lib/mergedPanelSurface";
import { buildPanelSurfacePathData, type PanelCutout, type SurfaceRing } from "@lib/panelSurface";
import { PanelElementType, type PanelElement } from "@lib/panelTypes";

const PANEL_SIZE_MM = { x: 40, y: 100 };

function jack(id: string, x: number, y: number): PanelElement {
  return { id, type: PanelElementType.Jack, positionMm: { x, y }, properties: { diameterMm: 6 } };
}

function sourceIds(cutouts: PanelCutout[]): string[] {
  return cutouts.map((cutout) => ("id" in cutout.source ? cutout.source.id : "mounting-hole"));
}

/** Corners of a jack opening sit on the jack polygon or where two cut-outs cross, never closer. */
function cornersInsideJacks(ring: SurfaceRing, centers: Array<[number, number]>) {
  const closest = 3 * Math.cos(Math.PI / 48) - 1e-9;
  return ring.filter(([x, y]) => centers.some(([cx, cy]) => Math.hypot(x - cx, y - cy) < closest));
}

describe("mergePanelSurface", () => {
  it("leaves designs without overlapping cut-outs as they are", () => {
    const input = {
      panelSizeMm: PANEL_SIZE_MM,
      mountingHoles: [],
      elements: [jack("a", 10, 20), jack("b", 20, 20)],
    };

    expect(mergePanelSurface(input)).toBeNull();
    expect(buildMergedPanelSurfacePathData(input)).toBe(buildPanelSurfacePathData(input));
  });

  it("merges two overlapping jacks into one opening", () => {
    const merged = mergePanelSurface({
      panelSizeMm: PANEL_SIZE_MM,
      mountingHoles: [],
      elements: [jack("a", 10, 20), jack("b", 15, 20), jack("c", 20, 60)],
    });

    expect(merged?.polygons).toHaveLength(1);
    const [outline, ...openings] = merged?.polygons[0] ?? [];
    expect(outline).toHaveLength(4);
    expect(outline).toEqual(
      expect.arrayContaining([
        [0, 0],
        [40, 0],
        [40, 100],
        [0, 100],
      ]),
    );
    expect(openings).toHaveLength(1);
    expect(
      cornersInsideJacks(openings[0], [
        [10, 20],
        [15, 20],
      ]),
    ).toEqual([]);
    expect(sourceIds(merged?.mergedCutouts ?? [])).toEqual(["a", "b"]);
    expect(sourceIds(merged?.separateCutouts ?? [])).toEqual(["c"]);
  });

  it("opens cut-outs that cross the panel edge into the outline", () => {
    const merged = mergePanelSurface({
      panelSizeMm: PANEL_SIZE_MM,
      mountingHoles: [],
      elements: [jack("edge", 1, 50)],
    });

    // A single ring: the notch is part of the outline, from the far side of the jack (x = 4) to
    // where it crosses the edge (y = 50 ± 2.83).
    expect(merged?.polygons).toHaveLength(1);
    expect(merged?.polygons[0]).toHaveLength(1);
    const outline = merged?.polygons[0][0] ?? [];
    expect(Math.max(...outline.filter(([x]) => x < 10).map(([x]) => x))).toBeCloseTo(4);
    expect(outline.some(([x, y]) => x === 0 && y > 48 && y < 52)).toBe(false);
  });
});

describe("buildMergedPanelSurfacePathData", () => {
  it("draws one opening for overlapping jacks and keeps the other cut-outs as they are", () => {
    const input = {
      panelSizeMm: PANEL_SIZE_MM,
      mountingHoles: [],
      elements: [jack("a", 10, 20), jack("b", 15, 20), jack("c", 20, 60)],
    };

    const pathData = buildMergedPanelSurfacePathData(input);
    const separateJack = buildPanelSurfacePathData(input).split("M ").pop();

    expect(pathData.match(/M /g)).toHaveLength(3);
    expect(pathData.endsWith(`M ${separateJack}`)).toBe(true);
  });
});
