import React from 'react';

import { type Vector2 } from '@lib/panelTypes';

const CANVAS_WIDTH_PX = 1200;
const CANVAS_HEIGHT_PX = 720;

interface CanvasSizeResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasSize: Vector2;
}

export function useCanvasSize(): CanvasSizeResult {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = React.useState<Vector2>({
    x: CANVAS_WIDTH_PX,
    y: CANVAS_HEIGHT_PX
  });

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

  return { containerRef, canvasSize };
}
