import type { PanelElementType } from "./panelTypes";

/**
 * Real components to place on a panel: the hole to drill for them, from their datasheet, and the
 * hardware they show on the front of the panel (nut, washer). Knobs go on potentiometers and
 * encoders. Labels live in the i18n layer (`properties.partOptions`, `properties.knobOptions`).
 *
 * Sources, checked in September 2026:
 * - Thonkiconn: QingPu PJ398SM and WQP518MA datasheets (Thonk), Ø6 mm bushing; QingPu
 *   W-QP-NUT-K knurled nut (Tayda), Ø7.8 mm.
 * - Alpha 9 mm pots: Alpha RD901F-40 datasheet, M7 × 0.75 bushing, 10 mm nut, Ø12 mm washer.
 * - Bourns PEC11R: Bourns datasheet, M7 × 0.75 bushing, 10 mm nut, Ø12 mm washer.
 * - Dailywell toggles: 1MS (mini) datasheet, Ø6.35 mm hole and Ø10.8 mm locking washer; 2MS
 *   (sub-mini) datasheet, Ø4.95 mm hole (a 5 mm drill, as the Synth DIY wiki advises) and 8 mm
 *   nut and locking washer.
 * - LEDs: 3 mm (T-1) and 5 mm (T-1¾) bodies, the dome pushed through the hole.
 * - Knobs: Tayda (Davies 1900H clone), Rogan PT series catalog (skirt diameter), Thonk (Tall
 *   Trimmer Topper).
 */

/** Element types that can stand for a part. */
export type PartElementType =
  | `${PanelElementType.Jack}`
  | `${PanelElementType.Potentiometer}`
  | `${PanelElementType.Switch}`
  | `${PanelElementType.Led}`;

export type PartId =
  | "thonkiconn"
  | "alpha9mm"
  | "bournsPec11r"
  | "dailywellSubMiniToggle"
  | "dailywellMiniToggle"
  | "led3mm"
  | "led5mm";

export interface PanelPart {
  id: PartId;
  /** Element type the part is placed as. */
  type: PartElementType;
  /** Recommended panel hole, from the datasheet. */
  holeDiameterMm: number;
  /** Widest hardware on the front of the panel (nut, washer), when wider than the hole. */
  hardwareDiameterMm?: number;
}

export const PANEL_PARTS: readonly PanelPart[] = [
  { id: "thonkiconn", type: "jack", holeDiameterMm: 6, hardwareDiameterMm: 7.8 },
  { id: "alpha9mm", type: "potentiometer", holeDiameterMm: 7, hardwareDiameterMm: 12 },
  { id: "bournsPec11r", type: "potentiometer", holeDiameterMm: 7, hardwareDiameterMm: 12 },
  { id: "dailywellSubMiniToggle", type: "switch", holeDiameterMm: 5, hardwareDiameterMm: 8 },
  { id: "dailywellMiniToggle", type: "switch", holeDiameterMm: 6.35, hardwareDiameterMm: 10.8 },
  { id: "led3mm", type: "led", holeDiameterMm: 3 },
  { id: "led5mm", type: "led", holeDiameterMm: 5 },
];

export type KnobId =
  | "thonkTallTrimmerTopper"
  | "davies1900h"
  | "roganPt1ps"
  | "roganPt2ps"
  | "roganPt3ps";

export interface PanelKnob {
  id: KnobId;
  /** Widest part of the knob: its skirt when it has one. */
  diameterMm: number;
}

export const PANEL_KNOBS: readonly PanelKnob[] = [
  { id: "thonkTallTrimmerTopper", diameterMm: 7.8 },
  { id: "davies1900h", diameterMm: 12.7 },
  { id: "roganPt1ps", diameterMm: 14.38 },
  { id: "roganPt2ps", diameterMm: 15.75 },
  { id: "roganPt3ps", diameterMm: 18.47 },
];

/** Part a new element starts as: the most common one for its type. */
export const DEFAULT_PART_IDS: Record<PartElementType, PartId> = {
  jack: "thonkiconn",
  potentiometer: "alpha9mm",
  switch: "dailywellSubMiniToggle",
  led: "led3mm",
};

/** Knob a new potentiometer starts with: the smallest usual one, so it rarely crowds others. */
export const DEFAULT_KNOB_ID: KnobId = "davies1900h";

export function isPartId(value: unknown): value is PartId {
  return PANEL_PARTS.some((part) => part.id === value);
}

export function getPart(id: PartId): PanelPart {
  return PANEL_PARTS.find((part) => part.id === id) ?? PANEL_PARTS[0];
}

/** Parts an element of this type can stand for, empty for the types without parts. */
export function getPartsForType(type: PanelElementType): PanelPart[] {
  return PANEL_PARTS.filter((part) => part.type === type);
}

/** Whether `value` names a part of this element type. */
export function isPartForType(value: unknown, type: PanelElementType): value is PartId {
  return PANEL_PARTS.some((part) => part.id === value && part.type === type);
}

export function isKnobId(value: unknown): value is KnobId {
  return PANEL_KNOBS.some((knob) => knob.id === value);
}

export function getKnob(id: KnobId): PanelKnob {
  return PANEL_KNOBS.find((knob) => knob.id === id) ?? PANEL_KNOBS[0];
}
