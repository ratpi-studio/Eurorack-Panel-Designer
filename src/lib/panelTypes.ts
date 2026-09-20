import { isKnobId, isPartForType, type KnobId, type PartId } from "./parts";
import { DEFAULT_TEXT_FONT_ID, isTextFontId, type TextFontId } from "./text/textFonts";

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
  /** Left out of the canvas, the 3D view, every export and orders, but kept in the design. */
  hidden?: boolean;
  /** Cannot be picked or moved on the canvas; still selectable from the components list. */
  locked?: boolean;
  properties: TProperties;
}

interface PanelElementPropertiesBase {
  /** Name shown in the components list; empty until someone renames the element. */
  label?: string;
}

export interface CircularElementProperties extends PanelElementPropertiesBase {
  diameterMm: number;
  /** Real component the hole is for (see `parts.ts`); its hardware shows on the canvas. */
  partId?: PartId;
}

export interface RectangularElementProperties extends PanelElementPropertiesBase {
  widthMm: number;
  heightMm: number;
}

/** A potentiometer or an encoder, with the knob that goes on it. */
export interface KnobElementProperties extends CircularElementProperties {
  knobId?: KnobId;
}

/**
 * Toggles mount through a round hole (`diameterMm`), other switches through a rectangular one.
 * Switches saved before 0.12 are all rectangular.
 */
export type SwitchElementProperties = CircularElementProperties | RectangularElementProperties;

/**
 * Where a text lies over an SVG pattern: `knockout` clears the pattern around the text (its
 * bounding box grown by the padding), `merge` joins the text and the pattern into one relief.
 */
export type TextPatternOverlap = "knockout" | "merge";

export interface LabelElementProperties extends PanelElementPropertiesBase {
  text: string;
  fontSizePt: number;
  fontId: TextFontId;
  patternOverlap: TextPatternOverlap;
  /** Clearance around the text where the pattern is removed, with `knockout`. */
  knockoutPaddingMm: number;
}

export const DEFAULT_LABEL_FONT_SIZE_PT = 10;
export const DEFAULT_LABEL_KNOCKOUT_PADDING_MM = 1;

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
  sourceName?: string;
  sourceId?: string;
}

/** Relief settings saved on each SVG artwork before the panel-wide `designRelief` existed. */
interface LegacyArtworkRelief {
  stlThicknessMm?: unknown;
  stlPenetrationMm?: unknown;
}

export type PanelElementPropertiesMap = {
  [PanelElementType.Jack]: CircularElementProperties;
  [PanelElementType.Potentiometer]: KnobElementProperties;
  [PanelElementType.Switch]: SwitchElementProperties;
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

/** A text element. */
export type LabelElement = PanelElementForType<PanelElementType.Label>;

export function isLabelElement(element: PanelElement): element is LabelElement {
  return element.type === PanelElementType.Label;
}

/** An element whose hole is a circle of `diameterMm`. */
export type RoundHoleElement =
  | PanelElementForType<PanelElementType.Jack>
  | PanelElementForType<PanelElementType.Potentiometer>
  | PanelElementForType<PanelElementType.Led>
  | (PanelElementForType<PanelElementType.Switch> & { properties: CircularElementProperties });

/** Jacks, knobs, LEDs, and switches with a round hole, such as toggles. */
export function hasRoundHole(element: PanelElement): element is RoundHoleElement {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
      return true;
    case PanelElementType.Switch:
      return isCircularElementProperties(element.properties);
    default:
      return false;
  }
}

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
  showDimensions: boolean;
  /** Editor-only outline of the knobs, nuts and washers on the front of the panel. */
  showHardware: boolean;
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

/**
 * Relief of the design: every SVG pattern and text, printed in the design color on the front of
 * the panel. They share one level, so they print as a single layer.
 */
export interface DesignReliefConfig {
  /** Height of the relief, from its base inside the panel to its top. */
  thicknessMm: number;
  /** How deep the relief sinks into the panel front, so both colors bond. */
  penetrationMm: number;
}

export interface PanelModel {
  dimensions: PanelDimensions;
  elements: PanelElement[];
  options: PanelOptions;
  mountingHoleConfig: MountingHoleConfig;
  elementHoleConfig: ElementMountingHoleConfig;
  clearance: ClearanceConfig;
  panelColor: string;
  designColor: string;
  designRelief: DesignReliefConfig;
}

