import {
  DEFAULT_MM_PER_HP,
  MM_PER_CM,
  THREE_U_HEIGHT_MM,
  type PanelDimensions
} from './panelTypes';

interface PanelWidthComputation {
  widthCm: number;
  widthMm: number;
  widthHp: number;
  normalizedWidthMm: number;
}

const MIN_PANEL_WIDTH_CM = 1;

export function sanitizeWidthCm(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_PANEL_WIDTH_CM;
  }

  return Math.max(MIN_PANEL_WIDTH_CM, value);
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

export function hpToMm(valueHp: number, mmPerHp = DEFAULT_MM_PER_HP): number {
  return valueHp * mmPerHp;
}

export function computePanelWidth(
  widthCm: number,
  mmPerHp = DEFAULT_MM_PER_HP
): PanelWidthComputation {
  const sanitizedWidthCm = sanitizeWidthCm(widthCm);
  const widthMm = cmToMm(sanitizedWidthCm);
  const widthHp = Math.max(1, Math.ceil(mmToHp(widthMm, mmPerHp)));
  const normalizedWidthMm = hpToMm(widthHp, mmPerHp);

  return {
    widthCm: sanitizedWidthCm,
    widthMm,
    widthHp,
    normalizedWidthMm
  };
}

export function createPanelDimensions(
  widthCm: number,
  mmPerHp = DEFAULT_MM_PER_HP,
  heightMm = THREE_U_HEIGHT_MM
): PanelDimensions {
  const { widthHp, normalizedWidthMm, widthCm: sanitizedWidthCm } =
    computePanelWidth(widthCm, mmPerHp);

  return {
    widthCm: sanitizedWidthCm,
    widthMm: normalizedWidthMm,
    widthHp,
    heightMm
  };
}
