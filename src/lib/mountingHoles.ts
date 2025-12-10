import {
  DEFAULT_MOUNTING_HOLE_CONFIG,
  type MountingHole,
  type MountingHoleConfig
} from './panelTypes';
import { hpToMm } from './units';

interface MountingHoleInput {
  widthHp: number;
  widthMm: number;
  heightMm: number;
  config?: Partial<MountingHoleConfig>;
}

export const MIN_MOUNTING_HOLE_SPACING_MM = 8;
const MIN_SPACING_HP = 1;
const HIT_MARGIN_MM = 0;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export function generateMountingHoles({
  widthHp,
  widthMm,
  heightMm,
  config
}: MountingHoleInput): MountingHole[] {
  if (widthHp <= 0 || widthMm <= 0 || heightMm <= 0) {
    return [];
  }

  const resolvedConfig: MountingHoleConfig = {
    ...DEFAULT_MOUNTING_HOLE_CONFIG,
    ...config
  };

  const slotLengthMm =
    resolvedConfig.shape === 'slot'
      ? Math.min(
          Math.max(resolvedConfig.slotLengthMm, resolvedConfig.diameterMm),
          Math.max(widthMm - resolvedConfig.horizontalOffsetMm * 2, resolvedConfig.diameterMm)
        )
      : undefined;

  const horizontalFootprint =
    resolvedConfig.shape === 'slot' && slotLengthMm
      ? slotLengthMm / 2
      : resolvedConfig.diameterMm / 2;

  const minCenter = horizontalFootprint + HIT_MARGIN_MM;
  const maxCenter = Math.max(widthMm - horizontalFootprint - HIT_MARGIN_MM, minCenter);

  const mmPerHp = widthMm / widthHp;
  const spacingHp = Math.max(MIN_SPACING_HP, resolvedConfig.spacingHp);
  const holes: MountingHole[] = [];
  const topY = resolvedConfig.verticalOffsetMm;
  const bottomY = heightMm - resolvedConfig.verticalOffsetMm;

  for (let hpOffset = 0; hpOffset < widthHp; hpOffset += spacingHp) {
    const startHp = hpOffset;
    const endHp = Math.min(widthHp, hpOffset + spacingHp);
    const startMm = hpToMm(startHp, mmPerHp);
    const endMm = hpToMm(endHp, mmPerHp);
    const segmentWidth = Math.max(endMm - startMm, 0);
    if (segmentWidth <= 0) {
      continue;
    }

    const segmentMin = Math.max(startMm + horizontalFootprint, minCenter);
    const segmentMax = Math.min(endMm - horizontalFootprint, maxCenter);
    const baseOffset = resolvedConfig.horizontalOffsetMm;
    let columnXs: number[];

    if (segmentMax <= segmentMin) {
      const center = clamp((startMm + endMm) / 2, minCenter, maxCenter);
      columnXs = [center];
    } else {
      const leftX = clamp(startMm + baseOffset, segmentMin, segmentMax);
      const rightX = clamp(endMm - baseOffset, segmentMin, segmentMax);
      const separation = Math.abs(rightX - leftX);
      const minSeparation = Math.max(
        resolvedConfig.diameterMm,
        horizontalFootprint,
        MIN_MOUNTING_HOLE_SPACING_MM
      );

      if (separation < minSeparation) {
        const center = clamp((segmentMin + segmentMax) / 2, segmentMin, segmentMax);
        columnXs = [center];
      } else {
        columnXs = [leftX, rightX];
      }
    }

    columnXs.forEach((x) => {
      holes.push(
        {
          center: { x, y: topY },
          diameterMm: resolvedConfig.diameterMm,
          shape: resolvedConfig.shape,
          slotLengthMm
        },
        {
          center: { x, y: bottomY },
          diameterMm: resolvedConfig.diameterMm,
          shape: resolvedConfig.shape,
          slotLengthMm
        }
      );
    });
  }

  return holes;
}
