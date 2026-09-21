// @vitest-environment jsdom

import { readFileSync } from "node:fs";

import polygonClipping from "polygon-clipping";
import { describe, expect, it, vi } from "vite-plus/test";

import {
  PANEL_BODY_MATERIAL_INDEX,
  PANEL_RELIEF_MATERIAL_INDEX,
  buildPanelStlWithWarnings,
  createPanelExtrusion,
} from "@lib/exportStl";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  PanelElementType,
  type PanelElement,
  type PanelModel,
} from "@lib/panelTypes";
import { DEFAULT_PANEL_FORMAT } from "@lib/panelFormat";
import { createPanelElement } from "@lib/elements";
import { generateMountingHoles } from "@lib/mountingHoles";
import { createSvgArtworkElement, sanitizeSvgArtwork } from "@lib/svgArtwork";
import { createPanelDimensions } from "@lib/units";

function createPanel(widthHp = 8): PanelModel {
  return {
    dimensions: createPanelDimensions(widthHp),
    elements: [],
    options: {
      showGrid: true,
      showMountingHoles: true,
      snapToGrid: true,
      gridSizeMm: 5,
      showDimensions: true,
      showHardware: true,
    },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: "#1a1a1a",
    designColor: "#ffffff",
    designRelief: { ...DEFAULT_DESIGN_RELIEF },
    format: { ...DEFAULT_PANEL_FORMAT },
  };
}

describe("buildPanelStl with SVG artwork", () => {
  it("expands a `<pattern>` fill into multiple repeated reliefs", () => {
    const model = createPanel(10);
    model.elements.push({
      id: "svg-pattern",
      type: PanelElementType.SvgArtwork,
      positionMm: { x: model.dimensions.widthMm / 2, y: model.dimensions.heightMm / 2 },
      properties: {
        svgText: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="5" y="5" width="10" height="10" fill="#000"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#dots)"/>
        </svg>`,
        viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
        widthMm: 40,
        heightMm: 40,
        color: "#ffffff",
        sourceName: "dots.svg",
      },
    });

    const result = buildPanelStlWithWarnings(model, [], { thicknessMm: 2 });

    expect(result.warnings).toEqual([]);
    expect(result.stl).toContain("facet");
    const facetCount = (result.stl.match(/facet normal/g) ?? []).length;
    expect(facetCount).toBeGreaterThan(50);
  });

  it("turns stroked paths into relief geometry", () => {
    const model = createPanel(8);
    model.elements.push({
      id: "svg-stroke",
      type: PanelElementType.SvgArtwork,
      positionMm: { x: model.dimensions.widthMm / 2, y: model.dimensions.heightMm / 2 },
      properties: {
        svgText: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <path d="M10 50 L90 50" fill="none" stroke="#000" stroke-width="6"/>
        </svg>`,
        viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
        widthMm: 30,
        heightMm: 30,
        color: "#ffffff",
        sourceName: "stroke.svg",
      },
    });

    const result = buildPanelStlWithWarnings(model, [], { thicknessMm: 2 });

    expect(result.warnings).toEqual([]);
    expect(result.stl).toMatch(/2\.4/);
    const facetCount = (result.stl.match(/facet normal/g) ?? []).length;
    expect(facetCount).toBeGreaterThan(20);
  });

  it("clips artwork against panel cutouts so no relief is generated inside a jack hole", () => {
    const model = createPanel(8);
    const cx = model.dimensions.widthMm / 2;
    const cy = model.dimensions.heightMm / 2;
    model.elements.push(
      {
        id: "jack-1",
        type: PanelElementType.Jack,
        positionMm: { x: cx, y: cy },
        properties: { diameterMm: 6 },
      },
      {
        id: "svg-cover",
        type: PanelElementType.SvgArtwork,
        positionMm: { x: cx, y: cy },
        properties: {
          svgText:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" fill="#000"/></svg>',
          viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
          widthMm: 30,
          heightMm: 30,
          color: "#ffffff",
        },
      },
    );

    const stl = buildPanelStlWithWarnings(model, [], { thicknessMm: 2 }).stl;
    const reliefVertices = Array.from(
      stl.matchAll(/vertex\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+2\.4/g),
    );
    expect(reliefVertices.length).toBeGreaterThan(0);

    const jackRadius = 3;
    const distancesToJackCenter = reliefVertices.map(([, x, y]) => {
      const px = Number.parseFloat(x);
      const py = Number.parseFloat(y);
      return Math.hypot(px - cx, py - (model.dimensions.heightMm - cy));
    });
    expect(distancesToJackCenter.some((d) => d < jackRadius - 0.01)).toBe(false);
  });

  it("puts the SVG relief in its own material group after the panel body", () => {
    const model = createPanel(8);
    model.elements.push({
      id: "svg-square",
      type: PanelElementType.SvgArtwork,
      positionMm: { x: model.dimensions.widthMm / 2, y: model.dimensions.heightMm / 2 },
      properties: {
        svgText:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" fill="#000"/></svg>',
        viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
        widthMm: 20,
        heightMm: 20,
        color: "#ffffff",
      },
    });

    const geometry = createPanelExtrusion(model, [], 2);

    const [body, relief] = geometry.groups;
    expect(geometry.groups).toHaveLength(2);
    expect(body).toMatchObject({ start: 0, materialIndex: PANEL_BODY_MATERIAL_INDEX });
    expect(relief).toMatchObject({
      start: body.count,
      count: geometry.getAttribute("position").count - body.count,
      materialIndex: PANEL_RELIEF_MATERIAL_INDEX,
    });
    const position = geometry.getAttribute("position");
    for (let vertex = relief.start; vertex < relief.start + relief.count; vertex += 1) {
      expect(position.getZ(vertex)).toBeGreaterThanOrEqual(1.8 - 1e-6);
    }
  });
  it("rebuilds the relief when the artwork moves or turns", () => {
    const model = createPanel(8);
    const artwork: PanelElement = {
      id: "svg-bar",
      type: PanelElementType.SvgArtwork,
      positionMm: { x: 15, y: 40 },
      rotationDeg: 0,
      properties: {
        svgText:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 2"><rect x="0" y="0" width="10" height="2" fill="#000"/></svg>',
        viewBox: { minX: 0, minY: 0, width: 10, height: 2 },
        widthMm: 10,
        heightMm: 2,
        color: "#ffffff",
      },
    };
    const measureRelief = (element: PanelElement) => {
      const geometry = createPanelExtrusion({ ...model, elements: [element] }, [], 2);
      const relief = geometry.groups[1];
      const position = geometry.getAttribute("position");
      const xs: number[] = [];
      const ys: number[] = [];
      for (let vertex = relief.start; vertex < relief.start + relief.count; vertex += 1) {
        xs.push(position.getX(vertex));
        ys.push(position.getY(vertex));
      }
      return {
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
        centerX: (Math.max(...xs) + Math.min(...xs)) / 2,
      };
    };

    const initial = measureRelief(artwork);
    const moved = measureRelief({ ...artwork, positionMm: { x: 25, y: 40 } });
    const turned = measureRelief({ ...artwork, rotationDeg: 90 });

    expect(initial.width).toBeCloseTo(10);
    expect(initial.height).toBeCloseTo(2);
    expect(moved.centerX - initial.centerX).toBeCloseTo(10);
    expect(turned.width).toBeCloseTo(2);
    expect(turned.height).toBeCloseTo(10);
    expect(measureRelief(artwork)).toEqual(initial);
  });
  it("warns when the relief cannot be clipped to the panel", () => {
    const intersection = vi.spyOn(polygonClipping, "intersection").mockImplementation(() => {
      throw new Error("Unable to find segment");
    });
    try {
      const model = createPanel(8);
      model.elements.push({
        id: "svg-square",
        type: PanelElementType.SvgArtwork,
        positionMm: { x: 20, y: 40 },
        properties: {
          svgText:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#000"/></svg>',
          viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
          widthMm: 10,
          heightMm: 10,
          color: "#ffffff",
          sourceName: "square.svg",
        },
      });

      const result = buildPanelStlWithWarnings(model, [], { thicknessMm: 2 });

      expect(result.warnings).toEqual(["square.svg"]);
      expect(result.stl).not.toMatch(/2\.4/);
    } finally {
      intersection.mockRestore();
    }
  });
});

