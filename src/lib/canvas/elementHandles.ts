import {
  PanelElementType,
  isCircularElementProperties,
  type PanelElement,
  type RectangularElementProperties,
  type Vector2,
} from "@lib/panelTypes";
import {
  getReferenceImageHandleDirection,
  REFERENCE_IMAGE_HANDLE_HIT_RADIUS_PX,
  REFERENCE_IMAGE_RESIZE_HANDLES,
  REFERENCE_IMAGE_ROTATION_HANDLE_OFFSET_PX,
  rotateReferenceImageVector,
  type ReferenceImageControlHandle,
  type ReferenceImageResizeHandle,
} from "@lib/referenceImage";

import { getElementSizeMm, getLabelSizeMm } from "./elementGeometry";
import { projectPanelPoint, type CanvasTransform } from "./transform";

/**
 * How dragging a handle changes an element:
 * - diameter: circles grow around their center
 * - box: the side (or corner) opposite to the handle stays in place
 * - font: labels scale their font size from the opposite corner
 * - artwork: SVG artwork keeps its aspect ratio (handled with the reference image helpers)
 */
type ElementResizeMode = "diameter" | "box" | "font" | "artwork";

export interface ElementHandleLayout {
  mode: ElementResizeMode;
  /** Half size of the transform frame in screen pixels, never smaller than the handles need. */
  halfSizePx: Vector2;
  handles: ReferenceImageResizeHandle[];
  hasRotationHandle: boolean;
}

interface ElementResizeOptions {
  snap: boolean;
}

const ELEMENT_RESIZE_STEP_MM = 0.5;
const LABEL_FONT_STEP_PT = 0.5;
const MIN_ELEMENT_SIZE_MM = 0.5;
const MIN_LABEL_FONT_SIZE_PT = 1;

// Keeps corner handles apart (and the element body grabbable) on tiny elements.
const MIN_FRAME_HALF_SIZE_PX = 10;
// Edge handles only appear on sides long enough to hold them next to the corner handles.
const MIN_EDGE_HANDLE_SIDE_PX = 40;
const CORNER_HANDLES: ReferenceImageResizeHandle[] = [
  "top-left",
  "top-right",
  "bottom-right",
  "bottom-left",
];

export function getElementResizeMode(element: PanelElement): ElementResizeMode {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
    case PanelElementType.Insert:
      return "diameter";
    case PanelElementType.Switch:
      return isCircularElementProperties(element.properties) ? "diameter" : "box";
    case PanelElementType.Label:
      return "font";
    case PanelElementType.SvgArtwork:
      return "artwork";
    default:
      return "box";
  }
}

/** Circles look the same at any rotation, so their handle frame stays axis-aligned. */
export function getElementFrameRotationDeg(element: PanelElement): number {
  return getElementResizeMode(element) === "diameter" ? 0 : (element.rotationDeg ?? 0);
}

export function getElementHandleLayout(element: PanelElement, scale: number): ElementHandleLayout {
  const size = getElementSizeMm(element);
  const mode = getElementResizeMode(element);
  const halfWidthPx = (size.widthMm * scale) / 2;
  const halfHeightPx = (size.heightMm * scale) / 2;

  if (mode === "artwork") {
    // Artwork resizes from the absolute pointer position, so its handles sit on the real edges.
    return {
      mode,
      halfSizePx: { x: halfWidthPx, y: halfHeightPx },
      handles: [...REFERENCE_IMAGE_RESIZE_HANDLES],
      hasRotationHandle: true,
    };
  }

  const halfSizePx = {
    x: Math.max(halfWidthPx, MIN_FRAME_HALF_SIZE_PX),
    y: Math.max(halfHeightPx, MIN_FRAME_HALF_SIZE_PX),
  };
  const handles = [...CORNER_HANDLES];
  if (mode !== "font") {
    if (halfSizePx.x * 2 >= MIN_EDGE_HANDLE_SIDE_PX) {
      handles.push("top", "bottom");
    }
    if (halfSizePx.y * 2 >= MIN_EDGE_HANDLE_SIDE_PX) {
      handles.push("right", "left");
    }
  }
  return { mode, halfSizePx, handles, hasRotationHandle: false };
}

