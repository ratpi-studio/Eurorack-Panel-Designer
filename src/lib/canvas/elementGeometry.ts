import {
  PanelElementType,
  type LabelElementProperties,
  type PanelElement,
  type Vector2
} from '@lib/panelTypes';

const LABEL_CHAR_WIDTH_RATIO = 0.6;
const LABEL_LINE_HEIGHT_RATIO = 1.25;

export const PT_TO_MM = 25.4 / 72;

interface LabelSizeMm {
  widthMm: number;
  heightMm: number;
}

export interface ElementBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface NearestElementDistance {
  elementId: string;
  center: Vector2;
  distanceMm: number;
}

export function getLabelSizeMm(
  properties: LabelElementProperties
): LabelSizeMm {
  const fontSizeMm = Math.max(2, properties.fontSizePt * PT_TO_MM);
  const textLength = properties.text?.length ?? 0;
  const widthMm = Math.max(
    fontSizeMm,
    fontSizeMm * LABEL_CHAR_WIDTH_RATIO * Math.max(textLength, 1)
  );
  const heightMm = fontSizeMm * LABEL_LINE_HEIGHT_RATIO;

  return { widthMm, heightMm };
}

function convertToElementSpace(
  point: Vector2,
  element: PanelElement
): Vector2 {
  const translated = {
    x: point.x - element.positionMm.x,
    y: point.y - element.positionMm.y
  };

  const rotation = -((element.rotationDeg ?? 0) * Math.PI) / 180;
  if (rotation === 0) {
    return translated;
  }

  return rotatePoint(translated, rotation);
}

function isPointInOval(
  point: Vector2,
  widthMm: number,
  heightMm: number
): boolean {
  const halfWidth = widthMm / 2;
  const halfHeight = heightMm / 2;
  if (halfWidth <= 0 || halfHeight <= 0) {
    return false;
  }
  const normalized =
    (point.x / halfWidth) * (point.x / halfWidth) +
    (point.y / halfHeight) * (point.y / halfHeight);
  return normalized <= 1;
}

function isPointInSlot(point: Vector2, widthMm: number, heightMm: number): boolean {
  const halfWidth = widthMm / 2;
  const halfHeight = heightMm / 2;
  if (halfWidth <= 0 || halfHeight <= 0) {
    return false;
  }
  const radius = Math.min(halfHeight, halfWidth);
  const rectHalfWidth = Math.max(halfWidth - radius, 0);

  if (Math.abs(point.y) <= radius && Math.abs(point.x) <= rectHalfWidth) {
    return true;
  }
  const dx = Math.abs(point.x) - rectHalfWidth;
  if (dx <= 0) {
    return Math.abs(point.y) <= radius;
  }
  return dx * dx + point.y * point.y <= radius * radius;
}

function isPointInTriangle(point: Vector2, widthMm: number, heightMm: number): boolean {
  const halfWidth = widthMm / 2;
  const halfHeight = heightMm / 2;
  if (halfWidth <= 0 || halfHeight <= 0) {
    return false;
  }

  const a = { x: 0, y: -halfHeight };
  const b = { x: halfWidth, y: halfHeight };
  const c = { x: -halfWidth, y: halfHeight };

  const v0 = { x: c.x - a.x, y: c.y - a.y };
  const v1 = { x: b.x - a.x, y: b.y - a.y };
  const v2 = { x: point.x - a.x, y: point.y - a.y };

  const dot00 = v0.x * v0.x + v0.y * v0.y;
  const dot01 = v0.x * v1.x + v0.y * v1.y;
  const dot02 = v0.x * v2.x + v0.y * v2.y;
  const dot11 = v1.x * v1.x + v1.y * v1.y;
  const dot12 = v1.x * v2.x + v1.y * v2.y;

  const denom = dot00 * dot11 - dot01 * dot01;
  if (denom === 0) {
    return false;
  }
  const invDenom = 1 / denom;
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  return u >= 0 && v >= 0 && u + v <= 1;
}

