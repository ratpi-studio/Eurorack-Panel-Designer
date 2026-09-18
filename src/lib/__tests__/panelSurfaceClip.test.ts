import { describe, expect, it } from "vite-plus/test";

import {
  buildPanelSurfaceClipPathData,
  getLoadedPanelSurfaceMerge,
  loadPanelSurfaceMerge,
} from "@lib/canvas/panelSurfaceClip";
import { buildMergedPanelSurfacePathData } from "@lib/mergedPanelSurface";
import { buildPanelSurfacePathData } from "@lib/panelSurface";
import { PanelElementType, type PanelElement } from "@lib/panelTypes";

function jack(id: string, x: number, y: number): PanelElement {
  return { id, type: PanelElementType.Jack, positionMm: { x, y }, properties: { diameterMm: 6 } };
}

const artwork: PanelElement = {
  id: "artwork",
  type: PanelElementType.SvgArtwork,
  positionMm: { x: 20, y: 30 },
  properties: {
    svgText:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" /></svg>',
    viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
    widthMm: 30,
    heightMm: 30,
    color: "#ffffff",
    stlThicknessMm: 0.6,
    stlPenetrationMm: 0.2,
    label: "",
  },
};

describe("buildPanelSurfaceClipPathData", () => {
  it("keeps the artwork out of the overlap of two jacks", async () => {
    const input = {
      panelSizeMm: { x: 40, y: 100 },
      mountingHoles: [],
      elements: [artwork, jack("jack-1", 15, 30), jack("jack-2", 20, 30)],
    };

    const pathData = await buildPanelSurfaceClipPathData(input);

    // The panel outline and a single opening for both jacks, as in the SVG export.
    expect(pathData).toBe(buildMergedPanelSurfacePathData(input));
    expect(pathData.match(/M /g)).toHaveLength(2);
    expect(getLoadedPanelSurfaceMerge()).not.toBeNull();
  });

  it("keeps the path of designs without overlapping cut-outs", async () => {
    const input = {
      panelSizeMm: { x: 40, y: 100 },
      mountingHoles: [],
      elements: [artwork, jack("jack-1", 10, 30), jack("jack-2", 30, 30)],
    };

    expect(await buildPanelSurfaceClipPathData(input)).toBe(buildPanelSurfacePathData(input));
  });
});

describe("loadPanelSurfaceMerge", () => {
  it("loads the merge code once", async () => {
    const pending = loadPanelSurfaceMerge();

    expect(loadPanelSurfaceMerge()).toBe(pending);
    expect(await pending).toBe(getLoadedPanelSurfaceMerge());
  });
});
