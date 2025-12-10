import { describe, expect, it } from 'vitest';

import { computeElementMountingHoles } from '@lib/elementMountingHoles';
import { PanelElementType } from '@lib/panelTypes';

describe('computeElementMountingHoles', () => {
  it('creates evenly spaced holes around circular elements', () => {
    const holes = computeElementMountingHoles(
      [
        {
          id: 'jack-1',
          type: PanelElementType.Jack,
          positionMm: { x: 10, y: 10 },
          properties: { diameterMm: 8 }
        }
      ],
      {
        enabled: true,
        count: 2,
        diameterMm: 2,
        offsetMm: 3,
        rotationDeg: 0
      }
    );

    expect(holes).toHaveLength(2);
    const radius = Math.abs(holes[0].center.x - 10);
    // base radius = 8/2 = 4 -> + offset 3 + holeRadius 1 => 8
    expect(radius).toBeCloseTo(8);
  });

  it('returns empty array when disabled', () => {
    const holes = computeElementMountingHoles(
      [
        {
          id: 'rect-1',
          type: PanelElementType.Rectangle,
          positionMm: { x: 0, y: 0 },
          properties: { widthMm: 10, heightMm: 5 },
          rotationDeg: 0
        }
      ],
      {
        enabled: false,
        count: 4,
        diameterMm: 2,
        offsetMm: 2,
        rotationDeg: 0
      }
    );
    expect(holes).toHaveLength(0);
  });

  it('supports per-element rotation overrides', () => {
    const holes = computeElementMountingHoles(
      [
        {
          id: 'rect-2',
          type: PanelElementType.Rectangle,
          positionMm: { x: 0, y: 0 },
          rotationDeg: 0,
          mountingHoleRotationDeg: 90,
          properties: { widthMm: 10, heightMm: 4 }
        }
      ],
      {
        enabled: true,
        count: 1,
        diameterMm: 2,
        offsetMm: 2,
        rotationDeg: 0
      }
    );
    expect(holes).toHaveLength(1);
    expect(holes[0].center.x).toBeCloseTo(0);
    expect(holes[0].center.y).toBeGreaterThan(0);
  });
});
