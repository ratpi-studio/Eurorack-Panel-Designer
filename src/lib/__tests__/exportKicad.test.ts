import { describe, expect, it } from 'vitest';

import { buildKicadEdgeCutsSvg, buildKicadPcbFile } from '@lib/exportKicad';
import { generateMountingHoles } from '@lib/mountingHoles';
import {
  DEFAULT_PANEL_OPTIONS,
  DEFAULT_MM_PER_HP,
  PanelElementType,
  type PanelModel
} from '@lib/panelTypes';
import { createPanelDimensions } from '@lib/units';

function createSampleModel(): PanelModel {
  return {
    dimensions: createPanelDimensions(2, DEFAULT_MM_PER_HP, 50),
    elements: [
      {
        id: 'jack-1',
        type: PanelElementType.Jack,
        positionMm: { x: 10, y: 15 },
        properties: {
          diameterMm: 6
        }
      },
      {
        id: 'switch-1',
        type: PanelElementType.Switch,
        positionMm: { x: 15, y: 30 },
        properties: {
          widthMm: 8,
          heightMm: 10
        }
      },
      {
        id: 'rectangle-1',
        type: PanelElementType.Rectangle,
        positionMm: { x: 25, y: 40 },
        properties: {
          widthMm: 6,
          heightMm: 8
        }
      },
      {
        id: 'oval-1',
        type: PanelElementType.Oval,
        positionMm: { x: 35, y: 50 },
        properties: {
          widthMm: 12,
          heightMm: 6
        }
      },
      {
        id: 'slot-1',
        type: PanelElementType.Slot,
        positionMm: { x: 45, y: 60 },
        properties: {
          widthMm: 14,
          heightMm: 4
        }
      },
      {
        id: 'triangle-1',
        type: PanelElementType.Triangle,
        positionMm: { x: 55, y: 70 },
        properties: {
          widthMm: 10,
          heightMm: 8
        }
      }
    ],
    options: { ...DEFAULT_PANEL_OPTIONS }
  };
}

describe('buildKicadEdgeCutsSvg', () => {
  it('outputs an SVG with outline and cutouts in millimeters', () => {
    const model = createSampleModel();
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm
    });

    const svg = buildKicadEdgeCutsSvg(model, mountingHoles);
    const widthStr = model.dimensions.widthMm.toString();
    const heightStr = model.dimensions.heightMm.toString();

    expect(svg).toContain(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${widthStr}mm" height="${heightStr}mm" viewBox="0 0 ${widthStr} ${heightStr}">`
    );
    expect(svg).toContain(
      `<rect x="0" y="0" width="${widthStr}" height="${heightStr}" stroke="black" stroke-width="0.1" fill="none" />`
    );
    expect(svg).toContain(
      `<circle cx="10" cy="15" r="3" stroke="black" stroke-width="0.1" fill="none" />`
    );
    expect(svg).toContain(
      `<rect x="11" y="25" width="8" height="10" stroke="black" stroke-width="0.1" fill="none" />`
    );
    expect(svg).toContain(
      `<rect x="22" y="36" width="6" height="8" stroke="black" stroke-width="0.1" fill="none" />`
    );
    expect(svg).toContain(
      `<ellipse cx="35" cy="50" rx="6" ry="3" stroke="black" stroke-width="0.1" fill="none" />`
    );
    expect(svg).toContain(
      `M 40 58 H 50 A 2 2 0 0 1 50 62 H 40 A 2 2 0 0 1 40 58 Z`
    );
    expect(svg).toContain(
      `M 55 66 L 60 74 L 50 74 Z`
    );
  });
});

describe('buildKicadPcbFile', () => {
  it('creates a minimal .kicad_pcb with Edge.Cuts geometry', () => {
    const model = createSampleModel();
    const mountingHoles = generateMountingHoles({
      widthHp: model.dimensions.widthHp,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.heightMm
    });

    const pcb = buildKicadPcbFile(model, mountingHoles);

    expect(pcb.startsWith('(kicad_pcb (version 20231126)')).toBe(true);
    expect(pcb).toContain('(layer "Edge.Cuts")');
    expect(pcb).toContain(
      `(gr_line (start 0 0) (end ${model.dimensions.widthMm} 0) (layer "Edge.Cuts") (width 0.15))`
    );
    expect(pcb).toContain(
      `(gr_line (start 11 25) (end 19 25) (layer "Edge.Cuts") (width 0.15))`
    );
    expect(pcb).toContain(
      `(gr_line (start 50 62) (end 40 62) (layer "Edge.Cuts") (width 0.15))`
    );
    expect(pcb).toContain(
      `(gr_line (start 55 66) (end 60 74) (layer "Edge.Cuts") (width 0.15))`
    );

    const grLineCount = pcb.match(/\(gr_line /g)?.length ?? 0;
    const expectedMinimum =
      4 + // outline
      4 + // rectangular hole
      (mountingHoles.length + 1) * 32; // 32 segments per circular cutout (mounting holes + jack)
    expect(grLineCount).toBeGreaterThanOrEqual(expectedMinimum);
  });
});
