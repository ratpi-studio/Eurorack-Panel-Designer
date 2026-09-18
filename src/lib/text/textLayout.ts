import type { LabelElement, LabelElementProperties } from "@lib/panelTypes";
import { elementPointToPanel, type SurfaceRing } from "@lib/panelSurface";
import { PT_TO_MM } from "@lib/units";

import {
  getLoadedTextFont,
  type GlyphCommand,
  type TextFont,
  type TextGlyph,
} from "./textFontLoader";
import { getTextFontInfo } from "./textFonts";

export interface TextBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type Point = [number, number];

/** A glyph outline with its curves flattened, in font units (y up). */
interface GlyphContours {
  rings: Point[][];
  bounds: TextBounds | null;
}

interface PositionedGlyph {
  glyph: TextGlyph;
  /** Origin of the glyph from the start of the text, in font units. */
  x: number;
}

/**
 * A label's text laid out in its own frame: millimeters, centered on the label position, y
 * pointing down, before the label's rotation. Every output draws text from this layout, so the
 * canvas, the PNG, the SVG and the STL show the same outlines.
 */
export interface LabelTextLayout {
  font: TextFont;
  /** Millimeters per font unit. */
  scale: number;
  glyphs: readonly PositionedGlyph[];
  /** Left end of the text: the text is centered on the label position. */
  originXMm: number;
  /** Baseline, half the cap height below the label position, which centers capitals. */
  baselineYMm: number;
  /** Bounds of the drawn glyphs; null when the text draws nothing. */
  inkBounds: TextBounds | null;
  /** Selection frame, centered on the label position. */
  frameSizeMm: { widthMm: number; heightMm: number };
  /** Characters the font has no glyph for: they are left out. */
  missingCharacters: string[];
  /** Outline as SVG path data, to fill with the nonzero rule. */
  pathData: string;
}

type LabelTextInput = Pick<LabelElementProperties, "text" | "fontSizePt" | "fontId">;

/** Largest distance between a flattened curve and the real one, as a fraction of the em. */
const FLATTEN_TOLERANCE_EM = 0.001;
const MAX_CURVE_SEGMENTS = 32;
const LAYOUT_CACHE_SIZE = 256;

const glyphContourCache = new WeakMap<TextGlyph, GlyphContours>();
// Layouts of the labels on the canvas are read on every frame; Map order is least-recently-used.
const layoutCache = new Map<string, LabelTextLayout>();

function distance(x: number, y: number): number {
  return Math.hypot(x, y);
}

function segmentCount(curvature: number, factor: number, tolerance: number): number {
  // The chord of a curve piece spanning 1/n of t strays at most `factor × curvature / n²`.
  const count = Math.ceil(Math.sqrt((factor * curvature) / tolerance));
  return Math.min(Math.max(count, 1), MAX_CURVE_SEGMENTS);
}

function flattenGlyph(glyph: TextGlyph, tolerance: number): Point[][] {
  const rings: Point[][] = [];
  let ring: Point[] = [];
  let current: Point = [0, 0];

  const closeRing = () => {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (ring.length > 1 && first[0] === last[0] && first[1] === last[1]) {
      ring.pop();
    }
    if (ring.length >= 3) {
      rings.push(ring);
    }
    ring = [];
  };
  const addPoint = (point: Point) => {
    const last = ring[ring.length - 1];
    if (!last) {
      ring.push(current, point);
    } else if (last[0] !== point[0] || last[1] !== point[1]) {
      ring.push(point);
    }
    current = point;
  };

  for (const command of glyph.commands as GlyphCommand[]) {
    switch (command.type) {
      case "M":
        closeRing();
        current = [command.x, command.y];
        ring = [current];
        break;
      case "L":
        addPoint([command.x, command.y]);
        break;
      case "Q": {
        const [x0, y0] = current;
        const count = segmentCount(
          distance(x0 - 2 * command.x1 + command.x, y0 - 2 * command.y1 + command.y),
          1 / 4,
          tolerance,
        );
        for (let step = 1; step <= count; step += 1) {
          const t = step / count;
          const u = 1 - t;
          addPoint([
            u * u * x0 + 2 * u * t * command.x1 + t * t * command.x,
            u * u * y0 + 2 * u * t * command.y1 + t * t * command.y,
          ]);
        }
        break;
      }
      case "C": {
        const [x0, y0] = current;
        const count = segmentCount(
          Math.max(
            distance(x0 - 2 * command.x1 + command.x2, y0 - 2 * command.y1 + command.y2),
            distance(
              command.x1 - 2 * command.x2 + command.x,
              command.y1 - 2 * command.y2 + command.y,
            ),
          ),
          3 / 4,
          tolerance,
        );
        for (let step = 1; step <= count; step += 1) {
          const t = step / count;
          const u = 1 - t;
          addPoint([
            u * u * u * x0 +
              3 * u * u * t * command.x1 +
              3 * u * t * t * command.x2 +
              t ** 3 * command.x,
            u * u * u * y0 +
              3 * u * u * t * command.y1 +
              3 * u * t * t * command.y2 +
              t ** 3 * command.y,
          ]);
        }
        break;
      }
      case "Z":
        closeRing();
        break;
    }
  }
  closeRing();
  return rings;
}

