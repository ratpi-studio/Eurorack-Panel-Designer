import { clampClearanceConfig, type ClearanceConfig } from './panelTypes';

export interface ClearanceLines {
  topY: number;
  bottomY: number;
}

export function computeClearanceLines(
  config: ClearanceConfig,
  panelHeightMm: number
): ClearanceLines {
  const clamped = clampClearanceConfig(config, panelHeightMm);
  const topY = clamped.topOffsetMm;
  const bottomY = Math.max(
    panelHeightMm - clamped.bottomOffsetMm,
    topY + clamped.minSpacingMm
  );
  return {
    topY,
    bottomY
  };
}

export function applyClearanceLinePosition(
  config: ClearanceConfig,
  panelHeightMm: number,
  line: 'top' | 'bottom',
  positionMm: number
): ClearanceConfig {
  const nextConfig: ClearanceConfig =
    line === 'top'
      ? { ...config, topOffsetMm: positionMm }
      : { ...config, bottomOffsetMm: panelHeightMm - positionMm };
  return clampClearanceConfig(nextConfig, panelHeightMm);
}
