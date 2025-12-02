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
        properties: { ...DEFAULT_CIRCULAR }
      };
    case PanelElementType.Potentiometer:
      return {
        id: generateElementId(),
        type,
        positionMm,
        properties: { ...DEFAULT_POTENTIOMETER }
      };
    case PanelElementType.Switch:
      return {
        id: generateElementId(),
        type,
        positionMm,
        properties: { ...DEFAULT_SWITCH }
      };
    case PanelElementType.Led:
      return {
        id: generateElementId(),
        type,
        positionMm,
        properties: { ...DEFAULT_LED }
      };
    case PanelElementType.Label:
    default:
      return {
        id: generateElementId(),
        type: PanelElementType.Label,
        positionMm,
        properties: { ...DEFAULT_LABEL }
      };
  }
}
