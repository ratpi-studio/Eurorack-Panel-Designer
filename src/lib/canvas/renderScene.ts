import {
  PanelElementType,
  isCircularElementProperties,
  isLabelElement,
  type LabelElement,
  type MountingHole,
  type PanelElement,
  type Vector2,
} from "@lib/panelTypes";
import { type ClearanceLines } from "@lib/clearance";
import { collectKnockoutRings } from "@lib/designLayer";
import { isElementLocked } from "@lib/elementVisibility";
import { findCrowdedElements, getFrontOutline } from "@lib/elementParts";
import { createPanelSurfacePath2D } from "@lib/panelSurface";
import { isSvgArtworkElement } from "@lib/svgArtwork";
import { getLabelTextLayout, type LabelTextLayout } from "@lib/text/textLayout";
import { PT_TO_MM } from "@lib/units";
import {
  getReferenceImageControlPositions,
  REFERENCE_IMAGE_HANDLE_SIZE_PX,
  REFERENCE_IMAGE_RESIZE_HANDLES,
  REFERENCE_IMAGE_ROTATION_HANDLE_OFFSET_PX,
  type ReferenceImage,
} from "@lib/referenceImage";

import {
  formatBoxLabel,
  formatDiameterLabel,
  formatDimensionMm,
  getElementDimensions,
  getInlineLabelPlacement,
  getReadableTextFlip,
} from "./elementDimensions";
import {
  computeNearestElementDistances,
  getElementSizeMm,
  type NearestElementDistance,
} from "./elementGeometry";
import {
  getElementFrameRotationDeg,
  getElementHandleLayout,
  getElementHandleLocalPositionPx,
  getElementResizeMode,
  type ElementHandleLayout,
} from "./elementHandles";
import { projectPanelPoint, type CanvasTransform } from "./transform";

export interface PanelCanvasPalette {
  panelFill: string;
  panelBorder: string;
  grid: string;
  gridCenter: string;
  mountingHoleFill: string;
  mountingHoleStroke: string;
  selection: string;
  clearanceLine: string;
  clearanceLabel: string;
  handleFill: string;
  handleStroke: string;
  dimensionText: string;
  dimensionHalo: string;
  dimensionLine: string;
  /** Knobs, nuts and washers that run into another element's. */
  crowdedHardwareFill: string;
  crowdedHardwareStroke: string;
}

export interface ElementStyle {
  fill: string;
  stroke: string;
}

interface SelectionAnimationState {
  dashOffset: number;
  pulseScale: number;
}

interface PanelSceneDrawingOptions {
  context: CanvasRenderingContext2D;
  transform: CanvasTransform;
  panelSizeMm: Vector2;
  elements: PanelElement[];
  referenceImage?: { image: HTMLImageElement; info: ReferenceImage; selected: boolean } | null;
  mountingHoles: MountingHole[];
  elementMountingHoles?: MountingHole[];
  mountingHolesSelected?: boolean;
  selectedElementIds: string[];
  showGrid: boolean;
  showMountingHoles: boolean;
  gridSizeMm: number;
  palette: PanelCanvasPalette;
  elementStyles: Record<PanelElementType, ElementStyle>;
  fontFamily: string;
  selectionAnimation?: SelectionAnimationState;
  ghostElement?: PanelElement | null;
  svgArtworkImages?: Map<string, HTMLImageElement>;
  /**
   * Clips SVG artwork and text to the panel minus its cut-outs, with the even-odd rule. Built once
   * per design change (see `buildPanelSurfaceClipPathData`), not on every frame.
   */
  panelSurfacePath: Path2D | null;
  clearanceLines?: ClearanceLines | null;
  showGhostDistances?: boolean;
  /** Editor-only measurement annotations (diameters, side lengths). */
  showDimensions?: boolean;
  /** Editor-only outlines of the knobs, nuts and washers on the front of the panel. */
  showHardware?: boolean;
}

const DIMENSION_FONT_SIZE_PX = 10;
const DIMENSION_TEXT_PADDING_PX = 2;
// Far enough from the frame for dimension lines to clear the resize handles.
const DIMENSION_LINE_OFFSET_PX = 16;
const DIMENSION_TICK_PX = 4;
const DIMENSION_TEXT_GAP_PX = 4;
const HARDWARE_FILL_ALPHA = 0.35;
const HARDWARE_DASH_PX = [4, 3];
const GHOST_ALPHA = 0.4;
const NO_CROWDED_ELEMENTS: ReadonlySet<string> = new Set();

