import {
  PanelElementType,
  type InsertElementProperties,
  type MountingHole,
  type PanelElement,
  type Vector2,
} from "./panelTypes";

export type SurfaceRing = Array<[number, number]>;
export type SurfacePolygon = SurfaceRing[];
export type SurfaceMultiPolygon = SurfacePolygon[];

const DEFAULT_SEGMENTS = 48;

export interface PanelSurfaceInput {
  panelSizeMm: Vector2;
  mountingHoles: MountingHole[];
  elements: PanelElement[];
}

/** A hole through the panel, with the mounting hole or element that makes it. */
export interface PanelCutout {
  ring: SurfaceRing;
  source: MountingHole | PanelElement;
}

function rotatePoint(point: Vector2, rotationDeg: number): Vector2 {
  if (rotationDeg === 0) {
    return point;
  }
  const rotation = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

/**
 * Maps a point from an element's own frame (centered on the element, before rotation) to panel
 * coordinates, rotating the way the canvas draws rotated elements.
 */
export function elementPointToPanel(point: Vector2, center: Vector2, rotationDeg = 0): Vector2 {
  const rotated = rotatePoint(point, rotationDeg);
  return { x: center.x + rotated.x, y: center.y + rotated.y };
}

function translateRing(ring: Vector2[], center: Vector2, rotationDeg = 0): SurfaceRing {
  return ring.map((point) => {
    const { x, y } = elementPointToPanel(point, center, rotationDeg);
    return [x, y];
  });
}

function rectRing(width: number, height: number): Vector2[] {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];
}

function ellipseRing(radiusX: number, radiusY: number, segments = DEFAULT_SEGMENTS): Vector2[] {
  const points: Vector2[] = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
    });
  }
  return points;
}

/** Polygon of a round cut-out, the same wherever the panel surface is built. */
export function circleRing(center: Vector2, radius: number): SurfaceRing {
  return translateRing(ellipseRing(radius, radius), center);
}

