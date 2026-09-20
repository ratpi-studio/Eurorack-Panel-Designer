import { describe, expect, it } from "vite-plus/test";

import { MIN_MOUNTING_HOLE_SPACING_MM, generateMountingHoles } from "../mountingHoles";
import { DEFAULT_MM_PER_HP, DEFAULT_MOUNTING_HOLE_CONFIG, type MountingHole } from "../panelTypes";
import { createPanelDimensions, panelDimensionsFromHp } from "../units";

const EVERY_COMMON_WIDTH_HP = [2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 21, 22, 28, 42];

function columnsOf(holes: MountingHole[]): number[] {
  return Array.from(new Set(holes.map((hole) => hole.center.x))).sort((a, b) => a - b);
}

function columnsForHp(widthHp: number): { widthMm: number; xs: number[] } {
  const dimensions = panelDimensionsFromHp(widthHp);

  return {
    widthMm: dimensions.widthMm,
    xs: columnsOf(
      generateMountingHoles({
        widthHp: dimensions.widthHp,
        widthMm: dimensions.widthMm,
        heightMm: dimensions.heightMm,
      }),
    ),
  };
}

describe("mounting hole generation", () => {
  it("creates four holes for a single spacing segment", () => {
    const dimensions = createPanelDimensions(5);
    const holes = generateMountingHoles({
      widthHp: dimensions.widthHp,
      widthMm: dimensions.widthMm,
      heightMm: dimensions.heightMm,
    });

    expect(holes).toHaveLength(4);
    const xs = Array.from(new Set(holes.map((hole) => hole.center.x)));
    expect(xs).toHaveLength(2);
    holes.forEach((hole) => {
      expect(hole.diameterMm).toBe(DEFAULT_MOUNTING_HOLE_CONFIG.diameterMm);
      expect(hole.shape).toBe("circle");
    });
  });

  it("adds a column every spacing on a wide panel, plus the one at the right edge", () => {
    const { widthMm, xs } = columnsForHp(42);

    expect(xs.map((x) => Number(x.toFixed(2)))).toEqual([7.5, 58.3, 109.1, 159.9, 205.62]);
    expect(widthMm - (xs.at(-1) ?? 0)).toBeCloseTo(7.38);
  });

  it("puts the first column 7.5 mm from the left edge, and the last as close on the right", () => {
    const { xs } = columnsForHp(6);

    expect(xs[0]).toBeCloseTo(DEFAULT_MOUNTING_HOLE_CONFIG.horizontalOffsetMm);
    expect(xs[1]).toBeCloseTo(22.74);
  });

  it("keeps every column a whole number of HP from the first one", () => {
    const offGrid = EVERY_COMMON_WIDTH_HP.flatMap((widthHp) => {
      const { xs } = columnsForHp(widthHp);
      const first = xs[0] ?? 0;

      return xs
        .map((x) => (x - first) / DEFAULT_MM_PER_HP)
        .filter((steps) => Math.abs(steps - Math.round(steps)) > 1e-6)
        .map((steps) => ({ widthHp, steps }));
    });

    expect(offGrid).toEqual([]);
  });

  it("ends as close to the same offset from the right edge as the grid allows", () => {
    const offsetMm = DEFAULT_MOUNTING_HOLE_CONFIG.horizontalOffsetMm;
    const misplaced = EVERY_COMMON_WIDTH_HP.filter((widthHp) => widthHp >= 6).filter((widthHp) => {
      const { widthMm, xs } = columnsForHp(widthHp);
      const rightOffsetMm = widthMm - (xs.at(-1) ?? 0);

      return Math.abs(rightOffsetMm - offsetMm) > DEFAULT_MM_PER_HP / 2 + 1e-6;
    });

    expect(misplaced).toEqual([]);
  });

  it("keeps a single column on panels too narrow for a pair", () => {
    expect(columnsForHp(4).xs).toEqual([DEFAULT_MOUNTING_HOLE_CONFIG.horizontalOffsetMm]);
    expect(columnsForHp(1).xs).toEqual([2.5]);
  });

  it("clamps offsets when the panel is very narrow", () => {
    const dimensions = createPanelDimensions(1);
    const holes = generateMountingHoles({
      widthHp: dimensions.widthHp,
      widthMm: dimensions.widthMm,
      heightMm: dimensions.heightMm,
      config: { horizontalOffsetMm: 50 },
    });

    expect(holes.length).toBeGreaterThanOrEqual(2);
    const xs = Array.from(new Set(holes.map((hole) => hole.center.x)));
    expect(xs.length).toBeGreaterThanOrEqual(1);
    xs.forEach((x) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(dimensions.widthMm);
    });
  });

  it("supports slot mounting holes without exceeding panel width", () => {
    const dimensions = createPanelDimensions(4);
    const holes = generateMountingHoles({
      widthHp: dimensions.widthHp,
      widthMm: dimensions.widthMm,
      heightMm: dimensions.heightMm,
      config: { shape: "slot", slotLengthMm: 30, diameterMm: 3 },
    });

    expect(holes.every((hole) => hole.shape === "slot")).toBe(true);
    const topHoles = holes.filter((hole) => hole.center.y === holes[0]?.center.y);
    topHoles.forEach((hole) => {
      expect(hole.slotLengthMm).toBeLessThanOrEqual(dimensions.widthMm);
      expect(hole.center.x + (hole.slotLengthMm ?? 0) / 2).toBeLessThanOrEqual(dimensions.widthMm);
      expect(hole.center.x - (hole.slotLengthMm ?? 0) / 2).toBeGreaterThanOrEqual(0);
    });
    const sortedXs = topHoles.map((hole) => hole.center.x).sort((a, b) => a - b);
    for (let i = 1; i < sortedXs.length; i += 1) {
      expect(sortedXs[i] - sortedXs[i - 1]).toBeGreaterThanOrEqual(MIN_MOUNTING_HOLE_SPACING_MM);
    }
  });
});
