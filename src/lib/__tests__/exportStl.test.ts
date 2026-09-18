import type { BufferGeometry } from "three";
import { describe, expect, it } from "vite-plus/test";

import {
  PANEL_BODY_MATERIAL_INDEX,
  buildPanelStl,
  buildPanelStlWithWarnings,
  createPanelExtrusion,
} from "@lib/exportStl";
import { generateMountingHoles } from "@lib/mountingHoles";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  PanelElementType,
  type PanelElement,
  type PanelModel,
} from "@lib/panelTypes";
import { createPanelDimensions } from "@lib/units";

function createEmptyPanel(): PanelModel {
  return {
    dimensions: createPanelDimensions(2),
    elements: [],
    options: {
      showGrid: true,
      showMountingHoles: true,
      snapToGrid: true,
      gridSizeMm: 5,
      showDimensions: true,
    },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: "#1a1a1a",
    designColor: "#ffffff",
    designRelief: { ...DEFAULT_DESIGN_RELIEF },
  };
}

/** Positive when every triangle is wound counter-clockwise seen from outside the solid. */
function signedVolume(geometry: BufferGeometry): number {
  const position = geometry.getAttribute("position");
  let volume = 0;
  for (let first = 0; first + 2 < position.count; first += 3) {
    const [ax, ay, az] = [position.getX(first), position.getY(first), position.getZ(first)];
    const [bx, by, bz] = [
      position.getX(first + 1),
      position.getY(first + 1),
      position.getZ(first + 1),
    ];
    const [cx, cy, cz] = [
      position.getX(first + 2),
      position.getY(first + 2),
      position.getZ(first + 2),
    ];
    volume += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }
  return volume;
}

/** Canvas-space vertices away from the panel edges, which belong to the only cut-out. */
function getCutoutPoints(geometry: BufferGeometry, model: PanelModel) {
  const position = geometry.getAttribute("position");
  const { widthMm, heightMm } = model.dimensions;
  const points: Array<{ x: number; y: number }> = [];
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const x = position.getX(vertex);
    // The export mirrors Y: bring the point back to canvas coordinates (origin top-left).
    const y = heightMm - position.getY(vertex);
    if (x > 1 && x < widthMm - 1 && y > 1 && y < heightMm - 1) {
      points.push({ x, y });
    }
  }
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    points,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function createWidePanel(elements: PanelModel["elements"]): PanelModel {
  return { ...createEmptyPanel(), dimensions: createPanelDimensions(10), elements };
}

