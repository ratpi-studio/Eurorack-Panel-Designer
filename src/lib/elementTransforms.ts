import { generateElementId } from "./elements";
import { PanelElementType, hasRoundHole, type PanelElement, type Vector2 } from "./panelTypes";

/**
 * Copies, mirrors and arrays of elements. Every function returns new elements with ids of
 * their own and leaves the ones it is given untouched; the caller adds them to the design.
 * Positions are in millimeters from the top left corner of the panel, y going down, and
 * rotations in degrees, clockwise on screen, like the canvas draws them.
 */

/** The line a mirror reflects across: `vertical` swaps left and right, `horizontal` top and bottom. */
export type MirrorAxis = "vertical" | "horizontal";

export interface RectangularArrayOptions {
  columns: number;
  rows: number;
  /** Distance between two columns, negative to repeat to the left. */
  spacingXMm: number;
  /** Distance between two rows, negative to repeat upward. */
  spacingYMm: number;
}

export interface CircularArrayOptions {
  /** Instances around the circle, the original included. */
  count: number;
  centerMm: Vector2;
  /** Angle the instances spread over: a full turn spaces them evenly, less puts the last one at its end. */
  sweepDeg: number;
  /** Turn each copy with its place on the circle, as a ring of LEDs faces its knob. */
  rotateCopies: boolean;
}

/** Copies one array may add, so a typo cannot freeze the editor. */
export const MAX_ARRAY_COPIES = 400;
export const MAX_ARRAY_SIDE = 50;
export const MAX_CIRCULAR_COUNT = 72;

// Rounding keeps copies off floating point noise such as 9.999999999 mm.
const POSITION_PRECISION = 1e6;

function roundMm(value: number): number {
  return Math.round(value * POSITION_PRECISION) / POSITION_PRECISION;
}

function roundPoint(point: Vector2): Vector2 {
  return { x: roundMm(point.x), y: roundMm(point.y) };
}

/** An angle in degrees brought to (-180, 180]. */
export function normalizeAngleDeg(angle: number): number {
  const wrapped = ((((angle + 180) % 360) + 360) % 360) - 180;
  const result = wrapped === -180 ? 180 : wrapped;
  return Math.abs(result) < 1e-9 ? 0 : roundMm(result);
}

/** A copy of the element with a new id, unlocked so it can be moved where it goes. */
function copyElement(element: PanelElement, positionMm: Vector2): PanelElement {
  const copy = structuredClone(element);
  copy.id = generateElementId();
  copy.positionMm = roundPoint(positionMm);
  delete copy.locked;
  return copy;
}

/** The center of the box around the positions of the elements. */
export function getElementsCenter(elements: readonly PanelElement[]): Vector2 | null {
  if (!elements.length) {
    return null;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { positionMm } of elements) {
    minX = Math.min(minX, positionMm.x);
    minY = Math.min(minY, positionMm.y);
    maxX = Math.max(maxX, positionMm.x);
    maxY = Math.max(maxY, positionMm.y);
  }
  return roundPoint({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });
}

/** Copies of the elements, moved by the offset. */
export function copyElements(
  elements: readonly PanelElement[],
  offsetMm: Vector2 = { x: 0, y: 0 },
): PanelElement[] {
  return elements.map((element) =>
    copyElement(element, {
      x: element.positionMm.x + offsetMm.x,
      y: element.positionMm.y + offsetMm.y,
    }),
  );
}

/**
 * Texts and SVG patterns would read backward if mirrored, so they keep their orientation and
 * only move. Every other element is symmetric across its own vertical axis (the triangle
 * points up), so turning it by the mirrored angle is the same as mirroring its outline.
 */
function keepsOrientation(element: PanelElement): boolean {
  return element.type === PanelElementType.Label || element.type === PanelElementType.SvgArtwork;
}

/**
 * Mirrors of the elements across a line through `axisPositionMm` (an x for a vertical axis,
 * a y for a horizontal one). Holes around an element follow it: `defaultHoleRotationDeg` is
 * the panel-wide angle used by elements without one of their own.
 */