const libraryItems = JSON.parse(readFileSync("public/svg-library/manifest.json", "utf8")) as Array<{
  id: string;
  src: string;
}>;

describe("built-in SVG library", () => {
  it.each(libraryItems.map((item) => [item.id, item.src]))(
    "turns %s into relief wherever it sits",
    (id, src) => {
      const model = createPanel(10);
      const panelSizeMm = { x: model.dimensions.widthMm, y: model.dimensions.heightMm };
      const railHoles = generateMountingHoles({
        widthHp: model.dimensions.widthHp,
        widthMm: model.dimensions.widthMm,
        heightMm: model.dimensions.heightMm,
      });
      const artwork = createSvgArtworkElement({
        ...sanitizeSvgArtwork(readFileSync(`public/${src}`, "utf8")),
        panelSizeMm,
        sourceName: id,
      });
      const turned: PanelElement = {
        ...artwork,
        positionMm: { x: 42.3, y: 71.9 },
        rotationDeg: 33.7,
        properties: { ...artwork.properties, widthMm: 61.7, heightMm: 61.7 },
      } as PanelElement;

      for (const placement of [artwork, turned]) {
        const warnings: string[] = [];
        model.elements = [createPanelElement(PanelElementType.Jack, { x: 45, y: 60 }), placement];

        const geometry = createPanelExtrusion(model, railHoles, 2, warnings);

        expect(warnings).toEqual([]);
        expect(geometry.groups.map((group) => group.materialIndex)).toContain(
          PANEL_RELIEF_MATERIAL_INDEX,
        );
      }
    },
    20_000,
  );
});
