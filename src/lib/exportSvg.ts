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
    case PanelElementType.Rectangle: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const x = element.positionMm.x - props.widthMm / 2;
      const y = element.positionMm.y - props.heightMm / 2;
      return `<rect x="${x}" y="${y}" width="${props.widthMm}" height="${props.heightMm}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    }
    case PanelElementType.Oval: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const rx = props.widthMm / 2;
      const ry = props.heightMm / 2;
      return `<ellipse cx="${element.positionMm.x}" cy="${element.positionMm.y}" rx="${rx}" ry="${ry}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    }
    case PanelElementType.Slot: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const d = slotPath(element.positionMm.x, element.positionMm.y, props.widthMm, props.heightMm);
      return `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    }
    case PanelElementType.Triangle: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const d = trianglePath(element.positionMm.x, element.positionMm.y, props.widthMm, props.heightMm);
      return `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    }
    case PanelElementType.Insert: {
      const props = element.properties as {
        outerDiameterMm: number;
        innerDiameterMm: number;
        outerDepthMm: number;
        innerDepthMm: number;
        embedDepthMm: number;
      };
      const outerR = props.outerDiameterMm / 2;
      const innerR = props.innerDiameterMm / 2;
      const showHole = props.outerDepthMm > 0 && props.embedDepthMm > 0 && props.innerDepthMm > 0;
      return `<g stroke="${stroke}" stroke-width="${strokeWidth}" fill="none">
  <circle cx="${element.positionMm.x}" cy="${element.positionMm.y}" r="${outerR}" />
  ${showHole ? `<circle cx="${element.positionMm.x}" cy="${element.positionMm.y}" r="${innerR}" />` : ''}
</g>`;
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
    case PanelElementType.Rectangle: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const x = element.positionMm.x - props.widthMm / 2;
      const y = element.positionMm.y - props.heightMm / 2;
      return rectPath(x, y, props.widthMm, props.heightMm);
    }
    case PanelElementType.Oval: {
      const props = element.properties as { widthMm: number; heightMm: number };
      return ellipsePath(
        element.positionMm.x,
        element.positionMm.y,
        props.widthMm / 2,
        props.heightMm / 2
      );
    }
    case PanelElementType.Slot: {
      const props = element.properties as { widthMm: number; heightMm: number };
      return slotPath(
        element.positionMm.x,
        element.positionMm.y,
        props.widthMm,
        props.heightMm
      );
    }
    case PanelElementType.Triangle: {
      const props = element.properties as { widthMm: number; heightMm: number };
      return trianglePath(
        element.positionMm.x,
        element.positionMm.y,
        props.widthMm,
        props.heightMm
      );
    }
    case PanelElementType.Insert: {
      const props = element.properties as {
        innerDiameterMm: number;
        outerDepthMm: number;
        embedDepthMm: number;
        innerDepthMm: number;
      };
      if (props.outerDepthMm <= 0 || props.embedDepthMm <= 0 || props.innerDepthMm <= 0) {
        return null;
      }
      const r = props.innerDiameterMm / 2;
      const cx = element.positionMm.x;
      const cy = element.positionMm.y;
      return circlePath(cx, cy, r);
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

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  const startX = cx - rx;
  const startY = cy;
  return `M ${startX} ${startY} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${startX} ${startY} Z`;
}

function slotPath(cx: number, cy: number, width: number, height: number): string {
  const radius = Math.min(height / 2, width / 2);
  const straightHalf = Math.max(width / 2 - radius, 0);
  const left = cx - straightHalf;
  const right = cx + straightHalf;
  const top = cy - radius;
  const bottom = cy + radius;
  return `M ${left} ${top} H ${right} A ${radius} ${radius} 0 0 1 ${right} ${bottom} H ${left} A ${radius} ${radius} 0 0 1 ${left} ${top} Z`;
}

function trianglePath(cx: number, cy: number, width: number, height: number): string {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const topX = cx;
  const topY = cy - halfHeight;
  const rightX = cx + halfWidth;
  const rightY = cy + halfHeight;
  const leftX = cx - halfWidth;
  const leftY = cy + halfHeight;
  return `M ${topX} ${topY} L ${rightX} ${rightY} L ${leftX} ${leftY} Z`;
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
      if (hole.shape === 'slot' && hole.slotLengthMm) {
        return `<path d="${slotPath(
          hole.center.x,
          hole.center.y,
          hole.slotLengthMm,
          hole.diameterMm
        )}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
      }
      const r = hole.diameterMm / 2;
      return `<circle cx="${hole.center.x}" cy="${hole.center.y}" r="${r}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    })
    .join('\n    ');

  const cutoutPaths = [
    rectPath(0, 0, width, height),
    ...mountingHoles.map((hole) =>
      hole.shape === 'slot' && hole.slotLengthMm
        ? slotPath(hole.center.x, hole.center.y, hole.slotLengthMm, hole.diameterMm)
        : circlePath(hole.center.x, hole.center.y, hole.diameterMm / 2)
    ),
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