function isPointInsideElement(
  pointMm: Vector2,
  element: PanelElement
): boolean {
  const localPoint = convertToElementSpace(pointMm, element);

  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led: {
      const radius = element.properties.diameterMm / 2;
      return localPoint.x ** 2 + localPoint.y ** 2 <= radius ** 2;
    }
    case PanelElementType.Switch:
    case PanelElementType.Rectangle: {
      const halfWidth = element.properties.widthMm / 2;
      const halfHeight = element.properties.heightMm / 2;
      return (
        Math.abs(localPoint.x) <= halfWidth &&
        Math.abs(localPoint.y) <= halfHeight
      );
    }
    case PanelElementType.Oval:
      return isPointInOval(
        localPoint,
        element.properties.widthMm,
        element.properties.heightMm
      );
    case PanelElementType.Slot:
      return isPointInSlot(
        localPoint,
        element.properties.widthMm,
        element.properties.heightMm
      );
    case PanelElementType.Triangle:
      return isPointInTriangle(
        localPoint,
        element.properties.widthMm,
        element.properties.heightMm
      );
    case PanelElementType.Label: {
      const { widthMm, heightMm } = getLabelSizeMm(element.properties);
      return (
        Math.abs(localPoint.x) <= widthMm / 2 &&
        Math.abs(localPoint.y) <= heightMm / 2
      );
    }
    default:
      return false;
  }
}

export function findElementAtPoint(
  pointMm: Vector2,
  elements: PanelElement[]
): PanelElement | null {
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (isPointInsideElement(pointMm, element)) {
      return element;
    }
  }

  return null;
}

export function computeNearestElementDistances(
  pointMm: Vector2,
  elements: PanelElement[],
  maxCount = 3
): NearestElementDistance[] {
  const distances = elements
    .map((element) => {
      const dx = element.positionMm.x - pointMm.x;
      const dy = element.positionMm.y - pointMm.y;
      const distanceMm = Math.hypot(dx, dy);
      return {
        elementId: element.id,
        center: { ...element.positionMm },
        distanceMm
      };
    });

  distances.sort((a, b) => a.distanceMm - b.distanceMm);
  return maxCount > 0 ? distances.slice(0, maxCount) : [];
}

function getRectBounds(
  center: Vector2,
  widthMm: number,
  heightMm: number,
  rotationDeg: number
): ElementBounds {
  const rotation = (rotationDeg * Math.PI) / 180;
  if (rotation === 0) {
    return {
      minX: center.x - widthMm / 2,
      maxX: center.x + widthMm / 2,
      minY: center.y - heightMm / 2,
      maxY: center.y + heightMm / 2
    };
  }
  const halfWidth = widthMm / 2;
  const halfHeight = heightMm / 2;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const dx = Math.abs(halfWidth * cos) + Math.abs(halfHeight * sin);
  const dy = Math.abs(halfWidth * sin) + Math.abs(halfHeight * cos);
  return {
    minX: center.x - dx,
    maxX: center.x + dx,
    minY: center.y - dy,
    maxY: center.y + dy
  };
}

function getTriangleBounds(
  center: Vector2,
  widthMm: number,
  heightMm: number,
  rotationDeg: number
): ElementBounds {
  const rotation = (rotationDeg * Math.PI) / 180;
  const halfWidth = widthMm / 2;
  const halfHeight = heightMm / 2;
  const localPoints: Vector2[] = [
    { x: 0, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight }
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  localPoints.forEach((point) => {
    const rotated = rotatePoint(point, rotation);
    const world = {
      x: center.x + rotated.x,
      y: center.y + rotated.y
    };
    minX = Math.min(minX, world.x);
    maxX = Math.max(maxX, world.x);
    minY = Math.min(minY, world.y);
    maxY = Math.max(maxY, world.y);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return {
      minX: center.x,
      maxX: center.x,
      minY: center.y,
      maxY: center.y
    };
  }

  return { minX, maxX, minY, maxY };
}

export function getElementBounds(element: PanelElement): ElementBounds {
  const rotation = element.rotationDeg ?? 0;
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led: {
      const radius = element.properties.diameterMm / 2;
      return {
        minX: element.positionMm.x - radius,
        maxX: element.positionMm.x + radius,
        minY: element.positionMm.y - radius,
        maxY: element.positionMm.y + radius
      };
    }
    case PanelElementType.Switch:
    case PanelElementType.Rectangle:
    case PanelElementType.Oval:
    case PanelElementType.Slot: {
      return getRectBounds(
        element.positionMm,
        element.properties.widthMm,
        element.properties.heightMm,
        rotation
      );
    }
    case PanelElementType.Triangle: {
      return getTriangleBounds(
        element.positionMm,
        element.properties.widthMm,
        element.properties.heightMm,
        rotation
      );
    }
    case PanelElementType.Label: {
      const { widthMm, heightMm } = getLabelSizeMm(element.properties);
      return getRectBounds(element.positionMm, widthMm, heightMm, rotation);
    }
    default:
      return assertUnreachable(element);
  }
}

function assertUnreachable(value: never): never {
  throw new Error(`Unhandled panel element: ${String(value)}`);
}
function rotatePoint(point: Vector2, rotationRad: number): Vector2 {
  if (rotationRad === 0) {
    return { ...point };
  }
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}
