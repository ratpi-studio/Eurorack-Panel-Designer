import { describe, expect, it } from "vite-plus/test";

import {
  CUSTOM_SIZE_MAX_MM,
  CUSTOM_SIZE_MIN_MM,
  DEFAULT_PANEL_FORMAT,
  getFormatSpec,
  getPanelFormatKey,
  getRackFormatSpec,
  isEurorack3uFormat,
  kosmoWidthStepsForMm,
  normalizePanelFormat,
  panelWidthMmForKosmoSteps,
  RACK_UNIT_MM,
  resolvePanelDimensions,
  snapWidthHp,
  THREE_U_HEIGHT_MM,
  type PanelFormat,
} from "../panelFormat";

function format(overrides: Partial<PanelFormat>): PanelFormat {
  return { ...DEFAULT_PANEL_FORMAT, ...overrides };
}

const pulpLogic = format({ rackUnits: 1, oneUSpec: "pulpLogic" });
const kosmo = format({ system: "kosmo" });

describe("panel formats", () => {
  it("gives each rack format the height its standard publishes", () => {
    expect(getRackFormatSpec(format({ rackUnits: 1 })).heightMm).toBe(39.65);
    expect(getRackFormatSpec(pulpLogic).heightMm).toBe(43.18);
    expect(getRackFormatSpec(format({ rackUnits: 3 })).heightMm).toBe(128.5);
  });

  it("derives 2U and 4U from the rack unit, less the rail lips of 3U", () => {
    const railLipsMm = 3 * RACK_UNIT_MM - THREE_U_HEIGHT_MM;

    expect(getRackFormatSpec(format({ rackUnits: 2 })).heightMm).toBeCloseTo(
      2 * RACK_UNIT_MM - railLipsMm,
    );
    expect(getRackFormatSpec(format({ rackUnits: 4 })).heightMm).toBeCloseTo(
      4 * RACK_UNIT_MM - railLipsMm,
    );
    expect(getRackFormatSpec(format({ rackUnits: 2 })).published).toBe(false);
    expect(getRackFormatSpec(format({ rackUnits: 4 })).published).toBe(false);
  });

  it("puts the first column of Pulp Logic holes 1 HP from the left edge, 7.5 mm elsewhere", () => {
    expect(getRackFormatSpec(pulpLogic).holeOffsetXMm).toBe(5.08);
    expect(getRackFormatSpec(format({ rackUnits: 1 })).holeOffsetXMm).toBe(7.5);
    expect(getRackFormatSpec(format({ rackUnits: 4 })).holeOffsetXMm).toBe(7.5);
    expect(getRackFormatSpec(pulpLogic).holeOffsetYMm).toBe(3);
  });

  it("only tells the 1U standards apart at 1U", () => {
    expect(getPanelFormatKey(format({ rackUnits: 3, oneUSpec: "pulpLogic" }))).toBe("eurorack3u");
    expect(getPanelFormatKey(pulpLogic)).toBe("pulpLogic1u");
    expect(getPanelFormatKey(format({ rackUnits: 1 }))).toBe("intellijel1u");
    expect(getPanelFormatKey(format({ custom: true }))).toBe("custom");
  });

  it("makes Kosmo panels 20 cm high, in widths of 2.5 cm steps, whatever row was picked before", () => {
    const spec = getFormatSpec(kosmo);

    expect(spec).toMatchObject({ key: "kosmo", heightMm: 200, widthStepMm: 25 });
    expect(getFormatSpec({ ...kosmo, rackUnits: 1 })).toEqual(spec);
    expect(getPanelFormatKey(kosmo)).toBe("kosmo");
    expect(getPanelFormatKey({ ...kosmo, custom: true })).toBe("custom");
    expect(isEurorack3uFormat(kosmo)).toBe(false);
  });

  it("makes Pulp Logic tiles multiples of 6 HP, and other widths whole HP", () => {
    expect(snapWidthHp(4, pulpLogic)).toBe(6);
    expect(snapWidthHp(20, pulpLogic)).toBe(18);
    expect(snapWidthHp(21, pulpLogic)).toBe(24);
    expect(snapWidthHp(6.4, DEFAULT_PANEL_FORMAT)).toBe(6);
    expect(snapWidthHp(Number.NaN, DEFAULT_PANEL_FORMAT)).toBe(1);
  });
});