describe("createPanelExtrusion", () => {
  it("turns rectangular cut-outs around their center like the canvas", () => {
    const model = createWidePanel([
      {
        id: "rect-1",
        type: PanelElementType.Rectangle,
        positionMm: { x: 50, y: 64 },
        rotationDeg: 90,
        properties: { widthMm: 30, heightMm: 4 },
      },
    ]);

    const cutout = getCutoutPoints(createPanelExtrusion(model, [], 2), model);

    expect(cutout.minX).toBeCloseTo(48);
    expect(cutout.maxX).toBeCloseTo(52);
    expect(cutout.minY).toBeCloseTo(49);
    expect(cutout.maxY).toBeCloseTo(79);
  });

  it("turns cut-outs in the same direction as the canvas", () => {
    // Unrotated, the apex is at the top; the canvas turns positive angles clockwise.
    const model = createWidePanel([
      {
        id: "triangle-1",
        type: PanelElementType.Triangle,
        positionMm: { x: 50, y: 64 },
        rotationDeg: 90,
        properties: { widthMm: 12, heightMm: 10 },
      },
    ]);

    const cutout = getCutoutPoints(createPanelExtrusion(model, [], 2), model);
    const apex = cutout.points.filter((point) => Math.abs(point.x - cutout.maxX) < 1e-6);
    const base = cutout.points.filter((point) => Math.abs(point.x - cutout.minX) < 1e-6);

    expect(cutout.maxX).toBeCloseTo(55);
    expect(apex.every((point) => Math.abs(point.y - 64) < 1e-6)).toBe(true);
    expect(cutout.minX).toBeCloseTo(45);
    expect(Math.min(...base.map((point) => point.y))).toBeCloseTo(58);
    expect(Math.max(...base.map((point) => point.y))).toBeCloseTo(70);
  });

  it("builds inserts on the back of the panel, opposite the relief", () => {
    const model = createWidePanel([
      {
        id: "insert-1",
        type: PanelElementType.Insert,
        positionMm: { x: 50, y: 64 },
        properties: {
          outerDiameterMm: 5.3,
          outerDepthMm: 4,
          innerDiameterMm: 2.7,
          innerDepthMm: 4,
          embedDepthMm: 1,
        },
      },
    ]);

    const geometry = createPanelExtrusion(model, [], 2);
    geometry.computeBoundingBox();

    // Sunk 1 mm into the 2 mm panel from its back face (z = 0), sticking out 3 mm behind it.
    expect(geometry.boundingBox?.min.z).toBeCloseTo(-3);
    expect(geometry.boundingBox?.max.z).toBeCloseTo(2);
  });

  it("merges overlapping cut-outs into one opening, without walls inside it", () => {
    const jack = (id: string, x: number): PanelElement => ({
      id,
      type: PanelElementType.Jack,
      positionMm: { x, y: 64 },
      properties: { diameterMm: 8 },
    });
    const model = createWidePanel([jack("jack-1", 45), jack("jack-2", 50)]);

    const position = createPanelExtrusion(model, [], 2).getAttribute("position");

    // Vertices may sit on either circle or where their outlines cross, never inside a circle.
    const closest = 4 * Math.cos(Math.PI / 48) - 1e-9;
    const inside: number[] = [];
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      const x = position.getX(vertex);
      const y = model.dimensions.heightMm - position.getY(vertex);
      if (Math.hypot(x - 45, y - 64) < closest || Math.hypot(x - 50, y - 64) < closest) {
        inside.push(vertex);
      }
    }
    expect(inside).toEqual([]);
  });

  it("opens cut-outs that cross the panel edge", () => {
    const model = createWidePanel([
      {
        id: "jack-edge",
        type: PanelElementType.Jack,
        positionMm: { x: 1, y: 64 },
        properties: { diameterMm: 8 },
      },
    ]);

    const geometry = createPanelExtrusion(model, [], 2);
    geometry.computeBoundingBox();

    expect(geometry.boundingBox?.min.x).toBeCloseTo(0);
    expect(signedVolume(geometry)).toBeGreaterThan(0);
  });

  it("builds sunk inserts behind the panel only, leaving nearby cut-outs open", () => {
    const model = createWidePanel([
      {
        id: "insert-1",
        type: PanelElementType.Insert,
        positionMm: { x: 50, y: 64 },
        properties: {
          outerDiameterMm: 8,
          outerDepthMm: 4,
          innerDiameterMm: 2.7,
          innerDepthMm: 2,
          embedDepthMm: 1,
        },
      },
      {
        id: "jack-1",
        type: PanelElementType.Jack,
        positionMm: { x: 55, y: 64 },
        properties: { diameterMm: 6 },
      },
    ]);

    const position = createPanelExtrusion(model, [], 2).getAttribute("position");

    const betweenFaces: number[] = [];
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      if (position.getZ(vertex) > 1e-9 && position.getZ(vertex) < 2 - 1e-9) {
        betweenFaces.push(vertex);
      }
    }
    expect(betweenFaces).toEqual([]);
  });

  it("rounds slot ends outward, also when the slot is turned", () => {
    const slot = {
      id: "slot-1",
      type: PanelElementType.Slot,
      positionMm: { x: 50, y: 64 },
      properties: { widthMm: 20, heightMm: 6 },
    } as const;
    const flat = createWidePanel([slot]);
    const upright = createWidePanel([{ ...slot, rotationDeg: 90 }]);

    const flatCutout = getCutoutPoints(createPanelExtrusion(flat, [], 2), flat);
    const uprightCutout = getCutoutPoints(createPanelExtrusion(upright, [], 2), upright);

    expect([flatCutout.minX, flatCutout.maxX, flatCutout.minY, flatCutout.maxY]).toEqual([
      expect.closeTo(40),
      expect.closeTo(60),
      expect.closeTo(61),
      expect.closeTo(67),
    ]);
    expect([
      uprightCutout.minX,
      uprightCutout.maxX,
      uprightCutout.minY,
      uprightCutout.maxY,
    ]).toEqual([expect.closeTo(47), expect.closeTo(53), expect.closeTo(54), expect.closeTo(74)]);
  });

  it("keeps triangles facing outward after mirroring to the canvas orientation", () => {
    const model = createEmptyPanel();
    model.elements.push({
      id: "jack-1",
      type: PanelElementType.Jack,
      positionMm: { x: model.dimensions.widthMm / 2, y: model.dimensions.heightMm / 2 },
      properties: { diameterMm: 6 },
    });
    const thicknessMm = 2;
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const geometry = createPanelExtrusion(model, mountingHoles, thicknessMm);

    const boxVolume = model.dimensions.widthMm * model.dimensions.heightMm * thicknessMm;
    const volume = signedVolume(geometry);
    expect(volume).toBeGreaterThan(boxVolume * 0.9);
    expect(volume).toBeLessThan(boxVolume);

    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const frontFaceNormals: number[] = [];
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      if (position.getZ(vertex) === thicknessMm && normal.getZ(vertex) !== 0) {
        frontFaceNormals.push(normal.getZ(vertex));
      }
    }
    expect(frontFaceNormals.length).toBeGreaterThan(0);
    expect(frontFaceNormals.every((z) => Math.abs(z - 1) < 1e-6)).toBe(true);
  });

  it("keeps a panel without relief in a single body material group", () => {
    const model = createEmptyPanel();
    model.elements.push({
      id: "insert-1",
      type: PanelElementType.Insert,
      positionMm: { x: 10, y: 20 },
      properties: {
        outerDiameterMm: 5.3,
        outerDepthMm: 4,
        innerDiameterMm: 2.7,
        innerDepthMm: 4,
        embedDepthMm: 1,
      },
    });

    const geometry = createPanelExtrusion(model, [], 2);

    expect(geometry.groups).toEqual([
      {
        start: 0,
        count: geometry.getAttribute("position").count,
        materialIndex: PANEL_BODY_MATERIAL_INDEX,
      },
    ]);
  });
});

