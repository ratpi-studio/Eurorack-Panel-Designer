import React from "react";

import type { PatternCanvasBinding } from "@components/PanelDesigner/usePatternCommand";
import type { PatternOverlay } from "@lib/canvas/patternOverlay";
import { computeCanvasTransform } from "@lib/canvas/transform";
import {
  PanelElementType,
  withElementProperties,
  type MountingHole,
  type PanelElement,
  type PanelModel,
  type PanelOptions,
  type Vector2,
} from "@lib/panelTypes";
import type { ReferenceImage } from "@lib/referenceImage";
import { type ClearanceLines } from "@lib/clearance";
import { createPanelElement } from "@lib/elements";
import { snapPointToGrid } from "@lib/grid";
import {
  useCanvasPointer,
  type CanvasContextMenuRequest,
  type CanvasPatternPointer,
} from "./useCanvasPointer";
import { useCanvasRender } from "./useCanvasRender";
import { useCanvasSize } from "./useCanvasSize";
import * as styles from "./PanelCanvas.css";

const CANVAS_PADDING_PX = 48;
// How close, in pixels, a reference must come to an element's center to snap to it.
const PATTERN_SNAP_PX = 10;

type DraftPropertiesState = Partial<{
  [T in PanelElementType]: PanelElement["properties"];
}>;

interface PanelCanvasProps {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  model: PanelModel;
  mountingHoles: MountingHole[];
  elementMountingHoles: MountingHole[];
  referenceImage: ReferenceImage | null;
  referenceImageSelected: boolean;
  mountingHolesSelected: boolean;
  zoom: number;
  pan: Vector2;
  zoomLimits: { min: number; max: number };
  placementType: PanelElementType | null;
  onPlaceElement: (type: PanelElementType, positionMm: Vector2) => string;
  onMoveElement: (elementId: string, positionMm: Vector2) => void;
  onMoveStart?: (elementId: string) => void;
  onMoveEnd?: () => void;
  onUpdateElement: (
    elementId: string,
    updater: (element: PanelElement) => PanelElement,
    options?: { skipHistory?: boolean },
  ) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: Vector2) => void;
  onSelectElement: (elementId: string | null) => void;
  onAddSelectedElements: (elementIds: string[]) => void;
  onSelectElements: (elementIds: string[]) => void;
  onToggleElementSelection: (elementId: string) => void;
  onClearSelection: () => void;
  onSelectReferenceImage: () => void;
  onClearReferenceSelection: () => void;
  onUpdateReferenceImage: (updates: Partial<ReferenceImage>) => void;
  referenceCalibrationPoints: Vector2[] | null;
  onPickCalibrationPoint: (pointMm: Vector2) => void;
  onSelectMountingHoles: () => void;
  onClearMountingHoleSelection: () => void;
  displayOptions: Pick<
    PanelOptions,
    "showGrid" | "showMountingHoles" | "gridSizeMm" | "snapToGrid"
  >;
  selectedElementIds: string[];
  draftProperties: DraftPropertiesState;
  onMoveElements: (updates: { id: string; positionMm: Vector2 }[]) => void;
  clearanceLines: ClearanceLines;
  onClearanceLineChange: (line: "top" | "bottom", positionMm: number) => void;
  onClearanceLineDragStart: () => void;
  onClearanceLineDragEnd: () => void;
  /** A running mirror or pattern command, previewed on the canvas. */
  pattern: PatternCanvasBinding | null;
  onRequestContextMenu: (request: CanvasContextMenuRequest) => void;
}

