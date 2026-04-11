import type { Vector2 } from "./panelTypes";

export interface ReferenceImage {
  dataUrl: string;
  positionMm: Vector2;
  widthMm: number;
  heightMm: number;
  rotationDeg: number;
  opacity: number;
  naturalWidth: number;
  naturalHeight: number;
}

type AxisDirection = -1 | 0 | 1;

export type ReferenceImageResizeHandle =
  | "top-left"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left";

export type ReferenceImageControlHandle = ReferenceImageResizeHandle | "rotate";

interface ReferenceImageHandleDirection {
  x: AxisDirection;
  y: AxisDirection;
}

export const REFERENCE_IMAGE_RESIZE_HANDLES: ReferenceImageResizeHandle[] = [
  "top-left",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
];

export const REFERENCE_IMAGE_HANDLE_SIZE_PX = 10;
export const REFERENCE_IMAGE_HANDLE_HIT_RADIUS_PX = 10;
export const REFERENCE_IMAGE_ROTATION_HANDLE_OFFSET_PX = 24;
export const MIN_REFERENCE_IMAGE_SIZE_MM = 1;

const HANDLE_DIRECTIONS: Record<ReferenceImageResizeHandle, ReferenceImageHandleDirection> = {
  "top-left": { x: -1, y: -1 },
  top: { x: 0, y: -1 },
  "top-right": { x: 1, y: -1 },
  right: { x: 1, y: 0 },
  "bottom-right": { x: 1, y: 1 },
  bottom: { x: 0, y: 1 },
  "bottom-left": { x: -1, y: 1 },
  left: { x: -1, y: 0 },
};

export function getReferenceImageRotationRad(image: Pick<ReferenceImage, "rotationDeg">): number {
  return ((image.rotationDeg ?? 0) * Math.PI) / 180;
}

export function rotateReferenceImageVector(point: Vector2, rotationRad: number): Vector2 {
  if (rotationRad === 0) {
    return { ...point };
  }

  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

export function referenceImageLocalToWorld(
  localPoint: Vector2,
  image: Pick<ReferenceImage, "positionMm" | "rotationDeg">,
): Vector2 {
  const rotated = rotateReferenceImageVector(localPoint, getReferenceImageRotationRad(image));
  return {
    x: image.positionMm.x + rotated.x,
    y: image.positionMm.y + rotated.y,
  };
}

export function referenceImageWorldToLocal(
  worldPoint: Vector2,
  image: Pick<ReferenceImage, "positionMm" | "rotationDeg">,
): Vector2 {
  const translated = {
    x: worldPoint.x - image.positionMm.x,
    y: worldPoint.y - image.positionMm.y,
  };

  return rotateReferenceImageVector(translated, -getReferenceImageRotationRad(image));
}

export function isPointInReferenceImage(
  point: Vector2,
  image: Pick<ReferenceImage, "positionMm" | "rotationDeg" | "widthMm" | "heightMm">,
  paddingMm = 0,
): boolean {
  const localPoint = referenceImageWorldToLocal(point, image);
  const halfWidth = image.widthMm / 2 + paddingMm;
  const halfHeight = image.heightMm / 2 + paddingMm;

  return Math.abs(localPoint.x) <= halfWidth && Math.abs(localPoint.y) <= halfHeight;
}

export function getReferenceImageHandleDirection(
  handle: ReferenceImageResizeHandle,
): ReferenceImageHandleDirection {
  return HANDLE_DIRECTIONS[handle];
}

export function getReferenceImageResizeHandlePosition(
  image: Pick<ReferenceImage, "positionMm" | "rotationDeg" | "widthMm" | "heightMm">,
  handle: ReferenceImageResizeHandle,
): Vector2 {
  const direction = HANDLE_DIRECTIONS[handle];

  return referenceImageLocalToWorld(
    {
      x: (image.widthMm / 2) * direction.x,
      y: (image.heightMm / 2) * direction.y,
    },
    image,
  );
}

export function getReferenceImageControlPositions(
  image: Pick<ReferenceImage, "positionMm" | "rotationDeg" | "widthMm" | "heightMm">,
  rotationHandleOffsetMm: number,
): Record<ReferenceImageControlHandle, Vector2> {
  const positions = Object.fromEntries(
    REFERENCE_IMAGE_RESIZE_HANDLES.map((handle) => [
      handle,
      getReferenceImageResizeHandlePosition(image, handle),
    ]),
  ) as Record<ReferenceImageResizeHandle, Vector2>;

  return {
    ...positions,
    rotate: referenceImageLocalToWorld(
      {
        x: 0,
        y: -(image.heightMm / 2 + Math.max(rotationHandleOffsetMm, 0)),
      },
      image,
    ),
  };
}

export function resizeReferenceImageFromHandle(
  image: Pick<ReferenceImage, "positionMm" | "rotationDeg" | "widthMm" | "heightMm">,
  handle: ReferenceImageResizeHandle,
  draggedPointMm: Vector2,
  minSizeMm = MIN_REFERENCE_IMAGE_SIZE_MM,
): Pick<ReferenceImage, "positionMm" | "widthMm" | "heightMm"> {
  const direction = HANDLE_DIRECTIONS[handle];
  const minSize = Math.max(minSizeMm, MIN_REFERENCE_IMAGE_SIZE_MM);
  const fixedPoint = referenceImageLocalToWorld(
    {
      x: direction.x === 0 ? 0 : (-direction.x * image.widthMm) / 2,
      y: direction.y === 0 ? 0 : (-direction.y * image.heightMm) / 2,
    },
    image,
  );
  const rotationRad = getReferenceImageRotationRad(image);
  const localDelta = rotateReferenceImageVector(
    {
      x: draggedPointMm.x - fixedPoint.x,
      y: draggedPointMm.y - fixedPoint.y,
    },
    -rotationRad,
  );

  const rawWidthMm =
    direction.x === 0 ? image.widthMm : Math.max(minSize, direction.x * localDelta.x);
  const rawHeightMm =
    direction.y === 0 ? image.heightMm : Math.max(minSize, direction.y * localDelta.y);
  let widthMm = rawWidthMm;
  let heightMm = rawHeightMm;

  if (direction.x !== 0 && direction.y !== 0) {
    const baseWidth = Math.max(image.widthMm, MIN_REFERENCE_IMAGE_SIZE_MM);
    const baseHeight = Math.max(image.heightMm, MIN_REFERENCE_IMAGE_SIZE_MM);
    const aspectRatio = baseWidth / baseHeight;
    const widthScale = rawWidthMm / baseWidth;
    const heightScale = rawHeightMm / baseHeight;

    if (widthScale >= heightScale) {
      widthMm = rawWidthMm;
      heightMm = widthMm / aspectRatio;
      if (heightMm < minSize) {
        heightMm = minSize;
        widthMm = heightMm * aspectRatio;
      }
    } else {
      heightMm = rawHeightMm;
      widthMm = heightMm * aspectRatio;
      if (widthMm < minSize) {
        widthMm = minSize;
        heightMm = widthMm / aspectRatio;
      }
    }
  }

  const centerOffset = rotateReferenceImageVector(
    {
      x: direction.x === 0 ? 0 : (direction.x * widthMm) / 2,
      y: direction.y === 0 ? 0 : (direction.y * heightMm) / 2,
    },
    rotationRad,
  );

  return {
    positionMm: {
      x: fixedPoint.x + centerOffset.x,
      y: fixedPoint.y + centerOffset.y,
    },
    widthMm,
    heightMm,
  };
}
