interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PatternDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  patternUnits: "userSpaceOnUse" | "objectBoundingBox";
  contents: Element[];
}

const SVG_NS = "http://www.w3.org/2000/svg";
const MAX_TILE_COUNT = 100_000;

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

function parseLength(value: string | null | undefined, basis: number, fallback: number): number {
  if (value == null) {
    return fallback;
  }
  const match = value.trim().match(/^(-?\d*\.?\d+)(%)?/);
  if (!match) {
    return fallback;
  }
  const number = Number.parseFloat(match[1]);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  if (match[2] === "%") {
    return (number / 100) * basis;
  }
  return number;
}

function parseRootBox(root: Element): BoundingBox {
  const viewBoxAttr = root.getAttribute("viewBox");
  if (viewBoxAttr) {
    const parts = viewBoxAttr
      .trim()
      .split(/[\s,]+/)
      .map(Number.parseFloat);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }
  const width = parseLength(root.getAttribute("width"), 0, 100);
  const height = parseLength(root.getAttribute("height"), 0, width);
  return { x: 0, y: 0, width, height };
}

function readPaintReference(element: Element, property: "fill" | "stroke"): string | null {
  const style = parseStyleDeclarations(element.getAttribute("style"));
  const value = style[property] ?? element.getAttribute(property);
  if (!value) {
    return null;
  }
  const match = value.trim().match(/^url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)$/i);
  return match ? match[1] : null;
}

function parsePatternDefinition(node: Element): PatternDef | null {
  const id = node.getAttribute("id");
  if (!id) {
    return null;
  }
  const patternUnitsAttr = node.getAttribute("patternUnits");
  const patternUnits =
    patternUnitsAttr === "userSpaceOnUse" ? "userSpaceOnUse" : "objectBoundingBox";
  const x = parseLength(node.getAttribute("x"), 0, 0);
  const y = parseLength(node.getAttribute("y"), 0, 0);
  const width = parseLength(node.getAttribute("width"), 0, 0);
  const height = parseLength(node.getAttribute("height"), 0, 0);
  const contents = Array.from(node.children);
  return { id, x, y, width, height, patternUnits, contents };
}

function computeConsumerBox(element: Element, root: BoundingBox): BoundingBox | null {
  const tag = element.tagName.toLowerCase();
  switch (tag) {
    case "rect": {
      const x = parseLength(element.getAttribute("x"), root.width, 0);
      const y = parseLength(element.getAttribute("y"), root.height, 0);
      const width = parseLength(element.getAttribute("width"), root.width, 0);
      const height = parseLength(element.getAttribute("height"), root.height, 0);
      if (width <= 0 || height <= 0) {
        return null;
      }
      return { x, y, width, height };
    }
    case "circle": {
      const cx = parseLength(element.getAttribute("cx"), root.width, 0);
      const cy = parseLength(element.getAttribute("cy"), root.height, 0);
      const r = parseLength(element.getAttribute("r"), root.width, 0);
      if (r <= 0) {
        return null;
      }
      return { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r };
    }
    case "ellipse": {
      const cx = parseLength(element.getAttribute("cx"), root.width, 0);
      const cy = parseLength(element.getAttribute("cy"), root.height, 0);
      const rx = parseLength(element.getAttribute("rx"), root.width, 0);
      const ry = parseLength(element.getAttribute("ry"), root.height, 0);
      if (rx <= 0 || ry <= 0) {
        return null;
      }
      return { x: cx - rx, y: cy - ry, width: 2 * rx, height: 2 * ry };
    }
    default:
      return null;
  }
}

function buildTilesGroup(doc: Document, pattern: PatternDef, bbox: BoundingBox): Element | null {
  let tileX = pattern.x;
  let tileY = pattern.y;
  let tileWidth = pattern.width;
  let tileHeight = pattern.height;

  if (pattern.patternUnits === "objectBoundingBox") {
    tileX = bbox.x + pattern.x * bbox.width;
    tileY = bbox.y + pattern.y * bbox.height;
    tileWidth = pattern.width * bbox.width;
    tileHeight = pattern.height * bbox.height;
  }

  if (tileWidth <= 0 || tileHeight <= 0) {
    return null;
  }

  const cols = Math.ceil(bbox.width / tileWidth) + 1;
  const rows = Math.ceil(bbox.height / tileHeight) + 1;
  if (cols * rows > MAX_TILE_COUNT) {
    return null;
  }

  const startX = tileX + Math.floor((bbox.x - tileX) / tileWidth) * tileWidth;
  const startY = tileY + Math.floor((bbox.y - tileY) / tileHeight) * tileHeight;
  const endX = bbox.x + bbox.width;
  const endY = bbox.y + bbox.height;

  const group = doc.createElementNS(SVG_NS, "g");
  for (let ty = startY; ty < endY; ty += tileHeight) {
    for (let tx = startX; tx < endX; tx += tileWidth) {
      if (!pattern.contents.length) {
        continue;
      }
      const tile = doc.createElementNS(SVG_NS, "g");
      tile.setAttribute("transform", `translate(${tx} ${ty})`);
      for (const child of pattern.contents) {
        tile.appendChild(child.cloneNode(true));
      }
      group.appendChild(tile);
    }
  }
  return group.children.length ? group : null;
}

export function expandSvgPatterns(svgText: string): string {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return svgText;
  }
  if (!/url\s*\(\s*['"]?#/i.test(svgText) || !/<pattern\b/i.test(svgText)) {
    return svgText;
  }

  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  if (doc.querySelector("parsererror")) {
    return svgText;
  }
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    return svgText;
  }

  const patterns = new Map<string, PatternDef>();
  Array.from(doc.querySelectorAll("pattern")).forEach((node) => {
    const definition = parsePatternDefinition(node);
    if (definition) {
      patterns.set(definition.id, definition);
    }
  });
  if (!patterns.size) {
    return svgText;
  }

  const rootBox = parseRootBox(root);

  let didExpand = false;
  const visit = (element: Element): void => {
    Array.from(element.children).forEach((child) => visit(child));
    if (element.tagName.toLowerCase() === "pattern") {
      return;
    }
    const fillRef = readPaintReference(element, "fill");
    const strokeRef = readPaintReference(element, "stroke");
    const patternRef = (fillRef && patterns.get(fillRef)) || (strokeRef && patterns.get(strokeRef));
    if (!patternRef) {
      return;
    }
    const consumerBox = computeConsumerBox(element, rootBox);
    if (!consumerBox) {
      return;
    }
    const tiles = buildTilesGroup(doc, patternRef, consumerBox);
    if (!tiles) {
      return;
    }
    element.parentNode?.replaceChild(tiles, element);
    didExpand = true;
  };
  visit(root);

  if (!didExpand) {
    return svgText;
  }

  Array.from(doc.querySelectorAll("pattern")).forEach((node) => {
    node.parentNode?.removeChild(node);
  });
  Array.from(doc.querySelectorAll("defs")).forEach((node) => {
    if (!node.children.length) {
      node.parentNode?.removeChild(node);
    }
  });

  return new XMLSerializer().serializeToString(root);
}
