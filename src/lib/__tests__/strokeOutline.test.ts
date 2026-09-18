import polygonClipping from "polygon-clipping";
import { describe, expect, it } from "vite-plus/test";

import { strokeOutline, type OutlinePoint } from "@lib/strokeOutline";

function ringArea(ring: OutlinePoint[]): number {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[(index + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

/** Area covered by the outline under the nonzero rule, as polygon-clipping resolves it. */
function filledArea(outline: OutlinePoint[] | null): number {
  expect(outline).not.toBeNull();
  const polygons = polygonClipping.union([[outline as OutlinePoint[]]]);
  return polygons.reduce(
    (total, [outer, ...holes]) =>
      total + ringArea(outer) - holes.reduce((sum, hole) => sum + ringArea(hole), 0),
    0,
  );
}

describe("strokeOutline", () => {
  const segment: OutlinePoint[] = [
    [0, 0],
    [10, 0],
  ];

  it("covers a straight segment with each cap style", () => {
    expect(filledArea(strokeOutline(segment, { width: 2, lineCap: "butt" }))).toBeCloseTo(20);
    expect(filledArea(strokeOutline(segment, { width: 2, lineCap: "square" }))).toBeCloseTo(24);
    // Round caps add a disc, drawn with 32 points per turn.
    expect(filledArea(strokeOutline(segment, { width: 2, lineCap: "round" }))).toBeCloseTo(
      20 + 16 * Math.sin(Math.PI / 16),
      5,
    );
  });

  it("gives a closed path a join at every corner and no caps", () => {
    const square: OutlinePoint[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];

    const outline = strokeOutline(square, { width: 2, lineJoin: "miter", lineCap: "round" });

    // Band between the 12 mm outer square and the 8 mm inner one.
    expect(filledArea(outline)).toBeCloseTo(12 * 12 - 8 * 8);
  });

  it("fills sharp inner turns without leaving holes", () => {
    const hairpin: OutlinePoint[] = [
      [0, 0],
      [10, 0],
      [0, 1],
    ];

    const polygons = polygonClipping.union([
      [strokeOutline(hairpin, { width: 2, lineJoin: "round", lineCap: "butt" }) as OutlinePoint[]],
    ]);

    expect(polygons).toHaveLength(1);
    expect(polygons[0]).toHaveLength(1);
  });

  it("draws a dot for a zero-length path with round caps only", () => {
    const dot: OutlinePoint[] = [
      [5, 5],
      [5, 5],
    ];

    expect(filledArea(strokeOutline(dot, { width: 2, lineCap: "round" }))).toBeCloseTo(
      16 * Math.sin(Math.PI / 16),
      5,
    );
    expect(strokeOutline(dot, { width: 2, lineCap: "butt" })).toBeNull();
  });

  it("skips paths with invalid coordinates or width", () => {
    expect(
      strokeOutline(
        [
          [0, 0],
          [Number.NaN, 4],
        ],
        { width: 2 },
      ),
    ).toBeNull();
    expect(strokeOutline(segment, { width: 0 })).toBeNull();
  });
});
