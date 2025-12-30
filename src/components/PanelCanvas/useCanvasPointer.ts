import React from 'react';

import { findElementAtPoint, getElementBounds } from '@lib/canvas/elementGeometry';
import {
  projectPanelPoint,
  screenPointToPanel,
  type CanvasTransform
} from '@lib/canvas/transform';
import {
  PanelElementType,
  type PanelElement,
  type PanelModel,
  type PanelOptions,
  type Vector2,
  type MountingHole
} from '@lib/panelTypes';
import type { ReferenceImage } from '@lib/referenceImage';
import { type ClearanceLines } from '@lib/clearance';
import { snapPointToGrid } from '@lib/grid';
import * as styles from './PanelCanvas.css';
const MOUNTING_HOLE_HIT_PADDING_MM = 1;
const CLEARANCE_LINE_HIT_MM = 3;
const REFERENCE_IMAGE_HIT_PADDING_MM = 3;

type DraftPropertiesState = Partial<{
  [T in PanelElementType]: PanelElement['properties'];
}>;

type MoveState = {
  anchorId: string;
  pointerOffset: Vector2;
  startPositions: Record<string, Vector2>;
  elementIds: string[];
};

type PointerMode = 'idle' | 'pan' | 'click' | 'move' | 'marquee' | 'clearance' | 'reference';

interface SelectionOverlay {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CanvasPointerResult {
  selectionOverlay: SelectionOverlay | null;
  pointerPanelPos: Vector2 | null;
  referenceImageElement: HTMLImageElement | null;
  snapOverridden: boolean;
  canvasClassName: string;
  handlePointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerUp: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerLeave: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (event: React.MouseEvent<HTMLCanvasElement>) => void;
}

interface CanvasPointerOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  transform: CanvasTransform;
  model: PanelModel;
  mountingHoles: MountingHole[];
  referenceImage: ReferenceImage | null;
  referenceImageSelected: boolean;
  mountingHolesSelected: boolean;
  zoom: number;
  zoomLimits: { min: number; max: number };
  pan: Vector2;
  placementType: PanelElementType | null;
  draftProperties: DraftPropertiesState;
  displayOptions: Pick<PanelOptions, 'showGrid' | 'showMountingHoles' | 'gridSizeMm' | 'snapToGrid'>;
  selectedElementIds: string[];
  canvasSize: Vector2;
  onPlaceElement: (type: PanelElementType, positionMm: Vector2) => string;
  onMoveElement: (elementId: string, positionMm: Vector2) => void;
  onMoveElements: (updates: { id: string; positionMm: Vector2 }[]) => void;
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
  clearanceLines: ClearanceLines;
  onClearanceLineChange: (line: 'top' | 'bottom', positionMm: number) => void;
  onClearanceLineDragStart: () => void;
  onClearanceLineDragEnd: () => void;
}

function isPointInMountingHole(point: Vector2, hole: MountingHole, paddingMm = 0): boolean {
  if (hole.shape === 'slot' && hole.slotLengthMm) {
    const radius = hole.diameterMm / 2 + paddingMm;
    const halfLength = Math.max(hole.slotLengthMm / 2 + paddingMm, radius);
    const innerHalf = Math.max(halfLength - radius, 0);
    const dx = Math.abs(point.x - hole.center.x);
    const dy = Math.abs(point.y - hole.center.y);

    if (dx <= innerHalf) {
      return dy <= radius;
    }

    const distX = dx - innerHalf;
    return distX * distX + dy * dy <= radius * radius;
  }

  const radius = hole.diameterMm / 2 + paddingMm;
  const dx = point.x - hole.center.x;
  const dy = point.y - hole.center.y;
  return dx * dx + dy * dy <= radius * radius;
}

function findMountingHoleAtPoint(point: Vector2, holes: MountingHole[]): MountingHole | null {
  for (const hole of holes) {
    if (isPointInMountingHole(point, hole, MOUNTING_HOLE_HIT_PADDING_MM)) {
      return hole;
    }
  }
  return null;
}

