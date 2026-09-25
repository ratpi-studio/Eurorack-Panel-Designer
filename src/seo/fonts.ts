/**
 * The two type roles of the UI kit, Geist and Geist Mono (SIL OFL 1.1, from Fontsource 5.3.0),
 * cut down to Latin and served from `public/fonts/ui/`. They are the pages' own fonts: panel texts
 * use the fonts of `src/lib/text/textFonts.ts`.
 */

export interface UiFont {
  family: string;
  url: string;
}

/** Fontsource's Latin range: characters outside it, such as arrows, fall back to system fonts. */
export const LATIN_UNICODE_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, " +
  "U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

export const UI_FONTS: readonly UiFont[] = [
  { family: "Geist", url: "/fonts/ui/geist/Geist-Variable-latin.woff2" },
  { family: "Geist Mono", url: "/fonts/ui/geist-mono/GeistMono-Variable-latin.woff2" },
];
