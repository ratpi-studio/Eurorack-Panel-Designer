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

function getCircularHoles(
  model: PanelModel,
  mountingHoles: MountingHole[]
): CircularHole[] {
  const circularHoles: CircularHole[] = mountingHoles.map((hole) => ({
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
    if (element.type !== PanelElementType.Switch) {
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
