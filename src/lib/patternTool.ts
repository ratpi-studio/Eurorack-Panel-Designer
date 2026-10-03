import {
  MAX_ARRAY_COPIES,
  MAX_ARRAY_SIDE,
  MAX_CIRCULAR_COUNT,
  buildCircularArray,
  buildRectangularArray,
  getCircularStepDeg,
  getElementsCenter,
  mirrorElements,
  type MirrorAxis,
} from "./elementTransforms";
import { snapPointToGrid } from "./grid";
import type { PanelElement, Vector2 } from "./panelTypes";

/**
 * The mirror and pattern commands, run like Fusion's: the command applies to the selection,
 * shows its result on the canvas as its settings change, takes its reference (the mirror
 * line, the center of a circle) from a click on the panel, and only changes the design when
 * applied, in one undo step.
 */

export interface MirrorTool {
  kind: "mirror";
  /** A vertical line swaps left and right, a horizontal one top and bottom. */
  orientation: MirrorAxis;
  /** A point the line goes through; null until it is picked on the panel. */
  lineMm: Vector2 | null;
  /** Adds mirrored copies; otherwise the selection itself moves to the other side. */
  keepOriginal: boolean;
}

export interface RectangularPatternTool {
  kind: "rectangular";
  columns: number;
  rows: number;
  /** From one instance to the next, negative to go left or up. */
  spacingMm: Vector2;
}

export interface CircularPatternTool {
  kind: "circular";
  /** Null until it is picked on the panel. */
  centerMm: Vector2 | null;
  /** Instances, the selection included. */
  count: number;
  sweepDeg: number;
  /** Diameter of the circle the selection sits on; null keeps it where it is. */
  diameterMm: number | null;
  rotateCopies: boolean;
}

export type PatternTool = MirrorTool | RectangularPatternTool | CircularPatternTool;
export type PatternToolKind = PatternTool["kind"];

export const DEFAULT_PATTERN_SPACING_MM: Vector2 = { x: 10.16, y: 15 };

export function createPatternTool(kind: PatternToolKind): PatternTool {
  switch (kind) {
    case "mirror":
      return { kind, orientation: "vertical", lineMm: null, keepOriginal: true };
    case "rectangular":
      return { kind, columns: 2, rows: 1, spacingMm: { ...DEFAULT_PATTERN_SPACING_MM } };
    case "circular":
      return {
        kind,
        centerMm: null,
        count: 6,
        sweepDeg: 360,
        diameterMm: null,
        rotateCopies: true,
      };
  }
}

/** Whether the command still waits for its reference to be clicked on the panel. */
export function isAwaitingReference(tool: PatternTool): boolean {
  return (
    (tool.kind === "mirror" && tool.lineMm === null) ||
    (tool.kind === "circular" && tool.centerMm === null)
  );
}

export interface PatternResult {
  /** Selected elements the command moves or turns, with their own ids. */
  updated: PanelElement[];
  /** New elements, with new ids. */
  copies: PanelElement[];
}

const EMPTY_RESULT: PatternResult = { updated: [], copies: [] };

// Below this, the selection sits on the center and no direction tells where the circle is.
const MIN_RADIUS_MM = 0.01;

function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Where the selection sits on the circle: its own center, unless a diameter was set. */
function getCircularPlacement(selection: readonly PanelElement[], tool: CircularPatternTool) {
  const selectionCenter = getElementsCenter(selection);
  if (!selectionCenter || !tool.centerMm) {
    return null;
  }
  const currentRadius = distance(selectionCenter, tool.centerMm);
  const radius = tool.diameterMm === null ? currentRadius : Math.max(0, tool.diameterMm / 2);
  // A selection on the center moves up when given a diameter, as 0° points up on a dial.
  const direction =
    currentRadius < MIN_RADIUS_MM
      ? { x: 0, y: -1 }
      : {
          x: (selectionCenter.x - tool.centerMm.x) / currentRadius,
          y: (selectionCenter.y - tool.centerMm.y) / currentRadius,
        };
  const onCircle = {
    x: tool.centerMm.x + direction.x * radius,
    y: tool.centerMm.y + direction.y * radius,
  };
  return {
    radius,
    onCircle,
    offset: { x: onCircle.x - selectionCenter.x, y: onCircle.y - selectionCenter.y },
  };
}

export function getPatternCopyCount(tool: PatternTool, selectionCount: number): number {
  switch (tool.kind) {
    case "mirror":
      return tool.keepOriginal ? selectionCount : 0;
    case "rectangular":
      return (tool.columns * tool.rows - 1) * selectionCount;
    case "circular":
      return (tool.count - 1) * selectionCount;
  }
}

