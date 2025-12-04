import React from 'react';

import { findElementAtPoint, getElementBounds } from '@lib/canvas/elementGeometry';
import { drawPanelScene, type PanelCanvasPalette } from '@lib/canvas/renderScene';
import {
  computeCanvasTransform,
  projectPanelPoint,
  screenPointToPanel
} from '@lib/canvas/transform';
import {
  PanelElementType,
  withElementProperties,
  type MountingHole,
  type PanelElement,
  type PanelModel,
  type PanelOptions,
  type Vector2
} from '@lib/panelTypes';
import { createPanelElement } from '@lib/elements';
import { snapPointToGrid } from '@lib/grid';
import { themeValues } from '@styles/theme.css';

import * as styles from './PanelCanvas.css';

const CANVAS_PADDING_PX = 48;
const CANVAS_WIDTH_PX = 1200;
const CANVAS_HEIGHT_PX = 720;

const elementFillColors: Record<PanelElementType, string> = {
  [PanelElementType.Jack]: '#38bdf8',
  [PanelElementType.Potentiometer]: '#f472b6',
  [PanelElementType.Switch]: '#facc15',
  [PanelElementType.Led]: '#f87171',
  [PanelElementType.Label]: '#f8fafc'
};

const elementStrokeColor = '#0f172a';

type MoveState = {
  anchorId: string;
  pointerOffset: Vector2;
  startPositions: Record<string, Vector2>;
  elementIds: string[];
};

type DraftPropertiesState = Partial<{
  [T in PanelElementType]: PanelElement['properties'];
}>;

interface ExtendedCanvasPalette extends PanelCanvasPalette {
  workspace: string;
  text: string;
}

const canvasPalette: ExtendedCanvasPalette = {
  workspace: '#030712',
  panelFill: '#111827',
  panelBorder: '#334155',
  grid: 'rgba(148, 163, 184, 0.2)',
  gridCenter: 'rgba(148, 163, 184, 0.45)',
  mountingHoleFill: '#0f172a',
  mountingHoleStroke: '#94a3b8',
  selection: '#ffffff',
  text: themeValues.color.textSecondary
};

interface PanelCanvasProps {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  model: PanelModel;
  mountingHoles: MountingHole[];
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
  displayOptions: Pick<
    PanelOptions,
    'showGrid' | 'showMountingHoles' | 'gridSizeMm' | 'snapToGrid'
  >;
  selectedElementIds: string[];
  draftProperties: DraftPropertiesState;
  onMoveElements: (updates: { id: string; positionMm: Vector2 }[]) => void;
}