export function PanelCanvas({
  canvasRef: forwardedCanvasRef,
  model,
  mountingHoles,
  elementMountingHoles,
  mountingHolesSelected,
  zoom,
  pan,
  zoomLimits,
  placementType,
  onPlaceElement,
  onMoveElement,
  onMoveElements,
  onMoveStart,
  onMoveEnd,
  onUpdateElement,
  onZoomChange,
  onPanChange,
  onSelectElement,
  onAddSelectedElements,
  onSelectElements,
  onToggleElementSelection,
  onClearSelection,
  onSelectReferenceImage,
  onClearReferenceSelection,
  onUpdateReferenceImage,
  referenceCalibrationPoints,
  onPickCalibrationPoint,
  onSelectMountingHoles,
  onClearMountingHoleSelection,
  displayOptions,
  selectedElementIds,
  draftProperties,
  referenceImage,
  referenceImageSelected,
  clearanceLines,
  onClearanceLineChange,
  onClearanceLineDragStart,
  onClearanceLineDragEnd,
  pattern,
  onRequestContextMenu,
}: PanelCanvasProps) {
  const internalCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canvasRef = forwardedCanvasRef ?? internalCanvasRef;
  const { containerRef, canvasSize } = useCanvasSize();

  const transform = React.useMemo(
    () =>
      computeCanvasTransform({
        canvasSizePx: canvasSize,
        panelSizeMm: {
          x: model.dimensions.widthMm,
          y: model.dimensions.heightMm,
        },
        zoom,
        pan,
        paddingPx: CANVAS_PADDING_PX,
      }),
    [canvasSize, model.dimensions.heightMm, model.dimensions.widthMm, pan, zoom],
  );

  const patternSnap = React.useCallback(
    (grid: boolean) => ({ thresholdMm: PATTERN_SNAP_PX / Math.max(transform.scale, 0.01), grid }),
    [transform.scale],
  );
  const patternPointer = React.useMemo<CanvasPatternPointer | null>(
    () =>
      pattern
        ? {
            guides: pattern.guides,
            awaitingReference: pattern.awaitingReference,
            onPick: (pointMm, snap) => pattern.pick(pointMm, patternSnap(snap)),
            onDragHandle: (handle, pointMm, snap) =>
              pattern.dragHandle(handle, pointMm, patternSnap(snap)),
          }
        : null,
    [pattern, patternSnap],
  );

  const {
    selectionOverlay,
    pointerPanelPos,
    referenceImageElement,
    snapOverridden,
    canvasClassName,
    canvasCursor,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleContextMenu,
    activePatternHandle,
  } = useCanvasPointer({
    canvasRef,
    transform,
    model,
    mountingHoles,
    referenceImage,
    referenceImageSelected,
    mountingHolesSelected,
    zoom,
    zoomLimits,
    pan,
    canvasSize,
    placementType,
    draftProperties,
    displayOptions,
    selectedElementIds,
    onPlaceElement,
    onMoveElement,
    onMoveElements,
    onMoveStart,
    onMoveEnd,
    onUpdateElement,
    onZoomChange,
    onPanChange,
    onSelectElement,
    onAddSelectedElements,
    onSelectElements,
    onToggleElementSelection,
    onClearSelection,
    onSelectReferenceImage,
    onClearReferenceSelection,
    onUpdateReferenceImage,
    referenceCalibrationPoints,
    onPickCalibrationPoint,
    onSelectMountingHoles,
    onClearMountingHoleSelection,
    clearanceLines,
    onClearanceLineChange,
    onClearanceLineDragStart,
    onClearanceLineDragEnd,
    pattern: patternPointer,
    onRequestContextMenu,
  });

  const maybeSnap = React.useCallback(
    (point: Vector2): Vector2 =>
      displayOptions.snapToGrid && !snapOverridden
        ? snapPointToGrid(point, displayOptions.gridSizeMm, {
            x: model.dimensions.widthMm,
            y: model.dimensions.heightMm,
          })
        : point,
    [
      displayOptions.gridSizeMm,
      displayOptions.snapToGrid,
      snapOverridden,
      model.dimensions.heightMm,
      model.dimensions.widthMm,
    ],
  );

  const panelSystem = model.format.system;
  const ghostElement = React.useMemo<PanelElement | null>(() => {
    if (!placementType || !pointerPanelPos) {
      return null;
    }

    const snappedPoint = maybeSnap(pointerPanelPos);
    const base = createPanelElement(placementType, snappedPoint, panelSystem);
    const draft = draftProperties[placementType];
    const withDraft = draft ? withElementProperties(base, draft) : base;

    return {
      ...withDraft,
      id: "ghost",
    };
  }, [draftProperties, maybeSnap, panelSystem, placementType, pointerPanelPos]);

  const referenceCalibration = React.useMemo(
    () =>
      referenceCalibrationPoints
        ? {
            points: referenceCalibrationPoints,
            pointerMm: referenceCalibrationPoints.length === 1 ? pointerPanelPos : null,
          }
        : null,
    [pointerPanelPos, referenceCalibrationPoints],
  );

  // While a command runs, the canvas shows the design as it would be once applied.
  const renderModel = React.useMemo(
    () => (pattern ? { ...model, elements: pattern.previewElements } : model),
    [model, pattern],
  );
  const patternOverlay = React.useMemo<PatternOverlay | null>(() => {
    if (!pattern) {
      return null;
    }
    const candidate =
      pattern.awaitingReference && pointerPanelPos
        ? pattern.getCandidate(
            pointerPanelPos,
            patternSnap(displayOptions.snapToGrid && !snapOverridden),
          )
        : null;
    return {
      guides: pattern.guides,
      candidate,
      copyIds: pattern.copyIds,
      activeHandle: activePatternHandle,
    };
  }, [
    activePatternHandle,
    displayOptions.snapToGrid,
    pattern,
    patternSnap,
    pointerPanelPos,
    snapOverridden,
  ]);

  useCanvasRender({
    canvasRef,
    canvasSize,
    transform,
    model: renderModel,
    patternOverlay,
    mountingHoles,
    elementMountingHoles,
    displayOptions,
    selectedElementIds,
    mountingHolesSelected,
    ghostElement,
    clearanceLines,
    referenceImage,
    referenceImageElement,
    referenceImageSelected,
    referenceCalibration,
    placementType,
  });

  const pointerText = pointerPanelPos
    ? ` · X ${pointerPanelPos.x.toFixed(1)} mm · Y ${pointerPanelPos.y.toFixed(1)} mm`
    : "";
  // Two decimals at most: panel heights such as 39.65 mm (Intellijel 1U) need them.
  const sizeText = `${Number(model.dimensions.widthMm.toFixed(2))} x ${Number(
    model.dimensions.heightMm.toFixed(2),
  )} mm`;
  // Kosmo widths are not counted in HP.
  const hpText = model.format.system === "eurorack" ? `${model.dimensions.widthHp} HP · ` : "";
  const hudText = `${hpText}${sizeText} · Zoom ${(zoom * 100).toFixed(0)}%${pointerText}`;

  // Browser translation rewraps text nodes in <font> elements, and React crashes if it later
  // has to remove one. Keep this subtree static: one HUD text node, selection rect always
  // mounted, translation disabled.
  return (
    <div ref={containerRef} className={styles.root} translate="no">
      <canvas
        ref={canvasRef}
        className={canvasClassName}
        role="presentation"
        style={{ cursor: canvasCursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={handleContextMenu}
      />
      <div
        className={styles.selectionRect}
        hidden={!selectionOverlay}
        style={
          selectionOverlay
            ? {
                left: `${selectionOverlay.left}px`,
                top: `${selectionOverlay.top}px`,
                width: `${selectionOverlay.width}px`,
                height: `${selectionOverlay.height}px`,
              }
            : undefined
        }
      />
      <div className={styles.hud}>{hudText}</div>
    </div>
  );
}