export type PanelModelInput = Omit<
  PanelModel,
  | "options"
  | "mountingHoleConfig"
  | "elementHoleConfig"
  | "clearance"
  | "panelColor"
  | "designColor"
  | "designRelief"
> & {
  // Saves made before the dimension and hardware overlays existed have no option for them.
  options: Omit<PanelOptions, "showDimensions" | "showHardware"> &
    Partial<Pick<PanelOptions, "showDimensions" | "showHardware">>;
  mountingHoleConfig?: MountingHoleConfig;
  elementHoleConfig?: ElementMountingHoleConfig;
  clearance?: ClearanceConfig;
  panelColor?: string;
  designColor?: string;
  // Saves made before 0.10 kept the relief on each SVG artwork instead.
  designRelief?: DesignReliefConfig;
};

export function normalizePanelModel(model: PanelModelInput): PanelModel {
  const overrides = model.mountingHoleConfig ?? DEFAULT_MOUNTING_HOLE_CONFIG;
  const elementOverrides = model.elementHoleConfig ?? DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG;
  const clearanceOverrides = model.clearance ?? DEFAULT_CLEARANCE_CONFIG;
  const elementEnableDefault = elementOverrides.enabled ?? false;
  const normalizedElements =
    model.elements?.map((element) => {
      const properties = sanitizePropertiesForType(element.type, element.properties);
      const base =
        typeof element.mountingHolesEnabled === "boolean"
          ? element
          : { ...element, mountingHolesEnabled: elementEnableDefault };
      return normalizeElementFlags((properties ? { ...base, properties } : base) as PanelElement);
    }) ?? [];
  return {
    ...model,
    options: {
      ...DEFAULT_PANEL_OPTIONS,
      ...model.options,
    },
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
    panelColor: typeof model.panelColor === "string" ? model.panelColor : DEFAULT_PANEL_COLOR,
    designColor: typeof model.designColor === "string" ? model.designColor : DEFAULT_DESIGN_COLOR,
    designRelief: normalizeDesignRelief(model.designRelief) ??
      readLegacyDesignRelief(model.elements) ?? { ...DEFAULT_DESIGN_RELIEF },
  };
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeDesignRelief(value: unknown): DesignReliefConfig | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { thicknessMm, penetrationMm } = value as Partial<
    Record<keyof DesignReliefConfig, unknown>
  >;
  const thickness = readFiniteNumber(thicknessMm);
  const penetration = readFiniteNumber(penetrationMm);
  if (thickness === null && penetration === null) {
    return null;
  }
  return {
    thicknessMm: Math.max(0, thickness ?? DEFAULT_DESIGN_RELIEF.thicknessMm),
    penetrationMm: Math.max(0, penetration ?? DEFAULT_DESIGN_RELIEF.penetrationMm),
  };
}

/**
 * Saves made before 0.10 set the relief of each SVG artwork. All details now share one relief:
 * keep the tallest one and the deepest penetration, so no artwork loses height.
 */
function readLegacyDesignRelief(elements: PanelModelInput["elements"]): DesignReliefConfig | null {
  let thicknessMm: number | null = null;
  let penetrationMm: number | null = null;
  for (const element of elements ?? []) {
    if (element.type !== PanelElementType.SvgArtwork || !element.properties) {
      continue;
    }
    const legacy = element.properties as LegacyArtworkRelief;
    const thickness = readFiniteNumber(legacy.stlThicknessMm);
    const penetration = readFiniteNumber(legacy.stlPenetrationMm);
    if (thickness !== null) {
      thicknessMm = Math.max(thicknessMm ?? -Infinity, thickness);
    }
    if (penetration !== null) {
      penetrationMm = Math.max(penetrationMm ?? -Infinity, penetration);
    }
  }
  if (thicknessMm === null && penetrationMm === null) {
    return null;
  }
  return normalizeDesignRelief({ thicknessMm, penetrationMm });
}

