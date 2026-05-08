import polygonClipping from "polygon-clipping";
import { BufferGeometry, ExtrudeGeometry, Mesh, MeshStandardMaterial, Path, Shape } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

import {
  PanelElementType,
  type InsertElementProperties,
  type MountingHole,
  type PanelElement,
  type PanelModel,
  type SvgArtworkElementProperties,
  type SvgViewBox,
} from "@lib/panelTypes";
import {
  buildPanelSurfaceMultiPolygon,
  type SurfaceMultiPolygon,
  type SurfacePolygon,
  type SurfaceRing,
} from "@lib/panelSurface";
import { buildSvgArtworkMaskMarkup, isBlackSvgPaint, isSvgArtworkElement } from "@lib/svgArtwork";
import { expandSvgPatterns } from "@lib/svgPatternExpand";

interface BuildPanelStlOptions {
  thicknessMm: number;
}

export interface BuildPanelStlResult {
  stl: string;
  warnings: string[];
}

interface CircularHole {
  centerX: number;
  centerY: number;
  radius: number;
}

interface RectangularHole {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OvalHole {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

interface SlotHole {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface TriangleHole {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export function getCircularHoles(model: PanelModel, mountingHoles: MountingHole[]): CircularHole[] {
  const circularHoles: CircularHole[] = mountingHoles
    .filter((hole) => hole.shape !== "slot")
    .map((hole) => ({
      centerX: hole.center.x,
      centerY: hole.center.y,
      radius: hole.diameterMm / 2,
    }));

  for (const element of model.elements) {
    switch (element.type) {
      case PanelElementType.Jack:
      case PanelElementType.Potentiometer:
      case PanelElementType.Led: {
        const props = element.properties as { diameterMm: number };
        circularHoles.push({
          centerX: element.positionMm.x,
          centerY: element.positionMm.y,
          radius: props.diameterMm / 2,
        });
        break;
      }
      case PanelElementType.Insert: {
        const props = element.properties as {
          innerDiameterMm: number;
          outerDepthMm: number;
          embedDepthMm: number;
          innerDepthMm: number;
        };
        if (props.outerDepthMm <= 0 || props.embedDepthMm <= 0 || props.innerDepthMm <= 0) {
          break;
        }
        circularHoles.push({
          centerX: element.positionMm.x,
          centerY: element.positionMm.y,
          radius: props.innerDiameterMm / 2,
        });
        break;
      }
      default:
        break;
    }
  }

  return circularHoles;
}

function getRectangularHoles(model: PanelModel): RectangularHole[] {
  const rectangularHoles: RectangularHole[] = [];

  for (const element of model.elements) {
    if (element.type !== PanelElementType.Switch && element.type !== PanelElementType.Rectangle) {
      continue;
    }
    const props = element.properties as { widthMm: number; heightMm: number };
    rectangularHoles.push({
      x: element.positionMm.x - props.widthMm / 2,
      y: element.positionMm.y - props.heightMm / 2,
      width: props.widthMm,
      height: props.heightMm,
    });
  }

  return rectangularHoles;
}

function getOvalHoles(model: PanelModel): OvalHole[] {
  const ovalHoles: OvalHole[] = [];

  for (const element of model.elements) {
    if (element.type !== PanelElementType.Oval) {
      continue;
    }
    const props = element.properties;
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      continue;
    }
    ovalHoles.push({
      centerX: element.positionMm.x,
      centerY: element.positionMm.y,
      radiusX: props.widthMm / 2,
      radiusY: props.heightMm / 2,
    });
  }

  return ovalHoles;
}

function getSlotHoles(model: PanelModel, mountingHoles: MountingHole[]): SlotHole[] {
  const slotHoles: SlotHole[] = mountingHoles
    .filter((hole) => hole.shape === "slot" && (hole.slotLengthMm ?? hole.diameterMm) > 0)
    .map((hole) => ({
      centerX: hole.center.x,
      centerY: hole.center.y,
      width: hole.slotLengthMm ?? hole.diameterMm,
      height: hole.diameterMm,
    }));

  for (const element of model.elements) {
    if (element.type !== PanelElementType.Slot) {
      continue;
    }
    const props = element.properties;
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      continue;
    }
    slotHoles.push({
      centerX: element.positionMm.x,
      centerY: element.positionMm.y,
      width: props.widthMm,
      height: props.heightMm,
    });
  }

