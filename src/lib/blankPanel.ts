import { generateMountingHoles } from "./mountingHoles";
import { DEFAULT_PANEL_FORMAT } from "./panelFormat";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_COLOR,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_COLOR,
  DEFAULT_PANEL_OPTIONS,
  type MountingHole,
  type PanelModel,
} from "./panelTypes";
import { CALCULATOR_MAX_HP } from "./rackCalculator";
import { panelDimensionsFromHp } from "./units";

/** Width of the panel a new design starts from. */
export const DEFAULT_BLANK_PANEL_HP = 20;

/** A 3U Eurorack panel with nothing on it, as a new design starts. */
export function createBlankPanelModel(widthHp: number = DEFAULT_BLANK_PANEL_HP): PanelModel {
  return {
    dimensions: panelDimensionsFromHp(widthHp),
    elements: [],
    options: { ...DEFAULT_PANEL_OPTIONS },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: DEFAULT_PANEL_COLOR,
    designColor: DEFAULT_DESIGN_COLOR,
    designRelief: { ...DEFAULT_DESIGN_RELIEF },
    format: { ...DEFAULT_PANEL_FORMAT },
  };
}

/** The mounting holes of a panel, as the editor generates them from its settings. */
export function panelMountingHoles(model: PanelModel): MountingHole[] {
  return generateMountingHoles({
    widthHp: model.dimensions.widthHp,
    widthMm: model.dimensions.widthMm,
    heightMm: model.dimensions.heightMm,
    config: model.mountingHoleConfig,
    system: model.format.system,
  });
}

/**
 * The editor starts a blank 3U panel of the width this query parameter gives, in HP, then drops it
 * from the address. The panel templates of the content pages link to it.
 */
export const OPEN_WIDTH_PARAM = "hp";

/** Widest panel a link may ask for: the widest row the calculator counts. */
export const OPEN_WIDTH_MAX_HP = CALCULATOR_MAX_HP;

/** The width in HP the editor was asked to start a blank panel at, or null. */
export function readOpenWidthParam(search: string): number | null {
  const value = new URLSearchParams(search).get(OPEN_WIDTH_PARAM)?.trim();
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }
  const widthHp = Number(value);
  return widthHp >= 1 && widthHp <= OPEN_WIDTH_MAX_HP ? widthHp : null;
}

/** Where the editor starts a blank panel of `widthHp` HP. */
export function openWidthUrl(widthHp: number): string {
  return `/?${OPEN_WIDTH_PARAM}=${widthHp}`;
}