/** Keeps `hidden` and `locked` only when set, so saved designs stay as they were without them. */
function normalizeElementFlags(element: PanelElement): PanelElement {
  if (element.hidden === undefined && element.locked === undefined) {
    return element;
  }
  const next = { ...element };
  if (next.hidden !== true) {
    delete next.hidden;
  }
  if (next.locked !== true) {
    delete next.locked;
  }
  return next;
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
  showDimensions: true,
  showHardware: true,
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

export const DEFAULT_PANEL_COLOR = "#226bbf";
export const DEFAULT_DESIGN_COLOR = "#ffffff";

export const DEFAULT_DESIGN_RELIEF: DesignReliefConfig = {
  thicknessMm: 0.6,
  penetrationMm: 0.2,
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

// v7: the relief moved from each SVG artwork to the panel (`designRelief`), and text elements
// gained a font and a pattern overlap mode.
// v8: jacks, knobs, switches and LEDs can name a real part (`partId`), knobs the knob that goes on
// them (`knobId`), and switches can have a round hole (`diameterMm`).
export const SERIALIZATION_VERSION = 8;

export function isCircularElementProperties(
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
    typeof properties.svgText === "string" &&
    isSvgViewBox(properties.viewBox) &&
    typeof properties.widthMm === "number" &&
    typeof properties.heightMm === "number" &&
    typeof properties.color === "string"
  );
}

/** Fills in the font and overlap settings that labels saved before 0.10 do not have. */
function normalizeLabelProperties(properties: LabelElementProperties): LabelElementProperties {
  const { fontId, patternOverlap, knockoutPaddingMm } = properties as Partial<
    Record<keyof LabelElementProperties, unknown>
  >;
  const padding = readFiniteNumber(knockoutPaddingMm);
  const fontSizePt = readFiniteNumber(properties.fontSizePt);
  return {
    ...properties,
    text: typeof properties.text === "string" ? properties.text : "",
    fontSizePt: fontSizePt === null ? DEFAULT_LABEL_FONT_SIZE_PT : Math.max(0, fontSizePt),
    fontId: isTextFontId(fontId) ? fontId : DEFAULT_TEXT_FONT_ID,
    patternOverlap: patternOverlap === "merge" ? "merge" : "knockout",
    knockoutPaddingMm: padding === null ? DEFAULT_LABEL_KNOCKOUT_PADDING_MM : Math.max(0, padding),
  };
}

function normalizeSvgArtworkProperties(
  properties: SvgArtworkElementProperties,
): SvgArtworkElementProperties {
  const next: SvgArtworkElementProperties & LegacyArtworkRelief = {
    ...properties,
    widthMm: Math.max(1, properties.widthMm),
    heightMm: Math.max(1, properties.heightMm),
    sourceName: typeof properties.sourceName === "string" ? properties.sourceName : undefined,
    sourceId: typeof properties.sourceId === "string" ? properties.sourceId : undefined,
  };
  // The panel's `designRelief` replaced them (see `readLegacyDesignRelief`).
  delete next.stlThicknessMm;
  delete next.stlPenetrationMm;
  return next;
}

/** Keeps the part and the knob only when they exist and fit the element type. */
function sanitizePartReferences(
  type: PanelElementType,
  properties: CircularElementProperties,
): KnobElementProperties {
  const next: KnobElementProperties = { ...properties };
  if (next.partId !== undefined && !isPartForType(next.partId, type)) {
    delete next.partId;
  }
  if (
    next.knobId !== undefined &&
    (type !== PanelElementType.Potentiometer || !isKnobId(next.knobId))
  ) {
    delete next.knobId;
  }
  return next;
}

/** A switch with a round hole keeps no size of a rectangular one. */
function toRoundSwitchProperties(properties: CircularElementProperties): CircularElementProperties {
  const next: CircularElementProperties & Partial<RectangularElementProperties> =
    sanitizePartReferences(PanelElementType.Switch, properties);
  delete next.widthMm;
  delete next.heightMm;
  return next;
}

/** Every switch part has a round hole: a rectangular switch stands for none. */
function toRectangularSwitchProperties(
  properties: RectangularElementProperties,
): RectangularElementProperties {
  const next: RectangularElementProperties & Pick<CircularElementProperties, "partId"> = {
    ...properties,
  };
  delete next.partId;
  return next;
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
        return sanitizePartReferences(type, properties) as PanelElementPropertiesMap[TType];
      }
      return null;
    case PanelElementType.Switch:
      if (isCircularElementProperties(properties)) {
        return toRoundSwitchProperties(properties) as PanelElementPropertiesMap[TType];
      }
      if (isRectangularElementProperties(properties)) {
        return toRectangularSwitchProperties(properties) as PanelElementPropertiesMap[TType];
      }
      return null;
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
        return normalizeLabelProperties(properties) as PanelElementPropertiesMap[TType];
      }
      return null;
    case PanelElementType.SvgArtwork:
      if (isSvgArtworkElementProperties(properties)) {
        return normalizeSvgArtworkProperties(properties) as PanelElementPropertiesMap[TType];
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
