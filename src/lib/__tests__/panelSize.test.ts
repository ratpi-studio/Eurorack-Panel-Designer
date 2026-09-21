import { describe, expect, it } from "vite-plus/test";

import { computeClearanceLines } from "../clearance";
import { generateMountingHoles } from "../mountingHoles";
import { DEFAULT_PANEL_FORMAT, type PanelFormat } from "../panelFormat";
import { setPanelFormat, setPanelHeightMm, setPanelWidthHp, setPanelWidthMm } from "../panelSize";
import {
  DEFAULT_PANEL_OPTIONS,
  normalizePanelModel,
  PanelElementType,
  type PanelModel,
} from "../panelTypes";
import { panelDimensionsFromHp } from "../units";

function createModel(widthHp = 20): PanelModel {
  return normalizePanelModel({
    dimensions: panelDimensionsFromHp(widthHp),
    elements: [
      {
        id: "jack-1",
        type: PanelElementType.Jack,
        positionMm: { x: 10, y: 100 },
        mountingHolesEnabled: false,
        properties: { diameterMm: 6, label: "" },
      },
    ],
    options: { ...DEFAULT_PANEL_OPTIONS },
  });
}

const pulpLogic: PanelFormat = { rackUnits: 1, oneUSpec: "pulpLogic", custom: false };
const intellijel: PanelFormat = { rackUnits: 1, oneUSpec: "intellijel", custom: false };

function holeColumnsAndRows(model: PanelModel): { xs: number[]; ys: number[] } {
  const holes = generateMountingHoles({
    widthHp: model.dimensions.widthHp,
    widthMm: model.dimensions.widthMm,
    heightMm: model.dimensions.heightMm,
    config: model.mountingHoleConfig,
  });
  const unique = (values: number[]) => [
    ...new Set(values.map((value) => Number(value.toFixed(2)))),
  ];

  return {
    xs: unique(holes.map((hole) => hole.center.x)),
    ys: unique(holes.map((hole) => hole.center.y)),
  };
}

describe("panel formats on a design", () => {
  it("switches to a Pulp Logic tile: its height, a multiple of 6 HP, and its holes", () => {
    const model = setPanelFormat(createModel(20), pulpLogic);

    expect(model.dimensions).toMatchObject({ widthHp: 18, widthMm: 91.3, heightMm: 43.18 });
    expect(model.mountingHoleConfig.horizontalOffsetMm).toBe(5.08);
    expect(model.mountingHoleConfig.verticalOffsetMm).toBe(3);
    expect(model.elements[0]?.positionMm).toEqual({ x: 10, y: 100 });
  });

  it("drills a 6 HP tile where the Pulp Logic drawing has its holes", () => {
    expect(holeColumnsAndRows(setPanelFormat(createModel(6), pulpLogic))).toEqual({
      xs: [5.08, 25.4],
      ys: [3, 40.18],
    });
  });

  it("drills an Intellijel 1U panel where the Intellijel drawing has its holes", () => {
    expect(holeColumnsAndRows(setPanelFormat(createModel(6), intellijel))).toEqual({
      xs: [7.5, 22.74],
      ys: [3, 36.65],
    });
  });

  it("keeps the hole offsets set by hand when the new format drills at the same place", () => {
    const model = createModel();
    const tuned = {
      ...model,
      mountingHoleConfig: { ...model.mountingHoleConfig, horizontalOffsetMm: 9 },
    };

    expect(setPanelFormat(tuned, intellijel).mountingHoleConfig.horizontalOffsetMm).toBe(9);
  });

  it("keeps the size when the panel goes custom, and its rack format when it comes back", () => {
    const tile = setPanelFormat(createModel(12), pulpLogic);
    const custom = setPanelFormat(tile, { ...pulpLogic, custom: true });

    expect(custom.dimensions).toMatchObject({ widthMm: 60.6, heightMm: 43.18 });

    const back = setPanelFormat(setPanelHeightMm(custom, 70), pulpLogic);

    expect(back.dimensions).toMatchObject({ widthHp: 12, heightMm: 43.18 });
    expect(back.mountingHoleConfig.horizontalOffsetMm).toBe(5.08);
  });

  it("draws the clearance guides inside a shorter panel, and keeps them for a taller one", () => {
    const model = createModel();
    const tall = {
      ...model,
      clearance: { ...model.clearance, topOffsetMm: 40, bottomOffsetMm: 40 },
    };
    const oneU = setPanelFormat(tall, intellijel);
    const lines = computeClearanceLines(oneU.clearance, oneU.dimensions.heightMm);

    expect(lines.topY).toBeGreaterThanOrEqual(0);
    expect(lines.bottomY).toBeLessThanOrEqual(oneU.dimensions.heightMm);
    expect(setPanelFormat(oneU, DEFAULT_PANEL_FORMAT).clearance).toEqual(tall.clearance);
  });
});

describe("panel sizes", () => {
  it("sets any width and height on a custom panel", () => {
    const custom = setPanelFormat(createModel(), { ...DEFAULT_PANEL_FORMAT, custom: true });

    expect(setPanelHeightMm(setPanelWidthMm(custom, 123.4), 56.7).dimensions).toMatchObject({
      widthMm: 123.4,
      widthHp: 25,
      heightMm: 56.7,
    });
  });

  it("gives a width typed in mm the HP it needs, in the steps of the format", () => {
    expect(setPanelWidthMm(createModel(), 30).dimensions).toMatchObject({
      widthHp: 6,
      widthMm: 30,
    });
    expect(setPanelWidthMm(setPanelFormat(createModel(), pulpLogic), 35).dimensions.widthHp).toBe(
      6,
    );
  });

  it("widens in the steps of the format", () => {
    expect(setPanelWidthHp(setPanelFormat(createModel(), pulpLogic), 13).dimensions.widthHp).toBe(
      12,
    );
    expect(setPanelWidthHp(createModel(), 13).dimensions.widthHp).toBe(13);
  });

  it("leaves the height of rack formats to their row", () => {
    const model = createModel();

    expect(setPanelHeightMm(model, 50)).toBe(model);
  });
});
