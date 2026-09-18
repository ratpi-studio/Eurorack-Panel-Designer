import type * as PanelSurfaceMerge from "@lib/mergedPanelSurface";
import {
  buildPanelSurfacePathData,
  hasOverlappingCutouts,
  type PanelSurfaceInput,
} from "@lib/panelSurface";

type PanelSurfaceMergeModule = typeof PanelSurfaceMerge;

let loadedMerge: PanelSurfaceMergeModule | null = null;
let pendingMerge: Promise<PanelSurfaceMergeModule> | null = null;

/**
 * Loads the code that merges overlapping cut-outs. It brings polygon-clipping along, so the canvas
 * only loads it once a design needs it.
 */
export function loadPanelSurfaceMerge(): Promise<PanelSurfaceMergeModule> {
  pendingMerge ??= import("@lib/mergedPanelSurface").then(
    (module) => {
      loadedMerge = module;
      return module;
    },
    (error: unknown) => {
      // Let a later call try again.
      pendingMerge = null;
      throw error;
    },
  );
  return pendingMerge;
}

/** The merge code, once `loadPanelSurfaceMerge` has loaded it. */
export function getLoadedPanelSurfaceMerge(): PanelSurfaceMergeModule | null {
  return loadedMerge;
}

/**
 * Path data that clips SVG artwork to the panel surface (even-odd rule), with overlapping cut-outs
 * merged into single openings. Loads the merge code first when cut-outs overlap.
 */
export async function buildPanelSurfaceClipPathData(input: PanelSurfaceInput): Promise<string> {
  if (!hasOverlappingCutouts(input)) {
    return buildPanelSurfacePathData(input);
  }
  const { buildMergedPanelSurfacePathData } = await loadPanelSurfaceMerge();
  return buildMergedPanelSurfacePathData(input);
}
