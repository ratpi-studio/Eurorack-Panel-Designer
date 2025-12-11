import type { Vector2 } from './panelTypes';

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

