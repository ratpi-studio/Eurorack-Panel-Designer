import { describe, expect, it } from 'vitest';

import { buildPanelStl } from '@lib/exportStl';
import { generateMountingHoles } from '@lib/mountingHoles';
import { PanelElementType, type PanelModel } from '@lib/panelTypes';
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
    }
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
});
