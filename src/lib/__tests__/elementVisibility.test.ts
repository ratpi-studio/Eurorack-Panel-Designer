import { describe, expect, it } from "vite-plus/test";

import { createPanelElement } from "@lib/elements";
import {
  getVisibleElements,
  isElementInteractive,
  withoutHiddenElements,
} from "@lib/elementVisibility";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  type PanelElement,
  type PanelModel,
} from "@lib/panelTypes";

function panelWith(elements: PanelElement[]): PanelModel {
  return {
    dimensions: { widthCm: 4.064, widthMm: 40.64, widthHp: 8, heightMm: 128.5 },
    elements,
    options: { ...DEFAULT_PANEL_OPTIONS },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: "#000000",
    designColor: "#ffffff",
    designRelief: { ...DEFAULT_DESIGN_RELIEF },
  };
}

const jack = createPanelElement(PanelElementType.Jack, { x: 10, y: 20 });
const hiddenKnob = {
  ...createPanelElement(PanelElementType.Potentiometer, { x: 20, y: 40 }),
  hidden: true,
};
const lockedLed = { ...createPanelElement(PanelElementType.Led, { x: 20, y: 60 }), locked: true };

describe("element visibility", () => {
  it("lets the canvas pick only shown, unlocked elements", () => {
    expect(isElementInteractive(jack)).toBe(true);
    expect(isElementInteractive(hiddenKnob)).toBe(false);
    expect(isElementInteractive(lockedLed)).toBe(false);
  });

  it("leaves hidden elements out, keeping locked ones", () => {
    expect(getVisibleElements([jack, hiddenKnob, lockedLed])).toEqual([jack, lockedLed]);
  });

  it("keeps the same objects when nothing is hidden, so views do not rebuild", () => {
    const elements = [jack, lockedLed];
    expect(getVisibleElements(elements)).toBe(elements);

    const model = panelWith(elements);
    expect(withoutHiddenElements(model)).toBe(model);
  });

  it("gives outputs the design without its hidden elements", () => {
    const model = panelWith([jack, hiddenKnob]);

    const output = withoutHiddenElements(model);

    expect(output.elements).toEqual([jack]);
    expect(output.dimensions).toBe(model.dimensions);
    expect(model.elements).toHaveLength(2);
  });
});