/** Handle position in the element's local frame, in screen pixels. */
export function getElementHandleLocalPositionPx(
  layout: ElementHandleLayout,
  handle: ReferenceImageControlHandle,
): Vector2 {
  if (handle === "rotate") {
    return { x: 0, y: -(layout.halfSizePx.y + REFERENCE_IMAGE_ROTATION_HANDLE_OFFSET_PX) };
  }
  const direction = getReferenceImageHandleDirection(handle);
  return {
    x: direction.x * layout.halfSizePx.x,
    y: direction.y * layout.halfSizePx.y,
  };
}

export function findElementHandleAtPoint(
  element: PanelElement,
  transform: CanvasTransform,
  pointPx: Vector2,
): ReferenceImageControlHandle | null {
  if (transform.scale <= 0) {
    return null;
  }

  const layout = getElementHandleLayout(element, transform.scale);
  const centerPx = projectPanelPoint(element.positionMm, transform);
  const rotationRad = toRadians(getElementFrameRotationDeg(element));
  const controls: ReferenceImageControlHandle[] = layout.hasRotationHandle
    ? [...layout.handles, "rotate"]
    : layout.handles;
  const maxDistanceSq = REFERENCE_IMAGE_HANDLE_HIT_RADIUS_PX ** 2;
  let closestHandle: ReferenceImageControlHandle | null = null;
  let closestDistanceSq = Infinity;

  controls.forEach((handle) => {
    const offset = rotateReferenceImageVector(
      getElementHandleLocalPositionPx(layout, handle),
      rotationRad,
    );
    const dx = pointPx.x - (centerPx.x + offset.x);
    const dy = pointPx.y - (centerPx.y + offset.y);
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq <= maxDistanceSq && distanceSq < closestDistanceSq) {
      closestHandle = handle;
      closestDistanceSq = distanceSq;
    }
  });

  return closestHandle;
}

/**
 * Resizes an element from one of its handles. `pointerDeltaMm` is the pointer travel since the
 * drag started and `element` is the element as it was at that moment, so the handle follows the
 * pointer even when the frame is enlarged for small elements. SVG artwork is returned unchanged.
 */
