import { describe, expect, it } from "vite-plus/test";

import { pickElementAtPoint } from "@lib/canvas/elementGeometry";
import { createPanelElement } from "@lib/elements";
import { PanelElementType, type PanelElement, type Vector2 } from "@lib/panelTypes";

/** An SVG pattern over the whole of an 8 HP panel. */
function fullPanelPattern(): PanelElement {
  const pattern = createPanelElement(PanelElementType.SvgArtwork, { x: 20.32, y: 64.25 });
  return {
    ...pattern,
    properties: { ...pattern.properties, widthMm: 40.64, heightMm: 128.5 },
  } as PanelElement;
}

function pick(
  point: Vector2,
  elements: PanelElement[],
  context: Partial<Parameters<typeof pickElementAtPoint>[2]> = {},
): string | null {
  const element = pickElementAtPoint(point, elements, {
    isOverMountingHole: false,
    isPlacing: false,
    selectedIds: new Set(),
    ...context,
  });
  return element?.id ?? null;
}

describe("picking an element on the canvas", () => {
  it("reaches the elements under a pattern placed over the whole panel", () => {
    const jack = createPanelElement(PanelElementType.Jack, { x: 10, y: 30 });
    const text = createPanelElement(PanelElementType.Label, { x: 20, y: 100 });
    const pattern = fullPanelPattern();
    const elements = [jack, text, pattern];

    expect(pick({ x: 10, y: 30 }, elements)).toBe(jack.id);
    expect(pick({ x: 20, y: 100 }, elements)).toBe(text.id);
    expect(pick({ x: 30, y: 60 }, elements)).toBe(pattern.id);
  });

  it("picks the smaller of two overlapping holes", () => {
    const jack = createPanelElement(PanelElementType.Jack, { x: 20, y: 60 });
    const cutOut = createPanelElement(PanelElementType.Rectangle, { x: 20, y: 60 });

    expect(pick({ x: 20, y: 60 }, [jack, cutOut])).toBe(jack.id);
    expect(pick({ x: 20, y: 68 }, [jack, cutOut])).toBe(cutOut.id);
  });

  it("puts holes before the design layer, whatever their size", () => {
    const cutOut = createPanelElement(PanelElementType.Rectangle, { x: 20, y: 60 });
    const text = createPanelElement(PanelElementType.Label, { x: 20, y: 60 });

    expect(pick({ x: 20, y: 60 }, [cutOut, text])).toBe(cutOut.id);
  });

  it("gives the element placed last when both are the same size", () => {
    const first = createPanelElement(PanelElementType.Jack, { x: 20, y: 60 });
    const second = createPanelElement(PanelElementType.Jack, { x: 21, y: 60 });

    expect(pick({ x: 20.5, y: 60 }, [first, second])).toBe(second.id);
    expect(pick({ x: 20.5, y: 60 }, [second, first])).toBe(first.id);
  });

  it("lets the mounting holes show through the design layer only", () => {
    const pattern = fullPanelPattern();
    const jack = createPanelElement(PanelElementType.Jack, { x: 7.5, y: 3 });

    expect(pick({ x: 7.5, y: 3 }, [pattern], { isOverMountingHole: true })).toBeNull();
    expect(pick({ x: 7.5, y: 3 }, [jack, pattern], { isOverMountingHole: true })).toBe(jack.id);
  });

  it("places over the design layer while still grabbing the selected element", () => {
    const jack = createPanelElement(PanelElementType.Jack, { x: 10, y: 30 });
    const text = createPanelElement(PanelElementType.Label, { x: 20, y: 100 });
    const pattern = fullPanelPattern();
    const elements = [jack, text, pattern];

    expect(pick({ x: 30, y: 60 }, elements, { isPlacing: true })).toBeNull();
    expect(pick({ x: 20, y: 100 }, elements, { isPlacing: true })).toBeNull();
    expect(
      pick({ x: 20, y: 100 }, elements, { isPlacing: true, selectedIds: new Set([text.id]) }),
    ).toBe(text.id);
    expect(pick({ x: 10, y: 30 }, elements, { isPlacing: true })).toBe(jack.id);
  });

  it("finds nothing away from the elements", () => {
    const jack = createPanelElement(PanelElementType.Jack, { x: 10, y: 30 });

    expect(pick({ x: 30, y: 100 }, [jack])).toBeNull();
  });
});
