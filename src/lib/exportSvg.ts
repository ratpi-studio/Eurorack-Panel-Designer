// polygon-clipping stays out of the startup bundle: this module loads on demand.
import polygonClipping from "polygon-clipping";

import { collectKnockoutRings } from "@lib/designLayer";
import { buildMergedPanelSurfacePathData } from "@lib/mergedPanelSurface";
import { reportDegradation } from "@lib/monitoring";
import {
  PanelElementType,
  isLabelElement,
  type LabelElement,
  type MountingHole,
  type PanelElement,
  type PanelModel,
} from "@lib/panelTypes";
import {
  buildPanelCutouts,
  panelOutlineRing,
  surfacePathData,
  type PanelSurfaceInput,
  type SurfaceRing,
} from "@lib/panelSurface";
import { buildSvgArtworkNestedMarkup, isSvgArtworkElement } from "@lib/svgArtwork";
import { getTextFontInfo } from "@lib/text/textFonts";
import { getLabelTextLayout } from "@lib/text/textLayout";
import { PT_TO_MM } from "@lib/units";

interface SvgOptions {
  stroke?: string;
  strokeWidth?: number;
  panelStroke?: string;
  background?: string | null;
  panelFill?: string;
  /** Fill of the SVG patterns and texts; the design color by default, as they print. */
  detailColor?: string;
}

const DEFAULT_STROKE = "#e5e7eb";
const DEFAULT_BACKGROUND: string | null = null;
const DEFAULT_PANEL_FILL = "#0f172a";

/** Turns a shape around the element center like the canvas does; empty when unrotated. */
function rotationTransform(element: PanelElement): string {
  const rotationDeg = element.rotationDeg ?? 0;
  if (!rotationDeg) {
    return "";
  }
  return ` transform="rotate(${rotationDeg} ${element.positionMm.x} ${element.positionMm.y})"`;
}

function elementToSvg(element: PanelElement, stroke: string): string {
  const strokeWidth = 0.6;
  const transform = rotationTransform(element);

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
      return `<rect x="${x}" y="${y}" width="${props.widthMm}" height="${props.heightMm}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"${transform} />`;
    }
    case PanelElementType.Rectangle: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const x = element.positionMm.x - props.widthMm / 2;
      const y = element.positionMm.y - props.heightMm / 2;
      return `<rect x="${x}" y="${y}" width="${props.widthMm}" height="${props.heightMm}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"${transform} />`;
    }
    case PanelElementType.Oval: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const rx = props.widthMm / 2;
      const ry = props.heightMm / 2;
      return `<ellipse cx="${element.positionMm.x}" cy="${element.positionMm.y}" rx="${rx}" ry="${ry}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"${transform} />`;
    }
    case PanelElementType.Slot: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const d = slotPath(element.positionMm.x, element.positionMm.y, props.widthMm, props.heightMm);
      return `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"${transform} />`;
    }
    case PanelElementType.Triangle: {
      const props = element.properties as { widthMm: number; heightMm: number };
      const d = trianglePath(
        element.positionMm.x,
        element.positionMm.y,
        props.widthMm,
        props.heightMm,
      );
      return `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"${transform} />`;
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
    default:
      return "";
  }
}

/**
 * Text as outlines, so the file shows the chosen font wherever it is opened. Without the font
 * (it failed to load), falls back to a text element in the same family and size.
 */
function labelToSvg(element: LabelElement, fill: string): string {
  const { positionMm, properties } = element;
  const layout = getLabelTextLayout(properties);
  if (layout) {
    if (!layout.pathData) {
      return "";
    }
    const rotationDeg = element.rotationDeg ?? 0;
    const transform = `translate(${positionMm.x} ${positionMm.y})${rotationDeg ? ` rotate(${rotationDeg})` : ""}`;
    return `<path d="${layout.pathData}" fill="${fill}" transform="${transform}" />`;
  }
  const fontSizeMm = Math.round(properties.fontSizePt * PT_TO_MM * 1000) / 1000;
  const family = escapeXml(getTextFontInfo(properties.fontId).familyName);
  return `<text x="${positionMm.x}" y="${positionMm.y}" fill="${fill}" font-size="${fontSizeMm}" font-family="${family}, sans-serif" font-weight="bold" dominant-baseline="middle" text-anchor="middle"${rotationTransform(element)}>${escapeXml(
    properties.text,
  )}</text>`;
}

/** Drops the closing point that polygon-clipping repeats at the end of each ring. */
function openRing(ring: SurfaceRing): SurfaceRing {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return ring.length > 1 && first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring;
}

