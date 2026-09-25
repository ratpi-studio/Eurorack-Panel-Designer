/**
 * The wireframe sphere of the loaders, drawn in a 300-unit square that each size scales. `Sphere`
 * (`src/components/SphereLoader`) draws it in the editor; the boot splash of `index.html` draws the
 * same sphere in plain CSS, before any script has loaded: keep the two in step.
 */

export const SPHERE_UNITS = 300;

const RADIUS = SPHERE_UNITS / 2;

/**
 * Great circles through the poles, every 10°. A circle turned half a turn is the same circle, so
 * half a turn draws them all.
 */
export const MERIDIAN_ANGLES: readonly number[] = Array.from(
  { length: 18 },
  (_, index) => (index + 1) * 10,
);

/** Parallels on both sides of the equator: their distance from it, and their diameter there. */
export const PARALLELS: readonly { offset: number; diameter: number }[] = [25, 50, 75, 100, 125]
  .flatMap((distance) => [-distance, distance])
  .map((offset) => ({ offset, diameter: 2 * Math.sqrt(RADIUS * RADIUS - offset * offset) }));

/** The two poles, where the axis leaves the sphere. */
export const POLE_OFFSETS: readonly number[] = [-RADIUS, RADIUS];
export const POLE_DIAMETER = 20;

/** The sphere turns once every 8 s. */
export const SPHERE_TURN_MS = 8000;