  return slotHoles;
}

function getTriangleHoles(model: PanelModel): TriangleHole[] {
  const triangleHoles: TriangleHole[] = [];

  for (const element of model.elements) {
    if (element.type !== PanelElementType.Triangle) {
      continue;
    }
    const props = element.properties;
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      continue;
    }
    triangleHoles.push({
      centerX: element.positionMm.x,
      centerY: element.positionMm.y,
      width: props.widthMm,
      height: props.heightMm,
    });
  }

  return triangleHoles;
}

function createSlotHolePath(hole: SlotHole): Path {
  const path = new Path();
  const radius = Math.min(hole.width / 2, hole.height / 2);
  const straightHalf = Math.max(hole.width / 2 - radius, 0);
  const left = hole.centerX - straightHalf;
  const right = hole.centerX + straightHalf;
  const top = hole.centerY - radius;
  const bottom = hole.centerY + radius;

  path.moveTo(left, top);
  path.lineTo(right, top);
  path.absarc(right, hole.centerY, radius, -Math.PI / 2, Math.PI / 2, true);
  path.lineTo(left, bottom);
  path.absarc(left, hole.centerY, radius, Math.PI / 2, -Math.PI / 2, true);
  path.lineTo(left, top);

  return path;
}

function createTriangleHolePath(hole: TriangleHole): Path {
  const path = new Path();
  const halfWidth = hole.width / 2;
  const halfHeight = hole.height / 2;

  path.moveTo(hole.centerX, hole.centerY - halfHeight);
  path.lineTo(hole.centerX + halfWidth, hole.centerY + halfHeight);
  path.lineTo(hole.centerX - halfWidth, hole.centerY + halfHeight);
  path.lineTo(hole.centerX, hole.centerY - halfHeight);

  return path;
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

function buildInsertGeometry(
  element: PanelElement & { type: PanelElementType.Insert; properties: InsertElementProperties },
  panelThicknessMm: number,
): BufferGeometry | null {
  const { outerDepthMm, innerDepthMm, embedDepthMm, outerRadius, innerRadius } =
    clampInsertProperties(element.properties, panelThicknessMm);

  if (outerDepthMm <= 0 || outerRadius <= 0) {
    return null;
  }

  const baseZ = Math.max(panelThicknessMm - embedDepthMm, 0);
  const ringHeight = Math.min(innerDepthMm, outerDepthMm);
  const remainingHeight = Math.max(outerDepthMm - ringHeight, 0);

  const ringShape = new Shape();
  ringShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  if (innerRadius > 0) {
    const hole = new Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    ringShape.holes.push(hole);
  }

  const geometries: BufferGeometry[] = [];

  if (ringHeight > 0) {
    const ringGeometry = new ExtrudeGeometry(ringShape, {
      depth: ringHeight,
      bevelEnabled: false,
    });
    ringGeometry.translate(element.positionMm.x, element.positionMm.y, baseZ);
    geometries.push(ringGeometry);
  }

  if (remainingHeight > 0) {
    const plugShape = new Shape();
    plugShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const plugGeometry = new ExtrudeGeometry(plugShape, {
      depth: remainingHeight,
      bevelEnabled: false,
    });
    plugGeometry.translate(element.positionMm.x, element.positionMm.y, baseZ + ringHeight);
    geometries.push(plugGeometry);
  }

  if (!geometries.length) {
    return null;
  }

  if (geometries.length === 1) {
    return geometries[0];
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

function transformSvgPoint(
  point: { x: number; y: number },
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
): [number, number] {
  const { properties } = element;
  const viewBox = properties.viewBox;
  const localX = ((point.x - viewBox.minX) / viewBox.width - 0.5) * properties.widthMm;
  const localY = ((point.y - viewBox.minY) / viewBox.height - 0.5) * properties.heightMm;
  const rotation = ((element.rotationDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return [
    element.positionMm.x + localX * cos - localY * sin,
    element.positionMm.y + localX * sin + localY * cos,
  ];
}

function shapeToPolygon(
  shape: Shape,
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
): SurfacePolygon | null {
  const extracted = shape.extractPoints(20);
  const outer = closeRing(extracted.shape.map((point) => transformSvgPoint(point, element)));
  if (outer.length < 4) {
    return null;
  }
  const holes = extracted.holes
    .map((hole) => closeRing(hole.map((point) => transformSvgPoint(point, element))))
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

function strokeBufferToPolygons(
  buffer: BufferGeometry,
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
): SurfaceMultiPolygon {
  const positions = buffer.getAttribute("position");
  if (!positions) {
    return [];
  }
  const array = positions.array;
  const triangles: SurfaceMultiPolygon = [];
  for (let index = 0; index + 8 < array.length; index += 9) {
    const ring: SurfaceRing = [
      transformSvgPoint({ x: array[index], y: array[index + 1] }, element),
      transformSvgPoint({ x: array[index + 3], y: array[index + 4] }, element),
      transformSvgPoint({ x: array[index + 6], y: array[index + 7] }, element),
    ];
    triangles.push([closeRing(ring)]);
  }
  if (!triangles.length) {
    return [];
  }
  try {
    return polygonClipping.union(triangles as polygonClipping.MultiPolygon) as SurfaceMultiPolygon;
  } catch {
    return triangles;
  }
}

function strokePathToPolygons(
  shapePath: ReturnType<SVGLoader["parse"]>["paths"][number],
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
): SurfaceMultiPolygon {
  const style = (shapePath.userData?.style ?? {}) as StrokeStyleLike;
  if (!style.stroke || style.stroke === "none") {
    return [];
  }
  const strokeWidth = Number(style.strokeWidth);
  if (!Number.isFinite(strokeWidth) || strokeWidth <= 0) {
    return [];
  }
  const polygons: SurfaceMultiPolygon = [];
  for (const subPath of shapePath.subPaths) {
    const points = subPath.getPoints(20);
    if (points.length < 2) {
      continue;
    }
    let buffer: BufferGeometry | null = null;
    try {
      buffer = SVGLoader.pointsToStroke(
        points,
        style as unknown as Parameters<typeof SVGLoader.pointsToStroke>[1],
        6,
        0,
      );
    } catch {
      buffer = null;
    }
    if (!buffer) {
      continue;
    }
    polygons.push(...strokeBufferToPolygons(buffer, element));
    buffer.dispose();
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

function fallbackSvgArtworkToMultiPolygon(
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
  svgText: string,
): SurfaceMultiPolygon {
  const viewBox = parseViewBox(svgText);
  const fallbackElement = {
    ...element,
    properties: {
      ...element.properties,
      viewBox,
    },
  };
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
    const ring = closeRing(
      [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ].map((point) => transformSvgPoint(point, fallbackElement)),
    );
    polygons.push([ring]);
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
        parsePointsAttribute(attributes.points).map((point) =>
          transformSvgPoint(point, fallbackElement),
        ),
      );
      if (ring.length >= 4) {
        polygons.push([ring]);
      }
      return "";
    },
  );

  return polygons;
}

function svgArtworkToMultiPolygon(
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
): SurfaceMultiPolygon {
  const maskedSvgText = buildSvgArtworkMaskMarkup(element.properties.svgText, "#000000");
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
            const polygon = shapeToPolygon(shape, element);
            if (polygon) {
              polygons.push(polygon);
            }
          }
        }
        polygons.push(...strokePathToPolygons(path, element));
      }
      if (polygons.length) {
        return polygons;
      }
    } catch {
      // Fall through to the small parser for simple SVGs.
    }
  }

  return fallbackSvgArtworkToMultiPolygon(element, expandedSvgText);
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

function multiPolygonToExtrusions({
  artwork,
  panelSurface,
  baseZ,
  depth,
}: {
  artwork: SurfaceMultiPolygon;
  panelSurface: SurfaceMultiPolygon;
  baseZ: number;
  depth: number;
}): BufferGeometry[] {
  if (depth <= 0 || !artwork.length) {
    return [];
  }

  let clipped: SurfaceMultiPolygon;
  try {
    clipped = polygonClipping.intersection(
      artwork as polygonClipping.MultiPolygon,
      panelSurface as polygonClipping.MultiPolygon,
    ) as SurfaceMultiPolygon;
  } catch {
    return [];
  }

  if (!clipped.length) {
    return [];
  }

  const geometries: BufferGeometry[] = [];
  for (const polygon of clipped) {
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

function buildSvgArtworkGeometry(
  element: PanelElement & {
    type: PanelElementType.SvgArtwork;
    properties: SvgArtworkElementProperties;
  },
  panelSurface: SurfaceMultiPolygon,
  panelThicknessMm: number,
  warnings: string[],
): BufferGeometry[] {
  const artworkThickness = Math.max(element.properties.stlThicknessMm, 0);
  if (artworkThickness <= 0) {
    return [];
  }

  const artworkMultiPolygon = svgArtworkToMultiPolygon(element);
  if (!artworkMultiPolygon.length) {
    warnings.push(element.properties.sourceName || element.id);
    return [];
  }

  const penetration = Math.min(
    Math.max(element.properties.stlPenetrationMm, 0),
    panelThicknessMm,
    artworkThickness,
  );
  const baseZ = panelThicknessMm - penetration;
  return multiPolygonToExtrusions({
    artwork: artworkMultiPolygon,
    panelSurface,
    baseZ,
    depth: artworkThickness,
  });
}

function buildPanelShape(model: PanelModel, mountingHoles: MountingHole[]): Shape {
  const shape = new Shape();
  const width = model.dimensions.widthMm;
  const height = model.dimensions.heightMm;

  // Outer rectangle (counter-clockwise)
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, height);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  // Circular holes (clockwise)
  const circularHoles = getCircularHoles(model, mountingHoles);
  for (const hole of circularHoles) {
    const path = new Path();
    path.absellipse(
      hole.centerX,
      hole.centerY,
      hole.radius,
      hole.radius,
      0,
      Math.PI * 2,
      true, // clockwise for holes
      0,
    );
    shape.holes.push(path);
  }

  // Rectangular holes (clockwise)
  const rectangularHoles = getRectangularHoles(model);
  for (const hole of rectangularHoles) {
    const path = new Path();
    path.moveTo(hole.x, hole.y);
    path.lineTo(hole.x, hole.y + hole.height);
    path.lineTo(hole.x + hole.width, hole.y + hole.height);
    path.lineTo(hole.x + hole.width, hole.y);
    path.lineTo(hole.x, hole.y);
    shape.holes.push(path);
  }

  // Oval holes
  const ovalHoles = getOvalHoles(model);
  for (const hole of ovalHoles) {
    const path = new Path();
    path.absellipse(
      hole.centerX,
      hole.centerY,
      hole.radiusX,
      hole.radiusY,
      0,
      Math.PI * 2,
      true,
      0,
    );
    shape.holes.push(path);
  }

  // Slot holes
  const slotHoles = getSlotHoles(model, mountingHoles);
  for (const hole of slotHoles) {
    shape.holes.push(createSlotHolePath(hole));
  }

  // Triangle holes
  const triangleHoles = getTriangleHoles(model);
  for (const hole of triangleHoles) {
    shape.holes.push(createTriangleHolePath(hole));
  }

  return shape;
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

  const shape = buildPanelShape(model, mountingHoles);
  const panelGeometry = new ExtrudeGeometry(shape, {
    depth: thicknessMm,
    bevelEnabled: false,
  });

  const geometries: BufferGeometry[] = [panelGeometry];
  const panelSurface = buildPanelSurfaceMultiPolygon({
    panelSizeMm: {
      x: model.dimensions.widthMm,
      y: model.dimensions.heightMm,
    },
    mountingHoles,
    elements: model.elements,
  });

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
        geometries.push(insertGeometry);
      }
      continue;
    }

    if (isSvgArtworkElement(element)) {
      geometries.push(...buildSvgArtworkGeometry(element, panelSurface, thicknessMm, warnings));
    }
  }

  const merged =
    geometries.length === 1 ? geometries[0] : (mergeGeometries(geometries) ?? panelGeometry);

  // Flip Y so the exported model matches the on-canvas orientation (origin top-left).
  merged.scale(1, -1, 1);
  merged.translate(0, model.dimensions.heightMm, 0);
  merged.computeVertexNormals();

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
