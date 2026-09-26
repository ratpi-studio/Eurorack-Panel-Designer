import type { PanelSystem } from "./panelFormat";
import type { PanelElementType } from "./panelTypes";

/**
 * Real components to place on a panel: the hole to drill for them, from their datasheet, and the
 * hardware they show on the front of the panel (nut, washer, the head of a banana socket). Knobs
 * go on potentiometers and encoders. Labels live in the i18n layer (`properties.partOptions`,
 * `properties.knobOptions`).
 *
 * Sources, checked in September 2026:
 * - Thonkiconn: QingPu PJ398SM and WQP518MA datasheets (Thonk), Ø6 mm bushing; QingPu
 *   W-QP-NUT-K knurled nut (Tayda), Ø7.8 mm.
 * - Switchcraft 1/4 in jacks: Switchcraft catalog, Hi-D Jax (112A) and Littel-Jax (11, 12A) pages,
 *   3/8-32 bushing through a single .375 in (9.53 mm) hole, 1/2 in hex nut and .625 in (15.87 mm)
 *   washer on the front, panels up to .156 in (3.96 mm) thick.
 * - Rean NYS229 and NYS230 1/4 in jacks: Rean drawings (Tayda A-1009, A-1021), Ø10.00 mm panel cut
 *   out and an SW 13 nut, 15 mm across its corners. The Kosmo community drills 1/4 in jacks 10 mm
 *   too: https://lookmumnocomputer.discourse.group/t/kosmo-specification/896, first post.
 * - Johnson (Cinch) 4 mm banana sockets, 108-0901-001 to 108-0913-001 by colour: 108-0902-001
 *   drawing, Ø.328 in (8.33 mm) mounting hole, whose two flats .250 in (6.35 mm) apart only key
 *   it, and Ø.438 in (11.13 mm) insulated head. Thonk sells them for Buchla and Serge builds.
 * - Tayda 4 mm banana sockets: J072 drawing (Tayda A-4257), ø8.0 mm hole and Ø10.80 mm head; the
 *   Hirschmann BIL 20 takes the same ø8 mm opening, with a ø10 mm head.
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
  | "switchcraft112a"
  | "reanNys229"
  | "johnsonBanana"
  | "taydaBanana"
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
  /** Widest hardware on the front of the panel (nut, washer, head), when wider than the hole. */
  hardwareDiameterMm?: number;
}

export const PANEL_PARTS: readonly PanelPart[] = [
  { id: "thonkiconn", type: "jack", holeDiameterMm: 6, hardwareDiameterMm: 7.8 },
  { id: "switchcraft112a", type: "jack", holeDiameterMm: 9.53, hardwareDiameterMm: 15.87 },
  { id: "reanNys229", type: "jack", holeDiameterMm: 10, hardwareDiameterMm: 15 },
  { id: "johnsonBanana", type: "jack", holeDiameterMm: 8.33, hardwareDiameterMm: 11.13 },
  { id: "taydaBanana", type: "jack", holeDiameterMm: 8, hardwareDiameterMm: 10.8 },
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

/** The parts Kosmo panels take instead: 1/4 in jacks, in the 10 mm hole Kosmo builders drill. */
const KOSMO_PART_IDS: Partial<Record<PartElementType, PartId>> = { jack: "reanNys229" };

/** Part a new element of this type starts as, on a panel of this system. */
export function getDefaultPartId(type: PartElementType, system: PanelSystem): PartId {
  return (system === "kosmo" ? KOSMO_PART_IDS[type] : undefined) ?? DEFAULT_PART_IDS[type];
}

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
