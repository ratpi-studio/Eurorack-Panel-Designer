import { describe, expect, it } from "vite-plus/test";

import { computeElementMountingHoles } from "@lib/elementMountingHoles";
import { createPanelElement } from "@lib/elements";
import {
  buildCircularArray,
  buildRectangularArray,
  copyElements,
  getCircularStepDeg,
  getElementsCenter,
  mirrorElements,
  normalizeAngleDeg,
} from "@lib/elementTransforms";
import {
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  PanelElementType,
  type PanelElement,
} from "@lib/panelTypes";

function element(
  type: PanelElementType,
  x: number,
  y: number,
  patch: Partial<PanelElement> = {},
): PanelElement {
  return { ...createPanelElement(type, { x, y }), ...patch } as PanelElement;
}

function sortedPoints(points: { x: number; y: number }[]) {
  return points
    .map(({ x, y }) => ({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
}

describe("element copies", () => {
  it("gives copies new ids, moves them, and leaves the originals untouched", () => {
    const original = element(PanelElementType.Jack, 10, 20, { locked: true });
    const [copy] = copyElements([original], { x: 5, y: -2 });
    expect(copy.id).not.toBe(original.id);
    expect(copy.positionMm).toEqual({ x: 15, y: 18 });
    expect(copy.locked).toBeUndefined();
    expect(copy.properties).toEqual(original.properties);
    expect(copy.properties).not.toBe(original.properties);
    expect(original.positionMm).toEqual({ x: 10, y: 20 });
  });

  it("finds the center of a group from its positions", () => {
    expect(
      getElementsCenter([
        element(PanelElementType.Jack, 0, 10),
        element(PanelElementType.Led, 20, 30),
        element(PanelElementType.Led, 5, 20),
      ]),
    ).toEqual({ x: 10, y: 20 });
    expect(getElementsCenter([])).toBeNull();
  });
});

describe("mirrors", () => {
  it("mirrors positions across a vertical or a horizontal line", () => {
    const jack = element(PanelElementType.Jack, 10, 30);
    expect(mirrorElements([jack], "vertical", 25)[0].positionMm).toEqual({ x: 40, y: 30 });
    expect(mirrorElements([jack], "horizontal", 64.25)[0].positionMm).toEqual({ x: 10, y: 98.5 });
  });

  it("turns asymmetric outlines into their mirror image", () => {
    const slot = element(PanelElementType.Slot, 10, 30, { rotationDeg: 30 });
    expect(mirrorElements([slot], "vertical", 0)[0].rotationDeg).toBe(-30);
    expect(mirrorElements([slot], "horizontal", 0)[0].rotationDeg).toBe(150);
    const triangle = element(PanelElementType.Triangle, 10, 30);
    expect(mirrorElements([triangle], "vertical", 0)[0].rotationDeg).toBeUndefined();
    expect(mirrorElements([triangle], "horizontal", 0)[0].rotationDeg).toBe(180);
  });

  it("keeps round holes, texts and SVG patterns at their angle", () => {
    const jack = element(PanelElementType.Jack, 10, 30, { rotationDeg: 20 });
    const text = element(PanelElementType.Label, 10, 30, { rotationDeg: 20 });
    expect(mirrorElements([jack], "horizontal", 0)[0].rotationDeg).toBe(20);
    expect(mirrorElements([text], "horizontal", 0)[0].rotationDeg).toBe(20);
  });

  it("puts the holes around an element where the reflection of the original ones lands", () => {
    const config = { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG, enabled: true, count: 3 };
    for (const axis of ["vertical", "horizontal"] as const) {
      const rectangle = element(PanelElementType.Rectangle, 10, 30, {
        rotationDeg: 25,
        mountingHolesEnabled: true,
        mountingHoleRotationDeg: 40,
      });
      const [mirrored] = mirrorElements([rectangle], axis, 0, config.rotationDeg);
      const reflected = computeElementMountingHoles([rectangle], config).map(
        ({ center: position }) =>
          axis === "vertical"
            ? { x: -position.x, y: position.y }
            : { x: position.x, y: -position.y },
      );
      const actual = computeElementMountingHoles([mirrored], config).map(
        ({ center: position }) => position,
      );
      expect(sortedPoints(actual)).toEqual(sortedPoints(reflected));
    }
  });
});

describe("rectangular arrays", () => {
  it("copies the selection to every other cell of the grid", () => {
    const jack = element(PanelElementType.Jack, 10, 20);
    const copies = buildRectangularArray([jack], {
      columns: 3,
      rows: 2,
      spacingXMm: 10.16,
      spacingYMm: -15,
    });
    expect(copies.map((copy) => copy.positionMm)).toEqual([
      { x: 20.16, y: 20 },
      { x: 30.32, y: 20 },
      { x: 10, y: 5 },
      { x: 20.16, y: 5 },
      { x: 30.32, y: 5 },
    ]);
    expect(new Set(copies.map((copy) => copy.id)).size).toBe(5);
  });

  it("makes nothing for a single cell or an oversized grid", () => {
    const jack = element(PanelElementType.Jack, 10, 20);
    expect(
      buildRectangularArray([jack], { columns: 1, rows: 1, spacingXMm: 5, spacingYMm: 5 }),
    ).toEqual([]);
    expect(
      buildRectangularArray([jack], { columns: 50, rows: 50, spacingXMm: 5, spacingYMm: 5 }),
    ).toEqual([]);
  });
});

describe("circular arrays", () => {
  it("spaces a full turn evenly and a partial sweep from end to end", () => {
    expect(getCircularStepDeg({ count: 4, sweepDeg: 360 })).toBe(90);
    expect(getCircularStepDeg({ count: 5, sweepDeg: 270 })).toBe(67.5);
    expect(getCircularStepDeg({ count: 3, sweepDeg: -90 })).toBe(-45);
  });

  it("turns copies around the center, clockwise on screen", () => {
    const led = element(PanelElementType.Led, 30, 20, { rotationDeg: 10 });
    const copies = buildCircularArray([led], {
      count: 4,
      centerMm: { x: 20, y: 20 },
      sweepDeg: 360,
      rotateCopies: true,
    });
    expect(copies.map((copy) => copy.positionMm)).toEqual([
      { x: 20, y: 30 },
      { x: 10, y: 20 },
      { x: 20, y: 10 },
    ]);
    expect(copies.map((copy) => copy.rotationDeg)).toEqual([100, -170, -80]);
  });

  it("keeps the orientation of copies when asked to", () => {
    const text = element(PanelElementType.Label, 30, 20);
    const copies = buildCircularArray([text], {
      count: 3,
      centerMm: { x: 20, y: 20 },
      sweepDeg: 180,
      rotateCopies: false,
    });
    expect(copies.map((copy) => copy.positionMm)).toEqual([
      { x: 20, y: 30 },
      { x: 10, y: 20 },
    ]);
    expect(copies.every((copy) => copy.rotationDeg === undefined)).toBe(true);
  });
});

describe("angles", () => {
  it("brings angles to (-180, 180]", () => {
    expect(normalizeAngleDeg(190)).toBe(-170);
    expect(normalizeAngleDeg(-180)).toBe(180);
    expect(normalizeAngleDeg(540)).toBe(180);
    expect(normalizeAngleDeg(-0)).toBe(0);
  });
});
