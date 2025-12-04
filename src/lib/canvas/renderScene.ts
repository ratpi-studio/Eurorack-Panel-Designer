import {
  PanelElementType,
  type MountingHole,
  type PanelElement
} from '@lib/panelTypes';

import {
  getLabelSizeMm,
  PT_TO_MM
} from './elementGeometry';
import {
  projectPanelPoint,
  type CanvasTransform
} from './transform';

export interface PanelCanvasPalette {
  panelFill: string;
  panelBorder: string;
  grid: string;
  gridCenter: string;
  mountingHoleFill: string;
  mountingHoleStroke: string;
  selection: string;
}

interface SelectionAnimationState {
  dashOffset: number;
  pulseScale: number;
}

interface PanelSceneDrawingOptions {
  context: CanvasRenderingContext2D;
  transform: CanvasTransform;
  elements: PanelElement[];
  mountingHoles: MountingHole[];
  selectedElementIds: string[];
  showGrid: boolean;
  showMountingHoles: boolean;
  gridSizeMm: number;
  palette: PanelCanvasPalette;
  elementFillColors: Record<PanelElementType, string>;
  elementStrokeColor: string;
  fontFamily: string;
  selectionAnimation?: SelectionAnimationState;
  ghostElement?: PanelElement | null;
}

export function drawPanelScene({
  context,
  transform,
  elements,
  mountingHoles,
  selectedElementIds,
  showGrid,
  showMountingHoles,
  gridSizeMm,
  palette,
  elementFillColors,
  elementStrokeColor,
  fontFamily,
  selectionAnimation,
  ghostElement
}: PanelSceneDrawingOptions) {
  drawPanelArea(context, transform, palette);

  if (showGrid) {
    drawGrid(context, transform, gridSizeMm, palette);
  }

  if (showMountingHoles) {
    drawMountingHoles(context, mountingHoles, transform, palette);
  }

  const selectionSet = new Set(selectedElementIds);
  drawElements(
    context,
    elements,
    transform,
    selectionSet,
    elementFillColors,
    elementStrokeColor,
    palette.selection,
    fontFamily,
    selectionAnimation
  );

  if (ghostElement) {
    drawGhostElement(
      context,
      ghostElement,
      transform,
      elementFillColors,
      elementStrokeColor,
      palette.selection,
      fontFamily
    );
  }
}

function drawPanelArea(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  palette: PanelCanvasPalette
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
    transform.panelSizePx.y
  );
  context.fill();
  context.stroke();
  context.restore();
}

function drawGrid(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  gridSizeMm: number,
  palette: PanelCanvasPalette
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
  palette: PanelCanvasPalette
) {
  context.save();
  context.fillStyle = palette.mountingHoleFill;
  context.strokeStyle = palette.mountingHoleStroke;
  context.lineWidth = 1;

  holes.forEach((hole) => {
    const center = projectPanelPoint(hole.center, transform);
    const radius = Math.max((hole.diameterMm / 2) * transform.scale, 1);

    context.beginPath();
    context.arc(center.x, center.y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });

  context.restore();
}

function drawElements(
  context: CanvasRenderingContext2D,
  elements: PanelElement[],
  transform: CanvasTransform,
  selectedElementIds: Set<string>,
  elementFillColors: Record<PanelElementType, string>,
  elementStrokeColor: string,
  selectionColor: string,
  fontFamily: string,
  selectionAnimation?: SelectionAnimationState
) {
  elements.forEach((element) => {
    const center = projectPanelPoint(element.positionMm, transform);
    context.save();
    context.translate(center.x, center.y);

    const rotation = ((element.rotationDeg ?? 0) * Math.PI) / 180;
    if (rotation !== 0) {
      context.rotate(rotation);
    }

    switch (element.type) {
      case PanelElementType.Jack:
      case PanelElementType.Potentiometer:
      case PanelElementType.Led: {
        drawCircularElement(
          context,
          element,
          transform.scale,
          selectedElementIds.has(element.id),
          elementFillColors[element.type],
          elementStrokeColor,
          selectionColor,
          selectionAnimation
        );
        break;
      }
      case PanelElementType.Switch: {
        drawRectangularElement(
          context,
          element,
          transform.scale,
          selectedElementIds.has(element.id),
          elementFillColors[element.type],
          elementStrokeColor,
          selectionColor,
          selectionAnimation
        );
        break;
      }
      case PanelElementType.Label: {
        drawLabelElement(
          context,
          element,
          transform.scale,
          selectedElementIds.has(element.id),
          elementFillColors[element.type],
          selectionColor,
          fontFamily,
          selectionAnimation
        );
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
  elementFillColors: Record<PanelElementType, string>,
  elementStrokeColor: string,
  selectionColor: string,
  fontFamily: string
) {
  context.save();
  context.globalAlpha = 0.4;
  drawElements(
    context,
    [element],
    transform,
    new Set(),
    elementFillColors,
    elementStrokeColor,
    selectionColor,
    fontFamily
  );
  context.restore();
}

function drawCircularElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  scale: number,
  isSelected: boolean,
  fillColor: string,
  strokeColor: string,
  selectionColor: string,
  selectionAnimation?: SelectionAnimationState
) {
  if (
    element.type !== PanelElementType.Jack &&
    element.type !== PanelElementType.Potentiometer &&
    element.type !== PanelElementType.Led
  ) {
    return;
  }

  const radius = (element.properties.diameterMm / 2) * scale;
  context.fillStyle = fillColor;
  context.strokeStyle = strokeColor;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (isSelected) {
    drawSelectionCircle(context, radius + 6, selectionColor, selectionAnimation);
  }
}

function drawRectangularElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  scale: number,
  isSelected: boolean,
  fillColor: string,
  strokeColor: string,
  selectionColor: string,
  selectionAnimation?: SelectionAnimationState
) {
  if (element.type !== PanelElementType.Switch) {
    return;
  }

  const width = element.properties.widthMm * scale;
  const height = element.properties.heightMm * scale;
  context.fillStyle = fillColor;
  context.strokeStyle = strokeColor;
  context.lineWidth = 2;
  context.beginPath();
  context.rect(-width / 2, -height / 2, width, height);
  context.fill();
  context.stroke();

  if (isSelected) {
    drawSelectionRect(
      context,
      width + 12,
      height + 12,
      selectionColor,
      selectionAnimation
    );
  }
}

function drawLabelElement(
  context: CanvasRenderingContext2D,
  element: PanelElement,
  scale: number,
  isSelected: boolean,
  fillColor: string,
  selectionColor: string,
  fontFamily: string,
  selectionAnimation?: SelectionAnimationState
) {
  if (element.type !== PanelElementType.Label) {
    return;
  }

  const text = element.properties.text ?? '';
  const fontSizePx = Math.max(6, element.properties.fontSizePt * PT_TO_MM * scale);
  context.fillStyle = fillColor;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `${fontSizePx}px ${fontFamily}`;
  context.fillText(text, 0, 0);

  if (isSelected) {
    const size = getLabelSizeMm(element.properties);
    drawSelectionRect(
      context,
      size.widthMm * scale + 12,
      size.heightMm * scale + 12,
      selectionColor,
      selectionAnimation
    );
  }
}

function drawSelectionCircle(
  context: CanvasRenderingContext2D,
  radius: number,
  selectionColor: string,
  selectionAnimation?: SelectionAnimationState
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
  selectionAnimation?: SelectionAnimationState
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
    height * pulseScale
  );
  context.restore();
}
