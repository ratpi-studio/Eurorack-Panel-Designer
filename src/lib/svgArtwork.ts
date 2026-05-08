import {
  PanelElementType,
  type PanelElement,
  type SvgArtworkElementProperties,
  type SvgViewBox,
  type Vector2,
} from "./panelTypes";

export const DEFAULT_SVG_ARTWORK_COLOR = "#f8fafc";
export const DEFAULT_SVG_ARTWORK_STL_THICKNESS_MM = 0.6;
export const DEFAULT_SVG_ARTWORK_STL_PENETRATION_MM = 0.2;

export interface SanitizedSvgArtwork {
  svgText: string;
  viewBox: SvgViewBox;
}

interface CreateSvgArtworkElementInput extends SanitizedSvgArtwork {
  panelSizeMm: Vector2;
  sourceName?: string;
  sourceId?: string;
}

const BLOCKED_ELEMENTS = [
  "script",
  "foreignObject",
  "iframe",
  "object",
  "embed",
  "image",
  "audio",
  "video",
  "canvas",
  "animate",
  "animateMotion",
  "animateTransform",
  "set",
] as const;

const FILLABLE_TAGS = new Set([
  "path",
  "rect",
  "circle",
  "ellipse",
  "polygon",
  "polyline",
  "text",
  "tspan",
]);

const DRAWABLE_TAGS = new Set([...FILLABLE_TAGS, "line"]);

function generateElementId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `svg-artwork-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function parseNumber(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = value.trim().match(/^-?\d*\.?\d+/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseViewBoxValue(value: string | null | undefined): SvgViewBox | null {
  if (!value) {
    return null;
  }
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number.parseFloat(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  const [minX, minY, width, height] = parts;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { minX, minY, width, height };
}

function serializeViewBox(viewBox: SvgViewBox): string {
  return `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeStyleAttribute(value: string): string {
  return value
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => !/url\s*\(/i.test(declaration))
    .filter((declaration) => !/expression\s*\(/i.test(declaration))
    .filter((declaration) => !/^\s*(behavior|-moz-binding)\s*:/i.test(declaration))
    .join("; ");
}

function parseStyleDeclarations(value: string | null): Record<string, string> {
  if (!value) {
    return {};
  }
  return value.split(";").reduce<Record<string, string>>((acc, declaration) => {
    const [rawProperty, ...rawValue] = declaration.split(":");
    const property = rawProperty?.trim().toLowerCase();
    const declarationValue = rawValue.join(":").trim();
    if (property && declarationValue) {
      acc[property] = declarationValue;
    }
    return acc;
  }, {});
}

function normalizePaint(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value
    .trim()
    .replace(/\s*!important\s*$/i, "")
    .toLowerCase();
}

export function isLocalSvgUrlReference(value: string | null | undefined): boolean {
  const normalized = normalizePaint(value);
  if (!normalized) {
    return false;
  }
  return /^url\(\s*['"]?#[^)'"\s]+['"]?\s*\)$/.test(normalized);
}

export function isBlackSvgPaint(value: string | null | undefined): boolean {
  const normalized = normalizePaint(value);
  if (!normalized || normalized === "none" || normalized === "transparent") {
    return false;
  }
  if (normalized === "black") {
    return true;
  }
  if (/^#(?:000|000f|000000|000000ff)$/i.test(normalized)) {
    return true;
  }
  const rgbMatch = normalized.match(
    /^rgba?\(\s*0(?:\.0+)?(?:\s*,\s*|\s+)0(?:\.0+)?(?:\s*,\s*|\s+)0(?:\.0+)?(?:\s*(?:,|\/)\s*([^)]+))?\s*\)$/,
  );
  if (!rgbMatch) {
    return false;
  }
  const alpha = rgbMatch[1] ? Number.parseFloat(rgbMatch[1]) : 1;
  return !Number.isFinite(alpha) || alpha > 0;
}

function getOwnPaint(element: Element, property: "fill" | "stroke"): string | undefined {
  const style = parseStyleDeclarations(element.getAttribute("style"));
  if (style[property]) {
    return style[property];
  }
  const attribute = element.getAttribute(property);
  return attribute === null ? undefined : attribute;
}

