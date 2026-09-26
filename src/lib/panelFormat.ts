import type { PanelDimensions } from "./panelTypes";

/**
 * Panel formats: the Eurorack rows and the Kosmo panels a design is made for, and the numbers each
 * standard publishes.
 *
 * - 3U Eurorack, from the Doepfer A-100 construction details
 *   (https://doepfer.de/a100_man/a100m_e.htm): panels are 128.5 mm high and a few tenths of a
 *   millimeter narrower than their HP pitch (table 1), with mounting holes 7.5 mm from the left
 *   edge and 3 mm from the top and bottom (front panel drawing).
 * - 1U Intellijel (https://intellijel.com/support/1u-technical-specifications/): 39.65 mm high,
 *   holes 7.5 mm from the left edge and 3 mm from the top and bottom, widths as in 3U.
 * - 1U Pulp Logic tiles (https://pulplogic.com/1u_tiles/): 1.700 in (43.18 mm) high, in multiples
 *   of 6 HP, with holes 0.200 in (5.08 mm) from the left edge and 0.118 in (3 mm) from the top and
 *   bottom. A tile may be up to 0.020 in (0.51 mm) under its pitch, which the 3U widths respect.
 * - 2U and 4U: no brand publishes them. They take the rack unit less the 4.85 mm the rail lips
 *   take from a 3U panel (133.35 mm down to 128.5 mm), and the 3U holes, for rows built with the
 *   same rails.
 * - Kosmo, the large format of Look Mum No Computer, has no formal specification. Its criteria
 *   (https://www.lookmumnocomputer.com/modular): 20 cm tall panels, widths in steps of 2.5 cm,
 *   10 mm top and bottom for the rails, M3 screws. The community's summary
 *   (https://lookmumnocomputer.discourse.group/t/kosmo-specification/896, first post) puts the
 *   hole centres 3 mm from the top, the bottom and the sides, and panel templates
 *   (https://gitlab.com/rsholmes/Kosmo_panel_templates) are cut at the full step, 25 mm x 200 mm
 *   and up, with no clearance.
 *
 * This module only imports types, so `panelTypes.ts` can import it without a cycle.
 */

export const MM_PER_CM = 10;
/** Horizontal pitch: the grid of the rails, 1/5 in. */
export const DEFAULT_MM_PER_HP = 5.08;
/** A rack unit, the height step of 19 in racks: 1.75 in. */
export const RACK_UNIT_MM = 44.45;
export const THREE_U_HEIGHT_MM = 128.5;

/**
 * Front panels are cut a few tenths of a millimeter narrower than their HP pitch, so modules can
 * be screwed side by side. Doepfer publishes the widths it uses, and the reduction is not
 * constant (0.08 mm at 1 HP, 0.48 mm at 6 HP), so its table comes first and
 * `PANEL_WIDTH_CLEARANCE_MM` covers the widths it leaves out.
 * Source: https://doepfer.de/a100_man/a100m_e.htm, "A-100 Construction Details", table 1.
 */
const PUBLISHED_PANEL_WIDTH_MM = new Map<number, number>([
  [1, 5],
  [1.5, 7.5],
  [2, 9.8],
  [4, 20],
  [6, 30],
  [8, 40.3],
  [10, 50.5],
  [12, 60.6],
  [14, 70.8],
  [16, 80.9],
  [18, 91.3],
  [20, 101.3],
  [21, 106.3],
  [22, 111.4],
  [28, 141.9],
  [42, 213],
]);

export const PANEL_WIDTH_CLEARANCE_MM = 0.35;

/** Whether Doepfer's table gives the width of a `widthHp` HP panel, rather than the clearance. */
export function isPublishedPanelWidth(widthHp: number): boolean {
  return PUBLISHED_PANEL_WIDTH_MM.has(widthHp);
}