export function resizeElementFromHandle(
  element: PanelElement,
  handle: ReferenceImageResizeHandle,
  pointerDeltaMm: Vector2,
  options: ElementResizeOptions,
): PanelElement {
  const direction = getReferenceImageHandleDirection(handle);
  const rotationRad = toRadians(getElementFrameRotationDeg(element));
  const localDelta = rotateReferenceImageVector(pointerDeltaMm, -rotationRad);
  const sizeStepMm = options.snap ? ELEMENT_RESIZE_STEP_MM : undefined;

  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led: {
      const diameterMm = resizeDiameter(
        element.properties.diameterMm,
        direction,
        localDelta,
        sizeStepMm,
        MIN_ELEMENT_SIZE_MM,
      );
      return { ...element, properties: { ...element.properties, diameterMm } };
    }
    case PanelElementType.Insert: {
      const outerDiameterMm = resizeDiameter(
        element.properties.outerDiameterMm,
        direction,
        localDelta,
        sizeStepMm,
        Math.max(MIN_ELEMENT_SIZE_MM, element.properties.innerDiameterMm),
      );
      return { ...element, properties: { ...element.properties, outerDiameterMm } };
    }
    case PanelElementType.Switch: {
      if (isCircularElementProperties(element.properties)) {
        const diameterMm = resizeDiameter(
          element.properties.diameterMm,
          direction,
          localDelta,
          sizeStepMm,
          MIN_ELEMENT_SIZE_MM,
        );
        return { ...element, properties: { ...element.properties, diameterMm } };
      }
      const box = { positionMm: element.positionMm, properties: element.properties };
      return { ...element, ...resizeBox(box, direction, localDelta, sizeStepMm, rotationRad) };
    }
    case PanelElementType.Rectangle:
    case PanelElementType.Oval:
    case PanelElementType.Slot:
    case PanelElementType.Triangle:
      return { ...element, ...resizeBox(element, direction, localDelta, sizeStepMm, rotationRad) };
    case PanelElementType.Label: {
      const startSize = getLabelSizeMm(element.properties);
      // Project the dragged corner on the frame diagonal to get a uniform scale factor.
      const diagonal = {
        x: direction.x * startSize.widthMm,
        y: direction.y * startSize.heightMm,
      };
      const diagonalLengthSq = diagonal.x ** 2 + diagonal.y ** 2;
      if (diagonalLengthSq === 0) {
        return element;
      }
      const scaleFactor =
        ((diagonal.x + localDelta.x) * diagonal.x + (diagonal.y + localDelta.y) * diagonal.y) /
        diagonalLengthSq;
      const properties = {
        ...element.properties,
        fontSizePt: quantizeSize(
          element.properties.fontSizePt * scaleFactor,
          options.snap ? LABEL_FONT_STEP_PT : undefined,
          MIN_LABEL_FONT_SIZE_PT,
        ),
      };
      const nextSize = getLabelSizeMm(properties);
      return {
        ...element,
        positionMm: shiftPosition(
          element.positionMm,
          {
            x: (direction.x * (nextSize.widthMm - startSize.widthMm)) / 2,
            y: (direction.y * (nextSize.heightMm - startSize.heightMm)) / 2,
          },
          rotationRad,
        ),
        properties,
      };
    }
    default:
      return element;
  }
}

interface ResizableBox {
  positionMm: Vector2;
  properties: RectangularElementProperties;
}

/** The side (or corner) opposite to the handle stays in place, even when the box is rotated. */
function resizeBox(
  { positionMm, properties }: ResizableBox,
  direction: Vector2,
  localDelta: Vector2,
  sizeStepMm: number | undefined,
  rotationRad: number,
): ResizableBox {
  const { widthMm, heightMm } = properties;
  const nextWidthMm =
    direction.x === 0
      ? widthMm
      : quantizeSize(widthMm + direction.x * localDelta.x, sizeStepMm, MIN_ELEMENT_SIZE_MM);
  const nextHeightMm =
    direction.y === 0
      ? heightMm
      : quantizeSize(heightMm + direction.y * localDelta.y, sizeStepMm, MIN_ELEMENT_SIZE_MM);
  return {
    positionMm: shiftPosition(
      positionMm,
      {
        x: (direction.x * (nextWidthMm - widthMm)) / 2,
        y: (direction.y * (nextHeightMm - heightMm)) / 2,
      },
      rotationRad,
    ),
    properties: { ...properties, widthMm: nextWidthMm, heightMm: nextHeightMm },
  };
}

function resizeDiameter(
  diameterMm: number,
  direction: Vector2,
  localDelta: Vector2,
  stepMm: number | undefined,
  minMm: number,
): number {
  // The center stays fixed, so the dragged handle moves by the change of radius.
  const axisWeight = direction.x ** 2 + direction.y ** 2;
  const radiusDeltaMm =
    axisWeight > 0 ? (direction.x * localDelta.x + direction.y * localDelta.y) / axisWeight : 0;
  return quantizeSize(diameterMm + 2 * radiusDeltaMm, stepMm, minMm);
}

function quantizeSize(value: number, step: number | undefined, min: number): number {
  const stepped = step ? Math.round(value / step) * step : value;
  return Math.max(min, Math.round(stepped * 100) / 100);
}

function shiftPosition(position: Vector2, localShift: Vector2, rotationRad: number): Vector2 {
  const shift = rotateReferenceImageVector(localShift, rotationRad);
  return { x: position.x + shift.x, y: position.y + shift.y };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
