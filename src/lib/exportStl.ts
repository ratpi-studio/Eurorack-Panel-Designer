import {
  ExtrudeGeometry,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape
} from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

import {
  PanelElementType,
  type MountingHole,
  type PanelModel
} from '@lib/panelTypes';

interface BuildPanelStlOptions {
  thicknessMm: number;
}

interface CircularHole {
  centerX: number;
  centerY: number;
  radius: number;
}

interface RectangularHole {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OvalHole {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

interface SlotHole {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface TriangleHole {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

function getCircularHoles(
  model: PanelModel,
  mountingHoles: MountingHole[]
): CircularHole[] {
  const circularHoles: CircularHole[] = mountingHoles
    .filter((hole) => hole.shape !== 'slot')
    .map((hole) => ({
      centerX: hole.center.x,
      centerY: hole.center.y,
      radius: hole.diameterMm / 2
    }));

  for (const element of model.elements) {
    switch (element.type) {
      case PanelElementType.Jack:
      case PanelElementType.Potentiometer:
      case PanelElementType.Led: {
        const props = element.properties as { diameterMm: number };
        circularHoles.push({
          centerX: element.positionMm.x,
          centerY: element.positionMm.y,
          radius: props.diameterMm / 2
        });
        break;
      }
      default:
        break;
    }
  }

  return circularHoles;
}

function getRectangularHoles(model: PanelModel): RectangularHole[] {
  const rectangularHoles: RectangularHole[] = [];

  for (const element of model.elements) {
    if (
      element.type !== PanelElementType.Switch &&
      element.type !== PanelElementType.Rectangle
    ) {
      continue;
    }
    const props = element.properties as { widthMm: number; heightMm: number };
    rectangularHoles.push({
      x: element.positionMm.x - props.widthMm / 2,
      y: element.positionMm.y - props.heightMm / 2,
      width: props.widthMm,
      height: props.heightMm
    });
  }

  return rectangularHoles;
}

function getOvalHoles(model: PanelModel): OvalHole[] {
  const ovalHoles: OvalHole[] = [];

  for (const element of model.elements) {
    if (element.type !== PanelElementType.Oval) {
      continue;
    }
    const props = element.properties;
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      continue;
    }
    ovalHoles.push({
      centerX: element.positionMm.x,
      centerY: element.positionMm.y,
      radiusX: props.widthMm / 2,
      radiusY: props.heightMm / 2
    });
  }

  return ovalHoles;
}

function getSlotHoles(
  model: PanelModel,
  mountingHoles: MountingHole[]
): SlotHole[] {
  const slotHoles: SlotHole[] = mountingHoles
    .filter((hole) => hole.shape === 'slot' && (hole.slotLengthMm ?? hole.diameterMm) > 0)
    .map((hole) => ({
      centerX: hole.center.x,
      centerY: hole.center.y,
      width: hole.slotLengthMm ?? hole.diameterMm,
      height: hole.diameterMm
    }));

  for (const element of model.elements) {
    if (element.type !== PanelElementType.Slot) {
      continue;
    }
    const props = element.properties;
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      continue;
    }
    slotHoles.push({
      centerX: element.positionMm.x,
      centerY: element.positionMm.y,
      width: props.widthMm,
      height: props.heightMm
    });
  }

  return slotHoles;
}

function getTriangleHoles(model: PanelModel): TriangleHole[] {
  const triangleHoles: TriangleHole[] = [];

  for (const element of model.elements) {
    if (element.type !== PanelElementType.Triangle) {
      continue;
    }
    const props = element.properties;
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      continue;
    }
    triangleHoles.push({
      centerX: element.positionMm.x,
      centerY: element.positionMm.y,
      width: props.widthMm,
      height: props.heightMm
    });
  }