/** Width a front panel of `widthHp` HP is cut at: its pitch on the rack grid, less the clearance. */
export function panelWidthMmForHp(widthHp: number): number {
  const published = PUBLISHED_PANEL_WIDTH_MM.get(widthHp);
  if (published !== undefined) {
    return published;
  }

  const pitchMm = widthHp * DEFAULT_MM_PER_HP;
  return pitchMm > PANEL_WIDTH_CLEARANCE_MM ? pitchMm - PANEL_WIDTH_CLEARANCE_MM : pitchMm;
}

export const PANEL_RACK_UNITS = [1, 2, 3, 4] as const;
export type PanelRackUnits = (typeof PANEL_RACK_UNITS)[number];

export const ONE_U_SPECS = ["intellijel", "pulpLogic"] as const;
export type OneUSpec = (typeof ONE_U_SPECS)[number];

/** Modular systems: Eurorack, in rows of 1U to 4U, and Kosmo. */
export const PANEL_SYSTEMS = ["eurorack", "kosmo"] as const;
export type PanelSystem = (typeof PANEL_SYSTEMS)[number];

export interface PanelFormat {
  /** The system the panel is made for. Saves from before Kosmo are all Eurorack. */
  system: PanelSystem;
  /** Height of the Eurorack row, in rack units. Kept on Kosmo, so coming back finds it. */
  rackUnits: PanelRackUnits;
  /** The 1U standard a 1U panel follows. Kept at other heights, so coming back to 1U finds it. */
  oneUSpec: OneUSpec;
  /** Any width and height in mm instead of the format, whose choice is kept for later. */
  custom: boolean;
}

export const DEFAULT_PANEL_FORMAT: PanelFormat = {
  system: "eurorack",
  rackUnits: 3,
  oneUSpec: "intellijel",
  custom: false,
};

/** The Eurorack rows. */
export type RackFormatKey = "intellijel1u" | "pulpLogic1u" | "rack2u" | "eurorack3u" | "rack4u";
export type PanelFormatKey = RackFormatKey | "kosmo" | "custom";

interface FormatSpecBase {
  heightMm: number;
  /** Mounting holes: the first column from the left edge, the rows from the top and bottom. */
  holeOffsetXMm: number;
  holeOffsetYMm: number;
  /** False for the heights no brand publishes, which are derived from the rack unit. */
  published: boolean;
}

export interface RackFormatSpec extends FormatSpecBase {
  key: RackFormatKey;
  /** Widths come in multiples of this many HP. */
  widthStepHp: number;
}

export interface KosmoFormatSpec extends FormatSpecBase {
  key: "kosmo";
  /** Widths come in multiples of this many millimeters. */
  widthStepMm: number;
}

export type FormatSpec = RackFormatSpec | KosmoFormatSpec;

const EURORACK_HOLE_OFFSETS = { holeOffsetXMm: 7.5, holeOffsetYMm: 3 };

const RACK_FORMAT_SPECS: Record<RackFormatKey, RackFormatSpec> = {
  intellijel1u: {
    key: "intellijel1u",
    heightMm: 39.65,
    ...EURORACK_HOLE_OFFSETS,
    widthStepHp: 1,
    published: true,
  },
  pulpLogic1u: {
    key: "pulpLogic1u",
    heightMm: 43.18,
    holeOffsetXMm: 5.08,
    holeOffsetYMm: 3,
    widthStepHp: 6,
    published: true,
  },
  // 2 x 44.45 mm, less the 4.85 mm of the rail lips.
  rack2u: {
    key: "rack2u",
    heightMm: 84.05,
    ...EURORACK_HOLE_OFFSETS,
    widthStepHp: 1,
    published: false,
  },
  eurorack3u: {
    key: "eurorack3u",
    heightMm: THREE_U_HEIGHT_MM,
    ...EURORACK_HOLE_OFFSETS,
    widthStepHp: 1,
    published: true,
  },
  // 4 x 44.45 mm, less the 4.85 mm of the rail lips.
  rack4u: {
    key: "rack4u",
    heightMm: 172.95,
    ...EURORACK_HOLE_OFFSETS,
    widthStepHp: 1,
    published: false,
  },
};

