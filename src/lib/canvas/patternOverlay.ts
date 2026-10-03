import type { Vector2 } from "@lib/panelTypes";
import type { PatternGuides, PatternHandleId } from "@lib/patternTool";

import { projectPanelPoint, type CanvasTransform } from "./transform";

/** What the canvas draws for a running mirror or pattern command. */
export interface PatternOverlay {
  guides: PatternGuides;
  /** Where a click would put the reference, under the pointer. */
  candidate: PatternGuides | null;
  /** Elements the command adds, outlined so they read as a preview. */
  copyIds: ReadonlySet<string>;
  /** The handle under the pointer or being dragged, drawn brighter. */
  activeHandle: PatternHandleId | null;
}

const GUIDE_COLOR = "#f59e0b";
const GUIDE_ACTIVE_COLOR = "#fde68a";
const HALO_COLOR = "rgba(3, 7, 18, 0.85)";
const ARROW_HEAD_PX = 11;
const ARROW_TIP_RADIUS_PX = 6;
const CENTER_RADIUS_PX = 6;
const LABEL_FONT_PX = 11;
export const PATTERN_HANDLE_HIT_PX = 11;
const LINE_HIT_PX = 6;

function distanceToSegment(point: Vector2, from: Vector2, to: Vector2): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0
      ? 0
      : Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSq));
  return Math.hypot(point.x - (from.x + t * dx), point.y - (from.y + t * dy));
}

/** The handle under a point of the canvas, in pixels: arrow tips and points first, then lines. */
export function findPatternHandleAtPoint(
  guides: PatternGuides,
  pointPx: Vector2,
  transform: CanvasTransform,
): PatternHandleId | null {
  let best: PatternHandleId | null = null;
  let bestDistance = PATTERN_HANDLE_HIT_PX;
  const consider = (id: PatternHandleId, atMm: Vector2) => {
    const atPx = projectPanelPoint(atMm, transform);
    const d = Math.hypot(pointPx.x - atPx.x, pointPx.y - atPx.y);
    if (d <= bestDistance) {
      best = id;
      bestDistance = d;
    }
  };
  guides.arrows.forEach((arrow) => consider(arrow.id, arrow.toMm));
  guides.points.forEach((point) => consider(point.id, point.atMm));
  if (best) {
    return best;
  }
  for (const line of guides.lines) {
    if (!line.id) {
      continue;
    }
    const d = distanceToSegment(
      pointPx,
      projectPanelPoint(line.fromMm, transform),
      projectPanelPoint(line.toMm, transform),
    );
    if (d <= LINE_HIT_PX) {
      return line.id;
    }
  }
  return null;
}

function strokeWithHalo(context: CanvasRenderingContext2D, color: string, widthPx: number) {
  context.strokeStyle = HALO_COLOR;
  context.lineWidth = widthPx + 2;
  context.stroke();
  context.strokeStyle = color;
  context.lineWidth = widthPx;
  context.stroke();
}

function drawLabel(
  context: CanvasRenderingContext2D,
  text: string,
  atPx: Vector2,
  fontFamily: string,
) {
  context.font = `600 ${LABEL_FONT_PX}px ${fontFamily}`;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = 3;
  context.strokeStyle = HALO_COLOR;
  context.strokeText(text, atPx.x, atPx.y);
  context.fillStyle = GUIDE_ACTIVE_COLOR;
  context.fillText(text, atPx.x, atPx.y);
}

