import { mergePanelSurface } from "@lib/mergedPanelSurface";
import { elementPointToPanel, type SurfaceRing } from "@lib/panelSurface";
import {
  PanelElementType,
  type MountingHole,
  type PanelElement,
  type PanelModel,
  type Vector2,
} from "@lib/panelTypes";

interface CircularCutout {
  cx: number;
  cy: number;
  radius: number;
}

/** A cut-out sized before rotation, turned by `rotationDeg` around its center like on the canvas. */
interface SizedCutout {
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotationDeg: number;
}

const SVG_STROKE = "black";
const SVG_STROKE_WIDTH = 0.1;
const EDGE_CUT_WIDTH = 0.15;
const MIN_CIRCLE_SEGMENTS = 32;
const PCB_VERSION = 20231126;
const PCB_GENERATOR = "eurorack-panel-designer";

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const fixed = Number.parseFloat(value.toFixed(4));
  if (Object.is(fixed, -0)) {
    return "0";
  }

  return fixed.toString();
}

interface EdgeCuts {
  /** Outline and opening rings, once cut-outs that overlap each other or the edge are merged. */
  mergedRings: Vector2[][] | null;
  /** The panel with only the cut-outs that keep their own shape. */
  model: PanelModel;
  mountingHoles: MountingHole[];
}

/** Ring corners at the precision of the file, without repeats that would make zero-length lines. */
function roundRing(ring: SurfaceRing): Vector2[] {
  const points: Vector2[] = [];
  for (const [x, y] of ring) {
    const point = { x: Number(formatNumber(x)), y: Number(formatNumber(y)) };
    const previous = points[points.length - 1];
    if (!previous || previous.x !== point.x || previous.y !== point.y) {
      points.push(point);
    }
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length > 1 && first.x === last.x && first.y === last.y) {
    points.pop();
  }
  return points;
}

/**
 * Merges cut-outs that overlap each other or cross the panel edge into the outline, like the STL:
 * drawn one by one, their outlines would cross, which KiCad rejects as a board outline. The other
 * cut-outs keep their own shapes.
 */
function planEdgeCuts(model: PanelModel, mountingHoles: MountingHole[]): EdgeCuts {
  const merged = mergePanelSurface({
    panelSizeMm: { x: model.dimensions.widthMm, y: model.dimensions.heightMm },
    mountingHoles,
    elements: model.elements,
  });
  if (!merged) {
    return { mergedRings: null, model, mountingHoles };
  }
  const mergedSources = new Set(merged.mergedCutouts.map((cutout) => cutout.source));
  return {
    mergedRings: merged.polygons
      .flat()
      .map(roundRing)
      .filter((ring) => ring.length >= 3),
    model: { ...model, elements: model.elements.filter((element) => !mergedSources.has(element)) },
    mountingHoles: mountingHoles.filter((hole) => !mergedSources.has(hole)),
  };
}

function collectCircularCutouts(
  model: PanelModel,
  mountingHoles: MountingHole[],
): CircularCutout[] {
  const holes: CircularCutout[] = mountingHoles
    .filter((hole) => hole.diameterMm > 0 && hole.shape !== "slot")
    .map((hole) => ({
      cx: hole.center.x,
      cy: hole.center.y,
      radius: hole.diameterMm / 2,
    }));

  for (const element of model.elements) {
    if (element.type === PanelElementType.Insert) {
      if (
        element.properties.outerDepthMm <= 0 ||
        element.properties.embedDepthMm <= 0 ||
        element.properties.innerDepthMm <= 0
      ) {
        continue;
      }
      const radius = element.properties.innerDiameterMm / 2;
      if (radius > 0) {
        holes.push({
          cx: element.positionMm.x,
          cy: element.positionMm.y,
          radius,
        });
      }
      continue;
    }

    if (hasCircularCutout(element)) {
      const radius = element.properties.diameterMm / 2;
      if (radius > 0) {
        holes.push({
          cx: element.positionMm.x,
          cy: element.positionMm.y,
          radius,
        });
      }
    }
  }

  return holes;
}