export function drawPanelScene({
  context,
  transform,
  elements,
  mountingHoles,
  elementMountingHoles,
  mountingHolesSelected,
  selectedElementIds,
  showGrid,
  showMountingHoles,
  gridSizeMm,
  palette,
  elementStyles,
  fontFamily,
  selectionAnimation,
  ghostElement,
  svgArtworkImages,
  panelSurfacePath,
  referenceImage,
  clearanceLines,
  panelSizeMm,
  showGhostDistances,
  showDimensions = false,
  showHardware = false,
}: PanelSceneDrawingOptions) {
  // The element being placed counts too, so it shows where it would crowd the others.
  const crowdedIds = showHardware
    ? findCrowdedElements(ghostElement ? [...elements, ghostElement] : elements)
    : NO_CROWDED_ELEMENTS;

  drawPanelArea(context, transform, palette);

  if (referenceImage && referenceImage.image.complete) {
    drawReferenceImage(
      context,
      transform,
      referenceImage.info,
      referenceImage.image,
      palette,
      referenceImage.selected,
    );
  }

  if (showGrid) {
    drawGrid(context, transform, gridSizeMm, palette);
  }

  if (clearanceLines) {
    drawClearanceLines(context, transform, panelSizeMm, clearanceLines, palette, fontFamily);
  }

  if (showMountingHoles) {
    drawMountingHoles(context, mountingHoles, transform, palette, mountingHolesSelected ?? false);
    if (elementMountingHoles?.length) {
      drawMountingHoles(context, elementMountingHoles, transform, palette, false);
    }
  }

  drawElements(
    context,
    elements,
    transform,
    panelSurfacePath,
    buildKnockoutClipPaths(elements, panelSizeMm),
    svgArtworkImages,
    elementStyles,
    fontFamily,
  );

  if (showHardware) {
    drawFrontHardware(context, elements, crowdedIds, transform, palette, elementStyles);
  }

  const singleSelectedElement =
    selectedElementIds.length === 1
      ? (elements.find((element) => element.id === selectedElementIds[0]) ?? null)
      : null;

  if (showDimensions) {
    drawInlineDimensionLabels(
      context,
      elements,
      transform,
      palette,
      fontFamily,
      singleSelectedElement?.id ?? null,
    );
  }

  if (singleSelectedElement) {
    drawSingleSelection(
      context,
      singleSelectedElement,
      transform,
      palette,
      fontFamily,
      selectionAnimation,
      showDimensions,
    );
  } else if (selectedElementIds.length > 1) {
    const selectionSet = new Set(selectedElementIds);
    elements.forEach((element) => {
      if (selectionSet.has(element.id)) {
        drawSelectionOutline(context, element, transform, palette.selection, selectionAnimation);
      }
    });
  }

  if (ghostElement) {
    drawGhostElement(context, ghostElement, transform, elementStyles, fontFamily);

    if (showHardware) {
      context.save();
      context.globalAlpha = GHOST_ALPHA;
      drawFrontHardware(context, [ghostElement], crowdedIds, transform, palette, elementStyles);
      context.restore();
    }

    if (showGhostDistances) {
      const distances = computeNearestElementDistances(ghostElement.positionMm, elements);
      if (distances.length > 0) {
        drawGhostDistances(
          context,
          transform,
          ghostElement.positionMm,
          distances,
          palette,
          fontFamily,
        );
      }
    }
  }
}

function drawPanelArea(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  palette: PanelCanvasPalette,
) {
  context.save();
  context.fillStyle = palette.panelFill;
  context.strokeStyle = palette.panelBorder;
  context.lineWidth = 2;
  context.beginPath();
  context.rect(
    transform.origin.x,
    transform.origin.y,
    transform.panelSizePx.x,
    transform.panelSizePx.y,
  );
  context.fill();
  context.stroke();
  context.restore();
}

function drawGhostDistances(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  ghostCenterMm: Vector2,
  distances: NearestElementDistance[],
  palette: PanelCanvasPalette,
  fontFamily: string,
) {
  const origin = projectPanelPoint(ghostCenterMm, transform);
  context.save();
  context.strokeStyle = palette.clearanceLine;
  context.lineWidth = 1;
  context.setLineDash([4, 4]);

  distances.forEach((entry) => {
    const target = projectPanelPoint(entry.center, transform);
    context.beginPath();
    context.moveTo(origin.x, origin.y);
    context.lineTo(target.x, target.y);
    context.stroke();

    const labelX = (origin.x + target.x) / 2;
    const labelY = (origin.y + target.y) / 2;

    context.save();
    context.setLineDash([]);
    context.font = `10px ${fontFamily}`;
    context.fillStyle = palette.clearanceLabel;
    context.textBaseline = "bottom";
    const label = `${entry.distanceMm.toFixed(1)} mm`;
    context.fillText(label, labelX + 4, labelY - 4);
    context.restore();
  });

  context.restore();
}

