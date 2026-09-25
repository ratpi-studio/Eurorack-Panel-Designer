import { style } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

/** A recessed screen on graph paper, the way the kit draws its scope. */
export const frame = style({
  padding: 14,
  background: vars.color.bg,
  backgroundImage: `linear-gradient(${vars.color.grid} 1px, transparent 1px), linear-gradient(90deg, ${vars.color.grid} 1px, transparent 1px)`,
  backgroundSize: "16px 16px",
});

export const drawing = style({
  display: "block",
  width: "100%",
  height: 300,
  "@media": {
    "screen and (max-width: 600px)": { height: 240 },
  },
});

// Strokes keep their width in pixels whatever the scale of the drawing.
export const panel = style({
  fill: vars.color.s2,
  stroke: vars.color.tx3,
  strokeWidth: 1,
  vectorEffect: "non-scaling-stroke",
});

export const hole = style({
  fill: vars.color.bg,
  stroke: vars.color.ac,
  strokeWidth: 1.5,
  vectorEffect: "non-scaling-stroke",
});

export const tick = style({
  stroke: vars.color.tick,
  strokeWidth: 1,
  vectorEffect: "non-scaling-stroke",
});

export const tickOnHole = style({
  stroke: vars.color.ac,
  strokeWidth: 1,
  vectorEffect: "non-scaling-stroke",
});
