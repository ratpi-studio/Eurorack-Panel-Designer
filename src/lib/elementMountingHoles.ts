import {
  PanelElementType,
  type ElementMountingHoleConfig,
  type MountingHole,
  type PanelElement
} from './panelTypes';

function getElementExtent(element: PanelElement): number | null {
  switch (element.type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led: {
      const props = element.properties as { diameterMm: number };
      return props.diameterMm / 2;
    }
    case PanelElementType.Switch:
    case PanelElementType.Rectangle:
    case PanelElementType.Slot:
    case PanelElementType.Triangle:
    case PanelElementType.Oval: {
      const props = element.properties as { widthMm: number; heightMm: number };
      return Math.max(props.widthMm, props.heightMm) / 2;
    }
    default:
      return null;
  }
}

export function computeElementMountingHoles(
  elements: PanelElement[],
  config: ElementMountingHoleConfig
): MountingHole[] {
  if (config.count <= 0 || config.diameterMm <= 0) {
    return [];
  }

  const holes: MountingHole[] = [];
  const angleStep = (Math.PI * 2) / config.count;
  const holeRadius = config.diameterMm / 2;

  elements.forEach((element) => {
    const enabled = element.mountingHolesEnabled === true;
    if (!enabled) {
      return;
    }
    const extent = getElementExtent(element);
    if (!extent) {
      return;
    }
    const radius = extent + config.offsetMm + holeRadius;
    if (!Number.isFinite(radius) || radius <= 0) {
      return;
    }
    const elementRotation = ((element.rotationDeg ?? 0) * Math.PI) / 180;
    const holeRotation =
      ((element.mountingHoleRotationDeg ?? config.rotationDeg) * Math.PI) / 180;

    for (let index = 0; index < config.count; index += 1) {
      const angle = holeRotation + elementRotation + index * angleStep;
      holes.push({
        center: {
          x: element.positionMm.x + Math.cos(angle) * radius,
          y: element.positionMm.y + Math.sin(angle) * radius
        },
        diameterMm: config.diameterMm,
        shape: 'circle'
      });
    }
  });

  return holes;
}
