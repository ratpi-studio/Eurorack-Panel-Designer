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

const MIN_SPACING_HP = 1;

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
    const availableWidth = Math.max(endMm - startMm, 0);
    const baseOffset = resolvedConfig.horizontalOffsetMm;
    let leftX = startMm + baseOffset;
    let rightX = endMm - baseOffset;

    if (rightX <= leftX && availableWidth > 0) {
      leftX = startMm;
      rightX = endMm;
    }

    const columnXs =
      Math.abs(leftX - rightX) < Number.EPSILON || availableWidth === 0
        ? [leftX]
        : [leftX, rightX];

    columnXs.forEach((x) => {
      holes.push(
        {
          center: { x, y: topY },
          diameterMm: resolvedConfig.diameterMm
        },
        {
          center: { x, y: bottomY },
          diameterMm: resolvedConfig.diameterMm
        }
      );
    });
  }

  return holes;
}