function collectSizedCutouts(model: PanelModel, types: PanelElementType[]): SizedCutout[] {
  const holes: SizedCutout[] = [];

  for (const element of model.elements) {
    if (!types.includes(element.type)) {
      continue;
    }
    const props = element.properties as { widthMm: number; heightMm: number };
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      continue;
    }
    holes.push({
      cx: element.positionMm.x,
      cy: element.positionMm.y,
      width: props.widthMm,
      height: props.heightMm,
      rotationDeg: element.rotationDeg ?? 0,
    });
  }

  return holes;
}

function collectRectangularCutouts(model: PanelModel): SizedCutout[] {
  return collectSizedCutouts(model, [PanelElementType.Switch, PanelElementType.Rectangle]);
}

function collectOvalCutouts(model: PanelModel): SizedCutout[] {
  return collectSizedCutouts(model, [PanelElementType.Oval]);
}

function collectSlotCutouts(model: PanelModel, mountingHoles: MountingHole[]): SizedCutout[] {
  const railSlots: SizedCutout[] = mountingHoles
    .filter((hole) => hole.shape === "slot" && (hole.slotLengthMm ?? hole.diameterMm) > 0)
    .map((hole) => ({
      cx: hole.center.x,
      cy: hole.center.y,
      width: hole.slotLengthMm ?? hole.diameterMm,
      height: hole.diameterMm,
      rotationDeg: 0,
    }));

  return [...railSlots, ...collectSizedCutouts(model, [PanelElementType.Slot])];
}

function collectTriangleCutouts(model: PanelModel): SizedCutout[] {
  return collectSizedCutouts(model, [PanelElementType.Triangle]);
}

/** SVG transform turning a cut-out around its center like on the canvas; empty when unrotated. */
function rotationTransform(hole: SizedCutout): string {
  if (!hole.rotationDeg) {
    return "";
  }
  return ` transform="rotate(${formatNumber(hole.rotationDeg)} ${formatNumber(hole.cx)} ${formatNumber(
    hole.cy,
  )})"`;
}

/** Places points given around the cut-out center, before rotation, on the panel. */
function placeCutoutPoints(hole: SizedCutout, localPoints: Vector2[]): Vector2[] {
  const center = { x: hole.cx, y: hole.cy };
  return localPoints.map((point) => elementPointToPanel(point, center, hole.rotationDeg));
}

function hasCircularCutout(element: PanelElement): element is PanelElement & {
  properties: { diameterMm: number };
} {
  return (
    element.type === PanelElementType.Jack ||
    element.type === PanelElementType.Potentiometer ||
    element.type === PanelElementType.Led
  );
}