function drawClearanceLines(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  panelSizeMm: Vector2,
  clearanceLines: ClearanceLines,
  palette: PanelCanvasPalette,
  fontFamily: string,
) {
  context.save();
  context.strokeStyle = palette.clearanceLine;
  context.lineWidth = 2;
  context.setLineDash([8, 6]);

  const drawLine = (yMm: number, labelOffset: number, distanceMm: number) => {
    const start = projectPanelPoint({ x: 0, y: yMm }, transform);
    const end = projectPanelPoint({ x: panelSizeMm.x, y: yMm }, transform);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();

    context.save();
    context.setLineDash([]);
    context.font = `10px ${fontFamily}`;
    context.fillStyle = palette.clearanceLabel;
    context.textBaseline = "bottom";
    const distanceLabel = `${distanceMm.toFixed(1)} mm`;
    context.fillText(`clearance · ${distanceLabel}`, start.x + 8, start.y - labelOffset);
    context.restore();
  };

  const topDistance = Math.max(clearanceLines.topY, 0);
  const bottomDistance = Math.max(panelSizeMm.y - clearanceLines.bottomY, 0);

  drawLine(clearanceLines.topY, 2, topDistance);
  drawLine(clearanceLines.bottomY, -12, bottomDistance);
  context.restore();
}