function resolvePaint(
  ownPaint: string | undefined,
  inheritedPaint: string,
  inheritedColor: string,
): string {
  const paint = ownPaint === undefined ? inheritedPaint : ownPaint;
  return normalizePaint(paint) === "currentcolor" ? inheritedColor : paint;
}

function maskDomSvg(svgText: string, color: string): string | null {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return null;
  }

  const document = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const root = document.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg" || document.querySelector("parsererror")) {
    return null;
  }

  const visit = (
    element: Element,
    inheritedFill: string,
    inheritedStroke: string,
    inheritedColor: string,
  ) => {
    const tagName = element.tagName.toLowerCase();
    const ownColor =
      element.getAttribute("color") ?? parseStyleDeclarations(element.getAttribute("style")).color;
    const nextColor = ownColor
      ? resolvePaint(ownColor, inheritedColor, inheritedColor)
      : inheritedColor;
    const nextFill = resolvePaint(getOwnPaint(element, "fill"), inheritedFill, nextColor);
    const nextStroke = resolvePaint(getOwnPaint(element, "stroke"), inheritedStroke, nextColor);

    Array.from(element.children).forEach((child) => visit(child, nextFill, nextStroke, nextColor));

    if (!DRAWABLE_TAGS.has(tagName)) {
      element.removeAttribute("fill");
      element.removeAttribute("stroke");
      element.removeAttribute("style");
      return;
    }

    const fillIsLocalRef = FILLABLE_TAGS.has(tagName) && isLocalSvgUrlReference(nextFill);
    const strokeIsLocalRef = isLocalSvgUrlReference(nextStroke);
    const fillIsBlack = FILLABLE_TAGS.has(tagName) && isBlackSvgPaint(nextFill);
    const strokeIsBlack = isBlackSvgPaint(nextStroke);

    if (!fillIsBlack && !strokeIsBlack && !fillIsLocalRef && !strokeIsLocalRef) {
      element.remove();
      return;
    }

    element.removeAttribute("style");
    if (fillIsLocalRef) {
      element.setAttribute("fill", nextFill);
    } else {
      element.setAttribute("fill", fillIsBlack ? color : "none");
    }
    if (strokeIsLocalRef) {
      element.setAttribute("stroke", nextStroke);
    } else if (strokeIsBlack) {
      element.setAttribute("stroke", color);
    } else {
      element.setAttribute("stroke", "none");
    }
  };

  visit(root, "black", "none", "black");
  root.setAttribute("fill", "none");
  root.setAttribute("color", color);
  return new XMLSerializer().serializeToString(root);
}

function sanitizeDomSvg(rawSvg: string): SanitizedSvgArtwork | null {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return null;
  }

  const document = new DOMParser().parseFromString(rawSvg, "image/svg+xml");
  if (document.querySelector("parsererror")) {
    throw new Error("Invalid SVG markup.");
  }

  const root = document.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    throw new Error("SVG file must contain a root <svg> element.");
  }

  BLOCKED_ELEMENTS.forEach((tagName) => {
    document.querySelectorAll(tagName).forEach((node) => node.remove());
  });

  document.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name;
      const lowerName = name.toLowerCase();
      const value = attribute.value.trim();

      if (lowerName.startsWith("on")) {
        element.removeAttribute(name);
        return;
      }

      if ((lowerName === "href" || lowerName === "xlink:href") && !value.startsWith("#")) {
        element.removeAttribute(name);
        return;
      }

      if (/javascript\s*:/i.test(value) || /data\s*:/i.test(value)) {
        element.removeAttribute(name);
        return;
      }

      if (/url\s*\(\s*['"]?(?:https?:|\/\/|data:)/i.test(value)) {
        element.removeAttribute(name);
        return;
      }

      if (lowerName === "style") {
        const sanitizedStyle = sanitizeStyleAttribute(value);
        if (sanitizedStyle) {
          element.setAttribute("style", sanitizedStyle);
        } else {
          element.removeAttribute(name);
        }
      }
    });
  });

  const width = parseNumber(root.getAttribute("width")) ?? 100;
  const height = parseNumber(root.getAttribute("height")) ?? width;
  const viewBox = parseViewBoxValue(root.getAttribute("viewBox")) ?? {
    minX: 0,
    minY: 0,
    width: Math.max(width, 1),
    height: Math.max(height, 1),
  };

  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  root.setAttribute("viewBox", serializeViewBox(viewBox));
  root.removeAttribute("width");
  root.removeAttribute("height");

  return {
    svgText: new XMLSerializer().serializeToString(root),
    viewBox,
  };
}