function drawGuides(
  context: CanvasRenderingContext2D,
  guides: PatternGuides,
  transform: CanvasTransform,
  activeHandle: PatternHandleId | null,
  fontFamily: string,
) {
  const colorFor = (id: PatternHandleId | null) =>
    id !== null && id === activeHandle ? GUIDE_ACTIVE_COLOR : GUIDE_COLOR;
  const dash = guides.candidate ? [6, 5] : [];

  guides.circles.forEach(({ centerMm, radiusMm }) => {
    const centerPx = projectPanelPoint(centerMm, transform);
    context.beginPath();
    context.arc(centerPx.x, centerPx.y, radiusMm * transform.scale, 0, Math.PI * 2);
    context.setLineDash([4, 4]);
    strokeWithHalo(context, GUIDE_COLOR, 1);
    context.setLineDash([]);
  });

  guides.lines.forEach((line) => {
    const fromPx = projectPanelPoint(line.fromMm, transform);
    const toPx = projectPanelPoint(line.toMm, transform);
    context.beginPath();
    context.moveTo(fromPx.x, fromPx.y);
    context.lineTo(toPx.x, toPx.y);
    // Construction lines are thin; the mirror line, picked or about to be, is not.
    const isMain = line.id !== null || guides.candidate === true;
    context.setLineDash(isMain ? dash : [4, 4]);
    strokeWithHalo(context, colorFor(line.id), isMain ? 2 : 1);
    context.setLineDash([]);
  });

  guides.arrows.forEach((arrow) => {
    const fromPx = projectPanelPoint(arrow.fromMm, transform);
    const toPx = projectPanelPoint(arrow.toMm, transform);
    const angle = Math.atan2(toPx.y - fromPx.y, toPx.x - fromPx.x);
    const length = Math.hypot(toPx.x - fromPx.x, toPx.y - fromPx.y);
    const color = colorFor(arrow.id);
    if (length > ARROW_HEAD_PX) {
      context.beginPath();
      context.moveTo(fromPx.x, fromPx.y);
      context.lineTo(
        toPx.x - Math.cos(angle) * ARROW_HEAD_PX * 0.8,
        toPx.y - Math.sin(angle) * ARROW_HEAD_PX * 0.8,
      );
      strokeWithHalo(context, color, 2);
      context.beginPath();
      context.moveTo(toPx.x, toPx.y);
      context.lineTo(
        toPx.x - Math.cos(angle - 0.45) * ARROW_HEAD_PX,
        toPx.y - Math.sin(angle - 0.45) * ARROW_HEAD_PX,
      );
      context.lineTo(
        toPx.x - Math.cos(angle + 0.45) * ARROW_HEAD_PX,
        toPx.y - Math.sin(angle + 0.45) * ARROW_HEAD_PX,
      );
      context.closePath();
      context.fillStyle = color;
      context.strokeStyle = HALO_COLOR;
      context.lineWidth = 1.5;
      context.stroke();
      context.fill();
    }
    // The tip is what is dragged, even when the arrow has no length yet.
    context.beginPath();
    context.arc(toPx.x, toPx.y, ARROW_TIP_RADIUS_PX, 0, Math.PI * 2);
    context.fillStyle = arrow.id === activeHandle ? GUIDE_ACTIVE_COLOR : "rgba(245, 158, 11, 0.25)";
    context.fill();
    strokeWithHalo(context, color, 1.5);
    drawLabel(context, arrow.label, { x: toPx.x + 10, y: toPx.y - 12 }, fontFamily);
  });

  guides.points.forEach((point) => {
    const atPx = projectPanelPoint(point.atMm, transform);
    const color = colorFor(point.id);
    context.beginPath();
    context.moveTo(atPx.x - CENTER_RADIUS_PX - 5, atPx.y);
    context.lineTo(atPx.x + CENTER_RADIUS_PX + 5, atPx.y);
    context.moveTo(atPx.x, atPx.y - CENTER_RADIUS_PX - 5);
    context.lineTo(atPx.x, atPx.y + CENTER_RADIUS_PX + 5);
    strokeWithHalo(context, color, 1.5);
    context.beginPath();
    context.arc(atPx.x, atPx.y, CENTER_RADIUS_PX, 0, Math.PI * 2);
    context.setLineDash(dash);
    strokeWithHalo(context, color, 2);
    context.setLineDash([]);
  });
}

export function drawPatternOverlay(
  context: CanvasRenderingContext2D,
  overlay: PatternOverlay,
  transform: CanvasTransform,
  fontFamily: string,
) {
  context.save();
  context.lineCap = "round";
  drawGuides(context, overlay.guides, transform, overlay.activeHandle, fontFamily);
  if (overlay.candidate) {
    context.globalAlpha = 0.85;
    drawGuides(context, overlay.candidate, transform, null, fontFamily);
  }
  context.restore();
}

export const PATTERN_COPY_OUTLINE_COLOR = GUIDE_COLOR;
