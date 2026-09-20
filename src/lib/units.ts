import {
  DEFAULT_MM_PER_HP,
  MM_PER_CM,
  panelWidthMmForHp,
  THREE_U_HEIGHT_MM,
  type PanelDimensions,
} from "./panelTypes";

interface PanelWidthComputation {
  widthCm: number;
  widthMm: number;
  widthHp: number;
  normalizedWidthMm: number;
}

const MIN_PANEL_WIDTH_CM = 1;

/** Typographic points to millimeters: a text's size is the height of its em square. */
export const PT_TO_MM = 25.4 / 72;

export function sanitizeWidthCm(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_PANEL_WIDTH_CM;
  }

  return Math.max(MIN_PANEL_WIDTH_CM, value);
}

export function sanitizeWidthHp(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, value);
}

export function cmToMm(valueCm: number): number {
  return valueCm * MM_PER_CM;
}

export function mmToCm(valueMm: number): number {
  return valueMm / MM_PER_CM;
}

export function mmToHp(valueMm: number, mmPerHp = DEFAULT_MM_PER_HP): number {
  return valueMm / mmPerHp;
}

/**
 * Distance a width in HP covers on the rack grid. Mounting holes sit on that grid; the panel
 * itself is cut a little narrower, see `panelWidthMmForHp`.
 */
export function hpToMm(valueHp: number, mmPerHp = DEFAULT_MM_PER_HP): number {
  return valueHp * mmPerHp;
}

export function computePanelWidth(widthCm: number): PanelWidthComputation {
  const sanitizedWidthCm = sanitizeWidthCm(widthCm);
  const widthMm = cmToMm(sanitizedWidthCm);
  const widthHp = Math.max(1, Math.ceil(mmToHp(widthMm)));
  const normalizedWidthMm = panelWidthMmForHp(widthHp);

  return {
    widthCm: sanitizedWidthCm,
    widthMm,
    widthHp,
    normalizedWidthMm,
  };
}

/** Panel dimensions for a width given in centimeters, rounded up to the HP it takes in a rack. */
export function createPanelDimensions(
  widthCm: number,
  heightMm = THREE_U_HEIGHT_MM,
): PanelDimensions {
  const { widthHp, normalizedWidthMm } = computePanelWidth(widthCm);

  return {
    widthCm: mmToCm(normalizedWidthMm),
    widthMm: normalizedWidthMm,
    widthHp,
    heightMm,
  };
}

/** Panel dimensions for a width given in HP, the unit racks are measured in. */
export function panelDimensionsFromHp(
  widthHp: number,
  heightMm = THREE_U_HEIGHT_MM,
): PanelDimensions {
  const sanitizedWidthHp = sanitizeWidthHp(widthHp);
  const widthMm = panelWidthMmForHp(sanitizedWidthHp);

  return {
    widthCm: mmToCm(widthMm),
    widthMm,
    widthHp: sanitizedWidthHp,
    heightMm,
  };
}
