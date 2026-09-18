import React from "react";

import { getLoadedPanelSurfaceMerge, loadPanelSurfaceMerge } from "@lib/canvas/panelSurfaceClip";
import { hasDesignElements } from "@lib/designLayer";
import { reportDegradation } from "@lib/monitoring";
import { buildPanelSurfacePathData, hasOverlappingCutouts } from "@lib/panelSurface";
import type { MountingHole, PanelElement } from "@lib/panelTypes";

/**
 * Clip path of the SVG artwork and text: the panel minus its cut-outs, with overlapping ones
 * merged. The canvas redraws on every frame, so the path is only rebuilt when the panel or its
 * cut-outs change.
 */
export function usePanelSurfacePath(
  widthMm: number,
  heightMm: number,
  mountingHoles: MountingHole[],
  elements: PanelElement[],
): Path2D | null {
  const [merge, setMerge] = React.useState(getLoadedPanelSurfaceMerge);

  const surface = React.useMemo(() => {
    // Only SVG artwork and text are clipped.
    if (!hasDesignElements(elements)) {
      return null;
    }
    const input = { panelSizeMm: { x: widthMm, y: heightMm }, mountingHoles, elements };
    return { input, overlapping: hasOverlappingCutouts(input) };
  }, [elements, heightMm, mountingHoles, widthMm]);

  const needsMerge = Boolean(surface?.overlapping) && !merge;
  React.useEffect(() => {
    if (!needsMerge) {
      return;
    }
    let cancelled = false;
    loadPanelSurfaceMerge().then(
      (module) => {
        if (!cancelled) {
          setMerge(module);
        }
      },
      // The artwork stays clipped, only the overlaps between cut-outs show it.
      (error: unknown) => reportDegradation(error, "panel-surface", "load-merge"),
    );
    return () => {
      cancelled = true;
    };
  }, [needsMerge]);

  return React.useMemo(() => {
    if (!surface || typeof Path2D === "undefined") {
      return null;
    }
    return new Path2D(
      surface.overlapping && merge
        ? merge.buildMergedPanelSurfacePathData(surface.input)
        : buildPanelSurfacePathData(surface.input),
    );
  }, [merge, surface]);
}
