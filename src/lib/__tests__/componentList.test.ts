import { describe, expect, it } from "vite-plus/test";

import { describeComponents, describeElementDetail } from "@lib/componentList";
import { createPanelElement } from "@lib/elements";
import { PanelElementType, type PanelElement } from "@lib/panelTypes";

const typeLabels = Object.fromEntries(
  Object.values(PanelElementType).map((type) => [type, type.toUpperCase()]),
) as Record<PanelElementType, string>;

function element(type: PanelElementType, patch: Partial<PanelElement> = {}): PanelElement {
  return { ...createPanelElement(type, { x: 10, y: 10 }), ...patch } as PanelElement;
}

function label(text: string): PanelElement {
  const created = createPanelElement(PanelElementType.Label, { x: 10, y: 10 });
  return { ...created, properties: { ...created.properties, text } } as PanelElement;
}

describe("components list", () => {
  it("numbers unnamed elements within their type, in placement order", () => {
    const items = describeComponents(
      [
        element(PanelElementType.Jack),
        element(PanelElementType.Potentiometer),
        element(PanelElementType.Jack),
      ],
      typeLabels,
    );

    expect(items.map((item) => item.name)).toEqual(["JACK 1", "POTENTIOMETER 1", "JACK 2"]);
    expect(items.every((item) => !item.isRenamed)).toBe(true);
  });

  it("uses the name given to an element, and keeps counting the others", () => {
    const named = element(PanelElementType.Jack);
    named.properties = { ...named.properties, label: "  CV in " };

    const items = describeComponents([named, element(PanelElementType.Jack)], typeLabels);

    expect(items[0]).toMatchObject({ name: "CV in", isRenamed: true });
    expect(items[1]).toMatchObject({ name: "JACK 2", isRenamed: false });
  });

  it("reports hidden and locked elements", () => {
    const [item] = describeComponents(
      [element(PanelElementType.Led, { hidden: true, locked: true })],
      typeLabels,
    );

    expect(item).toMatchObject({ hidden: true, locked: true, type: PanelElementType.Led });
  });

  it("tells similar elements apart by size or text", () => {
    const jack = element(PanelElementType.Jack);
    expect(describeElementDetail(jack)).toMatch(/^Ø[\d.]+ mm$/);
    expect(describeElementDetail(element(PanelElementType.Rectangle))).toMatch(
      /^[\d.]+ × [\d.]+ mm$/,
    );
    expect(describeElementDetail(element(PanelElementType.Insert))).toMatch(/^Ø[\d.]+ mm$/);
    expect(describeElementDetail(label("VCO"))).toBe("“VCO”");
    expect(describeElementDetail(label("   "))).toBe("");
    expect(describeElementDetail(label("A very long label for a module panel"))).toBe(
      "“A very long label for a…”",
    );
  });
});
