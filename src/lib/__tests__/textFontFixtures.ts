import { readFileSync } from "node:fs";

import {
  parseTextFont,
  registerTextFont,
  type GlyphCommand,
  type TextFont,
  type TextGlyph,
} from "@lib/text/textFontLoader";
import { getTextFontInfo, type TextFontId } from "@lib/text/textFonts";

/** Parses a shipped font from `public/` and makes it available to the text layout. */
export async function loadTestFont(id: TextFontId): Promise<TextFont> {
  const file = readFileSync(`public/${getTextFontInfo(id).file}`);
  const font = await parseTextFont(
    id,
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer,
  );
  registerTextFont(font);
  return font;
}

/** A closed contour through the points, in font units. */
export function contour(points: Array<[number, number]>): GlyphCommand[] {
  return [
    { type: "M", x: points[0][0], y: points[0][1] },
    ...points.slice(1).map(([x, y]): GlyphCommand => ({ type: "L", x, y })),
    { type: "Z" },
  ];
}

/** A square contour, counter-clockwise (y up) unless `clockwise`. */
export function square(x: number, y: number, size: number, clockwise = false): GlyphCommand[] {
  const points: Array<[number, number]> = [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
  ];
  return contour(clockwise ? points.reverse() : points);
}

/** A font whose glyphs are the given outlines, 1000 units per em. */
export function createTestFont(glyphs: Record<string, GlyphCommand[]>): TextFont {
  const entries = Object.entries(glyphs).map(([char, commands], index): [string, TextGlyph] => [
    char,
    { index: index + 1, advanceWidth: 1000, commands },
  ]);
  const byChar = new Map(entries);
  return {
    info: getTextFontInfo("roboto"),
    unitsPerEm: 1000,
    capHeight: 700,
    spaceAdvance: 250,
    glyphForChar: (char) => byChar.get(char) ?? null,
    kerning: () => 0,
  };
}
