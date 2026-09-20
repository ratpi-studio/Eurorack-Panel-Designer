import { describe, expect, it } from "vite-plus/test";

import {
  cmToMm,
  computePanelWidth,
  createPanelDimensions,
  hpToMm,
  mmToCm,
  mmToHp,
  panelDimensionsFromHp,
  sanitizeWidthCm,
} from "../units";
import { DEFAULT_MM_PER_HP, panelWidthMmForHp, THREE_U_HEIGHT_MM } from "../panelTypes";

const EVERY_WIDTH_HP = Array.from({ length: 42 }, (_, index) => index + 1);
/** The millimeter field starts at 1 cm, so 1 HP can only be set in HP. */
const WIDTHS_FROM_THE_MM_FIELD = EVERY_WIDTH_HP.filter((widthHp) => widthHp >= 2);

describe("units helpers", () => {
  it("converts centimeters to millimeters", () => {
    expect(cmToMm(4.2)).toBeCloseTo(42);
  });

  it("converts between millimeters and HP", () => {
    expect(mmToHp(10.16)).toBeCloseTo(2);
    expect(hpToMm(2)).toBeCloseTo(10.16);
  });

  it("sanitizes invalid width values", () => {
    expect(sanitizeWidthCm(0.5)).toBe(1);
    expect(sanitizeWidthCm(Number.NaN)).toBe(1);
    expect(sanitizeWidthCm(12)).toBe(12);
  });

  it("computes normalized widths", () => {
    const result = computePanelWidth(3.2);
    expect(result.widthCm).toBe(3.2);
    expect(result.widthMm).toBeCloseTo(32);
    expect(result.widthHp).toBe(7);
    expect(result.normalizedWidthMm).toBeCloseTo(35.21);
  });

  it("creates panel dimensions with the standard height", () => {
    const dimensions = createPanelDimensions(3.2);
    expect(dimensions.heightMm).toBe(THREE_U_HEIGHT_MM);
    expect(dimensions.widthHp).toBeGreaterThan(0);
  });
});

describe("panel widths", () => {
  it("cuts the common widths at the size Doepfer publishes", () => {
    expect(panelWidthMmForHp(2)).toBe(9.8);
    expect(panelWidthMmForHp(4)).toBe(20);
    expect(panelWidthMmForHp(6)).toBe(30);
    expect(panelWidthMmForHp(8)).toBe(40.3);
    expect(panelWidthMmForHp(42)).toBe(213);
  });

  it("keeps a clearance under the grid for the widths Doepfer leaves out", () => {
    expect(panelWidthMmForHp(3)).toBeCloseTo(14.89);
    expect(panelWidthMmForHp(7)).toBeCloseTo(35.21);
  });

  it("stays under the rack grid at every width, so modules fit side by side", () => {
    const tooWide = EVERY_WIDTH_HP.filter(
      (widthHp) => panelWidthMmForHp(widthHp) >= widthHp * DEFAULT_MM_PER_HP,
    );

    expect(tooWide).toEqual([]);
  });

  it("reads back the width it shows in the millimeter field", () => {
    const misread = WIDTHS_FROM_THE_MM_FIELD.filter((widthHp) => {
      const shownMm = Number(panelWidthMmForHp(widthHp).toFixed(1));
      return computePanelWidth(mmToCm(shownMm)).widthHp !== widthHp;
    });

    expect(misread).toEqual([]);
  });

  it("builds dimensions from a width in HP", () => {
    expect(panelDimensionsFromHp(6)).toEqual({
      widthCm: 3,
      widthMm: 30,
      widthHp: 6,
      heightMm: THREE_U_HEIGHT_MM,
    });
  });

  it("keeps the panel at least 1 HP wide", () => {
    expect(panelDimensionsFromHp(0).widthHp).toBe(1);
    expect(panelDimensionsFromHp(Number.NaN).widthHp).toBe(1);
  });
});
