import { createVar, keyframes, style, styleVariants } from "@vanilla-extract/css";

import {
  MERIDIAN_ANGLES,
  PARALLELS,
  POLE_DIAMETER,
  POLE_OFFSETS,
  SPHERE_TURN_MS,
  SPHERE_UNITS,
} from "@lib/sphereGeometry";

/** Length of one unit of the 300-unit drawing: whoever shows the sphere sets it. */
export const sphereUnit = createVar();

/** Colour of the lines, the poles and the axis: whoever shows the sphere sets it. */
export const sphereColor = createVar();

const units = (value: number) => `calc(${sphereUnit} * ${value})`;

const tint = (percent: number) => `color-mix(in srgb, ${sphereColor} ${percent}%, transparent)`;

const spin = keyframes({
  from: { transform: "rotateX(30deg) rotateY(0deg) rotateZ(80deg)" },
  to: { transform: "rotateX(30deg) rotateY(360deg) rotateZ(80deg)" },
});

/** The axis reaches half a diameter past the poles: the margin keeps it off what is around. */
export const stage = style({
  width: units(SPHERE_UNITS),
  height: units(SPHERE_UNITS),
  margin: `${units(SPHERE_UNITS / 3)} 0`,
});

export const sphere = style({
  position: "relative",
  width: "100%",
  height: "100%",
  transformStyle: "preserve-3d",
  transform: "rotateX(30deg) rotateY(0deg) rotateZ(80deg)",
  animation: `${spin} ${SPHERE_TURN_MS}ms linear infinite`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      animation: "none",
      transform: "rotateX(30deg) rotateY(40deg) rotateZ(80deg)",
    },
  },
});

const ring = style({
  position: "absolute",
  boxSizing: "border-box",
  border: `1px solid ${tint(30)}`,
  borderRadius: "50%",
});

export const meridian = styleVariants(
  Object.fromEntries(
    MERIDIAN_ANGLES.map((angle) => [
      angle,
      [
        ring,
        {
          inset: 0,
          transform: `rotateX(${angle}deg)`,
          boxShadow: `inset 0 0 8px ${tint(6)}`,
        },
      ],
    ]),
  ),
);

export const parallel = styleVariants(
  Object.fromEntries(
    PARALLELS.map(({ offset, diameter }) => [
      offset,
      [
        ring,
        {
          width: units(diameter),
          height: units(diameter),
          top: units((SPHERE_UNITS - diameter) / 2),
          left: units((SPHERE_UNITS - diameter) / 2),
          transform: `rotateY(90deg) translateZ(${units(offset)})`,
          boxShadow: `inset 0 0 5px ${tint(18)}`,
        },
      ],
    ]),
  ),
);

export const pole = styleVariants(
  Object.fromEntries(
    POLE_OFFSETS.map((offset) => [
      offset,
      {
        position: "absolute",
        width: units(POLE_DIAMETER),
        height: units(POLE_DIAMETER),
        top: units((SPHERE_UNITS - POLE_DIAMETER) / 2),
        left: units((SPHERE_UNITS - POLE_DIAMETER) / 2),
        borderRadius: "50%",
        background: sphereColor,
        transform: `rotateY(90deg) translateZ(${units(offset)})`,
      },
    ]),
  ),
);

const axisBase = style({
  position: "absolute",
  top: "calc(50% - 1px)",
  left: units(-SPHERE_UNITS / 2),
  width: units(SPHERE_UNITS * 2),
  height: "2px",
  background: `linear-gradient(to left, transparent, ${sphereColor}, transparent)`,
});

/** The axis twice, a quarter turn apart, so it never shows edge on. */
export const axis = styleVariants({
  flat: [axisBase],
  turned: [axisBase, { transform: "rotateX(90deg)" }],
});
