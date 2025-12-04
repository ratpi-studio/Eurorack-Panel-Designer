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

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return {
    x: translated.x * cos - translated.y * sin,
    y: translated.x * sin + translated.y * cos
  };
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
    case PanelElementType.Switch: {
      const halfWidth = element.properties.widthMm / 2;
      const halfHeight = element.properties.heightMm / 2;
      return (
        Math.abs(localPoint.x) <= halfWidth &&
        Math.abs(localPoint.y) <= halfHeight
      );
    }
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
    case PanelElementType.Switch: {
      return getRectBounds(
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
      return {
        minX: element.positionMm.x,
        maxX: element.positionMm.x,
        minY: element.positionMm.y,
        maxY: element.positionMm.y
      };
  }
}
