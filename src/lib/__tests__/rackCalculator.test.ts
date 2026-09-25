import { describe, expect, it } from "vite-plus/test";

import { DEFAULT_MM_PER_HP, RACK_UNIT_MM, THREE_U_HEIGHT_MM } from "../panelFormat";
import {
  CALCULATOR_MAX_HP,
  CALCULATOR_MAX_ROWS,
  mmToInches,
  NINETEEN_INCH_RACK_HP,
  readCase,
  readHeight,
  readWidthHp,
  readWidthMm,
} from "../rackCalculator";

describe("rack calculator widths", () => {
  it("reads a width in HP as the pitch on the rails and the width Doepfer cuts", () => {
    const reading = readWidthHp(12);

    expect(reading.widthHp).toBe(12);
    expect(reading.pitchMm).toBeCloseTo(60.96);
    expect(reading.panelWidthMm).toBe(60.6);
    expect(reading.clearanceMm).toBeCloseTo(0.36);
    expect(reading.published).toBe(true);
  });

  it("takes the clearance off the pitch for widths Doepfer leaves out", () => {
    const reading = readWidthHp(13);

    expect(reading.panelWidthMm).toBeCloseTo(13 * DEFAULT_MM_PER_HP - 0.35);
    expect(reading.clearanceMm).toBeCloseTo(0.35);
    expect(reading.published).toBe(false);
  });

  it("keeps widths in HP whole and within the calculator range", () => {
    expect(readWidthHp(6.4).widthHp).toBe(6);
    expect(readWidthHp(0).widthHp).toBe(1);
    expect(readWidthHp(Number.NaN).widthHp).toBe(1);
    expect(readWidthHp(10_000).widthHp).toBe(CALCULATOR_MAX_HP);
  });

  it("rounds millimeters up to the HP they take on the rails", () => {
    const reading = readWidthMm(58);

    expect(reading.widthHp).toBe(12);
    expect(reading.requestedMm).toBe(58);
    expect(reading.spareMm).toBeCloseTo(2.96);
  });

  it("does not round a width that is exactly a whole HP up to the next one", () => {
    expect(readWidthMm(12 * DEFAULT_MM_PER_HP).widthHp).toBe(12);
    expect(readWidthMm(12 * DEFAULT_MM_PER_HP + 0.01).widthHp).toBe(13);
  });

  it("falls back to a millimeter for widths that are not positive", () => {
    expect(readWidthMm(-3).requestedMm).toBe(1);
    expect(readWidthMm(-3).widthHp).toBe(1);
  });

  it("converts millimeters to inches", () => {
    expect(mmToInches(25.4)).toBe(1);
    expect(mmToInches(RACK_UNIT_MM)).toBeCloseTo(1.75);
  });
});

describe("rack calculator heights", () => {
  it("reads a 3U panel as the rack row less the rail lips", () => {
    const reading = readHeight({ rackUnits: 3, oneUSpec: "intellijel" });

    expect(reading.panelHeightMm).toBe(THREE_U_HEIGHT_MM);
    expect(reading.rowHeightMm).toBeCloseTo(133.35);
    expect(reading.underRowMm).toBeCloseTo(4.85);
  });

  it("tells the two 1U standards apart", () => {
    expect(readHeight({ rackUnits: 1, oneUSpec: "intellijel" }).panelHeightMm).toBe(39.65);
    expect(readHeight({ rackUnits: 1, oneUSpec: "pulpLogic" }).panelHeightMm).toBe(43.18);
    expect(readHeight({ rackUnits: 1, oneUSpec: "pulpLogic" }).spec.widthStepHp).toBe(6);
  });
});

describe("rack calculator cases", () => {
  it("adds 3U and 1U rows up to the rack units of the case", () => {
    const reading = readCase({ threeURows: 2, oneURows: 1, widthHp: 84 });

    expect(reading.rackUnits).toBe(7);
    expect(reading.heightMm).toBeCloseTo(311.15);
    expect(reading.rowWidthMm).toBeCloseTo(426.72);
    expect(reading.moduleSpaceHp).toBe(252);
    expect(reading.fitsNineteenInchRack).toBe(true);
  });

  it("flags rows wider than a 19 in rack", () => {
    expect(
      readCase({ threeURows: 1, oneURows: 0, widthHp: NINETEEN_INCH_RACK_HP + 1 }),
    ).toMatchObject({ fitsNineteenInchRack: false });
  });

  it("keeps rows and widths whole and within the calculator range", () => {
    const reading = readCase({ threeURows: 2.6, oneURows: -1, widthHp: Number.NaN });

    expect(reading.threeURows).toBe(3);
    expect(reading.oneURows).toBe(0);
    expect(reading.widthHp).toBe(1);
    expect(readCase({ threeURows: 99, oneURows: 0, widthHp: 84 }).threeURows).toBe(
      CALCULATOR_MAX_ROWS,
    );
  });
});
