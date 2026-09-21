// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from "vite-plus/test";

import {
  PANEL_RELIEF_MATERIAL_INDEX,
  buildDesignLayerPolygons,
  buildPanelStlWithWarnings,
  createPanelExtrusion,
} from "@lib/exportStl";
import { createPanelElement } from "@lib/elements";
import type { SurfaceMultiPolygon, SurfaceRing } from "@lib/panelSurface";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  type LabelElement,
  type PanelElement,
  type PanelModel,
} from "@lib/panelTypes";
import { DEFAULT_PANEL_FORMAT } from "@lib/panelFormat";
import { getLabelKnockoutRing, getLabelTextLayout } from "@lib/text/textLayout";
import { buildLabelTextPolygons } from "@lib/text/textPolygons";
import { createPanelDimensions } from "@lib/units";

import { loadTestFont } from "./textFontFixtures";

const PANEL_THICKNESS_MM = 2;

function createModel(elements: PanelElement[], designRelief = DEFAULT_DESIGN_RELIEF): PanelModel {
  return {
    dimensions: createPanelDimensions(4),
    elements,
    options: { ...DEFAULT_PANEL_OPTIONS },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: "#1a1a1a",
    designColor: "#ffffff",
    designRelief: { ...designRelief },
    format: { ...DEFAULT_PANEL_FORMAT },
  };
}

function label(
  text: string,
  position: { x: number; y: number },
  properties: Partial<LabelElement["properties"]> = {},
): LabelElement {
  const element = createPanelElement(PanelElementType.Label, position) as LabelElement;
  return {
    ...element,
    id: `label-${text}`,
    properties: { ...element.properties, text, ...properties },
  };
}

/** A square SVG pattern, fully black, centered on `position`. */
function squarePattern(position: { x: number; y: number }, sizeMm: number): PanelElement {
  return {
    id: "pattern",
    type: PanelElementType.SvgArtwork,
    positionMm: position,
    properties: {
      svgText:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#000"/></svg>',
      viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
      widthMm: sizeMm,
      heightMm: sizeMm,
      color: "#ffffff",
      sourceName: "square.svg",
    },
  };
}

