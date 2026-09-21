import { DEFAULT_MM_PER_HP } from "./panelFormat";
import {
  DEFAULT_MOUNTING_HOLE_CONFIG,
  type MountingHole,
  type MountingHoleConfig,
} from "./panelTypes";

interface MountingHoleInput {
  widthHp: number;
  widthMm: number;
  heightMm: number;
  config?: Partial<MountingHoleConfig>;
}

interface ColumnInput {
  widthMm: number;
  config: MountingHoleConfig;
  horizontalFootprint: number;
  minCenter: number;
  maxCenter: number;
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

/** The one column a panel too narrow for a pair gets: on the grid when it fits, centered if not. */
function singleColumnX({ widthMm, config, minCenter, maxCenter }: ColumnInput): number {
  const offsetMm = config.horizontalOffsetMm;
  if (offsetMm >= minCenter && offsetMm <= maxCenter) {
    return offsetMm;
  }

  return clamp(widthMm / 2, minCenter, maxCenter);
}

/**
 * Where the columns of mounting holes go. Holes are screwed into the rails, whose threads follow
 * the 5.08 mm grid, so the first column sits `horizontalOffsetMm` from the left edge of the panel
 * and every other one a whole number of HP from it. The last column lands as close to the same
 * offset from the right edge as the grid allows, and wide panels take an extra column every
 * `spacingHp` HP in between, unless it would crowd the last one.
 * Source: https://doepfer.de/a100_man/a100m_e.htm, front panel drawing.
 */
function buildColumnXs(input: ColumnInput): number[] {
  const { config, horizontalFootprint, minCenter, maxCenter, widthMm } = input;
  const offsetMm = config.horizontalOffsetMm;
  const steps = Math.round((widthMm - offsetMm * 2) / DEFAULT_MM_PER_HP);
  const minSeparationMm = Math.max(
    config.diameterMm,
    horizontalFootprint,
    MIN_MOUNTING_HOLE_SPACING_MM,
  );

  if (steps <= 0 || steps * DEFAULT_MM_PER_HP < minSeparationMm) {
    return [singleColumnX(input)];
  }

  const spacingSteps = Math.max(MIN_SPACING_HP, Math.round(config.spacingHp));
  const columnXs: number[] = [];

  for (let step = 0; step < steps; step += spacingSteps) {
    if ((steps - step) * DEFAULT_MM_PER_HP >= minSeparationMm) {
      columnXs.push(offsetMm + step * DEFAULT_MM_PER_HP);
    }
  }
  columnXs.push(offsetMm + steps * DEFAULT_MM_PER_HP);

  return columnXs.map((x) => clamp(x, minCenter, maxCenter));
}

export function generateMountingHoles({
  widthHp,
  widthMm,
  heightMm,
  config,
}: MountingHoleInput): MountingHole[] {
  if (widthHp <= 0 || widthMm <= 0 || heightMm <= 0) {
    return [];
  }

  const resolvedConfig: MountingHoleConfig = {
    ...DEFAULT_MOUNTING_HOLE_CONFIG,
    ...config,
  };

  const slotLengthMm =
    resolvedConfig.shape === "slot"
      ? Math.min(
          Math.max(resolvedConfig.slotLengthMm, resolvedConfig.diameterMm),
          Math.max(widthMm - resolvedConfig.horizontalOffsetMm * 2, resolvedConfig.diameterMm),
        )
      : undefined;

  const horizontalFootprint =
    resolvedConfig.shape === "slot" && slotLengthMm
      ? slotLengthMm / 2
      : resolvedConfig.diameterMm / 2;

  const minCenter = horizontalFootprint + HIT_MARGIN_MM;
  const maxCenter = Math.max(widthMm - horizontalFootprint - HIT_MARGIN_MM, minCenter);
  const topY = resolvedConfig.verticalOffsetMm;
  const bottomY = heightMm - resolvedConfig.verticalOffsetMm;

  const columnXs = buildColumnXs({
    widthMm,
    config: resolvedConfig,
    horizontalFootprint,
    minCenter,
    maxCenter,
  });

  return columnXs.flatMap((x) => [
    {
      center: { x, y: topY },
      diameterMm: resolvedConfig.diameterMm,
      shape: resolvedConfig.shape,
      slotLengthMm,
    },
    {
      center: { x, y: bottomY },
      diameterMm: resolvedConfig.diameterMm,
      shape: resolvedConfig.shape,
      slotLengthMm,
    },
  ]);
}
