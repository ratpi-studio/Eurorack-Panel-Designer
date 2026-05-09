import {
  PanelElementType,
  type MountingHole,
  type PanelElement,
  type PanelModel,
} from "@lib/panelTypes";
import { buildPanelSurfacePathData } from "@lib/panelSurface";
import { buildSvgArtworkNestedMarkup, isSvgArtworkElement } from "@lib/svgArtwork";

interface SvgOptions {
  stroke?: string;
  strokeWidth?: number;
  panelStroke?: string;
  background?: string | null;
  panelFill?: string;
}

const DEFAULT_STROKE = "#e5e7eb";
const DEFAULT_BACKGROUND: string | null = null;
const DEFAULT_PANEL_FILL = "#0f172a";

function elementToSvg(element: PanelElement, stroke: string): string {
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
      const d = trianglePath(
        element.positionMm.x,
        element.positionMm.y,
        props.widthMm,
        props.heightMm,
      );
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
  ${showHole ? `<circle cx="${element.positionMm.x}" cy="${element.positionMm.y}" r="${innerR}" />` : ""}
</g>`;
    }
    case PanelElementType.Label: {
      const props = element.properties as { fontSizePt: number; text: string };
      const fontSizePx = props.fontSizePt * 1.333; // rough pt→px
      return `<text x="${element.positionMm.x}" y="${element.positionMm.y}" fill="${stroke}" font-size="${fontSizePx}" font-family="Arial, sans-serif" dominant-baseline="middle" text-anchor="middle">${escapeXml(
        props.text,
      )}</text>`;
    }
    default:
      return "";
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
  options?: SvgOptions,
): string {
  const stroke = options?.stroke ?? model.designColor ?? DEFAULT_STROKE;
  const strokeWidth = options?.strokeWidth ?? 0.8;
  const panelStroke = options?.panelStroke ?? stroke;
  const background = options?.background ?? DEFAULT_BACKGROUND;
  const panelFill = options?.panelFill ?? model.panelColor ?? DEFAULT_PANEL_FILL;

  const width = model.dimensions.widthMm;
  const height = model.dimensions.heightMm;

  const elementsSvg = model.elements
    .filter((element) => !isSvgArtworkElement(element))
    .map((element) => elementToSvg(element, stroke))
    .join("\n    ");
  const artworkSvg = model.elements
    .filter(isSvgArtworkElement)
    .map((element) =>
      buildSvgArtworkNestedMarkup({
        ...element,
        properties: {
          ...element.properties,
          color: stroke,
        },
      }),
    )
    .join("\n    ");
  const holeOutlines = mountingHoles
    .map((hole) => {
      if (hole.shape === "slot" && hole.slotLengthMm) {
        return `<path d="${slotPath(
          hole.center.x,
          hole.center.y,
          hole.slotLengthMm,
          hole.diameterMm,
        )}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
      }
      const r = hole.diameterMm / 2;
      return `<circle cx="${hole.center.x}" cy="${hole.center.y}" r="${r}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`;
    })
    .join("\n    ");

  const cutoutPaths = buildPanelSurfacePathData({
    panelSizeMm: { x: width, y: height },
    mountingHoles,
    elements: model.elements,
  });

  const backgroundRect =
    background === null
      ? ""
      : `  <rect width="${width}" height="${height}" fill="${background}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm">
${backgroundRect}
  <defs>
    <clipPath id="panel-surface-clip" clipPathUnits="userSpaceOnUse">
      <path d="${cutoutPaths}" clip-rule="evenodd" />
    </clipPath>
  </defs>
  <path d="${cutoutPaths}" fill="${panelFill}" fill-rule="evenodd" stroke="${panelStroke}" stroke-width="${strokeWidth}" />
  ${artworkSvg ? `    <g clip-path="url(#panel-surface-clip)">\n    ${artworkSvg}\n    </g>` : ""}
  ${holeOutlines ? `    ${holeOutlines}` : ""}
  ${elementsSvg ? `    ${elementsSvg}` : ""}
</svg>`;
}
