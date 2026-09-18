import { describe, expect, it } from "vite-plus/test";

import {
  DEFAULT_VIEW_DIRECTION,
  computeFitDistance,
  normalizeVector,
  type Vector3Like,
} from "@lib/view3d/cameraFit";

function cross(a: Vector3Like, b: Vector3Like): Vector3Like {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function dot(a: Vector3Like, b: Vector3Like): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Largest normalized screen coordinate reached by the box corners, 1 being the viewport edge. */
function largestScreenExtent(
  size: Vector3Like,
  direction: Vector3Like,
  distance: number,
  verticalFovDeg: number,
  aspect: number,
): number {
  const back = normalizeVector(direction);
  const right = normalizeVector(cross({ x: 0, y: 1, z: 0 }, back));
  const up = cross(back, right);
  const tanVertical = Math.tan((verticalFovDeg * Math.PI) / 360);
  let extent = 0;
  for (const x of [-size.x / 2, size.x / 2]) {
    for (const y of [-size.y / 2, size.y / 2]) {
      for (const z of [-size.z / 2, size.z / 2]) {
        const corner = { x, y, z };
        const depth = distance - dot(corner, back);
        extent = Math.max(
          extent,
          Math.abs(dot(corner, right)) / (depth * tanVertical * aspect),
          Math.abs(dot(corner, up)) / (depth * tanVertical),
        );
      }
    }
  }
  return extent;
}

describe("computeFitDistance", () => {
  const front = { x: 0, y: 0, z: 1 };

  it("fits the limiting side of a flat box seen from the front", () => {
    const size = { x: 100, y: 50, z: 0 };

    expect(
      computeFitDistance({ size, direction: front, verticalFovDeg: 90, aspect: 1, padding: 0 }),
    ).toBeCloseTo(50);
    expect(
      computeFitDistance({ size, direction: front, verticalFovDeg: 90, aspect: 2, padding: 0 }),
    ).toBeCloseTo(25);
  });

  it("moves back to keep the padding free and to clear the box depth", () => {
    const size = { x: 100, y: 50, z: 10 };

    expect(
      computeFitDistance({ size, direction: front, verticalFovDeg: 90, aspect: 1, padding: 0.25 }),
    ).toBeCloseTo(105);
  });

  it("frames a panel seen from the default angle with its padding on the tightest side", () => {
    const size = { x: 101.6, y: 128.5, z: 2 };
    for (const aspect of [0.6, 1, 1.7]) {
      const distance = computeFitDistance({
        size,
        direction: DEFAULT_VIEW_DIRECTION,
        verticalFovDeg: 30,
        aspect,
        padding: 0.1,
      });

      expect(largestScreenExtent(size, DEFAULT_VIEW_DIRECTION, distance, 30, aspect)).toBeCloseTo(
        0.8,
      );
    }
  });
});
