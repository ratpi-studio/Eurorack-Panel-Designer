import {
  DEFAULT_MM_PER_HP,
  getRackFormatSpec,
  isPublishedPanelWidth,
  panelWidthMmForHp,
  RACK_UNIT_MM,
  widthHpForMm,
  type PanelFormat,
  type RackFormatSpec,
} from "./panelFormat";

/**
 * The numbers behind the HP and U calculator of the content pages. Widths and heights come from
 * `panelFormat.ts`, so the calculator answers with the sizes the editor cuts panels at.
 */

const MM_PER_INCH = 25.4;

/**
 * Width of the module space in a 19 in rack row. Doepfer: "The rack system has a usable width of
 * 84 HP". Source: https://doepfer.de/a100_man/a100m_e.htm
 */
export const NINETEEN_INCH_RACK_HP = 84;

/** Bounds of the calculator inputs: two 19 in rows side by side, and the millimeters they cover. */
export const CALCULATOR_MAX_HP = 2 * NINETEEN_INCH_RACK_HP;
export const CALCULATOR_MAX_MM = CALCULATOR_MAX_HP * DEFAULT_MM_PER_HP;
export const CALCULATOR_MAX_ROWS = 8;

export interface WidthReading {
  /** Rack space, in whole HP. */
  widthHp: number;
  /** Distance the panel covers on the rails: HP × 5.08 mm. */
  pitchMm: number;
  /** Width the panel is cut at. */
  panelWidthMm: number;
  /** What the cut takes off the pitch, so neighbouring panels do not bind. */
  clearanceMm: number;
  /** True when the width comes from Doepfer's table rather than the clearance. */
  published: boolean;
}

export interface MillimeterReading extends WidthReading {
  requestedMm: number;
  /** Rail left over past the requested width, inside the HP it rounds up to. */
  spareMm: number;
}

export interface HeightReading {
  spec: RackFormatSpec;
  rackUnits: number;
  panelHeightMm: number;
  /** Height of the rack row: rack units × 44.45 mm. */
  rowHeightMm: number;
  /** What the panel leaves of its row, for the rail lips. */
  underRowMm: number;
}

export interface CaseInput {
  threeURows: number;
  oneURows: number;
  widthHp: number;
}

export interface CaseReading {
  threeURows: number;
  oneURows: number;
  widthHp: number;
  rackUnits: number;
  heightMm: number;
  /** Width of the module space: HP × 5.08 mm. Rails are longer, to reach the case sides. */
  rowWidthMm: number;
  /** HP of modules the case takes, all rows together. */
  moduleSpaceHp: number;
  fitsNineteenInchRack: boolean;
}

function wholeNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(Math.round(value), min), max);
}

export function mmToInches(valueMm: number): number {
  return valueMm / MM_PER_INCH;
}

/** A width in HP: rounded to a whole HP, from 1 to `CALCULATOR_MAX_HP`. */
export function readWidthHp(widthHp: number): WidthReading {
  const hp = wholeNumber(widthHp, 1, CALCULATOR_MAX_HP);
  const pitchMm = hp * DEFAULT_MM_PER_HP;
  const panelWidthMm = panelWidthMmForHp(hp);
  return {
    widthHp: hp,
    pitchMm,
    panelWidthMm,
    clearanceMm: pitchMm - panelWidthMm,
    published: isPublishedPanelWidth(hp),
  };
}

/** A width in millimeters, and the HP it takes on the rails: rounded up, never down. */
export function readWidthMm(widthMm: number): MillimeterReading {
  const requestedMm =
    Number.isFinite(widthMm) && widthMm > 0 ? Math.min(widthMm, CALCULATOR_MAX_MM) : 1;
  const reading = readWidthHp(widthHpForMm(requestedMm));
  return { ...reading, requestedMm, spareMm: reading.pitchMm - requestedMm };
}

export function readHeight(format: Pick<PanelFormat, "rackUnits" | "oneUSpec">): HeightReading {
  const spec = getRackFormatSpec(format);
  const rowHeightMm = format.rackUnits * RACK_UNIT_MM;
  return {
    spec,
    rackUnits: format.rackUnits,
    panelHeightMm: spec.heightMm,
    rowHeightMm,
    underRowMm: rowHeightMm - spec.heightMm,
  };
}

/** A case of 3U and 1U rows, all as wide as `widthHp`. */
export function readCase(input: CaseInput): CaseReading {
  const threeURows = wholeNumber(input.threeURows, 0, CALCULATOR_MAX_ROWS);
  const oneURows = wholeNumber(input.oneURows, 0, CALCULATOR_MAX_ROWS);
  const widthHp = wholeNumber(input.widthHp, 1, CALCULATOR_MAX_HP);
  const rackUnits = threeURows * 3 + oneURows;
  return {
    threeURows,
    oneURows,
    widthHp,
    rackUnits,
    heightMm: rackUnits * RACK_UNIT_MM,
    rowWidthMm: widthHp * DEFAULT_MM_PER_HP,
    moduleSpaceHp: widthHp * (threeURows + oneURows),
    fitsNineteenInchRack: widthHp <= NINETEEN_INCH_RACK_HP,
  };
}
