import type { Vector2 } from '@lib/panelTypes';

export function snapPointToGrid(
  point: Vector2,
  gridSizeMm: number,
  panelSizeMm: Vector2
): Vector2 {
  if (!Number.isFinite(gridSizeMm) || gridSizeMm <= 0) {
    return point;
  }

  const center = {
    x: panelSizeMm.x / 2,
    y: panelSizeMm.y / 2
  };

  const relative = {
    x: point.x - center.x,
    y: point.y - center.y
  };

  return {
    x: center.x + Math.round(relative.x / gridSizeMm) * gridSizeMm,
    y: center.y + Math.round(relative.y / gridSizeMm) * gridSizeMm
  };
}
