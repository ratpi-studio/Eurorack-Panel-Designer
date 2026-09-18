export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

interface FitDistanceInput {
  /** Size of the box to frame, centered on the camera target. */
  size: Vector3Like;
  /** Unit vector pointing from the target toward the camera. */
  direction: Vector3Like;
  verticalFovDeg: number;
  /** Viewport width divided by its height. */
  aspect: number;
  /** Share of the viewport left free on each side of the box. */
  padding?: number;
  up?: Vector3Like;
}

const DEFAULT_PADDING = 0.1;
const WORLD_UP: Vector3Like = { x: 0, y: 1, z: 0 };

function dot(a: Vector3Like, b: Vector3Like): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vector3Like, b: Vector3Like): Vector3Like {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normalizeVector(vector: Vector3Like): Vector3Like {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length === 0) {
    return { x: 0, y: 0, z: 1 };
  }
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

/** Default camera direction: in front of the panel, a little to the right and above. */
export const DEFAULT_VIEW_DIRECTION = normalizeVector({ x: 0.5, y: 0.35, z: 1 });

/**
 * Distance from the target at which a perspective camera looking along `-direction` sees the
 * whole box, with `padding` kept free around it.
 */
export function computeFitDistance({
  size,
  direction,
  verticalFovDeg,
  aspect,
  padding = DEFAULT_PADDING,
  up = WORLD_UP,
}: FitDistanceInput): number {
  const back = normalizeVector(direction);
  const sideways = cross(up, back);
  const right =
    Math.hypot(sideways.x, sideways.y, sideways.z) > 1e-6
      ? normalizeVector(sideways)
      : { x: 1, y: 0, z: 0 };
  const cameraUp = cross(back, right);
  const tanVertical = Math.tan((verticalFovDeg * Math.PI) / 360);
  const tanHorizontal = tanVertical * Math.max(aspect, 1e-6);
  const margin = 1 / Math.max(1 - 2 * padding, 1e-6);

  let distance = 0;
  for (const signX of [-0.5, 0.5]) {
    for (const signY of [-0.5, 0.5]) {
      for (const signZ of [-0.5, 0.5]) {
        const corner = { x: signX * size.x, y: signY * size.y, z: signZ * size.z };
        const towardCamera = dot(corner, back);
        const horizontal = Math.abs(dot(corner, right)) * margin;
        const vertical = Math.abs(dot(corner, cameraUp)) * margin;
        distance = Math.max(
          distance,
          towardCamera + horizontal / tanHorizontal,
          towardCamera + vertical / tanVertical,
        );
      }
    }
  }
  return distance;
}
