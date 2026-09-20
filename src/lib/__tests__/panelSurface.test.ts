import { describe, expect, it } from "vite-plus/test";

import { buildPanelCutouts, splitOverlappingCutouts, type PanelCutout } from "@lib/panelSurface";
import { PanelElementType, type MountingHole, type PanelElement } from "@lib/panelTypes";

const PANEL_SIZE_MM = { x: 40, y: 100 };

function jack(id: string, x: number, y: number, diameterMm = 6): PanelElement {
  return { id, type: PanelElementType.Jack, positionMm: { x, y }, properties: { diameterMm } };
}

function rectangle(
  id: string,
  x: number,
  y: number,
  widthMm: number,
  heightMm: number,
): PanelElement {
  return {
    id,
    type: PanelElementType.Rectangle,
    positionMm: { x, y },
    properties: { widthMm, heightMm },
  };
}

function sourceIds(cutouts: PanelCutout[]): string[] {
  return cutouts.map((cutout) => ("id" in cutout.source ? cutout.source.id : "mounting-hole"));
}

function split(elements: PanelElement[], mountingHoles: MountingHole[] = []) {
  const { overlapping, separate } = splitOverlappingCutouts(
    PANEL_SIZE_MM,
    buildPanelCutouts({ mountingHoles, elements }),
  );
  return { overlapping: sourceIds(overlapping), separate: sourceIds(separate) };
}

describe("splitOverlappingCutouts", () => {
  it("leaves cut-outs clear of each other and of the panel edge as they are", () => {
    const mountingHole: MountingHole = {
      center: { x: 20, y: 3 },
      diameterMm: 3.2,
      shape: "circle",
    };

    expect(split([jack("a", 10, 20), jack("b", 20, 20)], [mountingHole])).toEqual({
      overlapping: [],
      separate: ["mounting-hole", "a", "b"],
    });
  });

  it("finds cut-outs that overlap, touch, or lie inside another", () => {
    expect(split([jack("a", 10, 20), jack("b", 15, 20), jack("c", 30, 20)])).toEqual({
      overlapping: ["a", "b"],
      separate: ["c"],
    });
    expect(
      split([rectangle("left", 10, 50, 10, 4), rectangle("right", 20, 50, 10, 4)]).overlapping,
    ).toEqual(["left", "right"]);
    expect(split([rectangle("outer", 20, 80, 20, 20), jack("inner", 20, 80)]).overlapping).toEqual([
      "outer",
      "inner",
    ]);
  });

  it("finds round cut-outs that overlap while their polygons do not", () => {
    // Round cut-outs are 48-sided polygons: halfway between two corners, their sides run 0.0086 mm
    // inside these 8 mm circles. In that direction, circles 7.99 mm apart overlap but their
    // polygons do not, and KiCad draws the circles.
    const direction = Math.PI / 48;
    const jackAt = (distance: number) =>
      jack("b", 10 + distance * Math.cos(direction), 50 + distance * Math.sin(direction), 8);

    expect(split([jack("a", 10, 50, 8), jackAt(7.99)]).overlapping).toEqual(["a", "b"]);
    expect(split([jack("a", 10, 50, 8), jackAt(8.05)]).overlapping).toEqual([]);
  });

  it("finds cut-outs that cross or touch the panel edge, not the ones off the panel", () => {
    expect(
      split([
        jack("crossing", 1, 50),
        rectangle("touching", 38, 70, 4, 10),
        jack("off-panel", 60, 50),
        jack("inside", 20, 50),
      ]),
    ).toEqual({ overlapping: ["crossing", "touching"], separate: ["off-panel", "inside"] });
  });

  it("ignores cut-outs without area", () => {
    expect(split([jack("a", 10, 20), jack("empty", 10, 20, 0)]).overlapping).toEqual([]);
  });
});

describe("buildPanelCutouts", () => {
  it("cuts switches with a round hole as circles, the others as rectangles", () => {
    const toggle: PanelElement = {
      id: "toggle",
      type: PanelElementType.Switch,
      positionMm: { x: 20, y: 50 },
      properties: { diameterMm: 5 },
    };
    const slide: PanelElement = {
      id: "slide",
      type: PanelElementType.Switch,
      positionMm: { x: 20, y: 80 },
      properties: { widthMm: 4, heightMm: 8 },
    };

    const [round, rectangular] = buildPanelCutouts({
      mountingHoles: [],
      elements: [toggle, slide],
    });

    expect(round.ring.every(([x, y]) => Math.abs(Math.hypot(x - 20, y - 50) - 2.5) < 1e-9)).toBe(
      true,
    );
    expect(rectangular.ring).toEqual([
      [18, 76],
      [22, 76],
      [22, 84],
      [18, 84],
    ]);
  });
});
