import { describe, expect, it } from "vite-plus/test";

import { buildKicadEdgeCutsSvg, buildKicadPcbFile } from "@lib/exportKicad";
import { generateMountingHoles } from "@lib/mountingHoles";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  DEFAULT_MM_PER_HP,
  PanelElementType,
  type PanelElement,
  type PanelModel,
} from "@lib/panelTypes";
import { createPanelDimensions } from "@lib/units";

type Point = [number, number];

interface EdgeCutLine {
  start: Point;
  end: Point;
}

function jack(id: string, x: number, y: number): PanelElement {
  return { id, type: PanelElementType.Jack, positionMm: { x, y }, properties: { diameterMm: 6 } };
}

function parseEdgeCutLines(pcb: string): EdgeCutLine[] {
  return [...pcb.matchAll(/\(gr_line \(start (\S+) (\S+)\) \(end (\S+) (\S+)\)/g)].map((match) => ({
    start: [Number(match[1]), Number(match[2])],
    end: [Number(match[3]), Number(match[4])],
  }));
}

/** Corners that do not end exactly one line and start exactly one other: open outlines. */
function openCorners(lines: EdgeCutLine[]): string[] {
  const balance = new Map<string, number>();
  for (const { start, end } of lines) {
    balance.set(start.join(" "), (balance.get(start.join(" ")) ?? 0) + 1);
    balance.set(end.join(" "), (balance.get(end.join(" ")) ?? 0) - 1);
  }
  return [...balance].filter(([, count]) => count !== 0).map(([corner]) => corner);
}

function side(a: Point, b: Point, point: Point): number {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
}

/** Pairs of lines that cross each other, which KiCad rejects in a board outline. */
function crossingLines(lines: EdgeCutLine[]): Array<[number, number]> {
  const crossings: Array<[number, number]> = [];
  lines.forEach((a, index) => {
    for (let other = index + 1; other < lines.length; other += 1) {
      const b = lines[other];
      if (
        side(b.start, b.end, a.start) * side(b.start, b.end, a.end) < 0 &&
        side(a.start, a.end, b.start) * side(a.start, a.end, b.end) < 0
      ) {
        crossings.push([index, other]);
      }
    }
  });
  return crossings;
}

function createSampleModel(): PanelModel {
  return {
    dimensions: createPanelDimensions(2, DEFAULT_MM_PER_HP, 50),
    elements: [
      {
        id: "jack-1",
        type: PanelElementType.Jack,
        positionMm: { x: 10, y: 15 },
        properties: {
          diameterMm: 6,
        },
      },
      {
        id: "switch-1",
        type: PanelElementType.Switch,
        positionMm: { x: 15, y: 30 },
        properties: {
          widthMm: 8,
          heightMm: 10,
        },
      },
      {
        id: "rectangle-1",
        type: PanelElementType.Rectangle,
        positionMm: { x: 25, y: 40 },
        properties: {
          widthMm: 6,
          heightMm: 8,
        },
      },
      {
        id: "oval-1",
        type: PanelElementType.Oval,
        positionMm: { x: 35, y: 50 },
        properties: {
          widthMm: 12,
          heightMm: 6,
        },
      },
      {
        id: "slot-1",
        type: PanelElementType.Slot,
        positionMm: { x: 45, y: 60 },
        properties: {
          widthMm: 14,
          heightMm: 4,
        },
      },
      {
        id: "triangle-1",
        type: PanelElementType.Triangle,
        positionMm: { x: 55, y: 70 },
        properties: {
          widthMm: 10,
          heightMm: 8,
        },
      },
    ],
    options: { ...DEFAULT_PANEL_OPTIONS },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: "#1a1a1a",
    designColor: "#ffffff",
    designRelief: { ...DEFAULT_DESIGN_RELIEF },
  };
}

describe("buildKicadEdgeCutsSvg", () => {
  it("outputs an SVG with outline and cutouts in millimeters", () => {
    const model = createSampleModel();
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const svg = buildKicadEdgeCutsSvg(model, mountingHoles);
    const widthStr = model.dimensions.widthMm.toString();
    const heightStr = model.dimensions.heightMm.toString();

    expect(svg).toContain(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${widthStr}mm" height="${heightStr}mm" viewBox="0 0 ${widthStr} ${heightStr}">`,
    );
    expect(svg).toContain(
      `<rect x="0" y="0" width="${widthStr}" height="${heightStr}" stroke="black" stroke-width="0.1" fill="none" />`,
    );
    expect(svg).toContain(
      `<circle cx="10" cy="15" r="3" stroke="black" stroke-width="0.1" fill="none" />`,
    );
    expect(svg).toContain(
      `<rect x="11" y="25" width="8" height="10" stroke="black" stroke-width="0.1" fill="none" />`,
    );
    expect(svg).toContain(
      `<rect x="22" y="36" width="6" height="8" stroke="black" stroke-width="0.1" fill="none" />`,
    );
    expect(svg).toContain(
      `<ellipse cx="35" cy="50" rx="6" ry="3" stroke="black" stroke-width="0.1" fill="none" />`,
    );
    expect(svg).toContain(`M 40 58 H 50 A 2 2 0 0 1 50 62 H 40 A 2 2 0 0 1 40 58 Z`);
    expect(svg).toContain(`M 55 66 L 60 74 L 50 74 Z`);
  });
});

describe("buildKicadPcbFile", () => {
  it("creates a minimal .kicad_pcb with Edge.Cuts geometry", () => {
    const model = createSampleModel();
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const pcb = buildKicadPcbFile(model, mountingHoles);

    expect(pcb.startsWith("(kicad_pcb (version 20231126)")).toBe(true);
    expect(pcb).toContain('(layer "Edge.Cuts")');
    expect(pcb).toContain(
      `(gr_line (start 0 0) (end ${model.dimensions.widthMm} 0) (layer "Edge.Cuts") (width 0.15))`,
    );
    expect(pcb).toContain(`(gr_line (start 11 25) (end 19 25) (layer "Edge.Cuts") (width 0.15))`);
    expect(pcb).toContain(`(gr_line (start 50 62) (end 40 62) (layer "Edge.Cuts") (width 0.15))`);
    expect(pcb).toContain(`(gr_line (start 55 66) (end 60 74) (layer "Edge.Cuts") (width 0.15))`);

    const grLineCount = pcb.match(/\(gr_line /g)?.length ?? 0;
    const expectedMinimum =
      4 + // outline
      4 + // rectangular hole
      (mountingHoles.length + 1) * 32; // 32 segments per circular cutout (mounting holes + jack)
    expect(grLineCount).toBeGreaterThanOrEqual(expectedMinimum);
  });
});

describe("rotated cut-outs", () => {
  it("turns cut-outs around their center like the canvas", () => {
    const model: PanelModel = {
      ...createSampleModel(),
      elements: [
        {
          id: "rectangle-turned",
          type: PanelElementType.Rectangle,
          positionMm: { x: 10, y: 25 },
          rotationDeg: 90,
          properties: {
            widthMm: 30,
            heightMm: 4,
          },
        },
      ],
    };

    const svg = buildKicadEdgeCutsSvg(model, []);
    const pcb = buildKicadPcbFile(model, []);

    expect(svg).toContain(
      `<rect x="-5" y="23" width="30" height="4" stroke="black" stroke-width="0.1" fill="none" transform="rotate(90 10 25)" />`,
    );
    // Once turned, the 30 × 4 mm cut-out spans x 8 → 12 and y 10 → 40.
    expect(pcb).toContain(`(gr_line (start 12 10) (end 12 40) (layer "Edge.Cuts") (width 0.15))`);
    expect(pcb).toContain(`(gr_line (start 12 40) (end 8 40) (layer "Edge.Cuts") (width 0.15))`);
    expect(pcb).toContain(`(gr_line (start 8 40) (end 8 10) (layer "Edge.Cuts") (width 0.15))`);
    expect(pcb).toContain(`(gr_line (start 8 10) (end 12 10) (layer "Edge.Cuts") (width 0.15))`);
  });
});

describe("overlapping cut-outs", () => {
  it("merges overlapping jacks into one outline, without crossing lines", () => {
    const model: PanelModel = {
      ...createSampleModel(),
      elements: [jack("jack-1", 8, 20), jack("jack-2", 13, 20), jack("jack-3", 10, 35)],
    };
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const svg = buildKicadEdgeCutsSvg(model, mountingHoles);
    const lines = parseEdgeCutLines(buildKicadPcbFile(model, mountingHoles));

    // Edge.Cuts SVG: the board outline, one path for both jacks, circles for the other holes.
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(svg.match(/<circle /g)).toHaveLength(mountingHoles.length + 1);
    expect(svg).toContain(
      `<circle cx="10" cy="35" r="3" stroke="black" stroke-width="0.1" fill="none" />`,
    );

    // .kicad_pcb: closed outlines that never cross, and no corner left inside the merged jacks.
    expect(openCorners(lines)).toEqual([]);
    expect(crossingLines(lines)).toEqual([]);
    const closest = 3 * Math.cos(Math.PI / 48) - 1e-4;
    expect(
      lines.filter(
        ({ start: [x, y] }) =>
          Math.hypot(x - 8, y - 20) < closest || Math.hypot(x - 13, y - 20) < closest,
      ),
    ).toEqual([]);
  });

  it("opens a jack that crosses the panel edge into the board outline", () => {
    const model: PanelModel = { ...createSampleModel(), elements: [jack("jack-edge", 1, 20)] };

    const svg = buildKicadEdgeCutsSvg(model, []);
    const lines = parseEdgeCutLines(buildKicadPcbFile(model, []));

    expect(svg.match(/<path /g)).toHaveLength(1);
    expect(svg).not.toContain("<rect");
    expect(svg).not.toContain("<circle");
    expect(openCorners(lines)).toEqual([]);
    expect(crossingLines(lines)).toEqual([]);
    // The left side of the board stops where the jack starts.
    expect(
      lines.filter(
        ({ start, end }) =>
          start[0] === 0 &&
          end[0] === 0 &&
          Math.min(start[1], end[1]) < 20 &&
          Math.max(start[1], end[1]) > 20,
      ),
    ).toEqual([]);
  });
});