function measurePoints(rings: Point[][]): TextBounds | null {
  let bounds: TextBounds | null = null;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      bounds = bounds
        ? {
            minX: Math.min(bounds.minX, x),
            minY: Math.min(bounds.minY, y),
            maxX: Math.max(bounds.maxX, x),
            maxY: Math.max(bounds.maxY, y),
          }
        : { minX: x, minY: y, maxX: x, maxY: y };
    }
  }
  return bounds;
}

/** Contours of a glyph with flattened curves, cached per glyph. */
export function getGlyphContours(glyph: TextGlyph, unitsPerEm: number): GlyphContours {
  const cached = glyphContourCache.get(glyph);
  if (cached) {
    return cached;
  }
  const rings = flattenGlyph(glyph, unitsPerEm * FLATTEN_TOLERANCE_EM);
  const contours = { rings, bounds: measurePoints(rings) };
  glyphContourCache.set(glyph, contours);
  return contours;
}

function formatCoordinate(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  return rounded === 0 ? "0" : String(rounded);
}

function buildPathData(
  glyphs: readonly PositionedGlyph[],
  originXMm: number,
  baselineYMm: number,
  scale: number,
): string {
  const parts: string[] = [];
  for (const { glyph, x } of glyphs) {
    const offsetXMm = originXMm + x * scale;
    const px = (value: number) => formatCoordinate(offsetXMm + value * scale);
    const py = (value: number) => formatCoordinate(baselineYMm - value * scale);
    for (const command of glyph.commands) {
      switch (command.type) {
        case "M":
        case "L":
          parts.push(`${command.type}${px(command.x)} ${py(command.y)}`);
          break;
        case "Q":
          parts.push(`Q${px(command.x1)} ${py(command.y1)} ${px(command.x)} ${py(command.y)}`);
          break;
        case "C":
          parts.push(
            `C${px(command.x1)} ${py(command.y1)} ${px(command.x2)} ${py(command.y2)} ${px(command.x)} ${py(command.y)}`,
          );
          break;
        case "Z":
          parts.push("Z");
          break;
      }
    }
  }
  return parts.join("");
}

/** Lays out one line of text, centered on the origin. Missing characters are left out. */
export function layoutLabelText(font: TextFont, text: string, fontSizePt: number): LabelTextLayout {
  const emMm = Math.max(fontSizePt, 0) * PT_TO_MM;
  const scale = emMm / font.unitsPerEm;
  const glyphs: PositionedGlyph[] = [];
  const missing = new Set<string>();
  let pen = 0;
  let previous: TextGlyph | null = null;

  for (const char of text) {
    if (/[\s\p{Cc}]/u.test(char)) {
      pen += font.spaceAdvance;
      previous = null;
      continue;
    }
    const glyph = font.glyphForChar(char);
    if (!glyph) {
      missing.add(char);
      previous = null;
      continue;
    }
    if (previous) {
      pen += font.kerning(previous, glyph);
    }
    // Text sized 0 draws nothing, and must not leave degenerate outlines behind.
    if (emMm > 0) {
      glyphs.push({ glyph, x: pen });
    }
    pen += glyph.advanceWidth;
    previous = glyph;
  }

  const originXMm = (-pen / 2) * scale;
  const baselineYMm = (font.capHeight / 2) * scale;
  let inkBounds: TextBounds | null = null;
  for (const { glyph, x } of glyphs) {
    const bounds = getGlyphContours(glyph, font.unitsPerEm).bounds;
    if (!bounds) {
      continue;
    }
    const glyphBounds = {
      minX: originXMm + (x + bounds.minX) * scale,
      maxX: originXMm + (x + bounds.maxX) * scale,
      minY: baselineYMm - bounds.maxY * scale,
      maxY: baselineYMm - bounds.minY * scale,
    };
    inkBounds = inkBounds
      ? {
          minX: Math.min(inkBounds.minX, glyphBounds.minX),
          minY: Math.min(inkBounds.minY, glyphBounds.minY),
          maxX: Math.max(inkBounds.maxX, glyphBounds.maxX),
          maxY: Math.max(inkBounds.maxY, glyphBounds.maxY),
        }
      : glyphBounds;
  }

  // The frame stays centered on the label position, like every element frame.
  const halfWidthMm = Math.max(
    (pen * scale) / 2,
    inkBounds ? Math.max(-inkBounds.minX, inkBounds.maxX) : 0,
    emMm / 4,
  );
  const halfHeightMm = Math.max(
    baselineYMm,
    inkBounds ? Math.max(-inkBounds.minY, inkBounds.maxY) : 0,
  );

  return {
    font,
    scale,
    glyphs,
    originXMm,
    baselineYMm,
    inkBounds,
    frameSizeMm: { widthMm: halfWidthMm * 2, heightMm: halfHeightMm * 2 },
    missingCharacters: [...missing],
    pathData: buildPathData(glyphs, originXMm, baselineYMm, scale),
  };
}