function drawReferenceImage(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  info: ReferenceImage,
  image: HTMLImageElement,
  palette: PanelCanvasPalette,
  selected: boolean,
) {
  const centerPx = projectPanelPoint(info.positionMm, transform);
  const halfWidthPx = (info.widthMm / 2) * transform.scale;
  const halfHeightPx = (info.heightMm / 2) * transform.scale;

  context.save();
  context.translate(centerPx.x, centerPx.y);
  const rotation = ((info.rotationDeg ?? 0) * Math.PI) / 180;
  if (rotation !== 0) {
    context.rotate(rotation);
  }
  context.globalAlpha = Math.min(Math.max(info.opacity, 0), 1);
  context.drawImage(image, -halfWidthPx, -halfHeightPx, halfWidthPx * 2, halfHeightPx * 2);
  context.globalAlpha = 1;
  if (selected) {
    context.strokeStyle = palette.selection;
    context.lineWidth = 1.5;
    context.setLineDash([6, 4]);
    context.strokeRect(-halfWidthPx, -halfHeightPx, halfWidthPx * 2, halfHeightPx * 2);
  }
  context.restore();

  if (!selected) {
    return;
  }

  const rotationOffsetMm = REFERENCE_IMAGE_ROTATION_HANDLE_OFFSET_PX / Math.max(transform.scale, 1);
  const controls = getReferenceImageControlPositions(info, rotationOffsetMm);
  const topCenter = projectPanelPoint(controls.top, transform);
  const rotationHandle = projectPanelPoint(controls.rotate, transform);
  const halfHandleSizePx = REFERENCE_IMAGE_HANDLE_SIZE_PX / 2;

  context.save();
  context.strokeStyle = palette.selection;
  context.fillStyle = "#f8fafc";
  context.lineWidth = 1.5;
  context.setLineDash([]);

  context.beginPath();
  context.moveTo(topCenter.x, topCenter.y);
  context.lineTo(rotationHandle.x, rotationHandle.y);
  context.stroke();

  REFERENCE_IMAGE_RESIZE_HANDLES.forEach((handle) => {
    const point = projectPanelPoint(controls[handle], transform);
    context.beginPath();
    context.rect(
      point.x - halfHandleSizePx,
      point.y - halfHandleSizePx,
      REFERENCE_IMAGE_HANDLE_SIZE_PX,
      REFERENCE_IMAGE_HANDLE_SIZE_PX,
    );
    context.fill();
    context.stroke();
  });

  context.beginPath();
  context.arc(rotationHandle.x, rotationHandle.y, halfHandleSizePx, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function drawGrid(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  gridSizeMm: number,
  palette: PanelCanvasPalette,
) {
  const stepPx = gridSizeMm * transform.scale;
  if (!Number.isFinite(stepPx) || stepPx < 4) {
    return;
  }

  context.save();
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  context.beginPath();

  const centerX = transform.origin.x + transform.panelSizePx.x / 2;
  const centerY = transform.origin.y + transform.panelSizePx.y / 2;

  // Draw vertical lines from center outward
  for (let offset = 0; offset <= transform.panelSizePx.x / 2 + stepPx; offset += stepPx) {
    const rightX = Math.round(centerX + offset) + 0.5;
    const leftX = Math.round(centerX - offset) + 0.5;
    if (rightX >= transform.origin.x && rightX <= transform.origin.x + transform.panelSizePx.x) {
      context.moveTo(rightX, transform.origin.y);
      context.lineTo(rightX, transform.origin.y + transform.panelSizePx.y);
    }
    if (
      offset !== 0 &&
      leftX >= transform.origin.x &&
      leftX <= transform.origin.x + transform.panelSizePx.x
    ) {
      context.moveTo(leftX, transform.origin.y);
      context.lineTo(leftX, transform.origin.y + transform.panelSizePx.y);
    }
  }

  // Draw horizontal lines from center outward
  for (let offset = 0; offset <= transform.panelSizePx.y / 2 + stepPx; offset += stepPx) {
    const bottomY = Math.round(centerY + offset) + 0.5;
    const topY = Math.round(centerY - offset) + 0.5;
    if (bottomY >= transform.origin.y && bottomY <= transform.origin.y + transform.panelSizePx.y) {
      context.moveTo(transform.origin.x, bottomY);
      context.lineTo(transform.origin.x + transform.panelSizePx.x, bottomY);
    }
    if (
      offset !== 0 &&
      topY >= transform.origin.y &&
      topY <= transform.origin.y + transform.panelSizePx.y
    ) {
      context.moveTo(transform.origin.x, topY);
      context.lineTo(transform.origin.x + transform.panelSizePx.x, topY);
    }
  }

  context.stroke();

  // Center crosshair
  context.strokeStyle = palette.gridCenter;
  context.lineWidth = 1.5;
  context.beginPath();
  const snappedCenterX = Math.round(centerX) + 0.5;
  const snappedCenterY = Math.round(centerY) + 0.5;
  context.moveTo(snappedCenterX, transform.origin.y);
  context.lineTo(snappedCenterX, transform.origin.y + transform.panelSizePx.y);
  context.moveTo(transform.origin.x, snappedCenterY);
  context.lineTo(transform.origin.x + transform.panelSizePx.x, snappedCenterY);
  context.stroke();

  context.restore();
}

function drawMountingHoles(
  context: CanvasRenderingContext2D,
  holes: MountingHole[],
  transform: CanvasTransform,
  palette: PanelCanvasPalette,
  highlight: boolean,
) {
  context.save();
  context.fillStyle = palette.mountingHoleFill;
  context.lineWidth = 1;

  holes.forEach((hole) => {
    const center = projectPanelPoint(hole.center, transform);
    const strokeColor = highlight ? palette.selection : palette.mountingHoleStroke;
    context.strokeStyle = strokeColor;
    if (hole.shape === "slot" && hole.slotLengthMm) {
      const radius = Math.max((hole.diameterMm / 2) * transform.scale, 1);
      const halfLength = Math.max((hole.slotLengthMm / 2) * transform.scale, radius);
      const offset = Math.max(halfLength - radius, 0);
      context.beginPath();
      context.moveTo(center.x - offset, center.y - radius);
      context.lineTo(center.x + offset, center.y - radius);
      context.arc(center.x + offset, center.y, radius, -Math.PI / 2, Math.PI / 2, false);
      context.lineTo(center.x - offset, center.y + radius);
      context.arc(center.x - offset, center.y, radius, Math.PI / 2, -Math.PI / 2, false);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    const radius = Math.max((hole.diameterMm / 2) * transform.scale, 1);
    context.beginPath();
    context.arc(center.x, center.y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });

  context.restore();
}

/**
 * Clip paths that each keep everything but the zone a knocked-out text clears, in panel mm.
 * Applied one after the other, they clear every zone, overlapping ones included.
 */
function buildKnockoutClipPaths(elements: PanelElement[], panelSizeMm: Vector2): Path2D[] {
  if (typeof Path2D === "undefined") {
    return [];
  }
  return collectKnockoutRings(elements).map((ring) => {
    const path = new Path2D();
    path.rect(-1, -1, panelSizeMm.x + 2, panelSizeMm.y + 2);
    ring.forEach(([x, y], index) => (index === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
    path.closePath();
    return path;
  });
}

function drawElements(
  context: CanvasRenderingContext2D,
  elements: PanelElement[],
  transform: CanvasTransform,
  panelSurfacePath: Path2D | null,
  knockoutClipPaths: Path2D[],
  svgArtworkImages: Map<string, HTMLImageElement> | undefined,
  elementStyles: Record<PanelElementType, ElementStyle>,
  fontFamily: string,
) {
  elements.forEach((element) => {
    if (isSvgArtworkElement(element)) {
      drawSvgArtworkElement(
        context,
        element,
        transform,
        panelSurfacePath,
        knockoutClipPaths,
        svgArtworkImages?.get(element.id) ?? null,
      );
      return;
    }

    if (isLabelElement(element)) {
      drawLabelElement(
        context,
        element,
        transform,
        panelSurfacePath,
        elementStyles[element.type],
        fontFamily,
      );
      return;
    }

    const center = projectPanelPoint(element.positionMm, transform);
    context.save();
    context.translate(center.x, center.y);

    const rotation = ((element.rotationDeg ?? 0) * Math.PI) / 180;
    if (rotation !== 0) {
      context.rotate(rotation);
    }

    const style = elementStyles[element.type];
    switch (element.type) {
      case PanelElementType.Jack:
      case PanelElementType.Potentiometer:
      case PanelElementType.Led: {
        drawCircularElement(context, element.properties.diameterMm, transform.scale, style);
        break;
      }
      case PanelElementType.Switch:
      case PanelElementType.Rectangle: {
        if (isCircularElementProperties(element.properties)) {
          drawCircularElement(context, element.properties.diameterMm, transform.scale, style);
          break;
        }
        drawRectangularElement(
          context,
          element.properties.widthMm,
          element.properties.heightMm,
          transform.scale,
          style,
        );
        break;
      }
      case PanelElementType.Oval: {
        drawOvalElement(context, element, transform.scale, style);
        break;
      }
      case PanelElementType.Slot: {
        drawSlotElement(context, element, transform.scale, style);
        break;
      }
      case PanelElementType.Triangle: {
        drawTriangleElement(context, element, transform.scale, style);
        break;
      }
      case PanelElementType.Insert: {
        drawInsertElement(context, element, transform.scale, style);
        break;
      }
      default:
        break;
    }

    context.restore();
  });
}

function drawGhostElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  transform: CanvasTransform,
  elementStyles: Record<PanelElementType, ElementStyle>,
  fontFamily: string,
) {
  context.save();
  context.globalAlpha = GHOST_ALPHA;
  drawElements(
    context,
    [element],
    transform,
    createPanelSurfacePath2D({
      panelSizeMm: {
        x: transform.panelSizePx.x / transform.scale,
        y: transform.panelSizePx.y / transform.scale,
      },
      mountingHoles: [],
      elements: [element],
    }),
    [],
    undefined,
    elementStyles,
    fontFamily,
  );
  context.restore();
}

/**
 * Knobs, nuts and washers, dashed in their element's color. The ones that run into another
 * element are drawn in red, bare holes included.
 */
function drawFrontHardware(
  context: CanvasRenderingContext2D,
  elements: PanelElement[],
  crowdedIds: ReadonlySet<string>,
  transform: CanvasTransform,
  palette: PanelCanvasPalette,
  elementStyles: Record<PanelElementType, ElementStyle>,
) {
  elements.forEach((element) => {
    const outline = getFrontOutline(element);
    const crowded = crowdedIds.has(element.id);
    if (!outline || (!outline.hasHardware && !crowded)) {
      return;
    }

    const center = projectPanelPoint(outline.center, transform);
    context.save();
    context.beginPath();
    context.arc(center.x, center.y, (outline.diameterMm / 2) * transform.scale, 0, Math.PI * 2);
    if (crowded) {
      context.fillStyle = palette.crowdedHardwareFill;
      context.fill();
      context.strokeStyle = palette.crowdedHardwareStroke;
      context.lineWidth = 2;
      context.stroke();
    } else {
      const style = elementStyles[element.type];
      context.save();
      context.globalAlpha *= HARDWARE_FILL_ALPHA;
      context.fillStyle = style.fill;
      context.fill();
      context.restore();
      context.strokeStyle = style.stroke;
      context.lineWidth = 1.25;
      context.setLineDash(HARDWARE_DASH_PX);
      context.stroke();
    }
    context.restore();
  });
}

function drawSvgArtworkElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  transform: CanvasTransform,
  panelSurfacePath: Path2D | null,
  knockoutClipPaths: Path2D[],
  image: HTMLImageElement | null,
) {
  if (!isSvgArtworkElement(element) || !image?.complete || !panelSurfacePath) {
    return;
  }

  context.save();
  context.translate(transform.origin.x, transform.origin.y);
  context.scale(transform.scale, transform.scale);
  context.clip(panelSurfacePath, "evenodd");
  knockoutClipPaths.forEach((clipPath) => context.clip(clipPath, "evenodd"));
  context.translate(element.positionMm.x, element.positionMm.y);
  const rotation = ((element.rotationDeg ?? 0) * Math.PI) / 180;
  if (rotation !== 0) {
    context.rotate(rotation);
  }
  context.drawImage(
    image,
    -element.properties.widthMm / 2,
    -element.properties.heightMm / 2,
    element.properties.widthMm,
    element.properties.heightMm,
  );
  context.restore();
}

function drawCircularElement(
  context: CanvasRenderingContext2D,
  diameterMm: number,
  scale: number,
  style: ElementStyle,
) {
  const radius = (diameterMm / 2) * scale;
  context.fillStyle = style.fill;
  context.strokeStyle = style.stroke;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawRectangularElement(
  context: CanvasRenderingContext2D,
  widthMm: number,
  heightMm: number,
  scale: number,
  style: ElementStyle,
) {
  const width = widthMm * scale;
  const height = heightMm * scale;
  context.fillStyle = style.fill;
  context.strokeStyle = style.stroke;
  context.lineWidth = 2;
  context.beginPath();
  context.rect(-width / 2, -height / 2, width, height);
  context.fill();
  context.stroke();
}

function drawOvalElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  scale: number,
  style: ElementStyle,
) {
  if (element.type !== PanelElementType.Oval) {
    return;
  }

  const radiusX = (element.properties.widthMm / 2) * scale;
  const radiusY = (element.properties.heightMm / 2) * scale;
  context.fillStyle = style.fill;
  context.strokeStyle = style.stroke;
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawSlotElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  scale: number,
  style: ElementStyle,
) {
  if (element.type !== PanelElementType.Slot) {
    return;
  }

  const width = element.properties.widthMm * scale;
  const height = element.properties.heightMm * scale;
  const radius = Math.min(width / 2, height / 2);
  const rectHalfWidth = Math.max(width / 2 - radius, 0);

  context.fillStyle = style.fill;
  context.strokeStyle = style.stroke;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-rectHalfWidth, -radius);
  context.lineTo(rectHalfWidth, -radius);
  context.arc(rectHalfWidth, 0, radius, -Math.PI / 2, Math.PI / 2);
  context.lineTo(-rectHalfWidth, radius);
  context.arc(-rectHalfWidth, 0, radius, Math.PI / 2, -Math.PI / 2);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawTriangleElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  scale: number,
  style: ElementStyle,
) {
  if (element.type !== PanelElementType.Triangle) {
    return;
  }

  const width = element.properties.widthMm * scale;
  const height = element.properties.heightMm * scale;
  context.fillStyle = style.fill;
  context.strokeStyle = style.stroke;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -height / 2);
  context.lineTo(width / 2, height / 2);
  context.lineTo(-width / 2, height / 2);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawInsertElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  scale: number,
  style: ElementStyle,
) {
  if (element.type !== PanelElementType.Insert) {
    return;
  }

  const outerRadius = (element.properties.outerDiameterMm / 2) * scale;
  const hasHole = element.properties.embedDepthMm > 0 && element.properties.innerDepthMm > 0;
  const innerRadius = hasHole ? Math.max((element.properties.innerDiameterMm / 2) * scale, 0) : 0;
  context.fillStyle = style.fill;
  context.strokeStyle = style.stroke;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, outerRadius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (hasHole) {
    context.beginPath();
    context.arc(0, 0, innerRadius, 0, Math.PI * 2);
    context.stroke();
  }
}

const labelPathCache = new WeakMap<LabelTextLayout, Path2D>();

function getLabelPath2D(layout: LabelTextLayout): Path2D | null {
  if (typeof Path2D === "undefined") {
    return null;
  }
  let path = labelPathCache.get(layout);
  if (!path) {
    path = new Path2D(layout.pathData);
    labelPathCache.set(layout, path);
  }
  return path;
}

/**
 * Draws the outlines the STL extrudes, clipped to the panel surface like the relief. Until the
 * font has loaded, an approximation in the interface font stands in.
 */
function drawLabelElement(
  context: CanvasRenderingContext2D,
  element: LabelElement,
  transform: CanvasTransform,
  panelSurfacePath: Path2D | null,
  style: ElementStyle,
  fontFamily: string,
) {
  const layout = getLabelTextLayout(element.properties);
  const path = layout ? getLabelPath2D(layout) : null;
  const rotation = ((element.rotationDeg ?? 0) * Math.PI) / 180;

  context.save();
  context.fillStyle = style.fill;
  if (path) {
    context.translate(transform.origin.x, transform.origin.y);
    context.scale(transform.scale, transform.scale);
    if (panelSurfacePath) {
      context.clip(panelSurfacePath, "evenodd");
    }
    context.translate(element.positionMm.x, element.positionMm.y);
    if (rotation !== 0) {
      context.rotate(rotation);
    }
    context.fill(path, "nonzero");
    context.restore();
    return;
  }

  const center = projectPanelPoint(element.positionMm, transform);
  context.translate(center.x, center.y);
  if (rotation !== 0) {
    context.rotate(rotation);
  }
  context.globalAlpha *= 0.5;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `bold ${element.properties.fontSizePt * PT_TO_MM * transform.scale}px ${fontFamily}`;
  context.fillText(element.properties.text ?? "", 0, 0);
  context.restore();
}

function drawSingleSelection(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  transform: CanvasTransform,
  palette: PanelCanvasPalette,
  fontFamily: string,
  selectionAnimation: SelectionAnimationState | undefined,
  showDimensions: boolean,
) {
  if (transform.scale <= 0) {
    return;
  }

  const layout = getElementHandleLayout(element, transform.scale);
  const frameRotationRad = (getElementFrameRotationDeg(element) * Math.PI) / 180;
  const center = projectPanelPoint(element.positionMm, transform);

  context.save();
  context.translate(center.x, center.y);
  if (frameRotationRad !== 0) {
    context.rotate(frameRotationRad);
  }
  drawTransformFrame(context, layout.halfSizePx, palette.selection, selectionAnimation);
  if (showDimensions) {
    drawSelectedElementDimensions(
      context,
      element,
      layout,
      transform.scale,
      frameRotationRad,
      palette,
      fontFamily,
    );
  }
  // A locked element cannot be resized on the canvas: no handles to suggest otherwise.
  if (!isElementLocked(element)) {
    drawTransformHandles(context, layout, palette);
  }
  context.restore();
}

function drawTransformFrame(
  context: CanvasRenderingContext2D,
  halfSizePx: Vector2,
  selectionColor: string,
  selectionAnimation?: SelectionAnimationState,
) {
  context.save();
  context.strokeStyle = selectionColor;
  context.lineWidth = 1.5;
  context.setLineDash([6, 6]);
  context.lineDashOffset = selectionAnimation?.dashOffset ?? 0;
  context.strokeRect(-halfSizePx.x, -halfSizePx.y, halfSizePx.x * 2, halfSizePx.y * 2);
  context.restore();
}

function drawTransformHandles(
  context: CanvasRenderingContext2D,
  layout: ElementHandleLayout,
  palette: PanelCanvasPalette,
) {
  const halfHandleSizePx = REFERENCE_IMAGE_HANDLE_SIZE_PX / 2;

  context.save();
  context.setLineDash([]);
  context.lineWidth = 1.5;
  context.fillStyle = palette.handleFill;
  context.strokeStyle = palette.handleStroke;

  if (layout.hasRotationHandle) {
    const rotationHandle = getElementHandleLocalPositionPx(layout, "rotate");
    context.save();
    context.strokeStyle = palette.selection;
    context.beginPath();
    context.moveTo(0, -layout.halfSizePx.y);
    context.lineTo(rotationHandle.x, rotationHandle.y);
    context.stroke();
    context.restore();

    context.beginPath();
    context.arc(rotationHandle.x, rotationHandle.y, halfHandleSizePx, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  layout.handles.forEach((handle) => {
    const point = getElementHandleLocalPositionPx(layout, handle);
    context.beginPath();
    context.rect(
      point.x - halfHandleSizePx,
      point.y - halfHandleSizePx,
      REFERENCE_IMAGE_HANDLE_SIZE_PX,
      REFERENCE_IMAGE_HANDLE_SIZE_PX,
    );
    context.fill();
    context.stroke();
  });

  context.restore();
}

function drawSelectionOutline(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  transform: CanvasTransform,
  selectionColor: string,
  selectionAnimation?: SelectionAnimationState,
) {
  const { widthMm, heightMm } = getElementSizeMm(element);
  const center = projectPanelPoint(element.positionMm, transform);

  context.save();
  context.translate(center.x, center.y);
  const rotation = ((element.rotationDeg ?? 0) * Math.PI) / 180;
  if (rotation !== 0) {
    context.rotate(rotation);
  }
  if (getElementResizeMode(element) === "diameter") {
    drawSelectionCircle(
      context,
      (widthMm / 2) * transform.scale + 6,
      selectionColor,
      selectionAnimation,
    );
  } else {
    drawSelectionRect(
      context,
      widthMm * transform.scale + 12,
      heightMm * transform.scale + 12,
      selectionColor,
      selectionAnimation,
    );
  }
  context.restore();
}

function drawInlineDimensionLabels(
  context: CanvasRenderingContext2D,
  elements: PanelElement[],
  transform: CanvasTransform,
  palette: PanelCanvasPalette,
  fontFamily: string,
  skippedElementId: string | null,
) {
  if (transform.scale <= 0) {
    return;
  }

  context.save();
  context.font = getDimensionFont(fontFamily);
  elements.forEach((element) => {
    if (element.id === skippedElementId) {
      return;
    }
    const dimensions = getElementDimensions(element);
    if (!dimensions) {
      return;
    }
    const text =
      dimensions.kind === "diameter"
        ? formatDiameterLabel(dimensions.diameterMm)
        : formatBoxLabel(dimensions.widthMm, dimensions.heightMm);
    const placement = getInlineLabelPlacement(
      element,
      getHalfTextSizeMm(context, text, transform.scale),
    );
    if (!placement) {
      return;
    }

    const frameRotationRad = (getElementFrameRotationDeg(element) * Math.PI) / 180;
    const center = projectPanelPoint(element.positionMm, transform);
    context.save();
    context.translate(center.x, center.y);
    if (frameRotationRad !== 0) {
      context.rotate(frameRotationRad);
    }
    drawDimensionText(
      context,
      text,
      {
        x: placement.offsetMm.x * transform.scale,
        y: placement.offsetMm.y * transform.scale,
      },
      placement.vertical ? -Math.PI / 2 : 0,
      frameRotationRad,
      palette,
    );
    context.restore();
  });
  context.restore();
}

/** Draws in the element frame: the context is already translated and rotated. */
function drawSelectedElementDimensions(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  layout: ElementHandleLayout,
  scale: number,
  frameRotationRad: number,
  palette: PanelCanvasPalette,
  fontFamily: string,
) {
  const dimensions = getElementDimensions(element);
  if (!dimensions) {
    return;
  }

  context.save();
  context.font = getDimensionFont(fontFamily);

  if (dimensions.kind === "diameter") {
    const text = formatDiameterLabel(dimensions.diameterMm);
    const placement = getInlineLabelPlacement(element, getHalfTextSizeMm(context, text, scale));
    const textCenter = placement
      ? { x: placement.offsetMm.x * scale, y: placement.offsetMm.y * scale }
      : { x: 0, y: layout.halfSizePx.y + DIMENSION_LINE_OFFSET_PX };
    drawDimensionText(context, text, textCenter, 0, frameRotationRad, palette);
    context.restore();
    return;
  }

  const halfWidthPx = (dimensions.widthMm * scale) / 2;
  const halfHeightPx = (dimensions.heightMm * scale) / 2;
  const widthLineY = layout.halfSizePx.y + DIMENSION_LINE_OFFSET_PX;
  const heightLineX = layout.halfSizePx.x + DIMENSION_LINE_OFFSET_PX;
  drawDimensionLine(
    context,
    { x: -halfWidthPx, y: widthLineY },
    { x: halfWidthPx, y: widthLineY },
    formatDimensionMm(dimensions.widthMm),
    frameRotationRad,
    palette,
  );
  drawDimensionLine(
    context,
    { x: heightLineX, y: halfHeightPx },
    { x: heightLineX, y: -halfHeightPx },
    formatDimensionMm(dimensions.heightMm),
    frameRotationRad,
    palette,
  );
  context.restore();
}

/** Dimension line with end ticks; the value sits in a gap of the line, or beside it if too short. */
function drawDimensionLine(
  context: CanvasRenderingContext2D,
  from: Vector2,
  to: Vector2,
  text: string,
  frameRotationRad: number,
  palette: PanelCanvasPalette,
) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length < 1) {
    return;
  }

  const unit = { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
  // Both dimension lines run so that this normal points away from the element.
  const normal = { x: -unit.y, y: unit.x };
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const gapPx = context.measureText(text).width + DIMENSION_TEXT_GAP_PX * 2;
  const textOnLine = length >= gapPx + DIMENSION_TICK_PX * 2;

  context.save();
  context.setLineDash([]);
  context.strokeStyle = palette.dimensionLine;
  context.lineWidth = 1;
  context.beginPath();
  if (textOnLine) {
    context.moveTo(from.x, from.y);
    context.lineTo(middle.x - (unit.x * gapPx) / 2, middle.y - (unit.y * gapPx) / 2);
    context.moveTo(middle.x + (unit.x * gapPx) / 2, middle.y + (unit.y * gapPx) / 2);
    context.lineTo(to.x, to.y);
  } else {
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
  }
  [from, to].forEach((end) => {
    context.moveTo(end.x - normal.x * DIMENSION_TICK_PX, end.y - normal.y * DIMENSION_TICK_PX);
    context.lineTo(end.x + normal.x * DIMENSION_TICK_PX, end.y + normal.y * DIMENSION_TICK_PX);
  });
  context.stroke();
  context.restore();

  const textOffsetPx = textOnLine ? 0 : DIMENSION_FONT_SIZE_PX / 2 + DIMENSION_TEXT_GAP_PX;
  drawDimensionText(
    context,
    text,
    { x: middle.x + normal.x * textOffsetPx, y: middle.y + normal.y * textOffsetPx },
    Math.atan2(unit.y, unit.x),
    frameRotationRad,
    palette,
  );
}

/** Haloed text, flipped when needed so it never reads upside down on rotated elements. */
function drawDimensionText(
  context: CanvasRenderingContext2D,
  text: string,
  center: Vector2,
  localAngleRad: number,
  frameRotationRad: number,
  palette: PanelCanvasPalette,
) {
  context.save();
  context.translate(center.x, center.y);
  context.rotate(localAngleRad + getReadableTextFlip(frameRotationRad + localAngleRad));
  context.setLineDash([]);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = 3;
  context.strokeStyle = palette.dimensionHalo;
  context.strokeText(text, 0, 0);
  context.fillStyle = palette.dimensionText;
  context.fillText(text, 0, 0);
  context.restore();
}

function getDimensionFont(fontFamily: string): string {
  return `600 ${DIMENSION_FONT_SIZE_PX}px ${fontFamily}`;
}

function getHalfTextSizeMm(
  context: CanvasRenderingContext2D,
  text: string,
  scale: number,
): Vector2 {
  return {
    x: (context.measureText(text).width / 2 + DIMENSION_TEXT_PADDING_PX) / scale,
    y: (DIMENSION_FONT_SIZE_PX / 2 + DIMENSION_TEXT_PADDING_PX) / scale,
  };
}

function drawSelectionCircle(
  context: CanvasRenderingContext2D,
  radius: number,
  selectionColor: string,
  selectionAnimation?: SelectionAnimationState,
) {
  context.save();
  context.strokeStyle = selectionColor;
  const pulseScale = selectionAnimation?.pulseScale ?? 1;
  context.lineWidth = 2 * pulseScale;
  const baseDash = 6;
  context.setLineDash([baseDash * pulseScale, baseDash * pulseScale]);
  context.lineDashOffset = selectionAnimation?.dashOffset ?? 0;
  context.beginPath();
  context.arc(0, 0, radius * pulseScale, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawSelectionRect(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  selectionColor: string,
  selectionAnimation?: SelectionAnimationState,
) {
  context.save();
  context.strokeStyle = selectionColor;
  const pulseScale = selectionAnimation?.pulseScale ?? 1;
  context.lineWidth = 2 * pulseScale;
  const baseDash = 6;
  context.setLineDash([baseDash * pulseScale, baseDash * pulseScale]);
  context.lineDashOffset = selectionAnimation?.dashOffset ?? 0;
  context.strokeRect(
    (-width / 2) * pulseScale,
    (-height / 2) * pulseScale,
    width * pulseScale,
    height * pulseScale,
  );
  context.restore();
}
