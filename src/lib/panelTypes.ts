export interface Vector2 {
  x: number;
  y: number;
}

export const MM_PER_CM = 10;
export const DEFAULT_MM_PER_HP = 5.08;
export const THREE_U_HEIGHT_MM = 128.5;

export enum PanelElementType {
  Jack = "jack",
  Potentiometer = "potentiometer",
  Switch = "switch",
  Led = "led",
  Label = "label",
  Rectangle = "rectangle",
  Oval = "oval",
  Slot = "slot",
  Triangle = "triangle",
  Insert = "insert",
  SvgArtwork = "svgArtwork",
}

interface PanelElementBase<
  TType extends PanelElementType,
  TProperties extends PanelElementPropertiesBase,
> {
  id: string;
  type: TType;
  positionMm: Vector2;
  mountingHolesEnabled?: boolean;
  rotationDeg?: number;
  mountingHoleRotationDeg?: number;
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

export interface InsertElementProperties extends PanelElementPropertiesBase {
  outerDiameterMm: number;
  outerDepthMm: number;
  innerDiameterMm: number;
  innerDepthMm: number;
  embedDepthMm: number;
}

export interface SvgViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface SvgArtworkElementProperties extends PanelElementPropertiesBase {
  svgText: string;
  viewBox: SvgViewBox;
  widthMm: number;
  heightMm: number;
  color: string;
  stlThicknessMm: number;
  stlPenetrationMm: number;
  sourceName?: string;
  sourceId?: string;
}

export type PanelElementPropertiesMap = {
  [PanelElementType.Jack]: CircularElementProperties;
  [PanelElementType.Potentiometer]: CircularElementProperties;
  [PanelElementType.Switch]: RectangularElementProperties;
  [PanelElementType.Led]: CircularElementProperties;
  [PanelElementType.Label]: LabelElementProperties;
  [PanelElementType.Rectangle]: RectangularElementProperties;
  [PanelElementType.Oval]: RectangularElementProperties;
  [PanelElementType.Slot]: RectangularElementProperties;
  [PanelElementType.Triangle]: RectangularElementProperties;
  [PanelElementType.Insert]: InsertElementProperties;
  [PanelElementType.SvgArtwork]: SvgArtworkElementProperties;
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
  | PanelElementForType<PanelElementType.Label>
  | PanelElementForType<PanelElementType.Rectangle>
  | PanelElementForType<PanelElementType.Oval>
  | PanelElementForType<PanelElementType.Slot>
  | PanelElementForType<PanelElementType.Triangle>
  | PanelElementForType<PanelElementType.Insert>
  | PanelElementForType<PanelElementType.SvgArtwork>;

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

export interface ElementMountingHoleConfig {
  enabled: boolean;
  count: number;
  diameterMm: number;
  offsetMm: number;
  rotationDeg: number;
}

export interface ClearanceConfig {
  topOffsetMm: number;
  bottomOffsetMm: number;
  minSpacingMm: number;
}

export interface PanelModel {
  dimensions: PanelDimensions;
  elements: PanelElement[];
  options: PanelOptions;
  mountingHoleConfig: MountingHoleConfig;
  elementHoleConfig: ElementMountingHoleConfig;
  clearance: ClearanceConfig;
}

export type PanelModelInput = Omit<
  PanelModel,
  "mountingHoleConfig" | "elementHoleConfig" | "clearance"
> & {
  mountingHoleConfig?: MountingHoleConfig;
  elementHoleConfig?: ElementMountingHoleConfig;
  clearance?: ClearanceConfig;
};

export function normalizePanelModel(model: PanelModelInput): PanelModel {
  const overrides = model.mountingHoleConfig ?? DEFAULT_MOUNTING_HOLE_CONFIG;
  const elementOverrides = model.elementHoleConfig ?? DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG;
  const clearanceOverrides = model.clearance ?? DEFAULT_CLEARANCE_CONFIG;
  const elementEnableDefault = elementOverrides.enabled ?? false;
  const normalizedElements =
    model.elements
      ?.map((element) => {
        const properties = sanitizePropertiesForType(element.type, element.properties);
        const base =
          typeof element.mountingHolesEnabled === "boolean"
            ? element
            : { ...element, mountingHolesEnabled: elementEnableDefault };
        return (properties ? { ...base, properties } : base) as PanelElement;
      }) ?? [];
  return {
    ...model,
    mountingHoleConfig: {
      ...DEFAULT_MOUNTING_HOLE_CONFIG,
      ...overrides,
    },
    elementHoleConfig: {
      ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
      ...elementOverrides,
    },
    elements: normalizedElements,
    clearance: clampClearanceConfig(
      {
        ...DEFAULT_CLEARANCE_CONFIG,
        ...clearanceOverrides,
      },
      model.dimensions.heightMm,
    ),
  };
}

export type MountingHoleShape = "circle" | "slot";

export interface MountingHole {
  center: Vector2;
  diameterMm: number;
  shape: MountingHoleShape;
  slotLengthMm?: number;
}

export interface MountingHoleConfig {
  diameterMm: number;
  horizontalOffsetMm: number;
  verticalOffsetMm: number;
  spacingHp: number;
  shape: MountingHoleShape;
  slotLengthMm: number;
}

export const DEFAULT_PANEL_OPTIONS: PanelOptions = {
  showGrid: true,
  showMountingHoles: true,
  snapToGrid: true,
  gridSizeMm: 5,
};

export const DEFAULT_MOUNTING_HOLE_CONFIG: MountingHoleConfig = {
  diameterMm: 3.4,
  horizontalOffsetMm: 7.5,
  verticalOffsetMm: 3,
  spacingHp: 10,
  shape: "circle",
  slotLengthMm: 8,
};

export const DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG: ElementMountingHoleConfig = {
  enabled: false,
  count: 2,
  diameterMm: 2.5,
  offsetMm: 3,
  rotationDeg: 0,
};

export const DEFAULT_CLEARANCE_CONFIG: ClearanceConfig = {
  topOffsetMm: 10,
  bottomOffsetMm: 10,
  minSpacingMm: 5,
};

export function clampClearanceConfig(
  config: ClearanceConfig,
  panelHeightMm: number,
): ClearanceConfig {
  const safeHeight = Math.max(panelHeightMm, 0);
  const clampValue = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  const safeMinSpacing = clampValue(config.minSpacingMm, 0, safeHeight);
  const maxOffsetSum = Math.max(safeHeight - safeMinSpacing, 0);
  const topOffsetMm = clampValue(config.topOffsetMm, 0, maxOffsetSum);
  const maxBottom = Math.max(maxOffsetSum - topOffsetMm, 0);
  const bottomOffsetMm = clampValue(config.bottomOffsetMm, 0, maxBottom);
  return {
    topOffsetMm,
    bottomOffsetMm,
    minSpacingMm: safeMinSpacing,
  };
}

export interface SerializedPanel {
  version: number;
  model: PanelModel;
}

export const SERIALIZATION_VERSION = 5;

function isCircularElementProperties(
  properties: PanelElement["properties"],
): properties is CircularElementProperties {
  return "diameterMm" in properties;
}

function isRectangularElementProperties(
  properties: PanelElement["properties"],
): properties is RectangularElementProperties {
  return "widthMm" in properties && "heightMm" in properties;
}

function isLabelElementProperties(
  properties: PanelElement["properties"],
): properties is LabelElementProperties {
  return "text" in properties && "fontSizePt" in properties;
}

function isInsertElementProperties(
  properties: PanelElement["properties"],
): properties is InsertElementProperties {
  return (
    "outerDiameterMm" in properties &&
    "outerDepthMm" in properties &&
    "innerDiameterMm" in properties &&
    "innerDepthMm" in properties &&
    "embedDepthMm" in properties
  );
}

function isSvgViewBox(value: unknown): value is SvgViewBox {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as SvgViewBox;
  return (
    typeof candidate.minX === "number" &&
    typeof candidate.minY === "number" &&
    typeof candidate.width === "number" &&
    typeof candidate.height === "number" &&
    candidate.width > 0 &&
    candidate.height > 0
  );
}

function isSvgArtworkElementProperties(
  properties: PanelElement["properties"],
): properties is SvgArtworkElementProperties {
  return (
    "svgText" in properties &&
    "viewBox" in properties &&
    "widthMm" in properties &&
    "heightMm" in properties &&
    "color" in properties &&
    "stlThicknessMm" in properties &&
    "stlPenetrationMm" in properties &&
    typeof properties.svgText === "string" &&
    isSvgViewBox(properties.viewBox) &&
    typeof properties.widthMm === "number" &&
    typeof properties.heightMm === "number" &&
    typeof properties.color === "string" &&
    typeof properties.stlThicknessMm === "number" &&
    typeof properties.stlPenetrationMm === "number"
  );
}

export function sanitizePropertiesForType<TType extends PanelElementType>(
  type: TType,
  properties?: PanelElement["properties"] | null,
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
    case PanelElementType.Rectangle:
    case PanelElementType.Oval:
    case PanelElementType.Slot:
    case PanelElementType.Triangle:
      if (isRectangularElementProperties(properties)) {
        return { ...properties } as PanelElementPropertiesMap[TType];
      }
      return null;
    case PanelElementType.Insert:
      if (isInsertElementProperties(properties)) {
        return { ...properties } as PanelElementPropertiesMap[TType];
      }
      return null;
    case PanelElementType.Label:
      if (isLabelElementProperties(properties)) {
        return { ...properties } as PanelElementPropertiesMap[TType];
      }
      return null;
    case PanelElementType.SvgArtwork:
      if (isSvgArtworkElementProperties(properties)) {
        return {
          ...properties,
          widthMm: Math.max(1, properties.widthMm),
          heightMm: Math.max(1, properties.heightMm),
          stlThicknessMm: Math.max(0, properties.stlThicknessMm),
          stlPenetrationMm: Math.max(0, properties.stlPenetrationMm),
          sourceName:
            typeof properties.sourceName === "string" ? properties.sourceName : undefined,
          sourceId: typeof properties.sourceId === "string" ? properties.sourceId : undefined,
        } as PanelElementPropertiesMap[TType];
      }
      return null;
    default:
      return null;
  }
}

export function withElementProperties(
  element: PanelElement,
  properties?: PanelElement["properties"] | null,
): PanelElement {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led: {
      const nextProperties = sanitizePropertiesForType(element.type, properties);
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties,
      };
    }
    case PanelElementType.Switch: {
      const nextProperties = sanitizePropertiesForType(PanelElementType.Switch, properties);
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties,
      };
    }
    case PanelElementType.Rectangle:
    case PanelElementType.Oval:
    case PanelElementType.Slot:
    case PanelElementType.Triangle: {
      const nextProperties = sanitizePropertiesForType(element.type, properties);
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties,
      };
    }
    case PanelElementType.Insert: {
      const nextProperties = sanitizePropertiesForType(PanelElementType.Insert, properties);
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties,
      };
    }
    case PanelElementType.Label: {
      const nextProperties = sanitizePropertiesForType(PanelElementType.Label, properties);
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties,
      };
    }
    case PanelElementType.SvgArtwork: {
      const nextProperties = sanitizePropertiesForType(PanelElementType.SvgArtwork, properties);
      if (!nextProperties) {
        return element;
      }
      return {
        ...element,
        properties: nextProperties,
      };
    }
    default:
      return element;
  }
}
