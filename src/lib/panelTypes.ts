type LengthUnit = 'cm' | 'mm' | 'hp';

export interface Vector2 {
  x: number;
  y: number;
}

export const MM_PER_CM = 10;
export const DEFAULT_MM_PER_HP = 5.08;
export const THREE_U_HEIGHT_MM = 128.5;

export enum PanelElementType {
  Jack = 'jack',
  Potentiometer = 'potentiometer',
  Switch = 'switch',
  Led = 'led',
  Label = 'label'
}

interface PanelElementBase<
  TType extends PanelElementType,
  TProperties extends PanelElementPropertiesBase
> {
  id: string;
  type: TType;
  positionMm: Vector2;
  rotationDeg?: number;
  properties: TProperties;
}

interface PanelElementPropertiesBase {
  label?: string;
}

export interface CircularElementProperties extends PanelElementPropertiesBase {
  diameterMm: number;
}

export interface RectangularElementProperties extends PanelElementPropertiesBase {
  widthMm: number;
  heightMm: number;
}

export interface LabelElementProperties extends PanelElementPropertiesBase {
  text: string;
  fontSizePt: number;
}

export type PanelElementPropertiesMap = {
  [PanelElementType.Jack]: CircularElementProperties;
  [PanelElementType.Potentiometer]: CircularElementProperties;
  [PanelElementType.Switch]: RectangularElementProperties;
  [PanelElementType.Led]: CircularElementProperties;
  [PanelElementType.Label]: LabelElementProperties;
};

type PanelElementForType<TType extends PanelElementType> = PanelElementBase<
  TType,
  PanelElementPropertiesMap[TType]
>;

export type PanelElement =
  | PanelElementForType<PanelElementType.Jack>
  | PanelElementForType<PanelElementType.Potentiometer>
  | PanelElementForType<PanelElementType.Switch>
  | PanelElementForType<PanelElementType.Led>
  | PanelElementForType<PanelElementType.Label>;

export interface PanelDimensions {
  widthCm: number;
  widthMm: number;
  widthHp: number;
  heightMm: number;
}

export interface PanelOptions {
  showGrid: boolean;
  showMountingHoles: boolean;
  snapToGrid: boolean;
  gridSizeMm: number;
}

export interface PanelModel {
  dimensions: PanelDimensions;
  elements: PanelElement[];
  options: PanelOptions;
}

export interface MountingHole {
  center: Vector2;
  diameterMm: number;
}

export interface MountingHoleConfig {
  diameterMm: number;
  horizontalOffsetMm: number;
  verticalOffsetMm: number;
  spacingHp: number;
}

export const DEFAULT_PANEL_OPTIONS: PanelOptions = {
  showGrid: true,
  showMountingHoles: true,
  snapToGrid: true,
  gridSizeMm: 5
};

export const DEFAULT_MOUNTING_HOLE_CONFIG: MountingHoleConfig = {
  diameterMm: 3.4,
  horizontalOffsetMm: 7.5,
  verticalOffsetMm: 3,
  spacingHp: 10
};

export interface SerializedPanel {
  version: number;
  model: PanelModel;
}

export const SERIALIZATION_VERSION = 1;

function isCircularElementProperties(
  properties: PanelElement['properties']
): properties is CircularElementProperties {
  return 'diameterMm' in properties;
}

function isRectangularElementProperties(
  properties: PanelElement['properties']
): properties is RectangularElementProperties {
  return 'widthMm' in properties && 'heightMm' in properties;
}

function isLabelElementProperties(
  properties: PanelElement['properties']
): properties is LabelElementProperties {
  return 'text' in properties && 'fontSizePt' in properties;
}

export function sanitizePropertiesForType<TType extends PanelElementType>(
  type: TType,
  properties?: PanelElement['properties'] | null
): PanelElementPropertiesMap[TType] | null {
  if (!properties) {
    return null;
  }

  switch (type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
      if (isCircularElementProperties(properties)) {
        return { ...properties } as PanelElementPropertiesMap[TType];
      }
      return null;
    case PanelElementType.Switch:
      if (isRectangularElementProperties(properties)) {
        return { ...properties } as PanelElementPropertiesMap[TType];
      }
      return null;
    case PanelElementType.Label:
      if (isLabelElementProperties(properties)) {
        return { ...properties } as PanelElementPropertiesMap[TType];
      }
      return null;
    default:
      return null;
  }
}

export function withElementProperties(
  element: PanelElement,
  properties?: PanelElement['properties'] | null
): PanelElement {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led: {
      const nextProperties = sanitizePropertiesForType(
        element.type,
        properties
      );
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties
      };
    }
    case PanelElementType.Switch: {
      const nextProperties = sanitizePropertiesForType(
        PanelElementType.Switch,
        properties
      );
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties
      };
    }
    case PanelElementType.Label: {
      const nextProperties = sanitizePropertiesForType(
        PanelElementType.Label,
        properties
      );
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties
      };
    }
    default:
      return element;
  }
}
