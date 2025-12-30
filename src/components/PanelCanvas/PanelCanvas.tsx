import React from 'react';

import { computeCanvasTransform } from '@lib/canvas/transform';
import {
  PanelElementType,
  withElementProperties,
  type MountingHole,
  type PanelElement,
  type PanelModel,
  type PanelOptions,
  type Vector2
} from '@lib/panelTypes';
import type { ReferenceImage } from '@lib/referenceImage';
import { type ClearanceLines } from '@lib/clearance';
import { createPanelElement } from '@lib/elements';
import { snapPointToGrid } from '@lib/grid';
import { useCanvasPointer } from './useCanvasPointer';
import { useCanvasRender } from './useCanvasRender';
import { useCanvasSize } from './useCanvasSize';
import * as styles from './PanelCanvas.css';

const CANVAS_PADDING_PX = 48;
const CANVAS_WIDTH_PX = 1200;
const CANVAS_HEIGHT_PX = 720;

type DraftPropertiesState = Partial<{
  [T in PanelElementType]: PanelElement['properties'];
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
  onSelectMountingHoles: () => void;
  onClearMountingHoleSelection: () => void;
  displayOptions: Pick<
    PanelOptions,
    'showGrid' | 'showMountingHoles' | 'gridSizeMm' | 'snapToGrid'
  >;
  selectedElementIds: string[];
  draftProperties: DraftPropertiesState;
  onMoveElements: (updates: { id: string; positionMm: Vector2 }[]) => void;
  clearanceLines: ClearanceLines;
  onClearanceLineChange: (line: 'top' | 'bottom', positionMm: number) => void;
  onClearanceLineDragStart: () => void;
  onClearanceLineDragEnd: () => void;
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
  onClearanceLineDragEnd
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
          y: model.dimensions.heightMm
        },
        zoom,
        pan,
        paddingPx: CANVAS_PADDING_PX
      }),
    [canvasSize, model.dimensions.heightMm, model.dimensions.widthMm, pan, zoom]
  );

  const {
    selectionOverlay,
    pointerPanelPos,
    referenceImageElement,
    snapOverridden,
    canvasClassName,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleContextMenu
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
    onSelectMountingHoles,
    onClearMountingHoleSelection,
    clearanceLines,
    onClearanceLineChange,
    onClearanceLineDragStart,
    onClearanceLineDragEnd
  });

  const maybeSnap = React.useCallback(
    (point: Vector2): Vector2 =>
      displayOptions.snapToGrid && !snapOverridden
        ? snapPointToGrid(
            point,
            displayOptions.gridSizeMm,
            { x: model.dimensions.widthMm, y: model.dimensions.heightMm }
          )
        : point,
    [
      displayOptions.gridSizeMm,
      displayOptions.snapToGrid,
      snapOverridden,
      model.dimensions.heightMm,
      model.dimensions.widthMm
    ]
  );

  const ghostElement = React.useMemo<PanelElement | null>(() => {
    if (!placementType || !pointerPanelPos) {
      return null;
    }

    const snappedPoint = maybeSnap(pointerPanelPos);
    const base = createPanelElement(placementType, snappedPoint);
    const draft = draftProperties[placementType];
    const withDraft = draft ? withElementProperties(base, draft) : base;

    return {
      ...withDraft,
      id: 'ghost'
    };
  }, [draftProperties, maybeSnap, placementType, pointerPanelPos]);

  useCanvasRender({
    canvasRef,
    canvasSize,
    transform,
    model,
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
    placementType
  });

  const canvasStyle = React.useMemo(
    () => ({
      width: '100%',
      maxWidth: `${CANVAS_WIDTH_PX}px`,
      height: `${canvasSize.y}px`,
      minHeight: `${Math.round(CANVAS_HEIGHT_PX * 0.6)}px`
    }),
    [canvasSize.y]
  );

  const hudText = `${model.dimensions.widthHp} HP · ${model.dimensions.widthMm.toFixed(
    1
  )} x ${model.dimensions.heightMm.toFixed(1)} mm · Zoom ${(zoom * 100).toFixed(0)}%`;

  return (
    <div ref={containerRef} className={styles.root} style={canvasStyle}>
      <canvas
        ref={canvasRef}
        className={canvasClassName}
        role="presentation"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={handleContextMenu}
      />
      {selectionOverlay ? (
        <div
          className={styles.selectionRect}
          style={{
            left: `${selectionOverlay.left}px`,
            top: `${selectionOverlay.top}px`,
            width: `${selectionOverlay.width}px`,
            height: `${selectionOverlay.height}px`
          }}
        />
      ) : null}
      <div className={styles.hud}>
        {hudText}
        {pointerPanelPos
          ? ` · X ${pointerPanelPos.x.toFixed(1)} mm · Y ${pointerPanelPos.y.toFixed(1)} mm`
          : ''}
      </div>
    </div>
  );
}
