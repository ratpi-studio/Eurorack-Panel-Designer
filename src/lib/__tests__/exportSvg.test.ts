import { beforeAll, describe, expect, it } from "vite-plus/test";

import { createPanelElement } from "@lib/elements";
import { buildPanelSvg } from "@lib/exportSvg";
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
import { getLabelTextLayout } from "@lib/text/textLayout";
import { createPanelDimensions } from "@lib/units";

import { loadTestFont } from "./textFontFixtures";

function jack(id: string, x: number, y: number): PanelElement {
  return { id, type: PanelElementType.Jack, positionMm: { x, y }, properties: { diameterMm: 6 } };
}

function label(
  text: string,
  position: { x: number; y: number },
  properties: Partial<LabelElement["properties"]> = {},
  rotationDeg = 0,
): LabelElement {
  const element = createPanelElement(PanelElementType.Label, position) as LabelElement;
  return {
    ...element,
    id: `label-${text}`,
    rotationDeg,
    properties: { ...element.properties, text, ...properties },
  };
}

beforeAll(async () => {
  await loadTestFont("roboto");
});

/** Subpaths of `M x y L x y … Z` path data, as lists of points. */
function parseRings(pathData: string): Array<Array<[number, number]>> {
  return pathData
    .split("M")
    .filter((subpath) => subpath.trim())
    .map((subpath) => {
      const values = subpath.replace(/[LZ]/g, " ").trim().split(/\s+/).map(Number);
      const points: Array<[number, number]> = [];
      for (let index = 0; index + 1 < values.length; index += 2) {
        points.push([values[index], values[index + 1]]);
      }
      return points;
    });
}

function createModel(): PanelModel {
  return {
    dimensions: createPanelDimensions(4),
    elements: [
      {
        id: "svg-1",
        type: PanelElementType.SvgArtwork,
        positionMm: { x: 10, y: 20 },
        rotationDeg: 15,
        properties: {
          svgText:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" /></svg>',
          viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
          widthMm: 12,
          heightMm: 12,
          color: "#ff00aa",
          label: "",
        },
      },
    ],
    options: { ...DEFAULT_PANEL_OPTIONS },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: "#1a1a1a",
    designColor: "#ff00aa",
    designRelief: { ...DEFAULT_DESIGN_RELIEF },
  };
}

describe("buildPanelSvg", () => {
  it("includes clipped decorative SVG artwork", () => {
    const svg = buildPanelSvg(createModel(), []);

    expect(svg).toContain(`clipPath id="panel-surface-clip"`);
    expect(svg).toContain(`clip-path="url(#panel-surface-clip)"`);
    expect(svg).toContain(`#ff00aa`);
    expect(svg).toContain(`rotate(15)`);
  });
  it("turns cut-out outlines and texts around their center like the canvas", () => {
    const model = createModel();
    model.elements.push(
      {
        id: "rect-1",
        type: PanelElementType.Rectangle,
        positionMm: { x: 10, y: 30 },
        rotationDeg: 90,
        properties: { widthMm: 12, heightMm: 4, label: "" },
      },
      label("OUT", { x: 10, y: 50 }, { fontSizePt: 8 }, -45),
      {
        id: "slot-1",
        type: PanelElementType.Slot,
        positionMm: { x: 10, y: 70 },
        properties: { widthMm: 10, heightMm: 4, label: "" },
      },
    );

    const svg = buildPanelSvg(model, []);

    expect(svg).toContain(
      `<rect x="4" y="28" width="12" height="4" stroke="#ff00aa" stroke-width="0.6" fill="none" transform="rotate(90 10 30)" />`,
    );
    expect(svg).toMatch(
      /<path d="M[^"]+" fill="#ff00aa" transform="translate\(10 50\) rotate\(-45\)" \/>/,
    );
    expect(svg).toContain(
      `<path d="M 7 68 H 13 A 2 2 0 0 1 13 72 H 7 A 2 2 0 0 1 7 68 Z" stroke="#ff00aa" stroke-width="0.6" fill="none" />`,
    );
  });

  it("outlines texts in their font, clipped to the panel surface like the relief", () => {
    const model = createModel();
    const text = label("GATE", { x: 10, y: 90 }, { fontSizePt: 9 });
    model.elements = [text];

    const svg = buildPanelSvg(model, [], { stroke: "#f5f3f0" });

    expect(svg).not.toContain("<text");
    expect(svg).toContain(
      `<path d="${getLabelTextLayout(text.properties)?.pathData}" fill="#ff00aa" transform="translate(10 90)" />`,
    );
    expect(svg).toMatch(
      /<g clip-path="url\(#panel-surface-clip\)">\s*<path d="M[^"]+" fill="#ff00aa"/,
    );
  });

  it("falls back to a text element in the same font when its outlines are not available", () => {
    const model = createModel();
    model.elements = [label("SYNC", { x: 10, y: 90 }, { fontId: "orbitron", fontSizePt: 18 })];

    const svg = buildPanelSvg(model, []);

    expect(svg).toMatch(/<text [^>]*font-size="6\.35" font-family="Orbitron Bold, sans-serif"/);
  });

  it("clears the SVG patterns around knocked-out texts, not around merged ones", () => {
    const knockedOut = createModel();
    knockedOut.elements.push(label("CV", { x: 10, y: 20 }, { patternOverlap: "knockout" }));
    const merged = createModel();
    merged.elements.push(label("CV", { x: 10, y: 20 }, { patternOverlap: "merge" }));

    const knockedOutSvg = buildPanelSvg(knockedOut, []);
    const mergedSvg = buildPanelSvg(merged, []);
    const surfacePath = knockedOutSvg.match(
      /id="panel-surface-clip"[^>]*>\s*<path d="([^"]*)"/,
    )?.[1];
    const patternPath = knockedOutSvg.match(/id="pattern-clip"[^>]*>\s*<path d="([^"]*)"/)?.[1];

    expect(knockedOutSvg).toContain(`<g clip-path="url(#pattern-clip)">`);
    // The panel outline, then the cleared zone around the text.
    expect(parseRings(surfacePath ?? "")).toHaveLength(1);
    expect(parseRings(patternPath ?? "")).toHaveLength(2);
    expect(mergedSvg).not.toContain("pattern-clip");
  });

  it("merges overlapping cut-outs, so neither the panel nor the artwork covers their overlap", () => {
    const model = createModel();
    model.elements.push(jack("jack-1", 15, 60), jack("jack-2", 20, 60));

    const svg = buildPanelSvg(model, []);
    const panelPath = svg.match(/<path d="([^"]*)" fill="#1a1a1a" fill-rule="evenodd"/)?.[1] ?? "";
    const clipPath = svg.match(/<clipPath [^>]*>\s*<path d="([^"]*)"/)?.[1];

    expect(clipPath).toBe(panelPath);
    // The panel outline, then one opening for both jacks. Its corners sit on the jack polygons or
    // where they cross, never inside a jack.
    const rings = parseRings(panelPath);
    expect(rings).toHaveLength(2);
    const closest = 3 * Math.cos(Math.PI / 48) - 1e-9;
    expect(
      rings[1].filter(
        ([x, y]) => Math.hypot(x - 15, y - 60) < closest || Math.hypot(x - 20, y - 60) < closest,
      ),
    ).toEqual([]);
  });
});
