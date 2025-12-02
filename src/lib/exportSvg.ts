import {
  PanelElementType,
  type MountingHole,
  type PanelElement,
  type PanelModel
} from '@lib/panelTypes';

interface SvgOptions {
  stroke?: string;
  strokeWidth?: number;
  panelStroke?: string;
  background?: string | null;
  panelFill?: string;
}

const DEFAULT_STROKE = '#e5e7eb';
const DEFAULT_BACKGROUND: string | null = null;
const DEFAULT_PANEL_FILL = '#0f172a';

function elementToSvg(element: PanelElement): string {
  const stroke = DEFAULT_STROKE;
  const strokeWidth = 0.6;

  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led: {
      const props = element.properties as { diameterMm: number };
      const r = props.diameterMm / 2;
      return `<circle cx="${element.positionMm.x}" cy="${element.positionMm.y}" r="${r}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    }
    case PanelElementType.Switch: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const x = element.positionMm.x - props.widthMm / 2;
      const y = element.positionMm.y - props.heightMm / 2;
      return `<rect x="${x}" y="${y}" width="${props.widthMm}" height="${props.heightMm}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    }
    case PanelElementType.Label: {
      const props = element.properties as { fontSizePt: number; text: string };
      const fontSizePx = props.fontSizePt * 1.333; // rough pt→px
      return `<text x="${element.positionMm.x}" y="${element.positionMm.y}" fill="${stroke}" font-size="${fontSizePx}" font-family="Arial, sans-serif" dominant-baseline="middle" text-anchor="middle">${escapeXml(
        props.text
      )}</text>`;
    }
    default:
      return '';
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function elementCutout(element: PanelElement): string | null {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led: {
      const props = element.properties as { diameterMm: number };
      const r = props.diameterMm / 2;
      const cx = element.positionMm.x;
      const cy = element.positionMm.y;
      return circlePath(cx, cy, r);
    }
    case PanelElementType.Switch: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const x = element.positionMm.x - props.widthMm / 2;
      const y = element.positionMm.y - props.heightMm / 2;
      return rectPath(x, y, props.widthMm, props.heightMm);
    }
    case PanelElementType.Label:
    default:
      return null;
  }
}

function rectPath(x: number, y: number, width: number, height: number): string {
  return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
}

function circlePath(cx: number, cy: number, r: number): string {
  const startX = cx - r;
  const startY = cy;
  return `M ${startX} ${startY} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${startX} ${startY} Z`;
}

export function buildPanelSvg(
  model: PanelModel,
  mountingHoles: MountingHole[],
  options?: SvgOptions
): string {
  const stroke = options?.stroke ?? DEFAULT_STROKE;
  const strokeWidth = options?.strokeWidth ?? 0.8;
  const panelStroke = options?.panelStroke ?? stroke;
  const background = options?.background ?? DEFAULT_BACKGROUND;
  const panelFill = options?.panelFill ?? DEFAULT_PANEL_FILL;

  const width = model.dimensions.widthMm;
  const height = model.dimensions.heightMm;

  const elementsSvg = model.elements.map(elementToSvg).join('\n    ');
  const holeOutlines = mountingHoles
    .map((hole) => {
      const r = hole.diameterMm / 2;
      return `<circle cx="${hole.center.x}" cy="${hole.center.y}" r="${r}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    })
    .join('\n    ');

  const cutoutPaths = [
    rectPath(0, 0, width, height),
    ...mountingHoles.map((hole) => circlePath(hole.center.x, hole.center.y, hole.diameterMm / 2)),
    ...model.elements.map(elementCutout).filter((p): p is string => Boolean(p))
  ].join(' ');

  const backgroundRect =
    background === null
      ? ''
      : `  <rect width="${width}" height="${height}" fill="${background}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm">
${backgroundRect}
  <path d="${cutoutPaths}" fill="${panelFill}" fill-rule="evenodd" stroke="${panelStroke}" stroke-width="${strokeWidth}" />
  ${holeOutlines ? `    ${holeOutlines}` : ''}
  ${elementsSvg ? `    ${elementsSvg}` : ''}
</svg>`;
}