/** Layout of a label's text, or null until its font has loaded (see `loadTextFonts`). */
export function getLabelTextLayout(properties: LabelTextInput): LabelTextLayout | null {
  const font = getLoadedTextFont(properties.fontId);
  if (!font) {
    return null;
  }
  const key = `${properties.fontId}\u0000${properties.fontSizePt}\u0000${properties.text}`;
  const cached = layoutCache.get(key);
  if (cached && cached.font === font) {
    layoutCache.delete(key);
    layoutCache.set(key, cached);
    return cached;
  }
  const layout = layoutLabelText(font, properties.text ?? "", properties.fontSizePt);
  layoutCache.set(key, layout);
  if (layoutCache.size > LAYOUT_CACHE_SIZE) {
    const oldestKey = layoutCache.keys().next().value;
    if (oldestKey !== undefined) {
      layoutCache.delete(oldestKey);
    }
  }
  return layout;
}

/** Maps a point of the label frame (mm) to panel coordinates, turned with the label. */
export function labelPointToPanel(element: LabelElement, x: number, y: number): Point {
  const point = elementPointToPanel({ x, y }, element.positionMm, element.rotationDeg ?? 0);
  return [point.x, point.y];
}

/**
 * The zone a knocked-out text clears in the SVG patterns: the bounds of its glyphs grown by the
 * padding, turned with the label. Null when the text merges with the patterns or draws nothing.
 */
export function getLabelKnockoutRing(
  element: LabelElement,
  layout: LabelTextLayout | null = getLabelTextLayout(element.properties),
): SurfaceRing | null {
  if (element.properties.patternOverlap !== "knockout" || !layout?.inkBounds) {
    return null;
  }
  const padding = Math.max(0, element.properties.knockoutPaddingMm);
  const minX = layout.inkBounds.minX - padding;
  const minY = layout.inkBounds.minY - padding;
  const maxX = layout.inkBounds.maxX + padding;
  const maxY = layout.inkBounds.maxY + padding;
  return [
    labelPointToPanel(element, minX, minY),
    labelPointToPanel(element, maxX, minY),
    labelPointToPanel(element, maxX, maxY),
    labelPointToPanel(element, minX, maxY),
  ];
}

/** Below this size, text is hard to print whatever the font. */
export const MIN_PRINTABLE_TEXT_SIZE_PT = 6;
/** Strokes thinner than a common 0.4 mm nozzle may not print. */
export const MIN_PRINTABLE_STROKE_MM = 0.4;

interface TextPrintability {
  /** Approximate width of the main strokes, in mm. */
  strokeMm: number;
  /** Under `MIN_PRINTABLE_TEXT_SIZE_PT`. */
  tooSmall: boolean;
  /** Strokes under `MIN_PRINTABLE_STROKE_MM`. */
  thinStrokes: boolean;
  /** Characters left out because the font has no glyph for them (once the font has loaded). */
  missingCharacters: string[];
}

/** A rough check of whether a text will print legibly, from its size and its font's weight. */
export function assessTextPrintability(properties: LabelTextInput): TextPrintability {
  const strokeMm = getTextFontInfo(properties.fontId).stemEm * properties.fontSizePt * PT_TO_MM;
  return {
    strokeMm,
    tooSmall: properties.fontSizePt < MIN_PRINTABLE_TEXT_SIZE_PT,
    thinStrokes: strokeMm < MIN_PRINTABLE_STROKE_MM,
    missingCharacters: getLabelTextLayout(properties)?.missingCharacters ?? [],
  };
}
