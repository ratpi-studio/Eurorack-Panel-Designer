import { MERIDIAN_ANGLES, PARALLELS, POLE_OFFSETS } from "@lib/sphereGeometry";

import * as styles from "./Sphere.css";

/**
 * The turning wireframe sphere of the loaders, alone. It takes its size and its colour from the
 * `sphereUnit` and `sphereColor` variables of `Sphere.css.ts`, which the caller sets.
 */
export function Sphere() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.sphere}>
        {MERIDIAN_ANGLES.map((angle) => (
          <span key={`meridian-${angle}`} className={styles.meridian[angle]} />
        ))}
        {PARALLELS.map(({ offset }) => (
          <span key={`parallel-${offset}`} className={styles.parallel[offset]} />
        ))}
        {POLE_OFFSETS.map((offset) => (
          <span key={`pole-${offset}`} className={styles.pole[offset]} />
        ))}
        <span className={styles.axis.flat} />
        <span className={styles.axis.turned} />
      </div>
    </div>
  );
}
