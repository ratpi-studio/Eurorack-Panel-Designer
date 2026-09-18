import { describe, expect, it } from "vite-plus/test";

import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  SERIALIZATION_VERSION,
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
  designRelief: { ...DEFAULT_DESIGN_RELIEF },
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
            sourceName: "square.svg",
          },
        },
      ],
    };

    expect(deserializePanelModel(serializePanelModel(model))).toEqual(model);
  });

  it("shows dimensions for saves made before the option existed", () => {
    const legacyOptions = {
      showGrid: false,
      showMountingHoles: true,
      snapToGrid: true,
      gridSizeMm: 2,
    };
    const payload = JSON.stringify({
      version: SERIALIZATION_VERSION,
      model: { ...sampleModel, options: legacyOptions },
    });

    expect(deserializePanelModel(payload).options).toEqual({
      ...legacyOptions,
      showDimensions: true,
    });
  });

  it("round-trips text elements with their font and pattern overlap", () => {
    const model: PanelModel = {
      ...sampleModel,
      designRelief: { thicknessMm: 0.8, penetrationMm: 0.3 },
      elements: [
        {
          id: "label-1",
          type: PanelElementType.Label,
          positionMm: { x: 20, y: 30 },
          rotationDeg: 90,
          mountingHolesEnabled: false,
          properties: {
            text: "CV IN",
            fontSizePt: 8,
            fontId: "barlowCondensed",
            patternOverlap: "merge",
            knockoutPaddingMm: 1.5,
            label: "",
          },
        },
      ],
    };

    expect(deserializePanelModel(serializePanelModel(model))).toEqual(model);
  });

  describe("saves from before 0.10", () => {
    const artwork = (id: string, stlThicknessMm: number, stlPenetrationMm: number) => ({
      id,
      type: PanelElementType.SvgArtwork,
      positionMm: { x: 20, y: 30 },
      mountingHolesEnabled: false,
      properties: {
        svgText: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
        viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
        widthMm: 18,
        heightMm: 18,
        color: "#ffffff",
        stlThicknessMm,
        stlPenetrationMm,
      },
    });
    const { designRelief: _unused, ...legacyModel } = sampleModel;
    const legacyPayload = (elements: unknown[]) =>
      JSON.stringify({ version: 6, model: { ...legacyModel, elements } });

    it("move the relief of their SVG artwork to the panel, keeping the tallest", () => {
      const model = deserializePanelModel(
        legacyPayload([artwork("svg-1", 0.6, 0.2), artwork("svg-2", 1, 0.1)]),
      );

      expect(model.designRelief).toEqual({ thicknessMm: 1, penetrationMm: 0.2 });
      for (const element of model.elements) {
        expect(element.properties).not.toHaveProperty("stlThicknessMm");
        expect(element.properties).not.toHaveProperty("stlPenetrationMm");
      }
    });

    it("get the default relief without SVG artwork", () => {
      const model = deserializePanelModel(legacyPayload([]));

      expect(model.designRelief).toEqual(DEFAULT_DESIGN_RELIEF);
    });

    it("give their texts the default font, cleared from patterns by 1 mm", () => {
      const model = deserializePanelModel(
        legacyPayload([
          {
            id: "label-1",
            type: PanelElementType.Label,
            positionMm: { x: 5, y: 10 },
            properties: { text: "OUT", fontSizePt: 8, label: "" },
          },
        ]),
      );

      expect(model.elements[0].properties).toEqual({
        text: "OUT",
        fontSizePt: 8,
        label: "",
        fontId: "roboto",
        patternOverlap: "knockout",
        knockoutPaddingMm: 1,
      });
    });
  });

  it("repairs invalid relief and text settings", () => {
    const payload = JSON.stringify({
      version: SERIALIZATION_VERSION,
      model: {
        ...sampleModel,
        designRelief: { thicknessMm: -1, penetrationMm: "deep" },
        elements: [
          {
            id: "label-1",
            type: PanelElementType.Label,
            positionMm: { x: 5, y: 10 },
            properties: {
              text: "OUT",
              fontSizePt: "large",
              fontId: "comic-sans",
              patternOverlap: "blend",
              knockoutPaddingMm: -2,
            },
          },
        ],
      },
    });

    const model = deserializePanelModel(payload);

    expect(model.designRelief).toEqual({
      thicknessMm: 0,
      penetrationMm: DEFAULT_DESIGN_RELIEF.penetrationMm,
    });
    expect(model.elements[0].properties).toMatchObject({
      fontSizePt: 10,
      fontId: "roboto",
      patternOverlap: "knockout",
      knockoutPaddingMm: 0,
    });
  });

  it("keeps hidden and locked elements, and drops the flags when they are not set", () => {
    const [jack] = sampleModel.elements;
    const model: PanelModel = {
      ...sampleModel,
      elements: [
        { ...jack, id: "hidden", hidden: true },
        { ...jack, id: "locked", locked: true },
        { ...jack, id: "plain", hidden: false, locked: undefined },
      ],
    };

    const [hidden, locked, plain] = deserializePanelModel(serializePanelModel(model)).elements;

    expect(hidden.hidden).toBe(true);
    expect(locked.locked).toBe(true);
    expect("hidden" in plain || "locked" in plain).toBe(false);
  });

  it("rejects malformed payloads", () => {
    expect(() =>
      parseSerializedPanel(
        JSON.stringify({
          version: SERIALIZATION_VERSION,
          model: { ...sampleModel, options: { ...sampleModel.options, showDimensions: "yes" } },
        }),
      ),
    ).toThrow(SerializationError);
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
