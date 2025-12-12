import { describe, expect, it } from 'vitest';

import type { PanelElement } from '../panelTypes';
import { PanelElementType } from '../panelTypes';
import {
  computeNearestElementDistances,
  type NearestElementDistance
} from '../canvas/elementGeometry';

function createElement(id: string, x: number, y: number): PanelElement {
  return {
    id,
    type: PanelElementType.Jack,
    positionMm: { x, y },
    rotationDeg: 0,
    properties: {
      diameterMm: 6
    }
  } as PanelElement;
}

describe('computeNearestElementDistances', () => {
  it('returns empty list when maxCount is zero', () => {
    const elements: PanelElement[] = [createElement('a', 0, 0)];
    const result = computeNearestElementDistances({ x: 0, y: 0 }, elements, 0);
    expect(result).toEqual<NearestElementDistance[]>([]);
  });

  it('returns nearest elements sorted by distance', () => {
    const elements: PanelElement[] = [
      createElement('a', 0, 0),
      createElement('b', 10, 0),
      createElement('c', 5, 0)
    ];
    const result = computeNearestElementDistances({ x: 0, y: 0 }, elements, 2);
    expect(result.map((entry) => entry.elementId)).toEqual(['a', 'c']);
    expect(result[0]?.distanceMm).toBeCloseTo(0);
    expect(result[1]?.distanceMm).toBeCloseTo(5);
  });

  it('limits the number of returned elements', () => {
    const elements: PanelElement[] = [
      createElement('a', 0, 0),
      createElement('b', 10, 0),
      createElement('c', 20, 0),
      createElement('d', 30, 0)
    ];
    const result = computeNearestElementDistances({ x: 0, y: 0 }, elements, 3);
    expect(result.length).toBe(3);
    expect(result.map((entry) => entry.elementId)).toEqual(['a', 'b', 'c']);
  });
});
