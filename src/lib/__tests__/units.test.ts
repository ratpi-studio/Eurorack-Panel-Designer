import { describe, expect, it } from 'vitest';

import {
  cmToMm,
  computePanelWidth,
  createPanelDimensions,
  hpToMm,
  mmToHp,
  sanitizeWidthCm
} from '../units';
import { THREE_U_HEIGHT_MM } from '../panelTypes';

describe('units helpers', () => {
  it('converts centimeters to millimeters', () => {
    expect(cmToMm(4.2)).toBeCloseTo(42);
  });

  it('converts between millimeters and HP', () => {
    expect(mmToHp(10.16)).toBeCloseTo(2);
    expect(hpToMm(2)).toBeCloseTo(10.16);
  });

  it('sanitizes invalid width values', () => {
    expect(sanitizeWidthCm(0.5)).toBe(1);
    expect(sanitizeWidthCm(Number.NaN)).toBe(1);
    expect(sanitizeWidthCm(12)).toBe(12);
  });

  it('computes normalized widths', () => {
    const result = computePanelWidth(3.2);
    expect(result.widthCm).toBe(3.2);
    expect(result.widthMm).toBeCloseTo(32);
    expect(result.widthHp).toBe(7);
    expect(result.normalizedWidthMm).toBeCloseTo(35.56);
  });

  it('creates panel dimensions with the standard height', () => {
    const dimensions = createPanelDimensions(3.2);
    expect(dimensions.heightMm).toBe(THREE_U_HEIGHT_MM);
    expect(dimensions.widthHp).toBeGreaterThan(0);
  });
});
