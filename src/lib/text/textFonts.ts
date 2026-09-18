/**
 * Curated fonts for text elements. Each one ships in `public/fonts/<folder>/` with its license
 * (SIL Open Font License 1.1), and loads only once a text uses it (see `textFontLoader.ts`).
 */
export type TextFontId = "roboto" | "barlowCondensed" | "jetbrainsMono" | "michroma" | "orbitron";

export interface TextFontInfo {
  id: TextFontId;
  /** Family and style, as the font names itself. */
  familyName: string;
  /** Font file, relative to the site root. */
  file: string;
  /**
   * Width of the main vertical stems, as a fraction of the font size, measured on the H. A rough
   * measure of how thin the strokes print.
   */
  stemEm: number;
}

export const TEXT_FONTS: readonly TextFontInfo[] = [
  {
    id: "roboto",
    familyName: "Roboto Bold",
    file: "fonts/roboto/Roboto-Bold.woff",
    stemEm: 0.146,
  },
  {
    id: "barlowCondensed",
    familyName: "Barlow Condensed Bold",
    file: "fonts/barlow-condensed/BarlowCondensed-Bold.woff",
    stemEm: 0.141,
  },
  {
    id: "jetbrainsMono",
    familyName: "JetBrains Mono Bold",
    file: "fonts/jetbrains-mono/JetBrainsMono-Bold.woff",
    stemEm: 0.125,
  },
  {
    id: "michroma",
    familyName: "Michroma",
    file: "fonts/michroma/Michroma-Regular.woff",
    stemEm: 0.094,
  },
  {
    id: "orbitron",
    familyName: "Orbitron Bold",
    file: "fonts/orbitron/Orbitron-Bold.woff",
    stemEm: 0.132,
  },
];

export const DEFAULT_TEXT_FONT_ID: TextFontId = "roboto";

export function isTextFontId(value: unknown): value is TextFontId {
  return TEXT_FONTS.some((font) => font.id === value);
}

export function getTextFontInfo(id: TextFontId): TextFontInfo {
  return TEXT_FONTS.find((font) => font.id === id) ?? TEXT_FONTS[0];
}
