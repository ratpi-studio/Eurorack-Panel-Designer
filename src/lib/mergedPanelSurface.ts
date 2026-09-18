// polygon-clipping stays out of the startup bundle: only modules loaded on demand import this one.
import polygonClipping from "polygon-clipping";

import { reportDegradation } from "@lib/monitoring";
import {
  buildPanelCutouts,
  buildPanelSurfacePathData,
  panelOutlineRing,
  splitOverlappingCutouts,
  surfacePathData,
  type PanelCutout,
  type PanelSurfaceInput,
  type SurfaceMultiPolygon,
  type SurfaceRing,
} from "@lib/panelSurface";

export interface MergedPanelSurface {
  /**
   * The panel minus the cut-outs that overlap each other or its edge, merged like in the STL:
   * outline and opening rings that never cross, to fill with the even-odd rule.
   */
  polygons: SurfaceMultiPolygon;
  /** The cut-outs merged into `polygons`. */
  mergedCutouts: PanelCutout[];
  /** Cut-outs clear of the others and of the panel edge, left as they are. */
  separateCutouts: PanelCutout[];
}

/** Drops the closing point that polygon-clipping repeats at the end of each ring. */
function openRing(ring: SurfaceRing): SurfaceRing {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return ring.length > 1 && first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring;
}

/**
 * Merges the cut-outs that overlap each other or cross the panel edge. Returns null when there are
 * none, or when polygon-clipping fails on them: the cut-outs then stay as they are.
 */
export function mergePanelSurface(input: PanelSurfaceInput): MergedPanelSurface | null {
  const { overlapping, separate } = splitOverlappingCutouts(
    input.panelSizeMm,
    buildPanelCutouts(input),
  );
  if (!overlapping.length) {
    return null;
  }
  try {
    // One polygon with the cut-outs as holes: the union keeps what lies outside all of them.
    const polygons = polygonClipping.union([
      [panelOutlineRing(input.panelSizeMm), ...overlapping.map((cutout) => cutout.ring)],
    ]);
    return {
      polygons: polygons.map((polygon) => polygon.map(openRing)),
      mergedCutouts: overlapping,
      separateCutouts: separate,
    };
  } catch (error) {
    reportDegradation(error, "panel-surface", "merge-cutouts");
    return null;
  }
}

/** Path data of the panel surface, with overlapping cut-outs merged into single openings. */
export function buildMergedPanelSurfacePathData(input: PanelSurfaceInput): string {
  const merged = mergePanelSurface(input);
  if (!merged) {
    return buildPanelSurfacePathData(input);
  }
  return surfacePathData([
    ...merged.polygons.flat(),
    ...merged.separateCutouts.map((cutout) => cutout.ring),
  ]);
}
