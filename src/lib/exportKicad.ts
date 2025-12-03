import {
  PanelElementType,
  type MountingHole,
  type PanelElement,
  type PanelModel
} from '@lib/panelTypes';

interface CircularCutout {
  cx: number;
  cy: number;
  radius: number;
}

interface RectangularCutout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SVG_STROKE = 'black';
const SVG_STROKE_WIDTH = 0.1;
const EDGE_CUT_WIDTH = 0.15;
const MIN_CIRCLE_SEGMENTS = 32;
const PCB_VERSION = 20231126;
const PCB_GENERATOR = 'eurorack-panel-designer';

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const fixed = Number.parseFloat(value.toFixed(4));
  if (Object.is(fixed, -0)) {
    return '0';
  }

  return fixed.toString();
}

function collectCircularCutouts(
  model: PanelModel,
  mountingHoles: MountingHole[]
): CircularCutout[] {
  const holes: CircularCutout[] = mountingHoles
    .filter((hole) => hole.diameterMm > 0)
    .map((hole) => ({
      cx: hole.center.x,
      cy: hole.center.y,
      radius: hole.diameterMm / 2
    }));

  for (const element of model.elements) {
    if (!hasCircularCutout(element)) {
      continue;
    }

    const radius = element.properties.diameterMm / 2;
    if (radius <= 0) {
      continue;
    }

    holes.push({
      cx: element.positionMm.x,
      cy: element.positionMm.y,
      radius
    });
  }

  return holes;
}

function collectRectangularCutouts(model: PanelModel): RectangularCutout[] {
  const holes: RectangularCutout[] = [];

  for (const element of model.elements) {
    if (element.type !== PanelElementType.Switch) {
      continue;
    }

    const props = element.properties;
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      continue;
    }

    holes.push({
      x: element.positionMm.x - props.widthMm / 2,
      y: element.positionMm.y - props.heightMm / 2,
      width: props.widthMm,
      height: props.heightMm
    });
  }

  return holes;
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

export function buildKicadEdgeCutsSvg(
  model: PanelModel,
  mountingHoles: MountingHole[]
): string {
  const width = formatNumber(model.dimensions.widthMm);
  const height = formatNumber(model.dimensions.heightMm);
  const circularCutouts = collectCircularCutouts(model, mountingHoles);
  const rectangularCutouts = collectRectangularCutouts(model);

  const circularSvgs = circularCutouts
    .map(
      (hole) =>
        `  <circle cx="${formatNumber(hole.cx)}" cy="${formatNumber(
          hole.cy
        )}" r="${formatNumber(hole.radius)}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none" />`
    )
    .join('\n');

  const rectangularSvgs = rectangularCutouts
    .map(
      (hole) =>
        `  <rect x="${formatNumber(hole.x)}" y="${formatNumber(
          hole.y
        )}" width="${formatNumber(hole.width)}" height="${formatNumber(
          hole.height
        )}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none" />`
    )
    .join('\n');

  const holeLines = [circularSvgs, rectangularSvgs].filter(Boolean).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" stroke="${SVG_STROKE}" stroke-width="${SVG_STROKE_WIDTH}" fill="none" />${
    holeLines ? `\n${holeLines}` : ''
  }
</svg>`;
}

function grLine(startX: number, startY: number, endX: number, endY: number): string {
  return `(gr_line (start ${formatNumber(startX)} ${formatNumber(
    startY
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
    grLine(left, bottom, left, top)
  ];
}

function circleLines(
  cx: number,
  cy: number,
  radius: number,
  segments = MIN_CIRCLE_SEGMENTS
): string[] {
  const segmentCount = Math.max(MIN_CIRCLE_SEGMENTS, segments);
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < segmentCount; i += 1) {
    const angle = (i / segmentCount) * Math.PI * 2;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    });
  }

  const lines: string[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    lines.push(grLine(current.x, current.y, next.x, next.y));
  }

  return lines;
}

export function buildKicadPcbFile(
  model: PanelModel,
  mountingHoles: MountingHole[]
): string {
  const width = model.dimensions.widthMm;
  const height = model.dimensions.heightMm;
  const circularCutouts = collectCircularCutouts(model, mountingHoles);
  const rectangularCutouts = collectRectangularCutouts(model);

  const outlineLines = rectangleLines(0, 0, width, height);
  const holeLines = [
    ...rectangularCutouts.flatMap((hole) =>
      rectangleLines(hole.x, hole.y, hole.width, hole.height)
    ),
    ...circularCutouts.flatMap((hole) => circleLines(hole.cx, hole.cy, hole.radius))
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
${allLines.join('\n')}
)`;
}
