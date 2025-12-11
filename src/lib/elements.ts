import {
  PanelElementType,
  type CircularElementProperties,
  type LabelElementProperties,
  type PanelElement,
  type RectangularElementProperties,
  type Vector2
} from '@lib/panelTypes';

function generateElementId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `element-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

const DEFAULT_CIRCULAR: CircularElementProperties = {
  diameterMm: 8,
  label: ''
};

const DEFAULT_POTENTIOMETER: CircularElementProperties = {
  diameterMm: 10,
  label: ''
};

const DEFAULT_SWITCH: RectangularElementProperties = {
  widthMm: 8,
  heightMm: 16,
  label: ''
};

const DEFAULT_RECTANGLE: RectangularElementProperties = {
  widthMm: 12,
  heightMm: 20,
  label: ''
};

const DEFAULT_OVAL: RectangularElementProperties = {
  widthMm: 12,
  heightMm: 8,
  label: ''
};

const DEFAULT_SLOT: RectangularElementProperties = {
  widthMm: 16,
  heightMm: 6,
  label: ''
};

const DEFAULT_TRIANGLE: RectangularElementProperties = {
  widthMm: 12,
  heightMm: 12,
  label: ''
};

const DEFAULT_LED: CircularElementProperties = {
  diameterMm: 3,
  label: ''
};

const DEFAULT_LABEL: LabelElementProperties = {
  text: 'Label',
  fontSizePt: 10,
  label: ''
};

export function createPanelElement(
  type: PanelElementType,
  positionMm: Vector2
): PanelElement {
  switch (type) {
    case PanelElementType.Jack:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_CIRCULAR }
      };
    case PanelElementType.Potentiometer:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_POTENTIOMETER }
      };
    case PanelElementType.Switch:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_SWITCH }
      };
    case PanelElementType.Rectangle:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_RECTANGLE }
      };
    case PanelElementType.Oval:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_OVAL }
      };
    case PanelElementType.Slot:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_SLOT }
      };
    case PanelElementType.Triangle:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_TRIANGLE }
      };
    case PanelElementType.Led:
      return {
        id: generateElementId(),
        type,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_LED }
      };
    case PanelElementType.Label:
    default:
      return {
        id: generateElementId(),
        type: PanelElementType.Label,
        positionMm,
        mountingHolesEnabled: false,
        properties: { ...DEFAULT_LABEL }
      };
  }
}
