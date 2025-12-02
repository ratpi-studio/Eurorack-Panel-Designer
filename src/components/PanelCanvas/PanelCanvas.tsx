import React from 'react';

import { findElementAtPoint } from '@lib/canvas/elementGeometry';
import { drawPanelScene, type PanelCanvasPalette } from '@lib/canvas/renderScene';
import {
  computeCanvasTransform,
  screenPointToPanel
} from '@lib/canvas/transform';
import {
  PanelElementType,
  type MountingHole,
  type PanelModel,
  type PanelOptions,
  type Vector2
} from '@lib/panelTypes';
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
  selection: themeValues.color.accent,
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
  displayOptions: Pick<
    PanelOptions,
    'showGrid' | 'showMountingHoles' | 'gridSizeMm' | 'snapToGrid'
  >;
  selectedElementId: string | null;
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
  onMoveStart,
  onMoveEnd,
  onZoomChange,
  onPanChange,
  onSelectElement,
  displayOptions,
  selectedElementId
}: PanelCanvasProps) {
  const internalCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canvasRef = forwardedCanvasRef ?? internalCanvasRef;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const panRef = React.useRef<Vector2>(pan);
  const pointerStartRef = React.useRef<Vector2 | null>(null);
  const pointerModeRef = React.useRef<
    'idle' | 'pan' | 'click' | 'move'
  >('idle');
  const panStartRef = React.useRef<Vector2 | null>(null);
  const moveElementRef = React.useRef<{
    elementId: string;
    offset: Vector2;
  } | null>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [canvasSize, setCanvasSize] = React.useState<Vector2>({
    x: CANVAS_WIDTH_PX,
    y: CANVAS_HEIGHT_PX
  });
  const [pointerPanelPos, setPointerPanelPos] = React.useState<Vector2 | null>(null);
  const [snapOverridden, setSnapOverridden] = React.useState(false);

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

  const hudText = `${model.dimensions.widthHp} HP · ${model.dimensions.widthMm.toFixed(
    1
  )} mm · Zoom ${(zoom * 100).toFixed(0)}%`;

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

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

    drawPanelScene({
      context,
      transform,
      elements: model.elements,
      mountingHoles,
      selectedElementId,
      showGrid: displayOptions.showGrid,
      showMountingHoles: displayOptions.showMountingHoles,
      gridSizeMm: displayOptions.gridSizeMm,
      palette: canvasPalette,
      elementFillColors,
      elementStrokeColor,
      fontFamily: themeValues.font.body
    });
  }, [
    transform,
    model.elements,
    mountingHoles,
    displayOptions.gridSizeMm,
    displayOptions.showGrid,
    displayOptions.showMountingHoles,
    selectedElementId,
    zoom,
    canvasSize.x,
    canvasSize.y
  ]);

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

    if (!canvasRef.current) {
      return;
    }

    canvasRef.current.setPointerCapture(event.pointerId);

    const shouldPan =
      event.button === 1 ||
      event.button === 2 ||
      event.shiftKey ||
      event.altKey ||
      event.metaKey ||
      event.ctrlKey;
    pointerModeRef.current = shouldPan ? 'pan' : 'click';
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    panStartRef.current = shouldPan ? { ...panRef.current } : null;

    if (shouldPan) {
      event.preventDefault();
      setIsPanning(true);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const pointPx = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const pointPanel = screenPointToPanel(pointPx, transform);
    if (!pointPanel) {
      return;
    }

    if (placementType) {
      const snappedPoint = maybeSnap(pointPanel);
      const newId = onPlaceElement(placementType, snappedPoint);
      onSelectElement(newId);
      pointerModeRef.current = 'idle';
      return;
    }

    const element = findElementAtPoint(pointPanel, model.elements);
    if (element) {
      const offset = {
        x: element.positionMm.x - pointPanel.x,
        y: element.positionMm.y - pointPanel.y
      };
      moveElementRef.current = { elementId: element.id, offset };
      pointerModeRef.current = 'move';
      onMoveStart?.(element.id);
      onSelectElement(element.id);
      return;
    }

    pointerModeRef.current = 'click';
    onSelectElement(null);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();

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

    if (pointerModeRef.current !== 'move') {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const pointPx = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      setPointerPanelPos(screenPointToPanel(pointPx, transform));
      return;
    }

    if (!canvasRef.current || !moveElementRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const pointPx = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    const pointPanel = screenPointToPanel(pointPx, transform);
    if (!pointPanel) {
      return;
    }

    const nextPosition = maybeSnap({
      x: pointPanel.x + moveElementRef.current.offset.x,
      y: pointPanel.y + moveElementRef.current.offset.y
    });

    onMoveElement(moveElementRef.current.elementId, nextPosition);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();

    if (pointerModeRef.current === 'click' && pointerStartRef.current) {
      const deltaX = event.clientX - pointerStartRef.current.x;
      const deltaY = event.clientY - pointerStartRef.current.y;
      const moved = Math.hypot(deltaX, deltaY);

      if (moved < 3 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const pointPx = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        const pointPanel = screenPointToPanel(pointPx, transform);
        if (pointPanel) {
          const element = findElementAtPoint(pointPanel, model.elements);
          onSelectElement(element ? element.id : null);
        }
      }
    }

    pointerModeRef.current = 'idle';
    pointerStartRef.current = null;
    panStartRef.current = null;
    moveElementRef.current = null;
    setPointerPanelPos(null);
    setIsPanning(false);
    onMoveEnd?.();
    if (canvasRef.current) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();

    pointerModeRef.current = 'idle';
    pointerStartRef.current = null;
    panStartRef.current = null;
    moveElementRef.current = null;
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
      <div className={styles.hud}>
        {hudText}
        {pointerPanelPos
          ? ` · X ${pointerPanelPos.x.toFixed(1)} mm · Y ${pointerPanelPos.y.toFixed(1)} mm`
          : ''}
      </div>
    </div>
  );
}
