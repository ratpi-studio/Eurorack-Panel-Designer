import { describe, expect, it } from "vite-plus/test";

import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  type PanelModel,
} from "../panelTypes";
import {
  deserializePanelModel,
  parseSerializedPanel,
  SerializationError,
  serializePanelModel,
} from "../serialization";

const sampleModel: PanelModel = {
  dimensions: {
    widthCm: 10,
    widthMm: 101.6,
    widthHp: 20,
    heightMm: 128.5,
  },
  elements: [
    {
      id: "el-1",
      type: PanelElementType.Jack,
      mountingHolesEnabled: false,
      positionMm: { x: 5, y: 10 },
      properties: {
        diameterMm: 6,
      },
    },
  ],
  options: { ...DEFAULT_PANEL_OPTIONS },
  mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
  elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
  clearance: { ...DEFAULT_CLEARANCE_CONFIG },
  panelColor: "#1a1a1a",
  designColor: "#ffffff",
};

describe("serialization helpers", () => {
  it("round-trips a panel model", () => {
    const serialized = serializePanelModel(sampleModel);
    const parsed = parseSerializedPanel(serialized);

    expect(parsed.model).toEqual(sampleModel);
  });

  it("deserializes from an object payload", () => {
    const serialized = serializePanelModel(sampleModel);
    const model = deserializePanelModel(JSON.parse(serialized));
    expect(model.dimensions.widthHp).toBe(20);
  });

  it("round-trips SVG artwork elements", () => {
    const model: PanelModel = {
      ...sampleModel,
      elements: [
        {
          id: "svg-1",
          type: PanelElementType.SvgArtwork,
          positionMm: { x: 20, y: 30 },
          rotationDeg: 12,
          mountingHolesEnabled: false,
          properties: {
            svgText:
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" /></svg>',
            viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
            widthMm: 18,
            heightMm: 18,
            color: "#ffffff",
            stlThicknessMm: 0.6,
            stlPenetrationMm: 0.2,
            sourceName: "square.svg",
          },
        },
      ],
    };

    expect(deserializePanelModel(serializePanelModel(model))).toEqual(model);
  });

  it("rejects malformed payloads", () => {
    expect(() => parseSerializedPanel("{}")).toThrow(SerializationError);
    expect(() =>
      parseSerializedPanel(
        JSON.stringify({
          version: 999,
          model: sampleModel,
        }),
      ),
    ).toThrow(SerializationError);
  });
});