/** The result of the command on the selection, as the canvas previews it and Apply adds it. */
export function computePatternResult(
  selection: readonly PanelElement[],
  tool: PatternTool,
  defaultHoleRotationDeg = 0,
): PatternResult {
  if (!selection.length || isAwaitingReference(tool)) {
    return EMPTY_RESULT;
  }
  switch (tool.kind) {
    case "mirror": {
      const line = tool.lineMm as Vector2;
      const mirrored = mirrorElements(
        selection,
        tool.orientation,
        tool.orientation === "vertical" ? line.x : line.y,
        defaultHoleRotationDeg,
      );
      if (tool.keepOriginal) {
        return { updated: [], copies: mirrored };
      }
      return {
        updated: mirrored.map((element, index) => {
          const original = selection[index];
          const moved: PanelElement = { ...element, id: original.id };
          if (original.locked) {
            moved.locked = true;
          }
          return moved;
        }),
        copies: [],
      };
    }
    case "rectangular":
      return {
        updated: [],
        copies: buildRectangularArray(selection, {
          columns: tool.columns,
          rows: tool.rows,
          spacingXMm: tool.spacingMm.x,
          spacingYMm: tool.spacingMm.y,
        }),
      };
    case "circular": {
      const placement = getCircularPlacement(selection, tool);
      if (!placement || !tool.centerMm) {
        return EMPTY_RESULT;
      }
      const { offset } = placement;
      const moved =
        Math.abs(offset.x) < 1e-9 && Math.abs(offset.y) < 1e-9
          ? []
          : selection.map((element) => ({
              ...element,
              positionMm: {
                x: element.positionMm.x + offset.x,
                y: element.positionMm.y + offset.y,
              },
            }));
      return {
        updated: moved,
        copies: buildCircularArray(moved.length ? moved : selection, {
          count: tool.count,
          centerMm: tool.centerMm,
          sweepDeg: tool.sweepDeg,
          rotateCopies: tool.rotateCopies,
        }),
      };
    }
  }
}

/** The elements of the design with the result applied: selected ones updated, copies last. */
export function applyPatternResult(
  elements: readonly PanelElement[],
  result: PatternResult,
): PanelElement[] {
  if (!result.updated.length && !result.copies.length) {
    return elements as PanelElement[];
  }
  const updated = new Map(result.updated.map((element) => [element.id, element]));
  return [...elements.map((element) => updated.get(element.id) ?? element), ...result.copies];
}

/** A reason the command cannot be applied, or null when it can. */
export function getPatternProblem(
  tool: PatternTool,
  selectionCount: number,
): "reference" | "tooMany" | "nothing" | null {
  if (isAwaitingReference(tool)) {
    return "reference";
  }
  const copies = getPatternCopyCount(tool, selectionCount);
  if (copies > MAX_ARRAY_COPIES) {
    return "tooMany";
  }
  if (tool.kind !== "mirror" && copies <= 0) {
    return "nothing";
  }
  return null;
}

export function clampPatternTool(tool: PatternTool): PatternTool {
  const integer = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));
  switch (tool.kind) {
    case "rectangular":
      return {
        ...tool,
        columns: integer(tool.columns, 1, MAX_ARRAY_SIDE),
        rows: integer(tool.rows, 1, MAX_ARRAY_SIDE),
      };
    case "circular":
      return { ...tool, count: integer(tool.count, 2, MAX_CIRCULAR_COUNT) };
    default:
      return tool;
  }
}

/* Snapping of references and handles ------------------------------------------------------ */

export interface PatternSnapContext {
  /** Points a reference snaps to: the centers of the other elements and of the panel. */
  targets: Vector2[];
  /** How close the pointer must come to a target, in mm (a few pixels at the current zoom). */
  thresholdMm: number;
  /** Grid to fall back on, or null when snapping is off. */
  gridSizeMm: number | null;
  panelSizeMm: Vector2;
}

export interface SnappedPoint {
  pointMm: Vector2;
  /** The target it snapped to, if any. */
  targetMm: Vector2 | null;
}

function snapToGrid(point: Vector2, context: PatternSnapContext): Vector2 {
  return context.gridSizeMm
    ? snapPointToGrid(point, context.gridSizeMm, context.panelSizeMm)
    : point;
}

/** A point snapped to the nearest target within reach, else to the grid. */
export function snapReferencePoint(point: Vector2, context: PatternSnapContext): SnappedPoint {
  let best: Vector2 | null = null;
  let bestDistance = context.thresholdMm;
  for (const target of context.targets) {
    const d = distance(point, target);
    if (d <= bestDistance) {
      best = target;
      bestDistance = d;
    }
  }
  return best
    ? { pointMm: { ...best }, targetMm: best }
    : { pointMm: snapToGrid(point, context), targetMm: null };
}

