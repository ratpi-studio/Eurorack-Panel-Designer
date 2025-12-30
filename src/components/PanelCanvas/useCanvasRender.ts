import React from 'react';

import { drawPanelScene } from '@lib/canvas/renderScene';
import { type ClearanceLines } from '@lib/clearance';
import { canvasPalette, elementFillColors, elementStrokeColor } from '@lib/canvas/palette';
import {
  type PanelElement,
  type PanelElementType,
  type PanelModel,
  type Vector2,
  type MountingHole
} from '@lib/panelTypes';
import type { ReferenceImage } from '@lib/referenceImage';
import { themeValues } from '@styles/theme.css';
import { type CanvasTransform } from '@lib/canvas/transform';

interface CanvasRenderOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasSize: Vector2;
  transform: CanvasTransform;
  model: PanelModel;
  mountingHoles: MountingHole[];
  elementMountingHoles: MountingHole[];
  displayOptions: {
    showGrid: boolean;
    showMountingHoles: boolean;
    gridSizeMm: number;
  };
  selectedElementIds: string[];
  mountingHolesSelected: boolean;
  ghostElement: PanelElement | null;
  clearanceLines: ClearanceLines;
  referenceImage: ReferenceImage | null;
  referenceImageElement: HTMLImageElement | null;
  referenceImageSelected: boolean;
  placementType: PanelElementType | null;
}

export function useCanvasRender({
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
}: CanvasRenderOptions) {
  React.useLayoutEffect(() => {
    let frameId: number | null = null;
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
      const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      const scaledWidth = Math.round(width * pixelRatio);
      const scaledHeight = Math.round(height * pixelRatio);

      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.scale(pixelRatio, pixelRatio);

      context.fillStyle = canvasPalette.workspace ?? '#030712';
      context.fillRect(0, 0, width, height);

      let selectionAnimation: { dashOffset: number; pulseScale: number } | undefined;
      if (selectedElementIds.length > 0) {
        const t = timeMs / 1000;
        const dashSpeed = 40;
        const patternLength = 12;
        const dashOffset = -((t * dashSpeed) % patternLength);
        const pulseSpeed = 0.6;
        const pulseAmplitude = 0.15;
        const pulseScale = 1 + pulseAmplitude * Math.sin(2 * Math.PI * pulseSpeed * t);
        selectionAnimation = { dashOffset, pulseScale };
      }

      drawPanelScene({
        context,
        transform,
        panelSizeMm: {
          x: model.dimensions.widthMm,
          y: model.dimensions.heightMm
        },
        elements: model.elements,
        referenceImage:
          referenceImage && referenceImageElement
            ? {
                image: referenceImageElement,
                info: referenceImage,
                selected: referenceImageSelected
              }
            : null,
        mountingHoles,
        elementMountingHoles,
        mountingHolesSelected,
        selectedElementIds,
        showGrid: displayOptions.showGrid,
        showMountingHoles: displayOptions.showMountingHoles,
        gridSizeMm: displayOptions.gridSizeMm,
        palette: canvasPalette,
        elementFillColors,
        elementStrokeColor,
        fontFamily: themeValues.font.body,
        selectionAnimation,
        ghostElement,
        clearanceLines,
        showGhostDistances: Boolean(ghostElement && placementType)
      });

      if (typeof window !== 'undefined') {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    if (typeof window !== 'undefined') {
      frameId = window.requestAnimationFrame(renderFrame);
    }

    return () => {
      if (frameId !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [
    canvasRef,
    transform,
    model.elements,
    mountingHoles,
    elementMountingHoles,
    displayOptions.gridSizeMm,
    displayOptions.showGrid,
    displayOptions.showMountingHoles,
    selectedElementIds,
    mountingHolesSelected,
    canvasSize.x,
    canvasSize.y,
    ghostElement,
    clearanceLines,
    referenceImage,
    referenceImageElement,
    referenceImageSelected,
    model.dimensions.widthMm,
    model.dimensions.heightMm,
    placementType
  ]);
}
