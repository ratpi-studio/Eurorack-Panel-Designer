import polygonClipping from "polygon-clipping";
import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

import { reportDegradation } from "@lib/monitoring";
import {
  PanelElementType,
  isLabelElement,
  type InsertElementProperties,
  type MountingHole,
  type PanelElement,
  type PanelModel,
  type SvgArtworkElementProperties,
  type SvgViewBox,
} from "@lib/panelTypes";
import {
  buildPanelSurfaceMultiPolygon,
  circleRing,
  type SurfaceMultiPolygon,
  type SurfacePolygon,
  type SurfaceRing,
} from "@lib/panelSurface";
import { strokeOutline } from "@lib/strokeOutline";
import { buildSvgArtworkMaskMarkup, isBlackSvgPaint, isSvgArtworkElement } from "@lib/svgArtwork";
import { expandSvgPatterns } from "@lib/svgPatternExpand";
import { getLabelKnockoutRing, getLabelTextLayout } from "@lib/text/textLayout";
import { placeLabelTextPolygons } from "@lib/text/textPolygons";

interface BuildPanelStlOptions {
  thicknessMm: number;
}

/** Material group of the panel itself, inserts included. */
export const PANEL_BODY_MATERIAL_INDEX = 0;
/** Material group of the design relief (SVG patterns and texts), shown in the design color. */
export const PANEL_RELIEF_MATERIAL_INDEX = 1;

export interface BuildPanelStlResult {
  stl: string;
  warnings: string[];
}

function clampInsertProperties(properties: InsertElementProperties, panelThicknessMm: number) {
  const outerDepthMm = Math.max(properties.outerDepthMm, 0);
  const innerDepthMm = Math.min(Math.max(properties.innerDepthMm, 0), outerDepthMm);
  const embedDepthMm = Math.min(
    Math.max(properties.embedDepthMm, 0),
    Math.min(panelThicknessMm, outerDepthMm || panelThicknessMm),
  );
  const outerRadius = Math.max(properties.outerDiameterMm / 2, 0);
  const innerRadius = Math.min(Math.max(properties.innerDiameterMm / 2, 0), outerRadius);

  return {
    outerDepthMm,
    innerDepthMm,
    embedDepthMm,
    outerRadius,
    innerRadius,
  };
}

