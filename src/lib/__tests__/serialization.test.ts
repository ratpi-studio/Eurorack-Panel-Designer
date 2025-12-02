import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  type PanelModel
} from '../panelTypes';
import {
  deserializePanelModel,
  parseSerializedPanel,
  SerializationError,
  serializePanelModel
} from '../serialization';

const sampleModel: PanelModel = {
  dimensions: {
    widthCm: 10,
    widthMm: 101.6,
    widthHp: 20,
    heightMm: 128.5
  },
  elements: [
    {
      id: 'el-1',
      type: PanelElementType.Jack,
      positionMm: { x: 5, y: 10 },
      properties: {
        diameterMm: 6
      }
    }
  ],
  options: { ...DEFAULT_PANEL_OPTIONS }
};

describe('serialization helpers', () => {
  it('round-trips a panel model', () => {
    const serialized = serializePanelModel(sampleModel);
    const parsed = parseSerializedPanel(serialized);

    expect(parsed.model).toEqual(sampleModel);
  });

  it('deserializes from an object payload', () => {
    const serialized = serializePanelModel(sampleModel);
    const model = deserializePanelModel(JSON.parse(serialized));
    expect(model.dimensions.widthHp).toBe(20);
  });

  it('rejects malformed payloads', () => {
    expect(() => parseSerializedPanel('{}')).toThrow(SerializationError);
    expect(() =>
      parseSerializedPanel(
        JSON.stringify({
          version: 999,
          model: sampleModel
        })
      )
    ).toThrow(SerializationError);
  });
});
