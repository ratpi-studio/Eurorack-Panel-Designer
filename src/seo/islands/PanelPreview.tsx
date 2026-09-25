import { DEFAULT_MM_PER_HP } from "@lib/panelFormat";
import type { MountingHole } from "@lib/panelTypes";

import * as styles from "./PanelPreview.css";

interface PanelPreviewProps {
  widthMm: number;
  heightMm: number;
  /** The mounting holes, as the editor generates them for this panel. */
  holes: readonly MountingHole[];
  /** Where the first hole column sits: the rail grid runs through it. */
  firstColumnMm: number;
  /** What the drawing shows, for screen readers. */
  label: string;
}

/** Positions of the rail grid over the panel: every 5.08 mm, through the first hole column. */
function railGridXs(widthMm: number, firstColumnMm: number): number[] {
  const first = Math.ceil(-firstColumnMm / DEFAULT_MM_PER_HP);
  const last = Math.floor((widthMm - firstColumnMm) / DEFAULT_MM_PER_HP);
  return Array.from(
    { length: Math.max(0, last - first + 1) },
    (_, index) => firstColumnMm + (first + index) * DEFAULT_MM_PER_HP,
  );
}

const key = (value: number) => value.toFixed(3);

/** The panel to scale, with its mounting holes and, above it, the rail grid they sit on. */
export function PanelPreview({
  widthMm,
  heightMm,
  holes,
  firstColumnMm,
  label,
}: PanelPreviewProps) {
  const holeColumns = new Set(holes.map((hole) => key(hole.center.x)));
  const pad = Math.max(widthMm, heightMm) * 0.08;

  return (
    <svg
      className={styles.drawing}
      viewBox={`${-pad} ${-pad} ${widthMm + 2 * pad} ${heightMm + 2 * pad}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
    >
      {railGridXs(widthMm, firstColumnMm).map((x) => (
        <line
          key={key(x)}
          className={holeColumns.has(key(x)) ? styles.tickOnHole : styles.tick}
          x1={x}
          x2={x}
          y1={-pad * 0.8}
          y2={-pad * 0.3}
        />
      ))}
      <rect className={styles.panel} x={0} y={0} width={widthMm} height={heightMm} />
      {holes.map((hole) => (
        <circle
          key={`${key(hole.center.x)}-${key(hole.center.y)}`}
          className={styles.hole}
          cx={hole.center.x}
          cy={hole.center.y}
          r={hole.diameterMm / 2}
        />
      ))}
    </svg>
  );
}
