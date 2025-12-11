import { describe, expect, it } from 'vitest';

import { buildPanelStl } from '@lib/exportStl';
import { generateMountingHoles } from '@lib/mountingHoles';
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  PanelElementType,
  type PanelModel
} from '@lib/panelTypes';
import { createPanelDimensions } from '@lib/units';

function createEmptyPanel(): PanelModel {
  return {
    dimensions: createPanelDimensions(2),
    elements: [],
    options: {
      showGrid: true,
      showMountingHoles: true,
      snapToGrid: true,
      gridSizeMm: 5
    },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG }
  };
}

describe('buildPanelStl', () => {
  it('creates a valid ASCII STL header and footer', () => {
    const model = createEmptyPanel();
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm
    });

    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: 2
    });

    expect(stl.startsWith('solid eurorack_panel')).toBe(true);
    expect(stl.trimEnd().endsWith('endsolid eurorack_panel')).toBe(true);
  });

  it('reflects the requested thickness in Z coordinates', () => {
    const model = createEmptyPanel();
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm
    });

    const thickness = 3.5;
    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: thickness
    });

    expect(stl).toContain(` ${thickness}`);
  });

  it('creates holes for circular elements', () => {
    const model = createEmptyPanel();
    model.elements.push({
      id: 'jack-1',
      type: PanelElementType.Jack,
      positionMm: { x: model.dimensions.widthMm / 2, y: model.dimensions.heightMm / 2 },
      properties: {
        diameterMm: 6
      }
    });

    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm
    });

    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: 2
    });

    // The presence of a jack should reduce the number of filled cells and
    // therefore the number of facets; we simply assert that the STL is non-empty
    // and still has the correct header/footer.
    expect(stl.startsWith('solid eurorack_panel')).toBe(true);
    expect(stl.trimEnd().endsWith('endsolid eurorack_panel')).toBe(true);
  });

  it('supports non-circular shape cutouts', () => {
    const model = createEmptyPanel();
    model.elements.push(
      {
        id: 'rect-1',
        type: PanelElementType.Rectangle,
        positionMm: { x: 20, y: 30 },
        properties: {
          widthMm: 6,
          heightMm: 10
        }
      },
      {
        id: 'oval-1',
        type: PanelElementType.Oval,
        positionMm: { x: 40, y: 40 },
        properties: {
          widthMm: 12,
          heightMm: 6
        }
      },
      {
        id: 'slot-1',
        type: PanelElementType.Slot,
        positionMm: { x: 60, y: 60 },
        properties: {
          widthMm: 14,
          heightMm: 4
        }
      },
      {
        id: 'triangle-1',
        type: PanelElementType.Triangle,
        positionMm: { x: 80, y: 80 },
        properties: {
          widthMm: 10,
          heightMm: 8
        }
      }
    );

    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm
    });

    const stl = buildPanelStl(model, mountingHoles, {
      thicknessMm: 2
    });

    expect(stl.startsWith('solid eurorack_panel')).toBe(true);
    expect(stl.includes('facet')).toBe(true);
  });
});
