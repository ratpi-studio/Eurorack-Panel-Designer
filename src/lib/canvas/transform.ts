import type { Vector2 } from '@lib/panelTypes';

export interface CanvasTransform {
  origin: Vector2;
  scale: number;
  panelSizePx: Vector2;
}

export interface CanvasTransformInput {
  canvasSizePx: Vector2;
  panelSizeMm: Vector2;
  zoom: number;
  pan: Vector2;
  paddingPx: number;
}

const MIN_CANVAS_DIMENSION = 1;

export function computeCanvasTransform({
  canvasSizePx,
  panelSizeMm,
  zoom,
  pan,
  paddingPx
}: CanvasTransformInput): CanvasTransform {
  const panelWidthMm = Math.max(panelSizeMm.x, MIN_CANVAS_DIMENSION);
  const panelHeightMm = Math.max(panelSizeMm.y, MIN_CANVAS_DIMENSION);
  const usableWidth = Math.max(
    canvasSizePx.x - paddingPx * 2,
    MIN_CANVAS_DIMENSION
  );
  const usableHeight = Math.max(
    canvasSizePx.y - paddingPx * 2,
    MIN_CANVAS_DIMENSION
  );
  const baseScale = Math.min(
    usableWidth / panelWidthMm,
    usableHeight / panelHeightMm
  );
  const safeZoom = Number.isFinite(zoom) ? zoom : 1;
  const scale = baseScale * safeZoom;
  const panelWidthPx = panelWidthMm * scale;
  const panelHeightPx = panelHeightMm * scale;

  const origin = {
    x: (canvasSizePx.x - panelWidthPx) / 2 + pan.x,
    y: (canvasSizePx.y - panelHeightPx) / 2 + pan.y
  };

  return {
    origin,
    scale,
    panelSizePx: { x: panelWidthPx, y: panelHeightPx }
  };
}

export function projectPanelPoint(
  pointMm: Vector2,
  transform: CanvasTransform
): Vector2 {
  return {
    x: transform.origin.x + pointMm.x * transform.scale,
    y: transform.origin.y + pointMm.y * transform.scale
  };
}

export function screenPointToPanel(
  pointPx: Vector2,
  transform: CanvasTransform
): Vector2 | null {
  if (transform.scale === 0) {
    return null;
  }

  return {
    x: (pointPx.x - transform.origin.x) / transform.scale,
    y: (pointPx.y - transform.origin.y) / transform.scale
  };
}
