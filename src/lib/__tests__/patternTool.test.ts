import { describe, expect, it } from "vite-plus/test";

import { createPanelElement } from "@lib/elements";
import { PanelElementType, type PanelElement } from "@lib/panelTypes";
import {
  applyPatternResult,
  computePatternResult,
  createPatternTool,
  dragPatternHandle,
  getCircularDiameterMm,
  getPatternCandidateGuides,
  getPatternGuides,
  getPatternProblem,
  pickPatternReference,
  snapMirrorLine,
  snapReferencePoint,
  type CircularPatternTool,
  type MirrorTool,
  type PatternSnapContext,
  type RectangularPatternTool,
} from "@lib/patternTool";

function element(type: PanelElementType, x: number, y: number): PanelElement {
  return createPanelElement(type, { x, y });
}

const PANEL = { x: 60, y: 128.5 };

function context(patch: Partial<PatternSnapContext> = {}): PatternSnapContext {
  return {
    targets: [{ x: 30, y: 64.25 }],
    thresholdMm: 2,
    gridSizeMm: null,
    panelSizeMm: PANEL,
    ...patch,
  };
}

function round(point: { x: number; y: number }) {
  return { x: Math.round(point.x * 1000) / 1000, y: Math.round(point.y * 1000) / 1000 };
}

describe("references", () => {
  it("snaps a point to the nearest target within reach, else to the grid", () => {
    const ctx = context({ targets: [{ x: 30, y: 40 }], gridSizeMm: 5 });
    expect(snapReferencePoint({ x: 31, y: 41 }, ctx).pointMm).toEqual({ x: 30, y: 40 });
    expect(snapReferencePoint({ x: 12, y: 21 }, ctx)).toEqual({
      pointMm: { x: 10, y: 19.25 },
      targetMm: null,
    });
  });

  it("snaps a mirror line across its own direction only", () => {
    const ctx = context({ targets: [{ x: 30, y: 100 }] });
    expect(snapMirrorLine({ x: 31.5, y: 10 }, "vertical", ctx).pointMm).toEqual({ x: 30, y: 10 });
    expect(snapMirrorLine({ x: 31.5, y: 10 }, "horizontal", ctx).pointMm).toEqual({
      x: 31.5,
      y: 10,
    });
  });

  it("waits for its reference before showing anything", () => {
    const selection = [element(PanelElementType.Jack, 10, 20)];
    const mirror = createPatternTool("mirror");
    expect(computePatternResult(selection, mirror)).toEqual({ updated: [], copies: [] });
    expect(getPatternProblem(mirror, 1)).toBe("reference");
    const candidate = getPatternCandidateGuides(mirror, { x: 29, y: 50 }, context());
    expect(candidate?.lines[0].fromMm.x).toBe(30);
    const picked = pickPatternReference(mirror, { x: 29, y: 50 }, context()) as MirrorTool;
    expect(picked.lineMm).toEqual({ x: 30, y: 50 });
    expect(getPatternProblem(picked, 1)).toBeNull();
  });
});

describe("mirror", () => {
  it("adds mirrored copies, or moves the selection across", () => {
    const jack = element(PanelElementType.Jack, 10, 20);
    const tool: MirrorTool = {
      kind: "mirror",
      orientation: "vertical",
      lineMm: { x: 30, y: 0 },
      keepOriginal: true,
    };
    const copied = computePatternResult([jack], tool);
    expect(copied.updated).toEqual([]);
    expect(copied.copies[0].positionMm).toEqual({ x: 50, y: 20 });

    const moved = computePatternResult([jack], { ...tool, keepOriginal: false });
    expect(moved.copies).toEqual([]);
    expect(moved.updated[0].id).toBe(jack.id);
    expect(moved.updated[0].positionMm).toEqual({ x: 50, y: 20 });
    expect(applyPatternResult([jack], moved)).toEqual([moved.updated[0]]);
  });

  it("drags the line to a new place", () => {
    const tool: MirrorTool = {
      kind: "mirror",
      orientation: "horizontal",
      lineMm: { x: 30, y: 64.25 },
      keepOriginal: true,
    };
    const selection = [element(PanelElementType.Jack, 10, 20)];
    const dragged = dragPatternHandle(selection, tool, "line", { x: 5, y: 80 }, context());
    expect((dragged as MirrorTool).lineMm).toEqual({ x: 5, y: 80 });
  });
});

describe("rectangular pattern", () => {
  const selection = [element(PanelElementType.Jack, 10, 20)];
  const tool: RectangularPatternTool = {
    kind: "rectangular",
    columns: 1,
    rows: 2,
    spacingMm: { x: 10, y: 15 },
  };

  it("draws one arrow per direction, from the selection to the next instance", () => {
    const guides = getPatternGuides(selection, tool, PANEL);
    expect(guides.arrows.map((arrow) => [arrow.id, arrow.toMm])).toEqual([
      ["spacing-x", { x: 20, y: 20 }],
      ["spacing-y", { x: 10, y: 35 }],
    ]);
  });

  it("sets the spacing from the arrow, snapped to the grid, and adds a column", () => {
    const dragged = dragPatternHandle(
      selection,
      tool,
      "spacing-x",
      { x: 22.7, y: 40 },
      context({ gridSizeMm: 2.54 }),
    ) as RectangularPatternTool;
    expect(dragged.spacingMm).toEqual({ x: 12.7, y: 15 });
    expect(dragged.columns).toBe(2);
    expect(dragged.rows).toBe(2);
    expect(computePatternResult(selection, dragged).copies).toHaveLength(3);
  });

  it("refuses more copies than one command may add", () => {
    expect(getPatternProblem({ ...tool, columns: 50, rows: 50 }, 1)).toBe("tooMany");
    expect(getPatternProblem({ ...tool, rows: 1 }, 1)).toBe("nothing");
  });
});

describe("circular pattern", () => {
  const led = element(PanelElementType.Led, 30, 28);
  const tool: CircularPatternTool = {
    kind: "circular",
    centerMm: { x: 30, y: 40 },
    count: 4,
    sweepDeg: 360,
    diameterMm: null,
    rotateCopies: false,
  };

  it("keeps the selection where it is until a diameter is set", () => {
    const result = computePatternResult([led], tool);
    expect(result.updated).toEqual([]);
    expect(result.copies.map((copy) => round(copy.positionMm))).toEqual([
      { x: 42, y: 40 },
      { x: 30, y: 52 },
      { x: 18, y: 40 },
    ]);
    expect(getCircularDiameterMm([led], tool)).toBe(24);
  });

  it("moves the selection along its direction to the diameter of the arrow", () => {
    const dragged = dragPatternHandle(
      [led],
      tool,
      "diameter",
      { x: 31, y: 20 },
      context(),
    ) as CircularPatternTool;
    expect(dragged.diameterMm).toBe(40);
    const result = computePatternResult([led], dragged);
    expect(round(result.updated[0].positionMm)).toEqual({ x: 30, y: 20 });
    expect(round(result.copies[1].positionMm)).toEqual({ x: 30, y: 60 });
    const guides = getPatternGuides([led], dragged, PANEL);
    expect(guides.circles[0].radiusMm).toBe(20);
    expect(guides.arrows[0].label).toBe("Ø 40 mm");
  });

  it("moves the center with its handle", () => {
    const dragged = dragPatternHandle(
      [led],
      tool,
      "center",
      { x: 29.5, y: 64 },
      context(),
    ) as CircularPatternTool;
    expect(dragged.centerMm).toEqual({ x: 30, y: 64.25 });
  });
});
