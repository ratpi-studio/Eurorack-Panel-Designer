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

interface PanelSurfaceInput {
  panelSizeMm: Vector2;
  mountingHoles: MountingHole[];
  elements: PanelElement[];
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

function translateRing(ring: Vector2[], center: Vector2, rotationDeg = 0): SurfaceRing {
  return ring.map((point) => {
    const rotated = rotatePoint(point, rotationDeg);
    return [center.x + rotated.x, center.y + rotated.y];
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
      return translateRing(
        ellipseRing(element.properties.diameterMm / 2, element.properties.diameterMm / 2),
        element.positionMm,
      );
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
      return translateRing(ellipseRing(props.innerDiameterMm / 2, props.innerDiameterMm / 2), {
        ...element.positionMm,
      });
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

  const radius = hole.diameterMm / 2;
  return translateRing(ellipseRing(radius, radius), hole.center);
}

export function buildPanelSurfacePolygon({
  panelSizeMm,
  mountingHoles,
  elements,
}: PanelSurfaceInput): SurfacePolygon {
  const outer: SurfaceRing = [
    [0, 0],
    [panelSizeMm.x, 0],
    [panelSizeMm.x, panelSizeMm.y],
    [0, panelSizeMm.y],
  ];

  const cutouts = [
    ...mountingHoles.map(mountingHoleRing),
    ...elements.map(elementCutoutRing).filter((ring): ring is SurfaceRing => Boolean(ring)),
  ];

  return [outer, ...cutouts];
}

export function buildPanelSurfaceMultiPolygon(input: PanelSurfaceInput): SurfaceMultiPolygon {
  return [buildPanelSurfacePolygon(input)];
}

function ringToPath(ring: SurfaceRing): string {
  if (!ring.length) {
    return "";
  }
  const [first, ...rest] = ring;
  return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`), "Z"].join(" ");
}

export function buildPanelSurfacePathData(input: PanelSurfaceInput): string {
  return buildPanelSurfacePolygon(input).map(ringToPath).filter(Boolean).join(" ");
}

export function createPanelSurfacePath2D(input: PanelSurfaceInput): Path2D | null {
  if (typeof Path2D === "undefined") {
    return null;
  }
  return new Path2D(buildPanelSurfacePathData(input));
}