/**
 * A mirror line through the pointer: it only snaps across its own direction, to the target
 * whose x (vertical line) or y (horizontal line) is the nearest.
 */
export function snapMirrorLine(
  point: Vector2,
  orientation: MirrorAxis,
  context: PatternSnapContext,
): SnappedPoint {
  const axis = orientation === "vertical" ? "x" : "y";
  let best: Vector2 | null = null;
  let bestDistance = context.thresholdMm;
  for (const target of context.targets) {
    const d = Math.abs(point[axis] - target[axis]);
    if (d <= bestDistance) {
      best = target;
      bestDistance = d;
    }
  }
  if (best) {
    return { pointMm: { ...point, [axis]: best[axis] }, targetMm: best };
  }
  const gridPoint = snapToGrid(point, context);
  return { pointMm: { ...point, [axis]: gridPoint[axis] }, targetMm: null };
}

/** Sets the reference of the command from a click on the panel. */
export function pickPatternReference(
  tool: PatternTool,
  point: Vector2,
  context: PatternSnapContext,
): PatternTool {
  if (tool.kind === "mirror") {
    return { ...tool, lineMm: snapMirrorLine(point, tool.orientation, context).pointMm };
  }
  if (tool.kind === "circular") {
    return { ...tool, centerMm: snapReferencePoint(point, context).pointMm };
  }
  return tool;
}

/* Handles --------------------------------------------------------------------------------- */

export type PatternHandleId = "spacing-x" | "spacing-y" | "diameter" | "center" | "line";

export interface PatternArrow {
  id: PatternHandleId;
  fromMm: Vector2;
  toMm: Vector2;
  label: string;
}

export interface PatternGuides {
  /** Arrows dragged by their tip. */
  arrows: PatternArrow[];
  /** Points dragged as they are, such as the center of a circle. */
  points: { id: PatternHandleId; atMm: Vector2 }[];
  /** Lines dragged across, such as the mirror line, and fixed ones when id is null. */
  lines: { id: PatternHandleId | null; fromMm: Vector2; toMm: Vector2 }[];
  circles: { centerMm: Vector2; radiusMm: number }[];
  /** Where a click would put the reference, shown under the pointer. */
  candidate?: boolean;
}

const EMPTY_GUIDES: PatternGuides = { arrows: [], points: [], lines: [], circles: [] };
// Mirror lines run past the panel so they read as lines, not as a panel edge.
const LINE_OVERHANG_MM = 6;

function formatMm(value: number): string {
  return `${Number(value.toFixed(2))} mm`;
}

function mirrorLineGuide(lineMm: Vector2, orientation: MirrorAxis, panelSizeMm: Vector2) {
  return orientation === "vertical"
    ? {
        fromMm: { x: lineMm.x, y: -LINE_OVERHANG_MM },
        toMm: { x: lineMm.x, y: panelSizeMm.y + LINE_OVERHANG_MM },
      }
    : {
        fromMm: { x: -LINE_OVERHANG_MM, y: lineMm.y },
        toMm: { x: panelSizeMm.x + LINE_OVERHANG_MM, y: lineMm.y },
      };
}

/** The handles and construction lines the canvas draws for the command. */
export function getPatternGuides(
  selection: readonly PanelElement[],
  tool: PatternTool,
  panelSizeMm: Vector2,
): PatternGuides {
  const selectionCenter = getElementsCenter(selection);
  if (!selectionCenter) {
    return EMPTY_GUIDES;
  }
  switch (tool.kind) {
    case "mirror":
      return tool.lineMm
        ? {
            ...EMPTY_GUIDES,
            lines: [{ id: "line", ...mirrorLineGuide(tool.lineMm, tool.orientation, panelSizeMm) }],
          }
        : EMPTY_GUIDES;
    case "rectangular":
      return {
        ...EMPTY_GUIDES,
        arrows: [
          {
            id: "spacing-x",
            fromMm: selectionCenter,
            toMm: { x: selectionCenter.x + tool.spacingMm.x, y: selectionCenter.y },
            label: `${formatMm(tool.spacingMm.x)} × ${tool.columns}`,
          },
          {
            id: "spacing-y",
            fromMm: selectionCenter,
            toMm: { x: selectionCenter.x, y: selectionCenter.y + tool.spacingMm.y },
            label: `${formatMm(tool.spacingMm.y)} × ${tool.rows}`,
          },
        ],
      };
    case "circular": {
      const placement = getCircularPlacement(selection, tool);
      if (!placement || !tool.centerMm) {
        return EMPTY_GUIDES;
      }
      const arcGuides: PatternGuides["lines"] = [];
      // A partial sweep shows where its last instance lands.
      if (Math.abs(tool.sweepDeg) < 360 && placement.radius > MIN_RADIUS_MM) {
        const step = getCircularStepDeg(tool);
        const startAngle = Math.atan2(
          placement.onCircle.y - tool.centerMm.y,
          placement.onCircle.x - tool.centerMm.x,
        );
        const angle = startAngle + (step * (tool.count - 1) * Math.PI) / 180;
        arcGuides.push({
          id: null,
          fromMm: tool.centerMm,
          toMm: {
            x: tool.centerMm.x + Math.cos(angle) * placement.radius,
            y: tool.centerMm.y + Math.sin(angle) * placement.radius,
          },
        });
      }
      return {
        arrows: [
          {
            id: "diameter",
            fromMm: tool.centerMm,
            toMm: placement.onCircle,
            label: `Ø ${formatMm(placement.radius * 2)}`,
          },
        ],
        points: [{ id: "center", atMm: tool.centerMm }],
        lines: arcGuides,
        circles: [{ centerMm: tool.centerMm, radiusMm: placement.radius }],
      };
    }
  }
}

