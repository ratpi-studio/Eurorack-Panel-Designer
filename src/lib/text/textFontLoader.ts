import type {
  OpentypeFont,
  OpentypeGlyph,
  OpentypePathCommand,
} from "three/examples/jsm/libs/opentype.module.js";

import { reportDegradation } from "@lib/monitoring";

import { getTextFontInfo, type TextFontId, type TextFontInfo } from "./textFonts";

export type GlyphCommand =
  | { type: "M" | "L"; x: number; y: number }
  | { type: "Q"; x1: number; y1: number; x: number; y: number }
  | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: "Z" };

/** A glyph outline in font units, with y pointing up, filled with the nonzero rule. */
export interface TextGlyph {
  index: number;
  advanceWidth: number;
  commands: readonly GlyphCommand[];
}

/** A parsed font, reduced to what the text layout needs. */
export interface TextFont {
  info: TextFontInfo;
  unitsPerEm: number;
  capHeight: number;
  spaceAdvance: number;
  /** Null when the font has no glyph for the character. */
  glyphForChar: (char: string) => TextGlyph | null;
  /** Extra advance between two glyphs, in font units (negative brings them closer). */
  kerning: (left: TextGlyph, right: TextGlyph) => number;
}

const loadedFonts = new Map<TextFontId, TextFont>();
const pendingFonts = new Map<TextFontId, Promise<TextFont>>();
const listeners = new Set<() => void>();
let fontsVersion = 0;

function toGlyphCommand(command: OpentypePathCommand): GlyphCommand | null {
  const { x = 0, y = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = command;
  switch (command.type) {
    case "M":
    case "L":
      return { type: command.type, x, y };
    case "Q":
      return { type: "Q", x1, y1, x, y };
    case "C":
      return { type: "C", x1, y1, x2, y2, x, y };
    case "Z":
      return { type: "Z" };
    default:
      return null;
  }
}

function measureCapHeight(glyph: TextGlyph | null): number | null {
  let top = -Infinity;
  for (const command of glyph?.commands ?? []) {
    if (command.type !== "Z") {
      top = Math.max(top, command.y);
    }
  }
  return Number.isFinite(top) && top > 0 ? top : null;
}

function wrapOpentypeFont(info: TextFontInfo, font: OpentypeFont): TextFont {
  const glyphs = new Map<number, TextGlyph>();
  const getGlyph = (index: number): TextGlyph => {
    const cached = glyphs.get(index);
    if (cached) {
      return cached;
    }
    const source: OpentypeGlyph = font.glyphs.get(index);
    const glyph: TextGlyph = {
      index,
      advanceWidth: source.advanceWidth ?? 0,
      commands: source.path.commands
        .map(toGlyphCommand)
        .filter((command): command is GlyphCommand => command !== null),
    };
    glyphs.set(index, glyph);
    return glyph;
  };
  const glyphForChar = (char: string): TextGlyph | null => {
    const index = font.charToGlyphIndex(char);
    return index > 0 ? getGlyph(index) : null;
  };

  const unitsPerEm = font.unitsPerEm || 1000;
  const declaredCapHeight = font.tables.os2?.sCapHeight;
  return {
    info,
    unitsPerEm,
    capHeight:
      declaredCapHeight && declaredCapHeight > 0
        ? declaredCapHeight
        : (measureCapHeight(glyphForChar("H")) ?? unitsPerEm * 0.7),
    spaceAdvance: glyphForChar(" ")?.advanceWidth ?? unitsPerEm / 4,
    glyphForChar,
    kerning: (left, right) => {
      try {
        const value = font.getKerningValue(left.index, right.index);
        return Number.isFinite(value) ? value : 0;
      } catch {
        // Kerning tables opentype.js cannot read: keep the plain advances.
        return 0;
      }
    },
  };
}

/** Parses a font file of the curated list. opentype.js loads on first use, in its own chunk. */
export async function parseTextFont(id: TextFontId, data: ArrayBuffer): Promise<TextFont> {
  const { default: opentype } = await import("three/examples/jsm/libs/opentype.module.js");
  return wrapOpentypeFont(getTextFontInfo(id), opentype.parse(data));
}

function getPublicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${path.replace(/^\/+/, "")}`;
}

async function fetchTextFont(id: TextFontId): Promise<TextFont> {
  const info = getTextFontInfo(id);
  const response = await fetch(getPublicAssetUrl(info.file));
  if (!response.ok) {
    throw new Error(`Unable to load the ${info.familyName} font (HTTP ${response.status}).`);
  }
  return parseTextFont(id, await response.arrayBuffer());
}

/** Makes a parsed font available to the synchronous text layout, and tells subscribers. */
export function registerTextFont(font: TextFont): void {
  loadedFonts.set(font.info.id, font);
  fontsVersion += 1;
  listeners.forEach((listener) => listener());
}

export function getLoadedTextFont(id: TextFontId): TextFont | null {
  return loadedFonts.get(id) ?? null;
}

/** Fetches and parses a font once; concurrent calls share the request. */
function loadTextFont(id: TextFontId): Promise<TextFont> {
  const loaded = loadedFonts.get(id);
  if (loaded) {
    return Promise.resolve(loaded);
  }
  let pending = pendingFonts.get(id);
  if (!pending) {
    pending = fetchTextFont(id).then(
      (font) => {
        pendingFonts.delete(id);
        registerTextFont(font);
        return font;
      },
      (error: unknown) => {
        // Let a later call try again.
        pendingFonts.delete(id);
        throw error;
      },
    );
    pendingFonts.set(id, pending);
  }
  return pending;
}

/**
 * Loads fonts that are not loaded yet. Never rejects: text in a font that fails to load is left
 * out of the outputs, which say so.
 */
export async function loadTextFonts(ids: Iterable<TextFontId>): Promise<void> {
  const missing = [...new Set(ids)].filter((id) => !loadedFonts.has(id));
  const results = await Promise.allSettled(missing.map(loadTextFont));
  results.forEach((result) => {
    if (result.status === "rejected") {
      reportDegradation(result.reason, "text-font", "load");
    }
  });
}

/** Notifies `listener` whenever a font finishes loading; returns the unsubscribe function. */
export function subscribeTextFonts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Changes whenever a font finishes loading, for `useSyncExternalStore`. */
export function getTextFontsVersion(): number {
  return fontsVersion;
}