function slotRing(width: number, height: number, segments = DEFAULT_SEGMENTS): Vector2[] {
  const radius = Math.min(width / 2, height / 2);
  const straightHalf = Math.max(width / 2 - radius, 0);
  const points: Vector2[] = [];
  const halfSegments = Math.max(8, Math.floor(segments / 2));

  for (let index = 0; index <= halfSegments; index += 1) {
    const angle = -Math.PI / 2 + (index / halfSegments) * Math.PI;
    points.push({
      x: straightHalf + Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  for (let index = 0; index <= halfSegments; index += 1) {
    const angle = Math.PI / 2 + (index / halfSegments) * Math.PI;
    points.push({
      x: -straightHalf + Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  return points;
}

function triangleRing(width: number, height: number): Vector2[] {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return [
    { x: 0, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];
}

function elementCutoutRing(element: PanelElement): SurfaceRing | null {
  const rotationDeg = element.rotationDeg ?? 0;

  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
      return circleRing(element.positionMm, element.properties.diameterMm / 2);
    case PanelElementType.Switch:
    case PanelElementType.Rectangle:
      return translateRing(
        rectRing(element.properties.widthMm, element.properties.heightMm),
        element.positionMm,
        rotationDeg,
      );
    case PanelElementType.Oval:
      return translateRing(
        ellipseRing(element.properties.widthMm / 2, element.properties.heightMm / 2),
        element.positionMm,
        rotationDeg,
      );
    case PanelElementType.Slot:
      return translateRing(
        slotRing(element.properties.widthMm, element.properties.heightMm),
        element.positionMm,
        rotationDeg,
      );
    case PanelElementType.Triangle:
      return translateRing(
        triangleRing(element.properties.widthMm, element.properties.heightMm),
        element.positionMm,
        rotationDeg,
      );
    case PanelElementType.Insert: {
      const props = element.properties as InsertElementProperties;
      if (props.outerDepthMm <= 0 || props.embedDepthMm <= 0 || props.innerDepthMm <= 0) {
        return null;
      }
      return circleRing(element.positionMm, props.innerDiameterMm / 2);
    }
    case PanelElementType.Label:
    case PanelElementType.SvgArtwork:
      return null;
    default:
      return null;
  }
}

function mountingHoleRing(hole: MountingHole): SurfaceRing {
  if (hole.shape === "slot" && hole.slotLengthMm) {
    return translateRing(slotRing(hole.slotLengthMm, hole.diameterMm), hole.center);
  }

  return circleRing(hole.center, hole.diameterMm / 2);
}

export function panelOutlineRing(panelSizeMm: Vector2): SurfaceRing {
  return [
    [0, 0],
    [panelSizeMm.x, 0],
    [panelSizeMm.x, panelSizeMm.y],
    [0, panelSizeMm.y],
  ];
}

/** Cut-outs of the mounting holes, then of the elements that make one. */
export function buildPanelCutouts({
  mountingHoles,
  elements,
}: Pick<PanelSurfaceInput, "mountingHoles" | "elements">): PanelCutout[] {
  const cutouts: PanelCutout[] = mountingHoles.map((hole) => ({
    ring: mountingHoleRing(hole),
    source: hole,
  }));
  for (const element of elements) {
    const ring = elementCutoutRing(element);
    if (ring) {
      cutouts.push({ ring, source: element });
    }
  }
  return cutouts;
}

export function buildPanelSurfacePolygon(input: PanelSurfaceInput): SurfacePolygon {
  return [
    panelOutlineRing(input.panelSizeMm),
    ...buildPanelCutouts(input).map((cutout) => cutout.ring),
  ];
}

export function buildPanelSurfaceMultiPolygon(input: PanelSurfaceInput): SurfaceMultiPolygon {
  return [buildPanelSurfacePolygon(input)];
}

/**
 * Round cut-outs are polygons with their corners on the true outline, so their sides run up to
 * `radius × (1 − cos(π / DEFAULT_SEGMENTS))` inside it, where KiCad draws the true shape. Overlap
 * tests allow that much slack, sized on the half diagonal of each cut-out.
 */
const ROUND_OUTLINE_SLACK = 1 - Math.cos(Math.PI / DEFAULT_SEGMENTS);

interface RingBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function measureRing(ring: SurfaceRing): RingBounds {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const [x, y] of ring) {
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
  }
  return bounds;
}

function hasArea(bounds: RingBounds): boolean {
  return bounds.maxX > bounds.minX && bounds.maxY > bounds.minY;
}

function outlineSlack(bounds: RingBounds): number {
  return (
    (ROUND_OUTLINE_SLACK * Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)) / 2
  );
}

/** Gap between two bounding boxes along the axis that separates them, negative if they overlap. */
function boundsGap(a: RingBounds, b: RingBounds): number {
  return Math.max(a.minX - b.maxX, b.minX - a.maxX, a.minY - b.maxY, b.minY - a.maxY);
}

type Point = [number, number];

function pointToSegmentDistance([x, y]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared > 0
      ? Math.min(Math.max(((x - ax) * dx + (y - ay) * dy) / lengthSquared, 0), 1)
      : 0;
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

/** Positive when `point` is on the left of the line from `a` to `b`, negative on its right. */
function side(a: Point, b: Point, point: Point): number {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
}

function segmentDistance(a1: Point, a2: Point, b1: Point, b2: Point): number {
  if (side(b1, b2, a1) * side(b1, b2, a2) < 0 && side(a1, a2, b1) * side(a1, a2, b2) < 0) {
    return 0;
  }
  return Math.min(
    pointToSegmentDistance(a1, b1, b2),
    pointToSegmentDistance(a2, b1, b2),
    pointToSegmentDistance(b1, a1, a2),
    pointToSegmentDistance(b2, a1, a2),
  );
}

/** Even-odd test, the fill rule of the panel surface. */
function isInsideRing([x, y]: Point, ring: SurfaceRing): boolean {
  let inside = false;
  for (let index = 0; index < ring.length; index += 1) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[(index + ring.length - 1) % ring.length];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Whether two rings come within `tolerance` of each other, one lying inside the other included. */
function ringsWithin(a: SurfaceRing, b: SurfaceRing, tolerance: number): boolean {
  for (let i = 0; i < a.length; i += 1) {
    const a1 = a[i];
    const a2 = a[(i + 1) % a.length];
    const minX = Math.min(a1[0], a2[0]) - tolerance;
    const maxX = Math.max(a1[0], a2[0]) + tolerance;
    const minY = Math.min(a1[1], a2[1]) - tolerance;
    const maxY = Math.max(a1[1], a2[1]) + tolerance;
    for (let j = 0; j < b.length; j += 1) {
      const b1 = b[j];
      const b2 = b[(j + 1) % b.length];
      if (
        Math.max(b1[0], b2[0]) < minX ||
        Math.min(b1[0], b2[0]) > maxX ||
        Math.max(b1[1], b2[1]) < minY ||
        Math.min(b1[1], b2[1]) > maxY
      ) {
        continue;
      }
      if (segmentDistance(a1, a2, b1, b2) <= tolerance) {
        return true;
      }
    }
  }
  // The outlines stay apart: the rings are apart too, unless one lies inside the other.
  return isInsideRing(a[0], b) || isInsideRing(b[0], a);
}

export interface CutoutOverlaps {
  /** Cut-outs that overlap or touch another cut-out or the panel edge. */
  overlapping: PanelCutout[];
  /** Cut-outs clear of the others and of the panel edge, including the ones off the panel. */
  separate: PanelCutout[];
}

/**
 * Finds the cut-outs that overlap or touch another cut-out or the panel edge. Drawn one by one,
 * their outlines would cross, which KiCad rejects, and the even-odd rule would fill their overlaps
 * again: they have to be merged into single openings (see `mergePanelSurface`).
 */
export function splitOverlappingCutouts(
  panelSizeMm: Vector2,
  cutouts: PanelCutout[],
): CutoutOverlaps {
  const outline = panelOutlineRing(panelSizeMm);
  const bounds = cutouts.map((cutout) => measureRing(cutout.ring));
  const overlaps = cutouts.map(() => false);

  cutouts.forEach((cutout, index) => {
    const box = bounds[index];
    if (!hasArea(box)) {
      return;
    }
    const slack = outlineSlack(box);
    const clearOfEdge =
      box.minX > slack &&
      box.minY > slack &&
      box.maxX < panelSizeMm.x - slack &&
      box.maxY < panelSizeMm.y - slack;
    if (!clearOfEdge && ringsWithin(cutout.ring, outline, slack)) {
      overlaps[index] = true;
    }

    for (let other = index + 1; other < cutouts.length; other += 1) {
      const otherBox = bounds[other];
      if ((overlaps[index] && overlaps[other]) || !hasArea(otherBox)) {
        continue;
      }
      const tolerance = slack + outlineSlack(otherBox);
      if (
        boundsGap(box, otherBox) <= tolerance &&
        ringsWithin(cutout.ring, cutouts[other].ring, tolerance)
      ) {
        overlaps[index] = true;
        overlaps[other] = true;
      }
    }
  });

  return {
    overlapping: cutouts.filter((_, index) => overlaps[index]),
    separate: cutouts.filter((_, index) => !overlaps[index]),
  };
}

export function hasOverlappingCutouts(input: PanelSurfaceInput): boolean {
  return (
    splitOverlappingCutouts(input.panelSizeMm, buildPanelCutouts(input)).overlapping.length > 0
  );
}

function ringToPath(ring: SurfaceRing): string {
  if (!ring.length) {
    return "";
  }
  const [first, ...rest] = ring;
  return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`), "Z"].join(" ");
}

/** SVG path data of rings, meant for the even-odd fill rule. */
export function surfacePathData(rings: SurfaceRing[]): string {
  return rings.map(ringToPath).filter(Boolean).join(" ");
}

/**
 * Path data of the panel surface, each cut-out on its own: see `buildMergedPanelSurfacePathData`
 * for designs where cut-outs overlap.
 */
export function buildPanelSurfacePathData(input: PanelSurfaceInput): string {
  return surfacePathData(buildPanelSurfacePolygon(input));
}

export function createPanelSurfacePath2D(input: PanelSurfaceInput): Path2D | null {
  if (typeof Path2D === "undefined") {
    return null;
  }
  return new Path2D(buildPanelSurfacePathData(input));
}