/** What a click at the pointer would place, drawn while the command waits for its reference. */
export function getPatternCandidateGuides(
  tool: PatternTool,
  point: Vector2,
  context: PatternSnapContext,
): PatternGuides | null {
  if (tool.kind === "mirror" && tool.lineMm === null) {
    const { pointMm } = snapMirrorLine(point, tool.orientation, context);
    return {
      ...EMPTY_GUIDES,
      lines: [{ id: null, ...mirrorLineGuide(pointMm, tool.orientation, context.panelSizeMm) }],
      candidate: true,
    };
  }
  if (tool.kind === "circular" && tool.centerMm === null) {
    const { pointMm } = snapReferencePoint(point, context);
    return { ...EMPTY_GUIDES, points: [{ id: "center", atMm: pointMm }], candidate: true };
  }
  return null;
}

/** Snaps a length to whole grid steps, keeping its sign. */
function snapLength(value: number, context: PatternSnapContext): number {
  if (!context.gridSizeMm) {
    return Math.round(value * 100) / 100;
  }
  return Math.round(value / context.gridSizeMm) * context.gridSizeMm;
}

/** The command after one of its handles is dragged to the pointer. */
export function dragPatternHandle(
  selection: readonly PanelElement[],
  tool: PatternTool,
  handle: PatternHandleId,
  point: Vector2,
  context: PatternSnapContext,
): PatternTool {
  const selectionCenter = getElementsCenter(selection);
  if (!selectionCenter) {
    return tool;
  }
  if (tool.kind === "rectangular" && (handle === "spacing-x" || handle === "spacing-y")) {
    const axis = handle === "spacing-x" ? "x" : "y";
    const spacing = snapLength(point[axis] - selectionCenter[axis], context);
    // Pulling an arrow out of a single column (or row) asks for a second one.
    const countKey = axis === "x" ? "columns" : "rows";
    return {
      ...tool,
      spacingMm: { ...tool.spacingMm, [axis]: spacing },
      [countKey]: Math.max(tool[countKey], 2),
    };
  }
  if (tool.kind === "circular" && tool.centerMm) {
    if (handle === "center") {
      return { ...tool, centerMm: snapReferencePoint(point, context).pointMm };
    }
    if (handle === "diameter") {
      const placement = getCircularPlacement(selection, tool);
      if (!placement) {
        return tool;
      }
      // Along the arrow only: the selection keeps its direction from the center.
      const dx = placement.onCircle.x - tool.centerMm.x;
      const dy = placement.onCircle.y - tool.centerMm.y;
      const length = Math.hypot(dx, dy);
      const along =
        length < MIN_RADIUS_MM
          ? distance(point, tool.centerMm)
          : ((point.x - tool.centerMm.x) * dx + (point.y - tool.centerMm.y) * dy) / length;
      const diameter = Math.max(0, snapLength(Math.max(0, along) * 2, context));
      return { ...tool, diameterMm: diameter };
    }
  }
  if (tool.kind === "mirror" && tool.lineMm && handle === "line") {
    return { ...tool, lineMm: snapMirrorLine(point, tool.orientation, context).pointMm };
  }
  return tool;
}

/** The diameter the circle has now, set or kept from where the selection sits. */
export function getCircularDiameterMm(
  selection: readonly PanelElement[],
  tool: CircularPatternTool,
): number | null {
  const placement = getCircularPlacement(selection, tool);
  return placement ? placement.radius * 2 : null;
}