export function PanelCanvas({
  canvasRef: forwardedCanvasRef,
  model,
  mountingHoles,
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
  displayOptions,
  selectedElementIds,
  draftProperties
}: PanelCanvasProps) {
  const internalCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canvasRef = forwardedCanvasRef ?? internalCanvasRef;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const panRef = React.useRef<Vector2>(pan);
  const pointerStartRef = React.useRef<Vector2 | null>(null);
  const pointerModeRef = React.useRef<
    'idle' | 'pan' | 'click' | 'move' | 'marquee'
  >('idle');
  const panStartRef = React.useRef<Vector2 | null>(null);
  const moveStateRef = React.useRef<MoveState | null>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [canvasSize, setCanvasSize] = React.useState<Vector2>({
    x: CANVAS_WIDTH_PX,
    y: CANVAS_HEIGHT_PX
  });
  const [pointerPanelPos, setPointerPanelPos] = React.useState<Vector2 | null>(null);
  const [snapOverridden, setSnapOverridden] = React.useState(false);
  const animationFrameRef = React.useRef<number | null>(null);
  const [selectionRect, setSelectionRect] = React.useState<{ start: Vector2; end: Vector2 } | null>(
    null
  );
  const selectionModeRef = React.useRef<'replace' | 'add'>('replace');
  const selectedElementSet = React.useMemo(
    () => new Set(selectedElementIds),
    [selectedElementIds]
  );
  const elementMap = React.useMemo(
    () => new Map(model.elements.map((element) => [element.id, element])),
    [model.elements]
  );

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const aspectRatio = CANVAS_WIDTH_PX / CANVAS_HEIGHT_PX;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width > 0 ? Math.min(rect.width, CANVAS_WIDTH_PX) : CANVAS_WIDTH_PX;
      const height = width / aspectRatio;
      setCanvasSize({ x: Math.round(width), y: Math.round(height) });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
    [
      canvasSize,
      model.dimensions.heightMm,
      model.dimensions.widthMm,
      pan,
      zoom
    ]
  );

  const canvasStyle = React.useMemo(
    () => ({
      width: '100%',
      maxWidth: `${CANVAS_WIDTH_PX}px`,
      height: `${canvasSize.y}px`,
      minHeight: `${Math.round(CANVAS_HEIGHT_PX * 0.6)}px`
    }),
    [canvasSize.y]
  );
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

  const hudText = `${model.dimensions.widthHp} HP · ${model.dimensions.widthMm.toFixed(
    1
  )} mm · Zoom ${(zoom * 100).toFixed(0)}%`;

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

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const renderFrame = (timeMs: number) => {
      const width = canvasSize.x;
      const height = canvasSize.y;
      const pixelRatio =
        typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      const scaledWidth = Math.round(width * pixelRatio);
      const scaledHeight = Math.round(height * pixelRatio);

      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.scale(pixelRatio, pixelRatio);

      context.fillStyle = canvasPalette.workspace;
      context.fillRect(0, 0, width, height);

      let selectionAnimation: { dashOffset: number; pulseScale: number } | undefined;
      if (selectedElementIds.length > 0) {
        const t = timeMs / 1000;
        const dashSpeed = 40; // dash movement speed in px/s (approx)
        const patternLength = 12; // 6 + 6 from setLineDash
        const dashOffset = -((t * dashSpeed) % patternLength);
        const pulseSpeed = 0.6; // Hz
        const pulseAmplitude = 0.15;
        const pulseScale =
          1 + pulseAmplitude * Math.sin(2 * Math.PI * pulseSpeed * t);
        selectionAnimation = { dashOffset, pulseScale };
      }

      drawPanelScene({
        context,
        transform,
        elements: model.elements,
        mountingHoles,
        selectedElementIds,
        showGrid: displayOptions.showGrid,
        showMountingHoles: displayOptions.showMountingHoles,
        gridSizeMm: displayOptions.gridSizeMm,
        palette: canvasPalette,
        elementFillColors,
        elementStrokeColor,
        fontFamily: themeValues.font.body,
        selectionAnimation,
        ghostElement
      });

      if (typeof window !== 'undefined') {
        animationFrameRef.current = window.requestAnimationFrame(renderFrame);
      }
    };

    if (typeof window !== 'undefined') {
      animationFrameRef.current = window.requestAnimationFrame(renderFrame);
    }

    return () => {
      if (animationFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
    };
  }, [
    transform,
    model.elements,
    mountingHoles,
    displayOptions.gridSizeMm,
    displayOptions.showGrid,
    displayOptions.showMountingHoles,
    selectedElementIds,
    zoom,
    canvasSize.x,
    canvasSize.y,
    ghostElement
  ]);

  const handleWheel = React.useCallback(
    (event: WheelEvent | React.WheelEvent<HTMLCanvasElement>) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      (event as WheelEvent).stopImmediatePropagation?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as any).stopPropagation?.();

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

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
        x:
          pointerPx.x -
          pointerPanel.x * nextScale -
          (canvasSize.x - nextPanelWidthPx) / 2,
        y:
          pointerPx.y -
          pointerPanel.y * nextScale -
          (canvasSize.y - nextPanelHeightPx) / 2
      };

      onZoomChange(nextZoom);
      onPanChange(nextPan);
    },
    [
      clampZoom,
      model.dimensions.heightMm,
      model.dimensions.widthMm,
      onPanChange,
      onZoomChange,
      transform,
      zoom,
      canvasSize.x,
      canvasSize.y
    ]
  );

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const listener = (event: WheelEvent) => handleWheel(event);
    canvas.addEventListener('wheel', listener, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', listener);
    };
  }, [handleWheel]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);

    const additiveModifier = event.shiftKey || event.metaKey || event.ctrlKey;
    const shouldPan =
      event.button === 1 ||
      event.button === 2 ||
      event.altKey;
    pointerModeRef.current = shouldPan ? 'pan' : 'click';
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    panStartRef.current = shouldPan ? { ...panRef.current } : null;

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

    if (placementType) {
      const snappedPoint = maybeSnap(pointPanel);
      const newId = onPlaceElement(placementType, snappedPoint);
      onSelectElement(newId);
      pointerModeRef.current = 'idle';
      return;
    }

    selectionModeRef.current = additiveModifier ? 'add' : 'replace';
    setSelectionRect({ start: pointPanel, end: pointPanel });
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
          } else {
            onClearSelection();
          }
        }
      }
    }

    pointerModeRef.current = 'idle';
    pointerStartRef.current = null;
    panStartRef.current = null;
    moveStateRef.current = null;
    setSelectionRect(null);
    selectionModeRef.current = 'replace';
    setPointerPanelPos(null);
    setIsPanning(false);
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
    setSelectionRect(null);
    selectionModeRef.current = 'replace';
    setIsPanning(false);
    onMoveEnd?.();
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  };

  const canvasClassName = isPanning
    ? `${styles.canvas} ${styles.canvasPanning}`
    : styles.canvas;

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