export function buildKicadEdgeCutsSvg(model: PanelModel, mountingHoles: MountingHole[]): string {
  const width = formatNumber(model.dimensions.widthMm);
  const height = formatNumber(model.dimensions.heightMm);
  const edgeCuts = planEdgeCuts(model, mountingHoles);
  const circularCutouts = collectCircularCutouts(edgeCuts.model, edgeCuts.mountingHoles);
  const rectangularCutouts = collectRectangularCutouts(edgeCuts.model);
  const ovalCutouts = collectOvalCutouts(edgeCuts.model);
  const slotCutouts = collectSlotCutouts(edgeCuts.model, edgeCuts.mountingHoles);
  const triangleCutouts = collectTriangleCutouts(edgeCuts.model);

  const outlineSvg = edgeCuts.mergedRings
    ? edgeCuts.mergedRings
        .map(
          (ring) =>
            `  <path d="${ringPath(ring)}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none" />`,
        )
        .join("\n")
    : `  <rect x="0" y="0" width="${width}" height="${height}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none" />`;

  const circularSvgs = circularCutouts
    .map(
      (hole) =>
        `  <circle cx="${formatNumber(hole.cx)}" cy="${formatNumber(
          hole.cy,
        )}" r="${formatNumber(hole.radius)}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none" />`,
    )
    .join("\n");

  const rectangularSvgs = rectangularCutouts
    .map(
      (hole) =>
        `  <rect x="${formatNumber(hole.cx - hole.width / 2)}" y="${formatNumber(
          hole.cy - hole.height / 2,
        )}" width="${formatNumber(hole.width)}" height="${formatNumber(
          hole.height,
        )}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none"${rotationTransform(hole)} />`,
    )
    .join("\n");

  const ovalSvgs = ovalCutouts
    .map(
      (hole) =>
        `  <ellipse cx="${formatNumber(hole.cx)}" cy="${formatNumber(
          hole.cy,
        )}" rx="${formatNumber(hole.width / 2)}" ry="${formatNumber(
          hole.height / 2,
        )}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none"${rotationTransform(hole)} />`,
    )
    .join("\n");

  const slotSvgs = slotCutouts
    .map(
      (hole) =>
        `  <path d="${slotPath(
          hole.cx,
          hole.cy,
          hole.width,
          hole.height,
        )}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none"${rotationTransform(hole)} />`,
    )
    .join("\n");

  const triangleSvgs = triangleCutouts
    .map(
      (hole) =>
        `  <path d="${trianglePath(
          hole.cx,
          hole.cy,
          hole.width,
          hole.height,
        )}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none"${rotationTransform(hole)} />`,
    )
    .join("\n");

  const holeLines = [circularSvgs, rectangularSvgs, ovalSvgs, slotSvgs, triangleSvgs]
    .filter(Boolean)
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
${outlineSvg}${holeLines ? `\n${holeLines}` : ""}
</svg>`;
}

function grLine(startX: number, startY: number, endX: number, endY: number): string {
  return `(gr_line (start ${formatNumber(startX)} ${formatNumber(
    startY,
  )}) (end ${formatNumber(endX)} ${formatNumber(endY)}) (layer "Edge.Cuts") (width ${EDGE_CUT_WIDTH}))`;
}

function rectangleLines(x: number, y: number, width: number, height: number): string[] {
  const left = x;
  const right = x + width;
  const top = y;
  const bottom = y + height;

  return [
    grLine(left, top, right, top),
    grLine(right, top, right, bottom),
    grLine(right, bottom, left, bottom),
    grLine(left, bottom, left, top),
  ];
}

function circleLines(
  cx: number,
  cy: number,
  radius: number,
  segments = MIN_CIRCLE_SEGMENTS,
): string[] {
  return closedShapeLines(
    ellipsePoints(radius, radius, segments).map(({ x, y }) => ({
      x: cx + x,
      y: cy + y,
    })),
  );
}

function ellipsePoints(
  radiusX: number,
  radiusY: number,
  segments = MIN_CIRCLE_SEGMENTS,
): Vector2[] {
  const segmentCount = Math.max(MIN_CIRCLE_SEGMENTS, segments);
  const points: Vector2[] = [];

  for (let i = 0; i < segmentCount; i += 1) {
    const angle = (i / segmentCount) * Math.PI * 2;
    points.push({
      x: radiusX * Math.cos(angle),
      y: radiusY * Math.sin(angle),
    });
  }

  return points;
}

function rectangleCutoutLines(hole: SizedCutout): string[] {
  const halfWidth = hole.width / 2;
  const halfHeight = hole.height / 2;
  return closedShapeLines(
    placeCutoutPoints(hole, [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight },
    ]),
  );
}

function ovalCutoutLines(hole: SizedCutout): string[] {
  return closedShapeLines(placeCutoutPoints(hole, ellipsePoints(hole.width / 2, hole.height / 2)));
}

function slotCutoutLines(hole: SizedCutout, segments = MIN_CIRCLE_SEGMENTS / 2): string[] {
  const radius = Math.min(hole.width / 2, hole.height / 2);
  const straightHalf = Math.max(hole.width / 2 - radius, 0);
  const arcSegments = Math.max(8, Math.round(segments));
  const points: Vector2[] = [];

  for (let i = 0; i <= arcSegments; i += 1) {
    const angle = -Math.PI / 2 + (i / arcSegments) * Math.PI;
    points.push({
      x: straightHalf + radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  for (let i = 0; i <= arcSegments; i += 1) {
    const angle = Math.PI / 2 + (i / arcSegments) * Math.PI;
    points.push({
      x: -straightHalf + radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  return closedShapeLines(placeCutoutPoints(hole, points));
}

function triangleCutoutLines(hole: SizedCutout): string[] {
  const halfWidth = hole.width / 2;
  const halfHeight = hole.height / 2;
  return closedShapeLines(
    placeCutoutPoints(hole, [
      { x: 0, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight },
    ]),
  );
}

function closedShapeLines(points: Vector2[]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    lines.push(grLine(current.x, current.y, next.x, next.y));
  }
  return lines;
}

function slotPath(cx: number, cy: number, width: number, height: number): string {
  const radius = Math.min(width / 2, height / 2);
  const straightHalf = Math.max(width / 2 - radius, 0);
  const left = cx - straightHalf;
  const right = cx + straightHalf;
  const top = cy - radius;
  const bottom = cy + radius;
  return `M ${formatNumber(left)} ${formatNumber(top)} H ${formatNumber(
    right,
  )} A ${formatNumber(radius)} ${formatNumber(radius)} 0 0 1 ${formatNumber(right)} ${formatNumber(
    bottom,
  )} H ${formatNumber(left)} A ${formatNumber(radius)} ${formatNumber(
    radius,
  )} 0 0 1 ${formatNumber(left)} ${formatNumber(top)} Z`;
}

function ringPath(points: Vector2[]): string {
  const [first, ...rest] = points;
  return [
    `M ${formatNumber(first.x)} ${formatNumber(first.y)}`,
    ...rest.map((point) => `L ${formatNumber(point.x)} ${formatNumber(point.y)}`),
    "Z",
  ].join(" ");
}

function trianglePath(cx: number, cy: number, width: number, height: number): string {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return `M ${formatNumber(cx)} ${formatNumber(
    cy - halfHeight,
  )} L ${formatNumber(cx + halfWidth)} ${formatNumber(
    cy + halfHeight,
  )} L ${formatNumber(cx - halfWidth)} ${formatNumber(cy + halfHeight)} Z`;
}

export function buildKicadPcbFile(model: PanelModel, mountingHoles: MountingHole[]): string {
  const width = model.dimensions.widthMm;
  const height = model.dimensions.heightMm;
  const edgeCuts = planEdgeCuts(model, mountingHoles);
  const circularCutouts = collectCircularCutouts(edgeCuts.model, edgeCuts.mountingHoles);
  const rectangularCutouts = collectRectangularCutouts(edgeCuts.model);
  const ovalCutouts = collectOvalCutouts(edgeCuts.model);
  const slotCutouts = collectSlotCutouts(edgeCuts.model, edgeCuts.mountingHoles);
  const triangleCutouts = collectTriangleCutouts(edgeCuts.model);

  const outlineLines = edgeCuts.mergedRings
    ? edgeCuts.mergedRings.flatMap(closedShapeLines)
    : rectangleLines(0, 0, width, height);
  const holeLines = [
    ...rectangularCutouts.flatMap(rectangleCutoutLines),
    ...circularCutouts.flatMap((hole) => circleLines(hole.cx, hole.cy, hole.radius)),
    ...ovalCutouts.flatMap(ovalCutoutLines),
    ...slotCutouts.flatMap((hole) => slotCutoutLines(hole)),
    ...triangleCutouts.flatMap(triangleCutoutLines),
  ];

  const allLines = [...outlineLines, ...holeLines].map((line) => `  ${line}`);

  return `(kicad_pcb (version ${PCB_VERSION}) (generator "${PCB_GENERATOR}")
  (general)
  (paper "A4")
  (layers
    (0 "F.Cu" signal)
    (31 "B.Cu" signal)
    (32 "Edge.Cuts" user)
  )
${allLines.join("\n")}
)`;
}