describe("buildPanelStl", () => {
  it("creates a valid ASCII STL header and footer", () => {
    const model = createEmptyPanel();
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: 2,
    });

    expect(stl.startsWith("solid eurorack_panel")).toBe(true);
    expect(stl.trimEnd().endsWith("endsolid eurorack_panel")).toBe(true);
  });

  it("reflects the requested thickness in Z coordinates", () => {
    const model = createEmptyPanel();
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const thickness = 3.5;
    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: thickness,
    });

    expect(stl).toContain(` ${thickness}`);
  });

  it("creates holes for circular elements", () => {
    const model = createEmptyPanel();
    model.elements.push({
      id: "jack-1",
      type: PanelElementType.Jack,
      positionMm: { x: model.dimensions.widthMm / 2, y: model.dimensions.heightMm / 2 },
      properties: {
        diameterMm: 6,
      },
    });

    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: 2,
    });

    // The presence of a jack should reduce the number of filled cells and
    // therefore the number of facets; we simply assert that the STL is non-empty
    // and still has the correct header/footer.
    expect(stl.startsWith("solid eurorack_panel")).toBe(true);
    expect(stl.trimEnd().endsWith("endsolid eurorack_panel")).toBe(true);
  });

  it("supports non-circular shape cutouts", () => {
    const model = createEmptyPanel();
    model.elements.push(
      {
        id: "rect-1",
        type: PanelElementType.Rectangle,
        positionMm: { x: 20, y: 30 },
        properties: {
          widthMm: 6,
          heightMm: 10,
        },
      },
      {
        id: "oval-1",
        type: PanelElementType.Oval,
        positionMm: { x: 40, y: 40 },
        properties: {
          widthMm: 12,
          heightMm: 6,
        },
      },
      {
        id: "slot-1",
        type: PanelElementType.Slot,
        positionMm: { x: 60, y: 60 },
        properties: {
          widthMm: 14,
          heightMm: 4,
        },
      },
      {
        id: "triangle-1",
        type: PanelElementType.Triangle,
        positionMm: { x: 80, y: 80 },
        properties: {
          widthMm: 10,
          heightMm: 8,
        },
      },
    );

    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: 2,
    });

    expect(stl.startsWith("solid eurorack_panel")).toBe(true);
    expect(stl.includes("facet")).toBe(true);
  });

  it("includes inserts with inner holes without failing", () => {
    const model = createEmptyPanel();
    model.elements.push({
      id: "insert-1",
      type: PanelElementType.Insert,
      positionMm: { x: 20, y: 20 },
      properties: {
        outerDiameterMm: 5.3,
        outerDepthMm: 4,
        innerDiameterMm: 2.7,
        innerDepthMm: 4,
        embedDepthMm: 1,
      },
    });

    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: 2,
    });

    expect(stl.startsWith("solid eurorack_panel")).toBe(true);
  });

  it("does not cut the panel under an insert that is not sunk into it", () => {
    const model = createEmptyPanel();
    const center = {
      x: model.dimensions.widthMm / 2,
      y: model.dimensions.heightMm / 2,
    };
    model.elements.push({
      id: "insert-2",
      type: PanelElementType.Insert,
      positionMm: center,
      properties: {
        outerDiameterMm: 6,
        outerDepthMm: 4,
        innerDiameterMm: 3,
        innerDepthMm: 4,
        embedDepthMm: 0,
      },
    });

    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm,
    });

    const position = createPanelExtrusion(model, mountingHoles, 2).getAttribute("position");
    const frontFaceNearInsert: number[] = [];
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      const x = position.getX(vertex);
      const y = model.dimensions.heightMm - position.getY(vertex);
      if (position.getZ(vertex) === 2 && Math.hypot(x - center.x, y - center.y) < 2) {
        frontFaceNearInsert.push(vertex);
      }
    }
    expect(frontFaceNearInsert).toEqual([]);

    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: 2,
    });
    expect(stl.startsWith("solid eurorack_panel")).toBe(true);
  });

  it("adds SVG artwork as a binary height map relief", () => {
    const model = createEmptyPanel();
    model.elements.push({
      id: "svg-1",
      type: PanelElementType.SvgArtwork,
      positionMm: { x: 10, y: 20 },
      properties: {
        svgText:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" /></svg>',
        viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
        widthMm: 8,
        heightMm: 8,
        color: "#ffffff",
      },
    });

    const result = buildPanelStlWithWarnings(model, [], {
      thicknessMm: 2,
    });

    expect(result.warnings).toEqual([]);
    expect(result.stl).toContain("facet");
    expect(result.stl).toMatch(/2\.4/);
  });

  it("ignores non-black SVG artwork in the height map", () => {
    const model = createEmptyPanel();
    model.elements.push({
      id: "svg-white",
      type: PanelElementType.SvgArtwork,
      positionMm: { x: 10, y: 20 },
      properties: {
        svgText:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect fill="white" x="0" y="0" width="10" height="10" /></svg>',
        viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
        widthMm: 8,
        heightMm: 8,
        color: "#ffffff",
        sourceName: "white.svg",
      },
    });

    const result = buildPanelStlWithWarnings(model, [], {
      thicknessMm: 2,
    });

    expect(result.warnings).toEqual(["white.svg"]);
    expect(result.stl).not.toMatch(/2\.4/);
  });

  it("warns when SVG artwork cannot produce a height map", () => {
    const model = createEmptyPanel();
    model.elements.push({
      id: "svg-text",
      type: PanelElementType.SvgArtwork,
      positionMm: { x: 10, y: 20 },
      properties: {
        svgText:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="1" y="8">A</text></svg>',
        viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
        widthMm: 8,
        heightMm: 8,
        color: "#ffffff",
        sourceName: "text.svg",
      },
    });

    const result = buildPanelStlWithWarnings(model, [], {
      thicknessMm: 2,
    });

    expect(result.warnings).toEqual(["text.svg"]);
    expect(result.stl.startsWith("solid eurorack_panel")).toBe(true);
  });
});
