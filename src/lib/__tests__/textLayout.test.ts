import { beforeAll, describe, expect, it } from "vite-plus/test";

import { getLabelSizeMm } from "@lib/canvas/elementGeometry";
import { createPanelElement } from "@lib/elements";
import { PanelElementType, type LabelElement } from "@lib/panelTypes";
import { getLoadedTextFont, type TextFont } from "@lib/text/textFontLoader";
import { TEXT_FONTS } from "@lib/text/textFonts";
import {
  assessTextPrintability,
  getLabelKnockoutRing,
  getLabelTextLayout,
  layoutLabelText,
} from "@lib/text/textLayout";
import { PT_TO_MM } from "@lib/units";

import { loadTestFont } from "./textFontFixtures";

function label(
  properties: Partial<LabelElement["properties"]> = {},
  rotationDeg = 0,
): LabelElement {
  const element = createPanelElement(PanelElementType.Label, { x: 30, y: 40 }) as LabelElement;
  return { ...element, rotationDeg, properties: { ...element.properties, ...properties } };
}

let roboto: TextFont;

beforeAll(async () => {
  roboto = await loadTestFont("roboto");
  await loadTestFont("orbitron");
});

describe("curated fonts", () => {
  it.each(TEXT_FONTS.map((font) => [font.id]))("parses %s with capitals and digits", async (id) => {
    const font = await loadTestFont(id);

    expect(font.unitsPerEm).toBeGreaterThan(0);
    expect(font.capHeight).toBeGreaterThan(font.unitsPerEm * 0.5);
    for (const char of "AZ09-+") {
      expect(font.glyphForChar(char)?.commands.length).toBeGreaterThan(0);
    }
  });
});

describe("layoutLabelText", () => {
  it("sizes text from points like the canvas, capitals centered on the label position", () => {
    const layout = layoutLabelText(roboto, "H", 10);
    const capHeightMm = (roboto.capHeight / roboto.unitsPerEm) * 10 * PT_TO_MM;

    expect(layout.inkBounds?.minY).toBeCloseTo(-capHeightMm / 2, 3);
    expect(layout.inkBounds?.maxY).toBeCloseTo(capHeightMm / 2, 3);
    // H is about symmetric: its ink is centered horizontally too.
    expect((layout.inkBounds?.minX ?? 0) + (layout.inkBounds?.maxX ?? 0)).toBeCloseTo(0, 2);
  });

  it("scales with the font size", () => {
    const small = layoutLabelText(roboto, "OUT", 8);
    const large = layoutLabelText(roboto, "OUT", 16);

    expect(large.frameSizeMm.widthMm).toBeCloseTo(small.frameSizeMm.widthMm * 2);
    expect(large.frameSizeMm.heightMm).toBeCloseTo(small.frameSizeMm.heightMm * 2);
  });

  it("applies the font's kerning", () => {
    const a = roboto.glyphForChar("A");
    const v = roboto.glyphForChar("V");
    const layout = layoutLabelText(roboto, "AV", 10);

    expect(roboto.kerning(a!, v!)).toBeLessThan(0);
    expect(layout.glyphs[1].x).toBe(a!.advanceWidth + roboto.kerning(a!, v!));
  });

  it("leaves out characters the font lacks, and lists them", async () => {
    const orbitron = getLoadedTextFont("orbitron")!;
    const layout = layoutLabelText(orbitron, "10 kΩ", 10);

    expect(layout.missingCharacters).toEqual(["Ω"]);
    expect(layout.glyphs).toHaveLength(3);
  });

  it("draws nothing for blank text", () => {
    const layout = layoutLabelText(roboto, "   ", 10);

    expect(layout.inkBounds).toBeNull();
    expect(layout.pathData).toBe("");
    expect(layout.frameSizeMm.widthMm).toBeGreaterThan(0);
  });

  it("draws nothing for text sized 0", () => {
    const layout = layoutLabelText(roboto, "OUT", 0);

    expect(layout.glyphs).toEqual([]);
    expect(layout.inkBounds).toBeNull();
    expect(getLabelKnockoutRing(label({ text: "OUT", fontSizePt: 0 }))).toBeNull();
  });

  it("describes the outline as path data in millimeters", () => {
    const { pathData, inkBounds } = layoutLabelText(roboto, "O", 10);
    const numbers = pathData
      .replace(/[MLQCZ]/g, " ")
      .trim()
      .split(/\s+/)
      .map(Number);

    expect(pathData).toMatch(/^M[-\d.]+ [-\d.]+/);
    expect(pathData.match(/M/g)).toHaveLength(2);
    expect(numbers.every(Number.isFinite)).toBe(true);
    expect(Math.max(...numbers)).toBeLessThan(Math.max(inkBounds!.maxX, inkBounds!.maxY) + 0.1);
  });
});

describe("label frames and knockout zones", () => {
  it("frames labels around their ink once the font has loaded", () => {
    const properties = label({ text: "GATE", fontSizePt: 12 }).properties;
    const layout = getLabelTextLayout(properties)!;

    expect(getLabelSizeMm(properties)).toEqual(layout.frameSizeMm);
    expect(getLabelSizeMm(properties).widthMm).toBeGreaterThanOrEqual(
      layout.inkBounds!.maxX - layout.inkBounds!.minX,
    );
  });

  it("grows the ink bounds by the padding and turns them with the label", () => {
    const element = label({ text: "CV", knockoutPaddingMm: 1 }, 90);
    const ink = getLabelTextLayout(element.properties)!.inkBounds!;

    const ring = getLabelKnockoutRing(element)!;
    const xs = ring.map(([x]) => x);
    const ys = ring.map(([, y]) => y);

    // Turned a quarter clockwise, the text's height spans x and its width spans y.
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(ink.maxY - ink.minY + 2);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(ink.maxX - ink.minX + 2);
    expect(Math.min(...xs)).toBeCloseTo(30 - ink.maxY - 1);
    expect(Math.min(...ys)).toBeCloseTo(40 + ink.minX - 1);
  });

  it("clears nothing for merged or blank texts", () => {
    expect(getLabelKnockoutRing(label({ text: "CV", patternOverlap: "merge" }))).toBeNull();
    expect(getLabelKnockoutRing(label({ text: " " }))).toBeNull();
  });
});

describe("assessTextPrintability", () => {
  it("accepts bold text at common panel sizes", () => {
    const result = assessTextPrintability(label({ text: "OUT", fontSizePt: 10 }).properties);

    expect(result).toMatchObject({ tooSmall: false, thinStrokes: false, missingCharacters: [] });
    expect(result.strokeMm).toBeGreaterThan(0.4);
  });

  it("warns about tiny text and thin strokes", () => {
    expect(assessTextPrintability(label({ fontSizePt: 5 }).properties)).toMatchObject({
      tooSmall: true,
      thinStrokes: true,
    });
    expect(
      assessTextPrintability(label({ fontSizePt: 10, fontId: "michroma" }).properties),
    ).toMatchObject({ tooSmall: false, thinStrokes: true });
  });

  it("lists characters the font lacks", () => {
    expect(
      assessTextPrintability(label({ text: "±5V", fontId: "orbitron" }).properties)
        .missingCharacters,
    ).toEqual(["±"]);
  });
});