function ringArea(ring: SurfaceRing): number {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[(index + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function area(polygons: SurfaceMultiPolygon): number {
  return polygons.reduce(
    (total, [outer, ...holes]) =>
      total + ringArea(outer) - holes.reduce((sum, hole) => sum + ringArea(hole), 0),
    0,
  );
}

/** Z values of the relief group, rounded to 0.1 µm. */
function reliefLevels(model: PanelModel): number[] {
  const geometry = createPanelExtrusion(model, [], PANEL_THICKNESS_MM);
  const relief = geometry.groups.find(
    (group) => group.materialIndex === PANEL_RELIEF_MATERIAL_INDEX,
  );
  if (!relief) {
    return [];
  }
  const position = geometry.getAttribute("position");
  const levels = new Set<number>();
  for (let vertex = relief.start; vertex < relief.start + relief.count; vertex += 1) {
    levels.add(Math.round(position.getZ(vertex) * 1e4) / 1e4);
  }
  return [...levels].sort((a, b) => a - b);
}

const center = { x: 10, y: 60 };
const panelSurface: SurfaceMultiPolygon = [
  [
    [
      [0, 0],
      [100, 0],
      [100, 200],
      [0, 200],
    ],
  ],
];

beforeAll(async () => {
  await loadTestFont("roboto");
});

describe("text relief", () => {
  it("raises text to the level of the SVG relief", () => {
    expect(reliefLevels(createModel([label("OUT", center)]))).toEqual([1.8, 2.4]);
    expect(
      reliefLevels(createModel([label("OUT", center), squarePattern({ x: 10, y: 20 }, 8)])),
    ).toEqual([1.8, 2.4]);
  });

  it("follows the panel's design relief", () => {
    const model = createModel([label("OUT", center)], { thicknessMm: 1, penetrationMm: 0.3 });

    expect(reliefLevels(model)).toEqual([1.7, 2.7]);
  });

  it("builds no relief without thickness", () => {
    const model = createModel([label("OUT", center)], { thicknessMm: 0, penetrationMm: 0.2 });

    expect(reliefLevels(model)).toEqual([]);
  });

  it("keeps text out of cut-outs", () => {
    const jack: PanelElement = {
      id: "jack",
      type: PanelElementType.Jack,
      positionMm: center,
      properties: { diameterMm: 3 },
    };
    const model = createModel([label("OOO", center, { fontSizePt: 14 }), jack]);

    const geometry = createPanelExtrusion(model, [], PANEL_THICKNESS_MM);
    const relief = geometry.groups[1];
    const position = geometry.getAttribute("position");
    const inside: number[] = [];
    for (let vertex = relief.start; vertex < relief.start + relief.count; vertex += 1) {
      const x = position.getX(vertex);
      const y = model.dimensions.heightMm - position.getY(vertex);
      if (Math.hypot(x - center.x, y - center.y) < 1.5 * Math.cos(Math.PI / 48) - 1e-6) {
        inside.push(vertex);
      }
    }
    expect(relief.count).toBeGreaterThan(0);
    expect(inside).toEqual([]);
  });

  it("warns when a text's font is not available", () => {
    const text = label("Missing font", center, { fontId: "michroma" });

    const { warnings } = buildPanelStlWithWarnings(createModel([text]), [], {
      thicknessMm: PANEL_THICKNESS_MM,
    });

    expect(warnings).toEqual(["Missing font"]);
  });
});

describe("text over SVG patterns", () => {
  const pattern = squarePattern(center, 16);
  const patternArea = 16 * 16;

  it("clears the pattern around knocked-out text, and raises the text inside", () => {
    const text = label("HI", center, { patternOverlap: "knockout", knockoutPaddingMm: 1 });
    const layout = getLabelTextLayout(text.properties)!;
    const zoneArea = ringArea(getLabelKnockoutRing(text)!);
    const textArea = area(buildLabelTextPolygons(layout));

    const layer = buildDesignLayerPolygons(createModel([pattern, text]), panelSurface);

    expect(zoneArea).toBeGreaterThan(textArea);
    expect(area(layer)).toBeCloseTo(patternArea - zoneArea + textArea, 3);
    // The pattern with its cleared window, and the two letters inside it.
    expect(layer).toHaveLength(3);
    expect(layer.find((polygon) => polygon.length === 2)).toBeDefined();
  });

  it("widens the cleared zone with the padding", () => {
    const tight = buildDesignLayerPolygons(
      createModel([pattern, label("HI", center, { knockoutPaddingMm: 0.5 })]),
      panelSurface,
    );
    const loose = buildDesignLayerPolygons(
      createModel([pattern, label("HI", center, { knockoutPaddingMm: 2 })]),
      panelSurface,
    );

    expect(area(loose)).toBeLessThan(area(tight));
  });

  it("merges text into the pattern at the same level", () => {
    const text = label("HI", center, { patternOverlap: "merge" });

    const layer = buildDesignLayerPolygons(createModel([pattern, text]), panelSurface);

    // The text lies within the pattern: one solid square, no extra area and no seams.
    expect(layer).toHaveLength(1);
    expect(layer[0]).toHaveLength(1);
    expect(area(layer)).toBeCloseTo(patternArea, 3);
  });

  it("merges texts that stick out of the pattern into one outline", () => {
    const text = label("HI", { x: center.x + 8, y: center.y }, { patternOverlap: "merge" });
    const textArea = area(buildLabelTextPolygons(getLabelTextLayout(text.properties)!));

    const layer = buildDesignLayerPolygons(createModel([pattern, text]), panelSurface);

    expect(area(layer)).toBeGreaterThan(patternArea);
    expect(area(layer)).toBeLessThan(patternArea + textArea);
  });

  it("leaves patterns away from the text untouched", () => {
    const farText = label("HI", { x: 10, y: 110 });

    const layer = buildDesignLayerPolygons(createModel([pattern, farText]), panelSurface);

    expect(area(layer)).toBeCloseTo(
      patternArea + area(buildLabelTextPolygons(getLabelTextLayout(farText.properties)!)),
      3,
    );
  });
});
