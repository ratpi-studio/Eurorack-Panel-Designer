import { describe, expect, it } from 'vitest';

import { MIN_MOUNTING_HOLE_SPACING_MM, generateMountingHoles } from '../mountingHoles';
import { DEFAULT_MOUNTING_HOLE_CONFIG } from '../panelTypes';
import { createPanelDimensions } from '../units';

describe('mounting hole generation', () => {
  it('creates four holes for a single spacing segment', () => {
    const dimensions = createPanelDimensions(5);
    const holes = generateMountingHoles({
      widthHp: dimensions.widthHp,
      widthMm: dimensions.widthMm,
      heightMm: dimensions.heightMm
    });

    expect(holes).toHaveLength(4);
    const xs = Array.from(new Set(holes.map((hole) => hole.center.x)));
    expect(xs).toHaveLength(2);
    holes.forEach((hole) => {
      expect(hole.diameterMm).toBe(DEFAULT_MOUNTING_HOLE_CONFIG.diameterMm);
      expect(hole.shape).toBe('circle');
    });
  });

  it('adds extra columns when the panel exceeds the spacing', () => {
    const dimensions = createPanelDimensions(30);
    const holes = generateMountingHoles({
      widthHp: dimensions.widthHp,
      widthMm: dimensions.widthMm,
      heightMm: dimensions.heightMm
    });

    const segments = Math.ceil(
      dimensions.widthHp / DEFAULT_MOUNTING_HOLE_CONFIG.spacingHp
    );
    expect(holes).toHaveLength(segments * 4);
  });

  it('clamps offsets when the panel is very narrow', () => {
    const dimensions = createPanelDimensions(1);
    const holes = generateMountingHoles({
      widthHp: dimensions.widthHp,
      widthMm: dimensions.widthMm,
      heightMm: dimensions.heightMm,
      config: { horizontalOffsetMm: 50 }
    });

    expect(holes.length).toBeGreaterThanOrEqual(2);
    const xs = Array.from(new Set(holes.map((hole) => hole.center.x)));
    expect(xs.length).toBeGreaterThanOrEqual(1);
    xs.forEach((x) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(dimensions.widthMm);
    });
  });

  it('supports slot mounting holes without exceeding panel width', () => {
    const dimensions = createPanelDimensions(4);
    const holes = generateMountingHoles({
      widthHp: dimensions.widthHp,
      widthMm: dimensions.widthMm,
      heightMm: dimensions.heightMm,
      config: { shape: 'slot', slotLengthMm: 30, diameterMm: 3 }
    });

    expect(holes.every((hole) => hole.shape === 'slot')).toBe(true);
    const topHoles = holes.filter((hole) => hole.center.y === holes[0]?.center.y);
    topHoles.forEach((hole) => {
      expect(hole.slotLengthMm).toBeLessThanOrEqual(dimensions.widthMm);
      expect(hole.center.x + (hole.slotLengthMm ?? 0) / 2).toBeLessThanOrEqual(dimensions.widthMm);
      expect(hole.center.x - (hole.slotLengthMm ?? 0) / 2).toBeGreaterThanOrEqual(0);
    });
    const sortedXs = topHoles.map((hole) => hole.center.x).sort((a, b) => a - b);
    for (let i = 1; i < sortedXs.length; i += 1) {
      expect(sortedXs[i] - sortedXs[i - 1]).toBeGreaterThanOrEqual(MIN_MOUNTING_HOLE_SPACING_MM);
    }
  });
});