function isPointInReferenceImage(point: Vector2, info: ReferenceImage): boolean {
  const halfWidth = info.widthMm / 2 + REFERENCE_IMAGE_HIT_PADDING_MM;
  const halfHeight = info.heightMm / 2 + REFERENCE_IMAGE_HIT_PADDING_MM;
  const rad = ((info.rotationDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(-rad);
  const sin = Math.sin(-rad);
  const dx = point.x - info.positionMm.x;
  const dy = point.y - info.positionMm.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight;
}

function findClearanceLineAtPoint(point: Vector2, lines: ClearanceLines): 'top' | 'bottom' | null {
  const topDist = Math.abs(point.y - lines.topY);
  const bottomDist = Math.abs(point.y - lines.bottomY);
  const nearest = Math.min(topDist, bottomDist);
  if (nearest > CLEARANCE_LINE_HIT_MM) {
    return null;
  }
  return topDist <= bottomDist ? 'top' : 'bottom';
}

export function useCanvasPointer({
  canvasRef,
  transform,
  model,
  mountingHoles,
  referenceImage,
  referenceImageSelected: _referenceImageSelected,
  mountingHolesSelected: _mountingHolesSelected,
  zoom,
  zoomLimits,
  pan,
  canvasSize,
  placementType,
  draftProperties: _draftProperties,
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
}: CanvasPointerOptions): CanvasPointerResult {
  const panRef = React.useRef<Vector2>(pan);
  const pointerStartRef = React.useRef<Vector2 | null>(null);
  const pointerModeRef = React.useRef<PointerMode>('idle');
  const referenceDragStartRef = React.useRef<{ offset: Vector2 } | null>(null);
  const panStartRef = React.useRef<Vector2 | null>(null);
  const moveStateRef = React.useRef<MoveState | null>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [pointerPanelPos, setPointerPanelPos] = React.useState<Vector2 | null>(null);
  const [snapOverridden, setSnapOverridden] = React.useState(false);
  const [selectionRect, setSelectionRect] = React.useState<{ start: Vector2; end: Vector2 } | null>(
    null
  );
  const [isHoveringInteractive, setIsHoveringInteractive] = React.useState(false);
  const selectionModeRef = React.useRef<'replace' | 'add'>('replace');
  const selectedElementSet = React.useMemo(() => new Set(selectedElementIds), [selectedElementIds]);
  const elementMap = React.useMemo(
    () => new Map(model.elements.map((element) => [element.id, element])),
    [model.elements]
  );
  const [referenceImageElement, setReferenceImageElement] = React.useState<HTMLImageElement | null>(
    null
  );

  React.useEffect(() => {
    if (!referenceImage) {
      setReferenceImageElement(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setReferenceImageElement(img);
    };
    img.src = referenceImage.dataUrl;
  }, [referenceImage]);

  React.useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setSnapOverridden(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setSnapOverridden(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const selectionOverlay = React.useMemo(() => {
    if (!selectionRect) {
      return null;
    }
    const startPx = projectPanelPoint(selectionRect.start, transform);
    const endPx = projectPanelPoint(selectionRect.end, transform);
    return {
      left: Math.min(startPx.x, endPx.x),
      top: Math.min(startPx.y, endPx.y),
      width: Math.abs(endPx.x - startPx.x),
      height: Math.abs(endPx.y - startPx.y)
    };
  }, [selectionRect, transform]);

  const clampZoom = React.useCallback(
    (value: number) => Math.min(zoomLimits.max, Math.max(zoomLimits.min, value)),
    [zoomLimits.max, zoomLimits.min]
  );

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

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const handleWheel = (event: WheelEvent | React.WheelEvent<HTMLCanvasElement>) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      (event as WheelEvent).stopImmediatePropagation?.();
      (event as unknown as { stopPropagation?: () => void }).stopPropagation?.();

      const rect = canvas.getBoundingClientRect();
      const pointerPx = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      const pointerPanel = screenPointToPanel(pointerPx, transform);
      if (!pointerPanel) {
        return;
      }

      const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05;
      const nextZoom = clampZoom(zoom * zoomFactor);
      if (nextZoom === zoom || zoom === 0) {
        return;
      }

      const baseScale = transform.scale / zoom;
      const nextScale = baseScale * nextZoom;
      const nextPanelWidthPx = model.dimensions.widthMm * nextScale;
      const nextPanelHeightPx = model.dimensions.heightMm * nextScale;
      const nextPan = {
        x: pointerPx.x - pointerPanel.x * nextScale - (canvasSize.x - nextPanelWidthPx) / 2,
        y: pointerPx.y - pointerPanel.y * nextScale - (canvasSize.y - nextPanelHeightPx) / 2
      };

      onZoomChange(nextZoom);
      onPanChange(nextPan);
    };

    const listener = (event: WheelEvent) => handleWheel(event);
    canvas.addEventListener('wheel', listener, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', listener);
    };
  }, [
    canvasRef,
    clampZoom,
    model.dimensions.heightMm,
    model.dimensions.widthMm,
    onPanChange,
    onZoomChange,
    transform,
    zoom,
    canvasSize.x,
    canvasSize.y
  ]);

  const updateHoverState = React.useCallback(
    (pointPanel: Vector2 | null) => {
      if (!pointPanel) {
        setIsHoveringInteractive(false);
        return;
      }
      const pointerMode = pointerModeRef.current;
      if (pointerMode !== 'idle' && pointerMode !== 'click') {
        setIsHoveringInteractive(false);
        return;
      }
      const element = findElementAtPoint(pointPanel, model.elements);
      const hole =
        displayOptions.showMountingHoles && findMountingHoleAtPoint(pointPanel, mountingHoles);
      const clearanceHit = findClearanceLineAtPoint(pointPanel, clearanceLines);
      const refHit =
        referenceImage && referenceImageElement && isPointInReferenceImage(pointPanel, referenceImage);
      setIsHoveringInteractive(Boolean(element || hole || clearanceHit || refHit));
    },
    [
      clearanceLines,
      displayOptions.showMountingHoles,
      model.elements,
      mountingHoles,
      referenceImage,
      referenceImageElement
    ]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);

    const additiveModifier = event.shiftKey || event.metaKey || event.ctrlKey;
    const shouldPan = event.button === 1 || event.button === 2 || event.altKey;
    pointerModeRef.current = shouldPan ? 'pan' : 'click';
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    panStartRef.current = shouldPan ? { ...panRef.current } : null;
    setIsHoveringInteractive(false);

    if (shouldPan) {
      event.preventDefault();
      setIsPanning(true);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pointPx = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const pointPanel = screenPointToPanel(pointPx, transform);
    if (!pointPanel) {
      return;
    }

    const element = findElementAtPoint(pointPanel, model.elements);
    if (element) {
      onClearMountingHoleSelection();
      if (additiveModifier) {
        onToggleElementSelection(element.id);
        pointerModeRef.current = 'idle';
        return;
      }

      const moveCandidates = selectedElementSet.has(element.id)
        ? selectedElementIds.filter((id) => elementMap.has(id))
        : [element.id];

      if (!selectedElementSet.has(element.id)) {
        onSelectElement(element.id);
      }

      const startPositions: Record<string, Vector2> = {};
      moveCandidates.forEach((id) => {
        const target = elementMap.get(id);
        if (target) {
          startPositions[id] = { ...target.positionMm };
        }
      });

      const elementIds = Object.keys(startPositions);
      moveStateRef.current = {
        anchorId: element.id,
        pointerOffset: {
          x: element.positionMm.x - pointPanel.x,
          y: element.positionMm.y - pointPanel.y
        },
        startPositions,
        elementIds
      };
      pointerModeRef.current = 'move';
      onMoveStart?.(element.id);
      return;
    }

    const hitHole = findMountingHoleAtPoint(pointPanel, mountingHoles);
    if (hitHole) {
      pointerModeRef.current = 'idle';
      onSelectMountingHoles();
      return;
    }

    if (referenceImage && isPointInReferenceImage(pointPanel, referenceImage)) {
      pointerModeRef.current = 'reference';
      referenceDragStartRef.current = {
        offset: {
          x: referenceImage.positionMm.x - pointPanel.x,
          y: referenceImage.positionMm.y - pointPanel.y
        }
      };
      onClearMountingHoleSelection();
      onSelectReferenceImage();
      return;
    }

    const clearanceHit = findClearanceLineAtPoint(pointPanel, clearanceLines);
    if (clearanceHit) {
      pointerModeRef.current = 'clearance';
      onClearanceLineDragStart();
      onClearanceLineChange(clearanceHit, pointPanel.y);
      return;
    }

    if (placementType) {
      const snappedPoint = maybeSnap(pointPanel);
      onClearMountingHoleSelection();
      const newId = onPlaceElement(placementType, snappedPoint);
      onSelectElement(newId);
      pointerModeRef.current = 'idle';
      return;
    }

    selectionModeRef.current = additiveModifier ? 'add' : 'replace';
    setSelectionRect({ start: pointPanel, end: pointPanel });
    onClearMountingHoleSelection();
    pointerModeRef.current = 'marquee';
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (pointerModeRef.current === 'pan') {
      if (!pointerStartRef.current || !panStartRef.current) {
        return;
      }

      const deltaX = event.clientX - pointerStartRef.current.x;
      const deltaY = event.clientY - pointerStartRef.current.y;
      const nextPan = {
        x: panStartRef.current.x + deltaX,
        y: panStartRef.current.y + deltaY
      };

      onPanChange(nextPan);
      event.preventDefault();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pointPx = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const pointPanel = screenPointToPanel(pointPx, transform);
    updateHoverState(pointPanel);

    if (pointerModeRef.current === 'clearance') {
      if (!pointPanel) {
        return;
      }
      const activeLine = findClearanceLineAtPoint(pointPanel, clearanceLines) ?? 'top';
      onClearanceLineChange(activeLine, pointPanel.y);
      setPointerPanelPos(pointPanel);
      return;
    }

    if (pointerModeRef.current === 'reference') {
      if (!pointPanel || !referenceImage || !referenceDragStartRef.current) {
        return;
      }
      const snapped = maybeSnap({
        x: pointPanel.x + referenceDragStartRef.current.offset.x,
        y: pointPanel.y + referenceDragStartRef.current.offset.y
      });
      onUpdateReferenceImage({ positionMm: snapped });
      setPointerPanelPos(pointPanel);
      return;
    }

    if (pointerModeRef.current === 'move') {
      if (!pointPanel || !moveStateRef.current) {
        return;
      }
      const { anchorId, pointerOffset, startPositions, elementIds } = moveStateRef.current;
      const anchorStart = startPositions[anchorId];
      if (!anchorStart) {
        return;
      }
      const targetAnchor = {
        x: pointPanel.x + pointerOffset.x,
        y: pointPanel.y + pointerOffset.y
      };
      const snappedAnchor = maybeSnap(targetAnchor);
      const delta = {
        x: snappedAnchor.x - anchorStart.x,
        y: snappedAnchor.y - anchorStart.y
      };
      const updates = elementIds.map((id) => {
        const start = startPositions[id];
        return {
          id,
          positionMm: {
            x: start.x + delta.x,
            y: start.y + delta.y
          }
        };
      });
      if (!updates.length) {
        return;
      }
      if (updates.length === 1) {
        onMoveElement(updates[0].id, updates[0].positionMm);
      } else {
        onMoveElements(updates);
      }
      return;
    }

    if (pointerModeRef.current === 'marquee') {
      if (!pointPanel) {
        return;
      }
      setSelectionRect((current) =>
        current
          ? {
              start: current.start,
              end: pointPanel
            }
          : current
      );
      setPointerPanelPos(pointPanel);
      return;
    }

    setPointerPanelPos(pointPanel);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();

    const canvas = canvasRef.current;

    if (pointerModeRef.current === 'marquee' && selectionRect) {
      const bounds = {
        minX: Math.min(selectionRect.start.x, selectionRect.end.x),
        maxX: Math.max(selectionRect.start.x, selectionRect.end.x),
        minY: Math.min(selectionRect.start.y, selectionRect.end.y),
        maxY: Math.max(selectionRect.start.y, selectionRect.end.y)
      };
      const selectedIds = model.elements
        .filter((element) => {
          const elementBounds = getElementBounds(element);
          return !(
            elementBounds.maxX < bounds.minX ||
            elementBounds.minX > bounds.maxX ||
            elementBounds.maxY < bounds.minY ||
            elementBounds.minY > bounds.maxY
          );
        })
        .map((element) => element.id);

      if (selectedIds.length) {
        if (selectionModeRef.current === 'add') {
          onAddSelectedElements(selectedIds);
        } else {
          onSelectElements(selectedIds);
        }
      } else if (selectionModeRef.current !== 'add') {
        onClearSelection();
        onClearMountingHoleSelection();
      }
    } else if (pointerModeRef.current === 'click' && pointerStartRef.current && canvas) {
      const deltaX = event.clientX - pointerStartRef.current.x;
      const deltaY = event.clientY - pointerStartRef.current.y;
      const moved = Math.hypot(deltaX, deltaY);

      if (moved < 3) {
        const rect = canvas.getBoundingClientRect();
        const pointPx = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        const pointPanel = screenPointToPanel(pointPx, transform);
        if (pointPanel) {
          const element = findElementAtPoint(pointPanel, model.elements);
          if (element) {
            onSelectElement(element.id);
            onClearMountingHoleSelection();
          } else {
            onClearSelection();
            onClearMountingHoleSelection();
            onClearReferenceSelection();
          }
        }
      }
    }

    if (pointerModeRef.current === 'clearance') {
      onClearanceLineDragEnd();
    }
    if (pointerModeRef.current === 'reference') {
      referenceDragStartRef.current = null;
    }

    pointerModeRef.current = 'idle';
    pointerStartRef.current = null;
    panStartRef.current = null;
    moveStateRef.current = null;
    setSelectionRect(null);
    selectionModeRef.current = 'replace';
    setPointerPanelPos(null);
    setIsPanning(false);
    setIsHoveringInteractive(false);
    onMoveEnd?.();
    if (canvas) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();

    pointerModeRef.current = 'idle';
    pointerStartRef.current = null;
    panStartRef.current = null;
    moveStateRef.current = null;
    referenceDragStartRef.current = null;
    setSelectionRect(null);
    selectionModeRef.current = 'replace';
    setIsPanning(false);
    setIsHoveringInteractive(false);
    onMoveEnd?.();
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  };

  const canvasClassName = [
    styles.canvas,
    isPanning ? styles.canvasPanning : '',
    !isPanning && isHoveringInteractive ? styles.canvasInteractive : ''
  ]
    .filter(Boolean)
    .join(' ');

  return {
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
  };
}