function extrudeShapeBetween(shape: Shape, fromZ: number, toZ: number): BufferGeometry {
  const geometry = new ExtrudeGeometry(shape, {
    depth: toZ - fromZ,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, fromZ);
  return geometry;
}

function buildInsertGeometry(
  element: PanelElement & { type: PanelElementType.Insert; properties: InsertElementProperties },
  panelThicknessMm: number,
): BufferGeometry | null {
  const { outerDepthMm, innerDepthMm, embedDepthMm, outerRadius, innerRadius } =
    clampInsertProperties(element.properties, panelThicknessMm);

  // Inserts stand on the back of the panel (z = 0), opposite the SVG relief, sunk into it by the
  // embed depth. That sunk part is panel material already: only what sticks out behind the panel
  // is built, so an insert never fills a cut-out next to it. The hole starts on the panel side.
  const farEndZ = embedDepthMm - outerDepthMm;
  if (farEndZ >= 0 || outerRadius <= 0) {
    return null;
  }
  const holeBottomZ = innerRadius > 0 ? Math.max(embedDepthMm - innerDepthMm, farEndZ) : 0;
  const outerRing = circleRing(element.positionMm, outerRadius);
  const geometries: BufferGeometry[] = [];

  if (holeBottomZ < 0) {
    const tube = ringToShape(outerRing);
    const hole = ringToPath(circleRing(element.positionMm, innerRadius));
    if (tube && hole) {
      tube.holes.push(hole);
      geometries.push(extrudeShapeBetween(tube, holeBottomZ, 0));
    }
  }

  const solidTopZ = Math.min(holeBottomZ, 0);
  const plug = ringToShape(outerRing);
  if (plug && solidTopZ > farEndZ) {
    geometries.push(extrudeShapeBetween(plug, farEndZ, solidTopZ));
  }

  if (geometries.length < 2) {
    return geometries[0] ?? null;
  }
  return mergeGeometries(geometries) ?? null;
}

function closeRing(ring: SurfaceRing): SurfaceRing {
  if (ring.length < 2) {
    return ring;
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring;
  }
  return [...ring, first];
}

/** Maps SVG user units of the artwork to panel millimeters, turning it like the canvas does. */
function createSvgArtworkTransform(
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
  viewBox: SvgViewBox,
): (point: [number, number]) => [number, number] {
  const { properties } = element;
  const rotation = ((element.rotationDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return ([x, y]) => {
    const localX = ((x - viewBox.minX) / viewBox.width - 0.5) * properties.widthMm;
    const localY = ((y - viewBox.minY) / viewBox.height - 0.5) * properties.heightMm;
    return [
      element.positionMm.x + localX * cos - localY * sin,
      element.positionMm.y + localX * sin + localY * cos,
    ];
  };
}

function shapeToPolygon(shape: Shape): SurfacePolygon | null {
  const extracted = shape.extractPoints(20);
  const outer = closeRing(extracted.shape.map((point): [number, number] => [point.x, point.y]));
  if (outer.length < 4) {
    return null;
  }
  const holes = extracted.holes
    .map((hole) => closeRing(hole.map((point): [number, number] => [point.x, point.y])))
    .filter((ring) => ring.length >= 4);
  return [outer, ...holes];
}

interface StrokeStyleLike {
  stroke?: string;
  strokeWidth?: string | number;
  strokeLineJoin?: string;
  strokeLineCap?: string;
  strokeMiterLimit?: string | number;
}

function strokePathToPolygons(
  shapePath: ReturnType<SVGLoader["parse"]>["paths"][number],
): SurfaceMultiPolygon {
  const style = (shapePath.userData?.style ?? {}) as StrokeStyleLike;
  if (!style.stroke || style.stroke === "none") {
    return [];
  }
  const strokeWidth = Number(style.strokeWidth);
  if (!Number.isFinite(strokeWidth) || strokeWidth <= 0) {
    return [];
  }
  const miterLimit = Number(style.strokeMiterLimit);
  const polygons: SurfaceMultiPolygon = [];
  for (const subPath of shapePath.subPaths) {
    const ring = strokeOutline(
      subPath.getPoints(20).map((point): [number, number] => [point.x, point.y]),
      {
        width: strokeWidth,
        lineJoin: style.strokeLineJoin,
        lineCap: style.strokeLineCap,
        miterLimit: Number.isFinite(miterLimit) && miterLimit >= 1 ? miterLimit : undefined,
      },
    );
    if (ring && ring.length >= 3) {
      polygons.push([ring]);
    }
  }
  return polygons;
}

function parseSvgNumber(value: string | undefined, fallback = 0): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSvgAttributes(markup: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  markup.replace(
    /([a-zA-Z_:][\w:.-]*)\s*=\s*(['"])(.*?)\2/g,
    (_match, name: string, _quote: string, value: string) => {
      attributes[name] = value;
      return "";
    },
  );
  return attributes;
}

function parseSvgStyleAttribute(value: string | undefined): Record<string, string> {
  if (!value) {
    return {};
  }
  return value.split(";").reduce<Record<string, string>>((acc, declaration) => {
    const [rawProperty, ...rawValue] = declaration.split(":");
    const property = rawProperty?.trim().toLowerCase();
    const declarationValue = rawValue.join(":").trim();
    if (property && declarationValue) {
      acc[property] = declarationValue;
    }
    return acc;
  }, {});
}

function hasSvgArtworkPaint(rawAttributes: string): boolean {
  const attributes = parseSvgAttributes(rawAttributes);
  const style = parseSvgStyleAttribute(attributes.style);
  const fill = style.fill ?? attributes.fill;
  const stroke = style.stroke ?? attributes.stroke;
  if (fill === undefined && stroke === undefined) {
    return true;
  }
  return isBlackSvgPaint(fill) || isBlackSvgPaint(stroke);
}

function parsePointsAttribute(value: string | undefined): Array<{ x: number; y: number }> {
  if (!value) {
    return [];
  }
  const numbers = value
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number.parseFloat(part))
    .filter((part) => Number.isFinite(part));
  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < numbers.length - 1; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] });
  }
  return points;
}

