// @vitest-environment jsdom

import { describe, expect, it } from "vite-plus/test";

import { buildPanelStlWithWarnings } from "@lib/exportStl";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  PanelElementType,
  type PanelModel,
} from "@lib/panelTypes";
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
    },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
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
        stlThicknessMm: 0.6,
        stlPenetrationMm: 0.2,
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
        stlThicknessMm: 0.6,
        stlPenetrationMm: 0.2,
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
          stlThicknessMm: 0.6,
          stlPenetrationMm: 0.2,
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
});
