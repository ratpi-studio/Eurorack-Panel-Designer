import { describe, expect, it } from 'vitest';

import { generateMountingHoles } from '../mountingHoles';
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

    expect(holes).toHaveLength(4);
    const xs = Array.from(new Set(holes.map((hole) => hole.center.x)));
    expect(xs.length).toBeGreaterThanOrEqual(1);
  });
});