describe("panel dimensions", () => {
  it("measures rack panels in HP, at the width they are cut at", () => {
    expect(resolvePanelDimensions(format({ rackUnits: 1 }), { widthHp: 6 })).toEqual({
      widthCm: 3,
      widthMm: 30,
      widthHp: 6,
      heightMm: 39.65,
    });
  });

  it("takes the HP a width in mm needs when there is no width in HP", () => {
    expect(resolvePanelDimensions(DEFAULT_PANEL_FORMAT, { widthMm: 30.48 }).widthHp).toBe(6);
  });

  it("keeps any size for a custom panel, and counts the HP it takes", () => {
    const dimensions = resolvePanelDimensions(format({ custom: true }), {
      widthMm: 123.4,
      heightMm: 56.7,
    });

    expect(dimensions).toMatchObject({ widthMm: 123.4, widthHp: 25, heightMm: 56.7 });
    expect(dimensions.widthCm).toBeCloseTo(12.34);
  });

  it("measures Kosmo panels in steps of 2.5 cm, the nearest one to their width", () => {
    expect(resolvePanelDimensions(kosmo, { widthMm: 50 })).toEqual({
      widthCm: 5,
      widthMm: 50,
      widthHp: 10,
      heightMm: 200,
    });
    expect(resolvePanelDimensions(kosmo, { widthMm: 60.6, widthHp: 12 }).widthMm).toBe(50);
    expect(resolvePanelDimensions(kosmo, { widthMm: 64 }).widthMm).toBe(75);
    expect(resolvePanelDimensions(kosmo, { widthMm: 3 }).widthMm).toBe(25);
    expect(resolvePanelDimensions(kosmo, { widthHp: 20 }).widthMm).toBe(100);
  });

  it("counts the 2.5 cm steps a width takes on Kosmo rails, rounded up", () => {
    expect(kosmoWidthStepsForMm(25)).toBe(1);
    expect(kosmoWidthStepsForMm(25.1)).toBe(2);
    expect(kosmoWidthStepsForMm(0)).toBe(1);
    expect(panelWidthMmForKosmoSteps(4)).toBe(100);
  });

  it("keeps custom sizes within the limits", () => {
    const dimensions = resolvePanelDimensions(format({ custom: true }), {
      widthMm: 1,
      heightMm: 5000,
    });

    expect(dimensions.widthMm).toBe(CUSTOM_SIZE_MIN_MM);
    expect(dimensions.heightMm).toBe(CUSTOM_SIZE_MAX_MM);
  });
});

describe("saved formats", () => {
  it("makes saves from before formats 3U panels", () => {
    expect(normalizePanelFormat(undefined, 128.5)).toEqual(DEFAULT_PANEL_FORMAT);
  });

  it("makes old saves with another height custom panels, so they keep their size", () => {
    expect(normalizePanelFormat(undefined, 50)).toEqual({ ...DEFAULT_PANEL_FORMAT, custom: true });
  });

  it("repairs what it does not know", () => {
    expect(
      normalizePanelFormat({ system: "buchla", rackUnits: 5, oneUSpec: "moog", custom: "yes" }),
    ).toEqual(DEFAULT_PANEL_FORMAT);
    expect(normalizePanelFormat(pulpLogic)).toEqual(pulpLogic);
    expect(normalizePanelFormat(kosmo)).toEqual(kosmo);
  });

  it("makes saves from before Kosmo Eurorack panels, keeping their row", () => {
    expect(normalizePanelFormat({ rackUnits: 1, oneUSpec: "pulpLogic", custom: false })).toEqual(
      pulpLogic,
    );
  });
});
