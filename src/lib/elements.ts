import {
  DEFAULT_LABEL_FONT_SIZE_PT,
  DEFAULT_LABEL_KNOCKOUT_PADDING_MM,
  PanelElementType,
  type CircularElementProperties,
  type InsertElementProperties,
  type KnobElementProperties,
  type LabelElementProperties,
  type PanelElement,
  type RectangularElementProperties,
  type SvgArtworkElementProperties,
  type Vector2,
} from "@lib/panelTypes";
import { DEFAULT_KNOB_ID, DEFAULT_PART_IDS, getPart, type PartId } from "@lib/parts";
import { DEFAULT_SVG_ARTWORK_COLOR } from "@lib/svgArtwork";
import { DEFAULT_TEXT_FONT_ID } from "@lib/text/textFonts";

function generateElementId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `element-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

/** A new jack, knob, switch or LED stands for the most common part of its type, with its hole. */
function partProperties(partId: PartId): CircularElementProperties {
  return { diameterMm: getPart(partId).holeDiameterMm, partId, label: "" };
}

const DEFAULT_JACK = partProperties(DEFAULT_PART_IDS.jack);

const DEFAULT_POTENTIOMETER: KnobElementProperties = {
  ...partProperties(DEFAULT_PART_IDS.potentiometer),
  knobId: DEFAULT_KNOB_ID,
};

const DEFAULT_SWITCH = partProperties(DEFAULT_PART_IDS.switch);

const DEFAULT_RECTANGLE: RectangularElementProperties = {
  widthMm: 12,
  heightMm: 20,
  label: "",
};

const DEFAULT_OVAL: RectangularElementProperties = {
  widthMm: 12,
  heightMm: 8,
  label: "",
};

const DEFAULT_SLOT: RectangularElementProperties = {
  widthMm: 16,
  heightMm: 6,
  label: "",
};

const DEFAULT_TRIANGLE: RectangularElementProperties = {
  widthMm: 12,
  heightMm: 12,
  label: "",
};

const DEFAULT_LED = partProperties(DEFAULT_PART_IDS.led);

const DEFAULT_INSERT: InsertElementProperties = {
  outerDiameterMm: 5.3,
  outerDepthMm: 4,
  innerDiameterMm: 2.7,
  innerDepthMm: 4,
  embedDepthMm: 0,
  label: "",
};

const DEFAULT_LABEL: LabelElementProperties = {
  text: "Label",
  fontSizePt: DEFAULT_LABEL_FONT_SIZE_PT,
  fontId: DEFAULT_TEXT_FONT_ID,
  patternOverlap: "knockout",
  knockoutPaddingMm: DEFAULT_LABEL_KNOCKOUT_PADDING_MM,
  label: "",
};

const DEFAULT_SVG_ARTWORK: SvgArtworkElementProperties = {
  svgText: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 50 8 L 92 92 L 8 92 Z" /></svg>`,
  viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
  widthMm: 20,
  heightMm: 20,
  color: DEFAULT_SVG_ARTWORK_COLOR,
  label: "",
};

export function createPanelElement(type: PanelElementType, positionMm: Vector2): PanelElement {
  switch (type) {
    case PanelElementType.Jack:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_JACK },
      };
    case PanelElementType.Potentiometer:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_POTENTIOMETER },
      };
    case PanelElementType.Switch:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_SWITCH },
      };
    case PanelElementType.Rectangle:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_RECTANGLE },
      };
    case PanelElementType.Oval:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_OVAL },
      };
    case PanelElementType.Slot:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_SLOT },
      };
    case PanelElementType.Triangle:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_TRIANGLE },
      };
    case PanelElementType.Insert:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_INSERT },
      };
    case PanelElementType.Led:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_LED },
      };
    case PanelElementType.Label:
      return {
        id: generateElementId(),
        type: PanelElementType.Label,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_LABEL },
      };
    case PanelElementType.SvgArtwork:
      return {
        id: generateElementId(),
        type: PanelElementType.SvgArtwork,
        positionMm,
        mountingHolesEnabled: false,
        rotationDeg: 0,
        properties: { ...DEFAULT_SVG_ARTWORK, viewBox: { ...DEFAULT_SVG_ARTWORK.viewBox } },
      };
    default:
      return {
        id: generateElementId(),
        type: PanelElementType.Label,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_LABEL },
      };
  }
}
