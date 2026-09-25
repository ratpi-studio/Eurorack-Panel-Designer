import { style } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

export const tool = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 16,
  alignItems: "start",
  "@media": {
    "screen and (max-width: 900px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const column = style({
  display: "grid",
  gap: 16,
  minWidth: 0,
});

export const wide = style({
  gridColumn: "1 / -1",
});

/** Beside the width and height panels, the drawing stays in view while they scroll. */
export const preview = style({
  "@media": {
    "screen and (min-width: 901px)": { position: "sticky", top: 58 },
  },
});

export const body = style({
  display: "grid",
  gap: 14,
  padding: 14,
});

export const inputs = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
});

export const status = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  lineHeight: 1.5,
  color: vars.color.tx2,
});

export const footerValue = style({
  color: vars.color.tx2,
});
