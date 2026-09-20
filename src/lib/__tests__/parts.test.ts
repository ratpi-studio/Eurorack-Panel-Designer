import { describe, expect, it } from "vite-plus/test";

import { PanelElementType } from "../panelTypes";
import {
  DEFAULT_KNOB_ID,
  DEFAULT_PART_IDS,
  PANEL_KNOBS,
  PANEL_PARTS,
  getPart,
  getPartsForType,
  isKnobId,
  isPartForType,
  isPartId,
} from "../parts";

describe("parts catalog", () => {
  it("places every part as an existing element type, with a unique id", () => {
    const types: string[] = Object.values(PanelElementType);
    expect(PANEL_PARTS.every((part) => types.includes(part.type))).toBe(true);
    expect(new Set(PANEL_PARTS.map((part) => part.id)).size).toBe(PANEL_PARTS.length);
    expect(new Set(PANEL_KNOBS.map((knob) => knob.id)).size).toBe(PANEL_KNOBS.length);
  });

  it("gives every part a hole, and hardware wider than it when any", () => {
    for (const part of PANEL_PARTS) {
      expect(part.holeDiameterMm).toBeGreaterThan(0);
      expect(part.hardwareDiameterMm ?? Infinity).toBeGreaterThan(part.holeDiameterMm);
    }
  });

  it("keeps the datasheet holes of the most used parts", () => {
    expect(getPart("thonkiconn")).toMatchObject({ holeDiameterMm: 6, hardwareDiameterMm: 7.8 });
    expect(getPart("alpha9mm")).toMatchObject({ holeDiameterMm: 7, hardwareDiameterMm: 12 });
    expect(getPart("dailywellMiniToggle")).toMatchObject({ holeDiameterMm: 6.35 });
  });

  it("starts each type with one of its own parts, and knobs with a known knob", () => {
    for (const [type, partId] of Object.entries(DEFAULT_PART_IDS)) {
      expect(getPart(partId).type).toBe(type);
    }
    expect(isKnobId(DEFAULT_KNOB_ID)).toBe(true);
  });

  it("lists the parts of a type, none for the types without parts", () => {
    expect(getPartsForType(PanelElementType.Jack).map((part) => part.id)).toEqual(["thonkiconn"]);
    expect(getPartsForType(PanelElementType.Switch).map((part) => part.id)).toEqual([
      "dailywellSubMiniToggle",
      "dailywellMiniToggle",
    ]);
    expect(getPartsForType(PanelElementType.Rectangle)).toEqual([]);
  });

  it("recognizes part and knob ids, and parts of a type", () => {
    expect(isPartId("alpha9mm")).toBe(true);
    expect(isPartId("alpha16mm")).toBe(false);
    expect(isKnobId("roganPt1ps")).toBe(true);
    expect(isKnobId(12)).toBe(false);
    expect(isPartForType("led5mm", PanelElementType.Led)).toBe(true);
    expect(isPartForType("led5mm", PanelElementType.Jack)).toBe(false);
  });
});