function sanitizeStringSvg(rawSvg: string): SanitizedSvgArtwork {
  const withoutUnsafe = rawSvg
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!doctype[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|foreignObject|iframe|object|embed|image|audio|video|canvas|animate|animateMotion|animateTransform|set)\b[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(
      /<(script|foreignObject|iframe|object|embed|image|audio|video|canvas|animate|animateMotion|animateTransform|set)\b[^>]*\/?>/gi,
      "",
    )
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|xlink:href)\s*=\s*(['"])(?!#)[\s\S]*?\2/gi, "")
    .replace(/\s+(href|xlink:href)\s*=\s*(?!#)[^\s>]+/gi, "")
    .replace(/\s+[a-z:-]+\s*=\s*(['"])[^'"]*javascript\s*:[\s\S]*?\1/gi, "")
    .replace(/\s+[a-z:-]+\s*=\s*(['"])[^'"]*url\s*\(\s*(?:https?:|\/\/|data:)[\s\S]*?\1/gi, "");

  const svgMatch = withoutUnsafe.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  if (!svgMatch) {
    throw new Error("SVG file must contain a root <svg> element.");
  }

  const rawAttributes = svgMatch[1] ?? "";
  const inner = svgMatch[2] ?? "";
  const viewBoxMatch = rawAttributes.match(/\bviewBox\s*=\s*(['"])(.*?)\1/i);
  const widthMatch = rawAttributes.match(/\bwidth\s*=\s*(['"])(.*?)\1/i);
  const heightMatch = rawAttributes.match(/\bheight\s*=\s*(['"])(.*?)\1/i);
  const width = parseNumber(widthMatch?.[2]) ?? 100;
  const height = parseNumber(heightMatch?.[2]) ?? width;
  const viewBox = parseViewBoxValue(viewBoxMatch?.[2]) ?? {
    minX: 0,
    minY: 0,
    width: Math.max(width, 1),
    height: Math.max(height, 1),
  };

  return {
    svgText: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${serializeViewBox(
      viewBox,
    )}">${inner}</svg>`,
    viewBox,
  };
}

export function sanitizeSvgArtwork(rawSvg: string): SanitizedSvgArtwork {
  const trimmed = rawSvg.trim();
  if (!trimmed || trimmed.length > 1_000_000) {
    throw new Error("SVG file is empty or too large.");
  }

  return sanitizeDomSvg(trimmed) ?? sanitizeStringSvg(trimmed);
}

function maskStyle(value: string, color: string): string {
  const declarations = parseStyleDeclarations(value);
  const nextDeclarations = Object.entries(declarations).map(([property, currentValue]) => {
    if (property === "fill" || property === "stroke") {
      if (isLocalSvgUrlReference(currentValue)) {
        return `${property}: ${currentValue}`;
      }
      return `${property}: ${isBlackSvgPaint(currentValue) ? color : "none"}`;
    }
    return `${property}: ${currentValue}`;
  });
  return nextDeclarations.join("; ");
}

function maskStringSvg(svgText: string, color: string): string {
  const escapedColor = escapeAttribute(color);
  const replacePaintValue = (value: string): string => {
    if (isLocalSvgUrlReference(value)) {
      return value;
    }
    return isBlackSvgPaint(value) ? escapedColor : "none";
  };
  const masked = svgText
    .replace(/\sfill\s*=\s*(['"])([\s\S]*?)\1/gi, (_match, quote: string, value: string) => {
      return ` fill=${quote}${replacePaintValue(value)}${quote}`;
    })
    .replace(/\sstroke\s*=\s*(['"])([\s\S]*?)\1/gi, (_match, quote: string, value: string) => {
      return ` stroke=${quote}${replacePaintValue(value)}${quote}`;
    })
    .replace(/\sstyle\s*=\s*(['"])([\s\S]*?)\1/gi, (_match, quote: string, value: string) => {
      return ` style=${quote}${escapeAttribute(maskStyle(value, color))}${quote}`;
    });

  return masked.replace(/<svg\b([^>]*)>/i, (_match, rawAttributes: string) => {
    const hasFill = /\sfill\s*=/.test(rawAttributes) || /\bfill\s*:/.test(rawAttributes);
    const hasColor = /\scolor\s*=/.test(rawAttributes) || /\bcolor\s*:/.test(rawAttributes);
    const fillAttribute = hasFill ? "" : ` fill="${escapedColor}"`;
    const colorAttribute = hasColor ? "" : ` color="${escapedColor}"`;
    return `<svg${rawAttributes}${fillAttribute}${colorAttribute}>`;
  });
}

export function buildSvgArtworkMaskMarkup(svgText: string, color: string): string {
  return maskDomSvg(svgText, color) ?? maskStringSvg(svgText, color);
}

export function recolorSvgArtworkMarkup(svgText: string, color: string): string {
  return buildSvgArtworkMaskMarkup(svgText, color);
}

export function buildSvgArtworkImageMarkup(properties: SvgArtworkElementProperties): string {
  return buildSvgArtworkMaskMarkup(properties.svgText, properties.color);
}

export function buildSvgArtworkDataUrl(properties: SvgArtworkElementProperties): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    buildSvgArtworkImageMarkup(properties),
  )}`;
}

export function getSvgArtworkAspectRatio(properties: SvgArtworkElementProperties): number {
  if (properties.heightMm <= 0) {
    return 1;
  }
  return properties.widthMm / properties.heightMm;
}

export function getSvgInnerMarkup(svgText: string): string {
  const match = svgText.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
  return match?.[1] ?? "";
}

export function buildSvgArtworkNestedMarkup(element: PanelElement): string {
  if (element.type !== PanelElementType.SvgArtwork) {
    return "";
  }
  const { properties } = element;
  const viewBox = serializeViewBox(properties.viewBox);
  const inner = getSvgInnerMarkup(buildSvgArtworkMaskMarkup(properties.svgText, properties.color));
  const rotation = element.rotationDeg ?? 0;
  const transform = `translate(${element.positionMm.x} ${element.positionMm.y}) rotate(${rotation})`;
  return `<g transform="${transform}">
      <svg x="${-properties.widthMm / 2}" y="${-properties.heightMm / 2}" width="${
        properties.widthMm
      }" height="${properties.heightMm}" viewBox="${viewBox}" overflow="visible" fill="${escapeAttribute(
        properties.color,
      )}" color="${escapeAttribute(properties.color)}">
        ${inner}
      </svg>
    </g>`;
}

export function createSvgArtworkElement({
  svgText,
  viewBox,
  panelSizeMm,
  sourceName,
  sourceId,
}: CreateSvgArtworkElementInput): PanelElement {
  const maxWidth = panelSizeMm.x * 0.6;
  const maxHeight = panelSizeMm.y * 0.6;
  const sourceAspect = viewBox.width > 0 && viewBox.height > 0 ? viewBox.width / viewBox.height : 1;
  let widthMm = Math.max(10, Math.min(maxWidth, panelSizeMm.x * 0.45));
  let heightMm = widthMm / sourceAspect;
  if (heightMm > maxHeight) {
    heightMm = maxHeight;
    widthMm = heightMm * sourceAspect;
  }

  return {
    id: generateElementId(),
    type: PanelElementType.SvgArtwork,
    positionMm: {
      x: panelSizeMm.x / 2,
      y: panelSizeMm.y / 2,
    },
    mountingHolesEnabled: false,
    rotationDeg: 0,
    properties: {
      svgText,
      viewBox,
      widthMm,
      heightMm,
      color: DEFAULT_SVG_ARTWORK_COLOR,
      stlThicknessMm: DEFAULT_SVG_ARTWORK_STL_THICKNESS_MM,
      stlPenetrationMm: DEFAULT_SVG_ARTWORK_STL_PENETRATION_MM,
      sourceName,
      sourceId,
      label: "",
    },
  };
}

export function isSvgArtworkElement(element: PanelElement): element is PanelElement & {
  type: PanelElementType.SvgArtwork;
  properties: SvgArtworkElementProperties;
} {
  return element.type === PanelElementType.SvgArtwork;
}
