import { describe, expect, it } from "vite-plus/test";

import { migratePersistedPanelState, PANEL_STATE_VERSION } from "../panelStateMigration";
import {
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  normalizePanelModel,
  type PanelModel,
} from "../panelTypes";
import { createPanelDimensions } from "../units";

function createInitialModel(): PanelModel {
  return normalizePanelModel({
    dimensions: createPanelDimensions(10),
    elements: [],
    options: { ...DEFAULT_PANEL_OPTIONS },
  });
}

/** A model autosaved by 0.9: relief on the SVG artwork, texts without a font. */
const legacyModel = {
  dimensions: createPanelDimensions(8),
  elements: [
    {
      id: "label-1",
      type: PanelElementType.Label,
      positionMm: { x: 10, y: 20 },
      properties: { text: "IN", fontSizePt: 10, label: "" },
    },
    {
      id: "svg-1",
      type: PanelElementType.SvgArtwork,
      positionMm: { x: 20, y: 40 },
      properties: {
        svgText: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
        viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
        widthMm: 10,
        heightMm: 10,
        color: "#ffffff",
        stlThicknessMm: 0.8,
        stlPenetrationMm: 0.25,
      },
    },
  ],
  options: { ...DEFAULT_PANEL_OPTIONS },
  panelColor: "#226bbf",
  designColor: "#ffffff",
} as unknown as PanelModel;

describe("migratePersistedPanelState", () => {
  it("is at version 10, where panel options gained the hardware overlay", () => {
    expect(PANEL_STATE_VERSION).toBe(10);
  });

  it("shows the hardware of 0.11 autosaves", () => {
    const { showHardware: _, ...options } = DEFAULT_PANEL_OPTIONS;
    const state = { model: { ...createInitialModel(), options } as unknown as PanelModel };

    const migrated = migratePersistedPanelState(state, 9, createInitialModel);

    expect(migrated?.model?.options.showHardware).toBe(true);
  });

  it("moves the relief of 0.9 autosaves to the panel and gives texts a font", () => {
    const state = { model: legacyModel, referenceImage: null, referenceImageSelected: false };

    const migrated = migratePersistedPanelState(state, 8, createInitialModel);

    expect(migrated?.model?.designRelief).toEqual({ thicknessMm: 0.8, penetrationMm: 0.25 });
    expect(migrated?.model?.elements[0].properties).toMatchObject({
      fontId: "roboto",
      patternOverlap: "knockout",
      knockoutPaddingMm: 1,
    });
    expect(migrated?.model?.elements[1].properties).not.toHaveProperty("stlThicknessMm");
  });

  it("gives older autosaves without artwork the default relief", () => {
    const migrated = migratePersistedPanelState(
      { model: { ...legacyModel, elements: [] } },
      8,
      createInitialModel,
    );

    expect(migrated?.model?.designRelief).toEqual(DEFAULT_DESIGN_RELIEF);
  });

  it("keeps what earlier versions did: drop old reference images, start empty designs over", () => {
    const image = { dataUrl: "data:image/png;base64,", positionMm: { x: 0, y: 0 } };

    expect(
      migratePersistedPanelState(
        { model: legacyModel, referenceImage: image, referenceImageSelected: true },
        4,
        createInitialModel,
      ),
    ).toMatchObject({ referenceImage: null, referenceImageSelected: false });
    expect(migratePersistedPanelState({ model: null }, 6, createInitialModel)?.model).toEqual(
      createInitialModel(),
    );
    expect(migratePersistedPanelState(undefined, 8, createInitialModel)).toBeUndefined();
  });
});