/** Kosmo widths come in steps of 2.5 cm, and panels are cut at their full width. */
export const KOSMO_WIDTH_STEP_MM = 25;
/** Room Look Mum No Computer leaves for the rails at the top and bottom of Kosmo panels. */
export const KOSMO_RAIL_ALLOWANCE_MM = 10;

export const KOSMO_FORMAT_SPEC: KosmoFormatSpec = {
  key: "kosmo",
  heightMm: 200,
  holeOffsetXMm: 3,
  holeOffsetYMm: 3,
  widthStepMm: KOSMO_WIDTH_STEP_MM,
  published: true,
};

/** Steps of 2.5 cm a width takes on Kosmo rails, rounded up. */
export function kosmoWidthStepsForMm(widthMm: number): number {
  return Math.max(1, Math.ceil(widthMm / KOSMO_WIDTH_STEP_MM - 1e-9));
}

/** Width a Kosmo panel of `steps` steps of 2.5 cm is cut at. */
export function panelWidthMmForKosmoSteps(steps: number): number {
  return steps * KOSMO_WIDTH_STEP_MM;
}

/** The Eurorack row of a panel, the one it keeps on Kosmo and custom panels for when they come back. */
export function getRackFormatSpec(
  format: Pick<PanelFormat, "rackUnits" | "oneUSpec">,
): RackFormatSpec {
  switch (format.rackUnits) {
    case 1:
      return format.oneUSpec === "pulpLogic"
        ? RACK_FORMAT_SPECS.pulpLogic1u
        : RACK_FORMAT_SPECS.intellijel1u;
    case 2:
      return RACK_FORMAT_SPECS.rack2u;
    case 3:
      return RACK_FORMAT_SPECS.eurorack3u;
    case 4:
      return RACK_FORMAT_SPECS.rack4u;
  }
}

/** The format a panel follows, custom or not: custom panels keep it for when they come back. */
export function getFormatSpec(
  format: Pick<PanelFormat, "system" | "rackUnits" | "oneUSpec">,
): FormatSpec {
  return format.system === "kosmo" ? KOSMO_FORMAT_SPEC : getRackFormatSpec(format);
}

export function getPanelFormatKey(format: PanelFormat): PanelFormatKey {
  return format.custom ? "custom" : getFormatSpec(format).key;
}

/** Whether the panel is the 3U Eurorack format, the one Etsy orders are made for. */
export function isEurorack3uFormat(format: PanelFormat): boolean {
  return getPanelFormatKey(format) === "eurorack3u";
}

export const CUSTOM_SIZE_MIN_MM = 5;
export const CUSTOM_SIZE_MAX_MM = 1000;

export function clampCustomSizeMm(value: number, fallbackMm: number): number {
  const size = Number.isFinite(value) && value > 0 ? value : fallbackMm;
  return Math.min(Math.max(size, CUSTOM_SIZE_MIN_MM), CUSTOM_SIZE_MAX_MM);
}

function isPanelSystem(value: unknown): value is PanelSystem {
  return PANEL_SYSTEMS.some((system) => system === value);
}

function isRackUnits(value: unknown): value is PanelRackUnits {
  return PANEL_RACK_UNITS.some((units) => units === value);
}

function isOneUSpec(value: unknown): value is OneUSpec {
  return ONE_U_SPECS.some((spec) => spec === value);
}

const LEGACY_HEIGHT_TOLERANCE_MM = 0.01;

/**
 * Repairs a saved format. Saves made before formats existed were all 3U, unless their height was
 * edited by hand: those become custom panels, so they keep their size. Saves made before Kosmo
 * are Eurorack.
 */