  return triangleHoles;
}

function createSlotHolePath(hole: SlotHole): Path {
  const path = new Path();
  const radius = Math.min(hole.width / 2, hole.height / 2);
  const straightHalf = Math.max(hole.width / 2 - radius, 0);
  const left = hole.centerX - straightHalf;
  const right = hole.centerX + straightHalf;
  const top = hole.centerY - radius;
  const bottom = hole.centerY + radius;

  path.moveTo(left, top);
  path.lineTo(right, top);
  path.absarc(right, hole.centerY, radius, -Math.PI / 2, Math.PI / 2, true);
  path.lineTo(left, bottom);
  path.absarc(left, hole.centerY, radius, Math.PI / 2, -Math.PI / 2, true);
  path.lineTo(left, top);

  return path;
}

function createTriangleHolePath(hole: TriangleHole): Path {
  const path = new Path();
  const halfWidth = hole.width / 2;
  const halfHeight = hole.height / 2;

  path.moveTo(hole.centerX, hole.centerY - halfHeight);
  path.lineTo(hole.centerX + halfWidth, hole.centerY + halfHeight);
  path.lineTo(hole.centerX - halfWidth, hole.centerY + halfHeight);
  path.lineTo(hole.centerX, hole.centerY - halfHeight);

  return path;
}

function buildPanelShape(
  model: PanelModel,
  mountingHoles: MountingHole[]
): Shape {
  const shape = new Shape();
  const width = model.dimensions.widthMm;
  const height = model.dimensions.heightMm;

  // Outer rectangle (counter-clockwise)
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, height);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  // Circular holes (clockwise)
  const circularHoles = getCircularHoles(model, mountingHoles);
  for (const hole of circularHoles) {
    const path = new Path();
    path.absellipse(
      hole.centerX,
      hole.centerY,
      hole.radius,
      hole.radius,
      0,
      Math.PI * 2,
      true, // clockwise for holes
      0
    );
    shape.holes.push(path);
  }

  // Rectangular holes (clockwise)
  const rectangularHoles = getRectangularHoles(model);
  for (const hole of rectangularHoles) {
    const path = new Path();
    path.moveTo(hole.x, hole.y);
    path.lineTo(hole.x, hole.y + hole.height);
    path.lineTo(hole.x + hole.width, hole.y + hole.height);
    path.lineTo(hole.x + hole.width, hole.y);
    path.lineTo(hole.x, hole.y);
    shape.holes.push(path);
  }

  // Oval holes
  const ovalHoles = getOvalHoles(model);
  for (const hole of ovalHoles) {
    const path = new Path();
    path.absellipse(
      hole.centerX,
      hole.centerY,
      hole.radiusX,
      hole.radiusY,
      0,
      Math.PI * 2,
      true,
      0
    );
    shape.holes.push(path);
  }

  // Slot holes
  const slotHoles = getSlotHoles(model, mountingHoles);
  for (const hole of slotHoles) {
    shape.holes.push(createSlotHolePath(hole));
  }

  // Triangle holes
  const triangleHoles = getTriangleHoles(model);
  for (const hole of triangleHoles) {
    shape.holes.push(createTriangleHolePath(hole));
  }

  return shape;
}

export function createPanelExtrusion(
  model: PanelModel,
  mountingHoles: MountingHole[],
  thicknessMm: number
): ExtrudeGeometry {
  if (!Number.isFinite(thicknessMm) || thicknessMm <= 0) {
    throw new Error('Panel thickness must be a positive number.');
  }

  const shape = buildPanelShape(model, mountingHoles);
  const geometry = new ExtrudeGeometry(shape, {
    depth: thicknessMm,
    bevelEnabled: false
  });

  // Flip Y so the exported model matches the on-canvas orientation (origin top-left).
  geometry.scale(1, -1, 1);
  geometry.translate(0, model.dimensions.heightMm, 0);
  geometry.computeVertexNormals();

  return geometry;
}

function geometryToStlString(geometry: ExtrudeGeometry): string {
  const mesh = new Mesh(
    geometry,
    // Material is not used for STL export; keep a tiny default.
    new MeshStandardMaterial()
  );

  const exporter = new STLExporter();
  const result = exporter.parse(mesh, { binary: false });
  if (typeof result === 'string') {
    return normalizeStlHeader(result);
  }

  // Fallback if exporter returns ArrayBuffer.
  const decoder = new TextDecoder();
  return normalizeStlHeader(decoder.decode(result));
}

function normalizeStlHeader(stl: string): string {
  return stl
    .replace(/^solid exported/, 'solid eurorack_panel')
    .replace(/endsolid exported\s*$/, 'endsolid eurorack_panel\n');
}

export function buildPanelStl(
  model: PanelModel,
  mountingHoles: MountingHole[],
  options: BuildPanelStlOptions
): string {
  const { thicknessMm } = options;
  const geometry = createPanelExtrusion(model, mountingHoles, thicknessMm);
  return geometryToStlString(geometry);
}