export function mirrorElements(
  elements: readonly PanelElement[],
  axis: MirrorAxis,
  axisPositionMm: number,
  defaultHoleRotationDeg = 0,
): PanelElement[] {
  return elements.map((element) => {
    const { x, y } = element.positionMm;
    const copy = copyElement(
      element,
      axis === "vertical" ? { x: 2 * axisPositionMm - x, y } : { x, y: 2 * axisPositionMm - y },
    );
    if (keepsOrientation(element)) {
      return copy;
    }
    // Reflecting across x = c turns an angle a into 180 - a, across y = c into -a: a shape
    // symmetric across its own vertical axis then turns by -a or 180 - a. Round holes look
    // the same at any angle and keep theirs.
    const rotation = element.rotationDeg ?? 0;
    const isRound = hasRoundHole(element) || element.type === PanelElementType.Insert;
    const mirroredRotation = isRound ? rotation : axis === "vertical" ? -rotation : 180 - rotation;
    if (mirroredRotation !== rotation) {
      copy.rotationDeg = normalizeAngleDeg(mirroredRotation);
    }
    // Holes sit at hole rotation + element rotation + k * step: solve for the hole rotation
    // that puts them where the reflection of the original ones lands.
    if (element.mountingHolesEnabled || element.mountingHoleRotationDeg !== undefined) {
      const holeRotation = element.mountingHoleRotationDeg ?? defaultHoleRotationDeg;
      const holeAngle = holeRotation + rotation;
      const mirroredHoleAngle = axis === "vertical" ? 180 - holeAngle : -holeAngle;
      copy.mountingHoleRotationDeg = normalizeAngleDeg(mirroredHoleAngle - mirroredRotation);
    }
    return copy;
  });
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Copies of the elements on a grid of columns and rows, the originals standing in its first
 * cell. Only the copies are returned, row by row.
 */
export function buildRectangularArray(
  elements: readonly PanelElement[],
  options: RectangularArrayOptions,
): PanelElement[] {
  const columns = clampInteger(options.columns, 1, MAX_ARRAY_SIDE);
  const rows = clampInteger(options.rows, 1, MAX_ARRAY_SIDE);
  const spacingX = Number.isFinite(options.spacingXMm) ? options.spacingXMm : 0;
  const spacingY = Number.isFinite(options.spacingYMm) ? options.spacingYMm : 0;
  if (!elements.length || (columns * rows - 1) * elements.length > MAX_ARRAY_COPIES) {
    return [];
  }
  const copies: PanelElement[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (row === 0 && column === 0) {
        continue;
      }
      copies.push(...copyElements(elements, { x: column * spacingX, y: row * spacingY }));
    }
  }
  return copies;
}

/** The angle between two instances of a circular array. */
export function getCircularStepDeg(
  options: Pick<CircularArrayOptions, "count" | "sweepDeg">,
): number {
  const count = clampInteger(options.count, 2, MAX_CIRCULAR_COUNT);
  const sweep = Number.isFinite(options.sweepDeg) ? options.sweepDeg : 360;
  // A full turn would put the last instance on the first one, so it spaces them by 1/count.
  return Math.abs(sweep) >= 360 ? Math.sign(sweep) * (360 / count) : sweep / (count - 1);
}

function rotateAround(point: Vector2, center: Vector2, angleDeg: number): Vector2 {
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  // With y going down, this turns clockwise on screen, the way element rotations turn.
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}

/**
 * Copies of the elements turned around a center, the originals being the first instance.
 * Only the copies are returned, in the order they go around.
 */
export function buildCircularArray(
  elements: readonly PanelElement[],
  options: CircularArrayOptions,
): PanelElement[] {
  const count = clampInteger(options.count, 2, MAX_CIRCULAR_COUNT);
  const step = getCircularStepDeg(options);
  if (
    !elements.length ||
    (count - 1) * elements.length > MAX_ARRAY_COPIES ||
    !Number.isFinite(options.centerMm.x) ||
    !Number.isFinite(options.centerMm.y)
  ) {
    return [];
  }
  const copies: PanelElement[] = [];
  for (let index = 1; index < count; index += 1) {
    const angle = step * index;
    for (const element of elements) {
      const copy = copyElement(element, rotateAround(element.positionMm, options.centerMm, angle));
      if (options.rotateCopies) {
        copy.rotationDeg = normalizeAngleDeg((element.rotationDeg ?? 0) + angle);
      }
      copies.push(copy);
    }
  }
  return copies;
}
