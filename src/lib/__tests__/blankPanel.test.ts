import { describe, expect, it } from "vite-plus/test";

import {
  DEFAULT_BLANK_PANEL_HP,
  OPEN_WIDTH_MAX_HP,
  createBlankPanelModel,
  openWidthUrl,
  panelMountingHoles,
  readOpenWidthParam,
} from "@lib/blankPanel";
import { DEFAULT_PANEL_FORMAT, THREE_U_HEIGHT_MM } from "@lib/panelFormat";
import { DEFAULT_MOUNTING_HOLE_CONFIG } from "@lib/panelTypes";
import { deserializePanelModel, serializePanelModel } from "@lib/serialization";

describe("blank panel", () => {
  it("starts a 3U Eurorack panel at the width Doepfer publishes, with nothing on it", () => {
    const model = createBlankPanelModel(8);
    expect(model.dimensions).toMatchObject({
      widthMm: 40.3,
      widthHp: 8,
      heightMm: THREE_U_HEIGHT_MM,
    });
    expect(model.dimensions.widthCm).toBeCloseTo(4.03);
    expect(model.elements).toEqual([]);
    expect(model.format).toEqual(DEFAULT_PANEL_FORMAT);
  });

  it("starts at the default width when none is given", () => {
    expect(createBlankPanelModel().dimensions.widthHp).toBe(DEFAULT_BLANK_PANEL_HP);
  });

  it("gives every panel settings of its own", () => {
    const model = createBlankPanelModel(8);
    model.mountingHoleConfig.diameterMm = 9;
    expect(createBlankPanelModel(8).mountingHoleConfig).toEqual(DEFAULT_MOUNTING_HOLE_CONFIG);
  });

  it("survives a save unchanged", () => {
    const model = createBlankPanelModel(12);
    expect(deserializePanelModel(serializePanelModel(model))).toEqual(model);
  });

  it("puts the mounting holes where the editor does", () => {
    const holes = panelMountingHoles(createBlankPanelModel(8));
    expect(holes.map((hole) => [hole.center.x, hole.center.y])).toEqual([
      [7.5, 3],
      [7.5, 125.5],
      [32.9, 3],
      [32.9, 125.5],
    ]);
    expect(panelMountingHoles(createBlankPanelModel(4))).toHaveLength(2);
  });
});

describe("opening the editor at a width", () => {
  it("reads a whole width in HP from the query string", () => {
    expect(readOpenWidthParam("?hp=8")).toBe(8);
    expect(readOpenWidthParam("?design=7K3Q9XMB&hp=42")).toBe(42);
    expect(readOpenWidthParam(`?hp=${OPEN_WIDTH_MAX_HP}`)).toBe(OPEN_WIDTH_MAX_HP);
  });

  it("ignores anything that is not a width a panel can have", () => {
    expect(readOpenWidthParam("")).toBeNull();
    expect(readOpenWidthParam("?hp=")).toBeNull();
    expect(readOpenWidthParam("?hp=0")).toBeNull();
    expect(readOpenWidthParam("?hp=1.5")).toBeNull();
    expect(readOpenWidthParam("?hp=-4")).toBeNull();
    expect(readOpenWidthParam("?hp=wide")).toBeNull();
    expect(readOpenWidthParam(`?hp=${OPEN_WIDTH_MAX_HP + 1}`)).toBeNull();
  });

  it("builds the address its reader understands", () => {
    expect(openWidthUrl(8)).toBe("/?hp=8");
    expect(readOpenWidthParam(openWidthUrl(8).slice(1))).toBe(8);
  });
});
