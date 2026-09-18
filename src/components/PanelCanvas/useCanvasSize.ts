import React from "react";

import { type Vector2 } from "@lib/panelTypes";

const CANVAS_WIDTH_PX = 1200;
const CANVAS_HEIGHT_PX = 720;

interface CanvasSizeResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasSize: Vector2;
}

/** Tracks the size of the box the canvas fills, which the surrounding layout decides. */
export function useCanvasSize(): CanvasSizeResult {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = React.useState<Vector2>({
    x: CANVAS_WIDTH_PX,
    y: CANVAS_HEIGHT_PX,
  });

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateSize = () => {
      // The client box excludes the border, so it matches the canvas drawn inside it.
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) {
        return;
      }
      setCanvasSize((current) =>
        current.x === width && current.y === height ? current : { x: width, y: height },
      );
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return { containerRef, canvasSize };
}
