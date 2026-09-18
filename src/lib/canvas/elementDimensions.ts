import { PanelElementType, type PanelElement, type Vector2 } from "@lib/panelTypes";

type ElementDimensions =
  | { kind: "diameter"; diameterMm: number }
  | { kind: "box"; widthMm: number; heightMm: number };

interface InlineLabelPlacement {
  /** Label center in the element's local (unrotated) frame. */
  offsetMm: Vector2;
  /** The text runs along the element's local Y axis instead of its X axis. */
  vertical: boolean;
}

const CENTERED: Vector2 = { x: 0, y: 0 };

export function getElementDimensions(element: PanelElement): ElementDimensions | null {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
      return { kind: "diameter", diameterMm: element.properties.diameterMm };
    case PanelElementType.Insert:
      return { kind: "diameter", diameterMm: element.properties.outerDiameterMm };
    case PanelElementType.Switch:
    case PanelElementType.Rectangle:
    case PanelElementType.Oval:
    case PanelElementType.Slot:
    case PanelElementType.Triangle:
    case PanelElementType.SvgArtwork:
      return {
        kind: "box",
        widthMm: element.properties.widthMm,
        heightMm: element.properties.heightMm,
      };
    default:
      return null;
  }
}

export function formatDimensionMm(valueMm: number): string {
  return String(Math.round(valueMm * 100) / 100);
}

export function formatDiameterLabel(diameterMm: number): string {
  return `Ø${formatDimensionMm(diameterMm)}`;
}

export function formatBoxLabel(widthMm: number, heightMm: number): string {
  return `${formatDimensionMm(widthMm)} × ${formatDimensionMm(heightMm)}`;
}

/**
 * Finds where a centered text box (given by its half extents) fits inside the element's shape.
 * Returns null when the text would spill out, so small elements stay uncluttered.
 */
export function getInlineLabelPlacement(
  element: PanelElement,
  halfTextMm: Vector2,
): InlineLabelPlacement | null {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
      return fitsInCircle(element.properties.diameterMm / 2, halfTextMm)
        ? { offsetMm: CENTERED, vertical: false }
        : null;
    case PanelElementType.Insert:
      return fitsInCircle(element.properties.outerDiameterMm / 2, halfTextMm)
        ? { offsetMm: CENTERED, vertical: false }
        : null;
    case PanelElementType.Switch:
    case PanelElementType.Rectangle: {
      const { widthMm, heightMm } = element.properties;
      return placeInSymmetricShape(
        halfTextMm,
        (halfX, halfY) => halfX <= widthMm / 2 && halfY <= heightMm / 2,
      );
    }
    case PanelElementType.Oval: {
      const radiusX = element.properties.widthMm / 2;
      const radiusY = element.properties.heightMm / 2;
      return placeInSymmetricShape(
        halfTextMm,
        (halfX, halfY) =>
          radiusX > 0 && radiusY > 0 && (halfX / radiusX) ** 2 + (halfY / radiusY) ** 2 <= 1,
      );
    }
    case PanelElementType.Slot: {
      const { widthMm, heightMm } = element.properties;
      return placeInSymmetricShape(halfTextMm, (halfX, halfY) =>
        fitsInSlot(widthMm, heightMm, halfX, halfY),
      );
    }
    case PanelElementType.Triangle:
      return placeInTriangle(element.properties.widthMm, element.properties.heightMm, halfTextMm);
    default:
      return null;
  }
}

/** Extra rotation (0 or π) that keeps text drawn at `angleRad` from reading upside down. */
export function getReadableTextFlip(angleRad: number): number {
  const turn = Math.PI * 2;
  const normalized = ((angleRad % turn) + turn) % turn;
  const epsilon = 1e-6;
  const pointsBackwards =
    normalized >= Math.PI / 2 - epsilon && normalized < (Math.PI * 3) / 2 - epsilon;
  return pointsBackwards ? Math.PI : 0;
}

function fitsInCircle(radiusMm: number, halfTextMm: Vector2): boolean {
  return halfTextMm.x ** 2 + halfTextMm.y ** 2 <= radiusMm ** 2;
}

function placeInSymmetricShape(
  halfTextMm: Vector2,
  fits: (halfX: number, halfY: number) => boolean,
): InlineLabelPlacement | null {
  if (fits(halfTextMm.x, halfTextMm.y)) {
    return { offsetMm: CENTERED, vertical: false };
  }
  if (fits(halfTextMm.y, halfTextMm.x)) {
    return { offsetMm: CENTERED, vertical: true };
  }
  return null;
}

function fitsInSlot(widthMm: number, heightMm: number, halfX: number, halfY: number): boolean {
  // Same capsule as the renderer: rounded ends on the X axis, radius from the shorter side.
  const radius = Math.min(widthMm, heightMm) / 2;
  const straightHalf = Math.max(widthMm / 2 - radius, 0);
  if (radius <= 0 || halfY > radius) {
    return false;
  }
  if (halfX <= straightHalf) {
    return true;
  }
  return (halfX - straightHalf) ** 2 + halfY ** 2 <= radius ** 2;
}

function placeInTriangle(
  widthMm: number,
  heightMm: number,
  halfTextMm: Vector2,
): InlineLabelPlacement | null {
  if (widthMm <= 0 || heightMm <= 0) {
    return null;
  }
  // The triangle widens linearly from its apex (y = -h/2) to its base (y = h/2), so the text
  // top edge must sit low enough to be covered, and its bottom edge must stay above the base.
  const minCenterY = (2 * heightMm * halfTextMm.x) / widthMm + halfTextMm.y - heightMm / 2;
  const maxCenterY = heightMm / 2 - halfTextMm.y;
  if (minCenterY > maxCenterY) {
    return null;
  }
  const centroidY = heightMm / 6;
  return {
    offsetMm: { x: 0, y: Math.min(Math.max(centroidY, minCenterY), maxCenterY) },
    vertical: false,
  };
}
