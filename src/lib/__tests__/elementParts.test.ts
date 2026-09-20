import { describe, expect, it } from "vite-plus/test";

import {
  applyPartChoice,
  findCrowdedElements,
  getFrontOutline,
  getPartChoice,
  isPartChoice,
} from "../elementParts";
import { createPanelElement } from "../elements";
import {
  PanelElementType,
  hasRoundHole,
  withElementProperties,
  type PanelElement,
} from "../panelTypes";

function place(type: PanelElementType, x: number, y = 50): PanelElement {
  return { ...createPanelElement(type, { x, y }), id: `${type}-${x}-${y}` };
}

function withProperties(element: PanelElement, properties: Record<string, unknown>): PanelElement {
  return withElementProperties(element, properties as unknown as PanelElement["properties"]);
}

const customJack = (x: number, diameterMm: number) =>
  withProperties(place(PanelElementType.Jack, x), { diameterMm, label: "" });
const rectangularSwitch = () =>
  withProperties(place(PanelElementType.Switch, 20), { widthMm: 8, heightMm: 16, label: "" });

describe("getFrontOutline", () => {
  it("outlines the nut of a jack and the knob of a potentiometer", () => {
    expect(getFrontOutline(place(PanelElementType.Jack, 20))).toMatchObject({
      diameterMm: 7.8,
      hasHardware: true,
    });
    const knob = place(PanelElementType.Potentiometer, 20);
    expect(getFrontOutline(knob)?.diameterMm).toBe(12.7);
    expect(
      getFrontOutline(withProperties(knob, { ...knob.properties, knobId: "roganPt3ps" }))
        ?.diameterMm,
    ).toBe(18.47);
    // Without a knob, the washer under the nut is what shows.
    expect(
      getFrontOutline(withProperties(knob, { diameterMm: 7, partId: "alpha9mm" }))?.diameterMm,
    ).toBe(12);
  });

  it("keeps bare holes as they are", () => {
    expect(getFrontOutline(place(PanelElementType.Led, 20))).toMatchObject({
      diameterMm: 3,
      hasHardware: false,
    });
    expect(getFrontOutline(customJack(20, 8))).toMatchObject({ diameterMm: 8, hasHardware: false });
  });

  it("outlines the nut of a toggle, and nothing for the other shapes", () => {
    expect(getFrontOutline(place(PanelElementType.Switch, 20))?.diameterMm).toBe(8);
    expect(getFrontOutline(rectangularSwitch())).toBeNull();
    expect(getFrontOutline(place(PanelElementType.Rectangle, 20))).toBeNull();
  });
});

describe("findCrowdedElements", () => {
  it("finds knobs that run into each other, not the ones that only touch", () => {
    const first = place(PanelElementType.Potentiometer, 20);

    expect(findCrowdedElements([first, place(PanelElementType.Potentiometer, 32)])).toEqual(
      new Set([first.id, "potentiometer-32-50"]),
    );
    expect(findCrowdedElements([first, place(PanelElementType.Potentiometer, 32.7)]).size).toBe(0);
    expect(findCrowdedElements([first, place(PanelElementType.Potentiometer, 33)]).size).toBe(0);
  });

  it("finds a hole under the knob of another element", () => {
    const knob = place(PanelElementType.Potentiometer, 20);
    const led = place(PanelElementType.Led, 25);

    expect(findCrowdedElements([knob, led])).toEqual(new Set([knob.id, led.id]));
    expect(findCrowdedElements([knob, place(PanelElementType.Led, 28)]).size).toBe(0);
  });

  it("leaves overlapping bare holes to the cut-out merge", () => {
    expect(findCrowdedElements([customJack(20, 6), customJack(24, 6)]).size).toBe(0);
  });

  it("ignores the elements without a round hole", () => {
    const knob = place(PanelElementType.Potentiometer, 20);

    expect(findCrowdedElements([knob, place(PanelElementType.Rectangle, 22)]).size).toBe(0);
  });
});

describe("part choices", () => {
  it("shows the part of an element, or the shape of its own hole", () => {
    expect(getPartChoice(place(PanelElementType.Jack, 20))).toBe("thonkiconn");
    expect(getPartChoice(customJack(20, 8))).toBe("custom");
    expect(getPartChoice(place(PanelElementType.Switch, 20))).toBe("dailywellSubMiniToggle");
    expect(
      getPartChoice(withProperties(place(PanelElementType.Switch, 20), { diameterMm: 6 })),
    ).toBe("customRound");
    expect(getPartChoice(rectangularSwitch())).toBe("customRectangle");
    expect(getPartChoice(place(PanelElementType.Rectangle, 20))).toBeNull();
  });

  it("gives a part its datasheet hole, and keeps the hole when leaving the part", () => {
    expect(applyPartChoice(customJack(20, 8), "thonkiconn")).toEqual({
      label: "",
      diameterMm: 6,
      partId: "thonkiconn",
    });
    expect(applyPartChoice(customJack(20, 6.4), "custom")).toEqual({ label: "", diameterMm: 6.4 });
    expect(applyPartChoice(place(PanelElementType.Jack, 20), "custom")).toEqual({
      label: "",
      diameterMm: 6,
    });
  });

  it("keeps the knob of a potentiometer that changes part", () => {
    expect(applyPartChoice(place(PanelElementType.Potentiometer, 20), "bournsPec11r")).toEqual({
      label: "",
      diameterMm: 7,
      partId: "bournsPec11r",
      knobId: "davies1900h",
    });
  });

  it("turns switches round or rectangular", () => {
    const toggle = withElementProperties(
      rectangularSwitch(),
      applyPartChoice(rectangularSwitch(), "dailywellMiniToggle"),
    );
    expect(hasRoundHole(toggle)).toBe(true);
    expect(toggle.properties).toEqual({
      label: "",
      diameterMm: 6.35,
      partId: "dailywellMiniToggle",
    });

    expect(applyPartChoice(rectangularSwitch(), "customRound")).toEqual({
      label: "",
      diameterMm: 8,
    });
    expect(applyPartChoice(place(PanelElementType.Switch, 20), "customRectangle")).toEqual({
      label: "",
      widthMm: 5,
      heightMm: 5,
    });
  });

  it("recognizes the choices of the part select", () => {
    expect(isPartChoice("thonkiconn")).toBe(true);
    expect(isPartChoice("customRound")).toBe(true);
    expect(isPartChoice("round")).toBe(false);
  });
});