/**
 * Clip path data of the SVG patterns: the panel surface minus the zones cleared by knocked-out
 * texts, for the even-odd rule. Null when polygon-clipping fails on it.
 */
function buildPatternClipPathData(
  input: PanelSurfaceInput,
  knockouts: SurfaceRing[],
): string | null {
  try {
    // Cut-out rings may overlap each other or the panel edge: polygon-clipping takes them as
    // holes all the same.
    const polygons = polygonClipping.difference(
      [
        panelOutlineRing(input.panelSizeMm),
        ...buildPanelCutouts(input).map((cutout) => cutout.ring),
      ],
      ...knockouts.map((ring): polygonClipping.Polygon => [ring]),
    );
    return surfacePathData(polygons.flat().map(openRing));
  } catch (error) {
    reportDegradation(error, "export-svg", "text-knockout");
    return null;
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
  const detailColor = options?.detailColor ?? model.designColor ?? stroke;

  const width = model.dimensions.widthMm;
  const height = model.dimensions.heightMm;
  const surfaceInput: PanelSurfaceInput = {
    panelSizeMm: { x: width, y: height },
    mountingHoles,
    elements: model.elements,
  };

  const elementsSvg = model.elements
    .filter((element) => !isSvgArtworkElement(element) && !isLabelElement(element))
    .map((element) => elementToSvg(element, stroke))
    .join("\n    ");
  const artworkSvg = model.elements
    .filter(isSvgArtworkElement)
    .map((element) =>
      buildSvgArtworkNestedMarkup({
        ...element,
        properties: {
          ...element.properties,
          color: detailColor,
        },
      }),
    )
    .join("\n    ");
  const textSvg = model.elements
    .filter(isLabelElement)
    .map((element) => labelToSvg(element, detailColor))
    .filter(Boolean)
    .join("\n    ");

  // Knocked-out texts clear the patterns around them, as on the canvas and in the STL.
  const knockouts = artworkSvg ? collectKnockoutRings(model.elements) : [];
  const patternClipPathData = knockouts.length
    ? buildPatternClipPathData(surfaceInput, knockouts)
    : null;
  // Without that path, each zone gets a clip path that keeps everything but the zone.
  const fallbackKnockouts = patternClipPathData === null ? knockouts : [];
  const knockoutClipPaths = fallbackKnockouts
    .map(
      (ring, index) => `<clipPath id="knockout-clip-${index}" clipPathUnits="userSpaceOnUse">
      <path d="${surfacePathData([
        [
          [-1, -1],
          [width + 1, -1],
          [width + 1, height + 1],
          [-1, height + 1],
        ],
        ring,
      ])}" clip-rule="evenodd" />
    </clipPath>`,
    )
    .join("\n    ");
  const artworkGroup = fallbackKnockouts.reduce(
    (inner, _ring, index) => `<g clip-path="url(#knockout-clip-${index})">\n    ${inner}\n    </g>`,
    `<g clip-path="url(#${patternClipPathData ? "pattern-clip" : "panel-surface-clip"})">\n    ${artworkSvg}\n    </g>`,
  );
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

  // Overlapping cut-outs are merged into one opening: drawn one by one, the even-odd rule would
  // fill their overlap with the panel again, and show the artwork there.
  const cutoutPaths = buildMergedPanelSurfacePathData(surfaceInput);

  const backgroundRect =
    background === null
      ? ""
      : `  <rect width="${width}" height="${height}" fill="${background}" />`;
  const patternClipPath = patternClipPathData
    ? `
    <clipPath id="pattern-clip" clipPathUnits="userSpaceOnUse">
      <path d="${patternClipPathData}" clip-rule="evenodd" />
    </clipPath>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm">
${backgroundRect}
  <defs>
    <clipPath id="panel-surface-clip" clipPathUnits="userSpaceOnUse">
      <path d="${cutoutPaths}" clip-rule="evenodd" />
    </clipPath>${patternClipPath}${knockoutClipPaths ? `\n    ${knockoutClipPaths}` : ""}
  </defs>
  <path d="${cutoutPaths}" fill="${panelFill}" fill-rule="evenodd" stroke="${panelStroke}" stroke-width="${strokeWidth}" />
  ${artworkSvg ? `    ${artworkGroup}` : ""}
  ${textSvg ? `    <g clip-path="url(#panel-surface-clip)">\n    ${textSvg}\n    </g>` : ""}
  ${holeOutlines ? `    ${holeOutlines}` : ""}
  ${elementsSvg ? `    ${elementsSvg}` : ""}
</svg>`;
}