function parseViewBox(svgText: string): SvgViewBox {
  const match = svgText.match(/\bviewBox\s*=\s*(['"])(.*?)\1/i);
  if (!match) {
    return { minX: 0, minY: 0, width: 100, height: 100 };
  }
  const parts = match[2]
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number.parseFloat(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return { minX: 0, minY: 0, width: 100, height: 100 };
  }
  return {
    minX: parts[0],
    minY: parts[1],
    width: Math.max(parts[2], 1),
    height: Math.max(parts[3], 1),
  };
}

/** Rect and polygon shapes, for environments without an SVG parser. */
function fallbackSvgArtworkPolygons(svgText: string): SurfaceMultiPolygon {
  const polygons: SurfacePolygon[] = [];

  svgText.replace(/<rect\b([^>]*)\/?>/gi, (_match, rawAttributes: string) => {
    if (!hasSvgArtworkPaint(rawAttributes)) {
      return "";
    }
    const attributes = parseSvgAttributes(rawAttributes);
    const x = parseSvgNumber(attributes.x);
    const y = parseSvgNumber(attributes.y);
    const width = parseSvgNumber(attributes.width);
    const height = parseSvgNumber(attributes.height);
    if (width <= 0 || height <= 0) {
      return "";
    }
    polygons.push([
      closeRing([
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
      ]),
    ]);
    return "";
  });

  svgText.replace(
    /<(polygon|polyline)\b([^>]*)\/?>/gi,
    (_match, tagName: string, rawAttributes: string) => {
      if (tagName.toLowerCase() !== "polygon") {
        return "";
      }
      if (!hasSvgArtworkPaint(rawAttributes)) {
        return "";
      }
      const attributes = parseSvgAttributes(rawAttributes);
      const ring = closeRing(
        parsePointsAttribute(attributes.points).map((point): [number, number] => [
          point.x,
          point.y,
        ]),
      );
      if (ring.length >= 4) {
        polygons.push([ring]);
      }
      return "";
    },
  );

  return polygons;
}

/**
 * Unions polygons. polygon-clipping throws on some nearly degenerate inputs: each half is then
 * unioned on its own, and the halves are kept side by side, overlapping where they meet.
 */
function unionPolygons(polygons: SurfaceMultiPolygon): SurfaceMultiPolygon {
  if (!polygons.length) {
    return polygons;
  }
  try {
    return polygonClipping.union(polygons as polygonClipping.MultiPolygon) as SurfaceMultiPolygon;
  } catch (error) {
    reportDegradation(error, "stl-geometry", "surface-union");
    if (polygons.length === 1) {
      return polygons;
    }
    const middle = Math.ceil(polygons.length / 2);
    return [...unionPolygons(polygons.slice(0, middle)), ...unionPolygons(polygons.slice(middle))];
  }
}

interface SvgArtworkOutline {
  /** Black areas of the artwork, in SVG user units. */
  polygons: SurfaceMultiPolygon;
  /** View box that maps the polygons onto the element, when it is not the element's own. */
  viewBox?: SvgViewBox;
}

/**
 * Black areas of the artwork, unioned in SVG user units: strokes that meet or overlap there line
 * up exactly, which scaling and turning them to panel millimeters would break.
 */
function traceSvgArtwork(svgText: string): SvgArtworkOutline {
  const maskedSvgText = buildSvgArtworkMaskMarkup(svgText, "#000000");
  const expandedSvgText = expandSvgPatterns(maskedSvgText);
  if (typeof DOMParser !== "undefined") {
    try {
      const loader = new SVGLoader();
      const data = loader.parse(expandedSvgText);
      const polygons: SurfaceMultiPolygon = [];
      for (const path of data.paths) {
        const fillStyle = (path.userData?.style ?? {}) as { fill?: string };
        if (fillStyle.fill && fillStyle.fill !== "none") {
          for (const shape of SVGLoader.createShapes(path)) {
            const polygon = shapeToPolygon(shape);
            if (polygon) {
              polygons.push(polygon);
            }
          }
        }
        polygons.push(...strokePathToPolygons(path));
      }
      if (polygons.length) {
        return { polygons: unionPolygons(polygons) };
      }
    } catch {
      // Fall through to the small parser for simple SVGs.
    }
  }

  return {
    polygons: unionPolygons(fallbackSvgArtworkPolygons(expandedSvgText)),
    viewBox: parseViewBox(expandedSvgText),
  };
}

const ARTWORK_CACHE_SIZE = 16;
// Tracing is the slowest step, and the live 3D view rebuilds the model on every edit. The outline
// does not depend on where the artwork sits, so it is cached by markup; Map order doubles as
// least-recently-used order.
const artworkOutlineCache = new Map<string, SvgArtworkOutline>();

function getSvgArtworkOutline(svgText: string): SvgArtworkOutline {
  const cached = artworkOutlineCache.get(svgText);
  if (cached) {
    artworkOutlineCache.delete(svgText);
    artworkOutlineCache.set(svgText, cached);
    return cached;
  }
  const outline = traceSvgArtwork(svgText);
  artworkOutlineCache.set(svgText, outline);
  if (artworkOutlineCache.size > ARTWORK_CACHE_SIZE) {
    const oldestKey = artworkOutlineCache.keys().next().value;
    if (oldestKey !== undefined) {
      artworkOutlineCache.delete(oldestKey);
    }
  }
  return outline;
}

function placeSvgArtwork(
  outline: SvgArtworkOutline,
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
): SurfaceMultiPolygon {
  const toPanel = createSvgArtworkTransform(element, outline.viewBox ?? element.properties.viewBox);
  return outline.polygons.map((polygon) => polygon.map((ring) => ring.map(toPanel)));
}

/**
 * Keeps the parts of the artwork over the panel surface. When polygon-clipping fails on the whole
 * artwork, each polygon is clipped on its own, and only the ones that still fail are dropped.
 */
function clipToPanelSurface(
  artwork: SurfaceMultiPolygon,
  panelSurface: SurfaceMultiPolygon,
): { polygons: SurfaceMultiPolygon; complete: boolean } {
  try {
    return {
      polygons: polygonClipping.intersection(
        artwork as polygonClipping.MultiPolygon,
        panelSurface as polygonClipping.MultiPolygon,
      ) as SurfaceMultiPolygon,
      complete: true,
    };
  } catch (error) {
    reportDegradation(error, "stl-geometry", "artwork-clip");
  }

  const polygons: SurfaceMultiPolygon = [];
  let complete = true;
  for (const polygon of artwork) {
    try {
      polygons.push(
        ...(polygonClipping.intersection(
          [polygon] as polygonClipping.MultiPolygon,
          panelSurface as polygonClipping.MultiPolygon,
        ) as SurfaceMultiPolygon),
      );
    } catch (error) {
      reportDegradation(error, "stl-geometry", "artwork-clip-polygon");
      complete = false;
    }
  }
  return { polygons, complete };
}

function ringToShape(ring: SurfaceRing): Shape | null {
  if (ring.length < 3) {
    return null;
  }
  const shape = new Shape();
  shape.moveTo(ring[0][0], ring[0][1]);
  for (let index = 1; index < ring.length; index += 1) {
    shape.lineTo(ring[index][0], ring[index][1]);
  }
  return shape;
}

function ringToPath(ring: SurfaceRing): Path | null {
  if (ring.length < 3) {
    return null;
  }
  const path = new Path();
  path.moveTo(ring[0][0], ring[0][1]);
  for (let index = 1; index < ring.length; index += 1) {
    path.lineTo(ring[index][0], ring[index][1]);
  }
  return path;
}

function extrudePolygons(
  polygons: SurfaceMultiPolygon,
  baseZ: number,
  depth: number,
): BufferGeometry[] {
  if (depth <= 0) {
    return [];
  }

  const geometries: BufferGeometry[] = [];
  for (const polygon of polygons) {
    const [outer, ...holes] = polygon;
    if (!outer) {
      continue;
    }
    const shape = ringToShape(outer);
    if (!shape) {
      continue;
    }
    for (const hole of holes) {
      const path = ringToPath(hole);
      if (path) {
        shape.holes.push(path);
      }
    }
    const geometry = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, baseZ);
    geometries.push(geometry);
  }
  return geometries;
}

/** A pattern or a text of the design layer, named in warnings. */
interface DesignItem {
  name: string;
  polygons: SurfaceMultiPolygon;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function measureRing(ring: SurfaceRing): Bounds {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const [x, y] of ring) {
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
  }
  return bounds;
}

function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
}

/**
 * Removes the zones of knocked-out texts from a pattern. Only the polygons near a zone go through
 * polygon-clipping: large patterns stay fast to rebuild in the live 3D view.
 */
function knockOutPattern(
  pattern: DesignItem,
  zones: Array<{ ring: SurfaceRing; bounds: Bounds }>,
  warnings: string[],
): SurfaceMultiPolygon {
  const near: SurfacePolygon[] = [];
  const apart: SurfacePolygon[] = [];
  for (const polygon of pattern.polygons) {
    const bounds = measureRing(polygon[0] ?? []);
    (zones.some((zone) => boundsOverlap(bounds, zone.bounds)) ? near : apart).push(polygon);
  }
  if (!near.length) {
    return pattern.polygons;
  }
  try {
    const cleared = polygonClipping.difference(
      near as polygonClipping.MultiPolygon,
      ...zones.map((zone): polygonClipping.Polygon => [zone.ring]),
    ) as SurfaceMultiPolygon;
    return [...apart, ...cleared];
  } catch (error) {
    reportDegradation(error, "stl-geometry", "text-knockout");
    // The pattern still covers the texts: say so instead of exporting it silently.
    warnings.push(pattern.name);
    return pattern.polygons;
  }
}

/**
 * Merges the design into one layer clipped to the panel surface. polygon-clipping takes overlapping
 * polygons as their union, so one intersection merges texts with the patterns they overlap. When
 * it fails, each item is clipped on its own and overlapping items stay side by side.
 */
function clipDesignLayer(
  items: DesignItem[],
  panelSurface: SurfaceMultiPolygon,
  warnings: string[],
): SurfaceMultiPolygon {
  if (!items.length) {
    return [];
  }
  try {
    return polygonClipping.intersection(
      items.flatMap((item) => item.polygons) as polygonClipping.MultiPolygon,
      panelSurface as polygonClipping.MultiPolygon,
    ) as SurfaceMultiPolygon;
  } catch (error) {
    reportDegradation(error, "stl-geometry", "design-layer");
  }
  return items.flatMap((item) => {
    const { polygons, complete } = clipToPanelSurface(item.polygons, panelSurface);
    if (!complete) {
      // Part of the relief is missing: say so instead of exporting it silently.
      warnings.push(item.name);
    }
    return polygons;
  });
}

/**
 * What prints in relief, in the design color: the SVG patterns minus the zones of knocked-out
 * texts, and the texts, merged and clipped to the panel surface. Patterns and texts that end up
 * missing or incomplete are named in `warnings`. Texts need their font loaded (`loadTextFonts`).
 */
export function buildDesignLayerPolygons(
  model: PanelModel,
  panelSurface: SurfaceMultiPolygon,
  warnings: string[] = [],
): SurfaceMultiPolygon {
  const patterns: DesignItem[] = [];
  const texts: DesignItem[] = [];
  const knockouts: Array<{ ring: SurfaceRing; bounds: Bounds }> = [];

  for (const element of model.elements) {
    if (isSvgArtworkElement(element)) {
      const name = element.properties.sourceName || element.id;
      const outline = getSvgArtworkOutline(element.properties.svgText);
      if (!outline.polygons.length) {
        warnings.push(name);
        continue;
      }
      patterns.push({ name, polygons: placeSvgArtwork(outline, element) });
      continue;
    }
    if (!isLabelElement(element) || !element.properties.text.trim()) {
      continue;
    }
    const name = element.properties.text.trim();
    const layout = getLabelTextLayout(element.properties);
    if (!layout) {
      // Its font did not load.
      warnings.push(name);
      continue;
    }
    texts.push({ name, polygons: placeLabelTextPolygons(element, layout) });
    const knockout = getLabelKnockoutRing(element, layout);
    if (knockout) {
      knockouts.push({ ring: knockout, bounds: measureRing(knockout) });
    }
  }

  if (knockouts.length) {
    for (const pattern of patterns) {
      pattern.polygons = knockOutPattern(pattern, knockouts, warnings);
    }
  }
  return clipDesignLayer(
    [...patterns, ...texts].filter((item) => item.polygons.length),
    panelSurface,
    warnings,
  );
}

/** Extrudes the design layer between its base, sunk into the panel front, and its top. */
function buildDesignReliefGeometry(
  model: PanelModel,
  panelSurface: SurfaceMultiPolygon,
  panelThicknessMm: number,
  warnings: string[],
): BufferGeometry[] {
  const reliefThickness = Math.max(model.designRelief.thicknessMm, 0);
  if (reliefThickness <= 0) {
    return [];
  }
  const penetration = Math.min(
    Math.max(model.designRelief.penetrationMm, 0),
    panelThicknessMm,
    reliefThickness,
  );
  return extrudePolygons(
    buildDesignLayerPolygons(model, panelSurface, warnings),
    panelThicknessMm - penetration,
    reliefThickness,
  );
}

/**
 * The panel minus its cut-outs, with overlapping cut-outs merged into one opening: extruding them
 * one by one would leave the walls of each cut-out standing inside the others.
 */
function buildPanelSurface(model: PanelModel, mountingHoles: MountingHole[]): SurfaceMultiPolygon {
  const surface = buildPanelSurfaceMultiPolygon({
    panelSizeMm: {
      x: model.dimensions.widthMm,
      y: model.dimensions.heightMm,
    },
    mountingHoles,
    elements: model.elements,
  });
  try {
    return polygonClipping.union(surface as polygonClipping.MultiPolygon) as SurfaceMultiPolygon;
  } catch (error) {
    reportDegradation(error, "stl-geometry", "panel-surface");
    return surface;
  }
}

function countDrawnVertices(geometries: BufferGeometry[]): number {
  return geometries.reduce(
    (count, geometry) => count + (geometry.index?.count ?? geometry.getAttribute("position").count),
    0,
  );
}

function reverseTriangleWinding(geometry: BufferGeometry): void {
  const index = geometry.index;
  if (index) {
    for (let first = 0; first + 2 < index.count; first += 3) {
      const second = index.getX(first + 1);
      index.setX(first + 1, index.getX(first + 2));
      index.setX(first + 2, second);
    }
    index.needsUpdate = true;
    return;
  }

  for (const attribute of Object.values(geometry.attributes)) {
    for (let first = 0; first + 2 < attribute.count; first += 3) {
      for (let component = 0; component < attribute.itemSize; component += 1) {
        const second = attribute.getComponent(first + 1, component);
        attribute.setComponent(first + 1, component, attribute.getComponent(first + 2, component));
        attribute.setComponent(first + 2, component, second);
      }
    }
    attribute.needsUpdate = true;
  }
}

export function createPanelExtrusion(
  model: PanelModel,
  mountingHoles: MountingHole[],
  thicknessMm: number,
  warnings: string[] = [],
): BufferGeometry {
  if (!Number.isFinite(thicknessMm) || thicknessMm <= 0) {
    throw new Error("Panel thickness must be a positive number.");
  }

  const panelSurface = buildPanelSurface(model, mountingHoles);
  const bodyGeometries = extrudePolygons(panelSurface, 0, thicknessMm);

  for (const element of model.elements) {
    if (element.type === PanelElementType.Insert) {
      const insertGeometry = buildInsertGeometry(
        element as PanelElement & {
          type: PanelElementType.Insert;
          properties: InsertElementProperties;
        },
        thicknessMm,
      );
      if (insertGeometry) {
        bodyGeometries.push(insertGeometry);
      }
    }
  }

  const reliefGeometries = buildDesignReliefGeometry(model, panelSurface, thicknessMm, warnings);

  const geometries = [...bodyGeometries, ...reliefGeometries];
  const merged =
    (geometries.length === 1 ? geometries[0] : mergeGeometries(geometries)) ??
    // Nothing left to build, e.g. a cut-out covering the whole panel.
    new BufferGeometry().setAttribute("position", new Float32BufferAttribute([], 3));

  // Flip Y so the exported model matches the on-canvas orientation (origin top-left).
  merged.scale(1, -1, 1);
  merged.translate(0, model.dimensions.heightMm, 0);
  // The mirror turned the triangles inside out: restore outward-facing winding and normals.
  reverseTriangleWinding(merged);
  merged.computeVertexNormals();

  // Body first, relief last: two groups let the 3D view color the relief separately.
  const totalCount = countDrawnVertices([merged]);
  const bodyCount = Math.min(countDrawnVertices(bodyGeometries), totalCount);
  merged.clearGroups();
  merged.addGroup(0, bodyCount, PANEL_BODY_MATERIAL_INDEX);
  if (totalCount > bodyCount) {
    merged.addGroup(bodyCount, totalCount - bodyCount, PANEL_RELIEF_MATERIAL_INDEX);
  }

  return merged;
}

function geometryToStlString(geometry: BufferGeometry): string {
  const mesh = new Mesh(
    geometry,
    // Material is not used for STL export; keep a tiny default.
    new MeshStandardMaterial(),
  );

  const exporter = new STLExporter();
  const result = exporter.parse(mesh, { binary: false });
  if (typeof result === "string") {
    return normalizeStlHeader(result);
  }

  // Fallback if exporter returns ArrayBuffer.
  const decoder = new TextDecoder();
  return normalizeStlHeader(decoder.decode(result));
}

function normalizeStlHeader(stl: string): string {
  return stl
    .replace(/^solid exported/, "solid eurorack_panel")
    .replace(/endsolid exported\s*$/, "endsolid eurorack_panel\n");
}

export function buildPanelStl(
  model: PanelModel,
  mountingHoles: MountingHole[],
  options: BuildPanelStlOptions,
): string {
  const { stl } = buildPanelStlWithWarnings(model, mountingHoles, options);
  return stl;
}

export function buildPanelStlWithWarnings(
  model: PanelModel,
  mountingHoles: MountingHole[],
  options: BuildPanelStlOptions,
): BuildPanelStlResult {
  const { thicknessMm } = options;
  const warnings: string[] = [];
  const geometry = createPanelExtrusion(model, mountingHoles, thicknessMm, warnings);
  return {
    stl: geometryToStlString(geometry),
    warnings,
  };
}