export function normalizePanelFormat(value: unknown, savedHeightMm?: number): PanelFormat {
  if (typeof value !== "object" || value === null) {
    const hasOtherHeight =
      typeof savedHeightMm === "number" &&
      Number.isFinite(savedHeightMm) &&
      savedHeightMm > 0 &&
      Math.abs(savedHeightMm - THREE_U_HEIGHT_MM) > LEGACY_HEIGHT_TOLERANCE_MM;
    return { ...DEFAULT_PANEL_FORMAT, custom: hasOtherHeight };
  }

  const saved = value as Partial<Record<keyof PanelFormat, unknown>>;
  return {
    system: isPanelSystem(saved.system) ? saved.system : DEFAULT_PANEL_FORMAT.system,
    rackUnits: isRackUnits(saved.rackUnits) ? saved.rackUnits : DEFAULT_PANEL_FORMAT.rackUnits,
    oneUSpec: isOneUSpec(saved.oneUSpec) ? saved.oneUSpec : DEFAULT_PANEL_FORMAT.oneUSpec,
    custom: typeof saved.custom === "boolean" ? saved.custom : DEFAULT_PANEL_FORMAT.custom,
  };
}

function readPositive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

/** HP a width takes on the rails, rounded up. */
export function widthHpForMm(widthMm: number): number {
  return Math.max(1, Math.ceil(widthMm / DEFAULT_MM_PER_HP - 1e-9));
}

/** A width in HP a Eurorack row allows: a whole number, in the steps its widths come in. */
export function snapWidthHp(
  widthHp: number,
  format: Pick<PanelFormat, "rackUnits" | "oneUSpec" | "custom">,
): number {
  const step = format.custom ? 1 : getRackFormatSpec(format).widthStepHp;
  const hp = readPositive(widthHp) ?? step;
  return Math.max(step, Math.round(hp / step) * step);
}

export interface PanelSizeInput {
  widthHp?: number;
  widthMm?: number;
  heightMm?: number;
}

/**
 * Dimensions of a panel in a format. Eurorack rows measure the width in HP, cut as the standards
 * publish it, and Kosmo in steps of 2.5 cm, the nearest one to the width in mm; both take their
 * height from the format. Custom panels keep any size in mm, within `CUSTOM_SIZE_MIN_MM` and
 * `CUSTOM_SIZE_MAX_MM`. Every panel counts the HP it takes on Eurorack rails.
 */
export function resolvePanelDimensions(format: PanelFormat, size: PanelSizeInput): PanelDimensions {
  const savedWidthHp = readPositive(size.widthHp);
  const savedWidthMm = readPositive(size.widthMm);

  if (format.custom) {
    const widthMm = clampCustomSizeMm(
      savedWidthMm ?? (savedWidthHp ? panelWidthMmForHp(savedWidthHp) : Number.NaN),
      panelWidthMmForHp(1),
    );
    const heightMm = clampCustomSizeMm(size.heightMm ?? Number.NaN, THREE_U_HEIGHT_MM);
    return { widthCm: widthMm / MM_PER_CM, widthMm, widthHp: widthHpForMm(widthMm), heightMm };
  }

  if (format.system === "kosmo") {
    const requestedMm =
      savedWidthMm ?? (savedWidthHp ? panelWidthMmForHp(savedWidthHp) : KOSMO_WIDTH_STEP_MM);
    const steps = Math.max(1, Math.round(requestedMm / KOSMO_WIDTH_STEP_MM));
    const widthMm = panelWidthMmForKosmoSteps(steps);
    return {
      widthCm: widthMm / MM_PER_CM,
      widthMm,
      widthHp: widthHpForMm(widthMm),
      heightMm: KOSMO_FORMAT_SPEC.heightMm,
    };
  }

  const widthHp = snapWidthHp(
    savedWidthHp ?? (savedWidthMm ? widthHpForMm(savedWidthMm) : 1),
    format,
  );
  const widthMm = panelWidthMmForHp(widthHp);
  return {
    widthCm: widthMm / MM_PER_CM,
    widthMm,
    widthHp,
    heightMm: getRackFormatSpec(format).heightMm,
  };
}
