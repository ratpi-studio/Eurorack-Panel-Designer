import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

// The kit's primary and secondary buttons, drawn on a link: its Button only renders <button>.
const base = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  height: vars.density.h,
  padding: "0 14px",
  borderRadius: vars.radius.r,
  font: `500 ${vars.density.fs}/1 ${vars.font.sans}`,
  whiteSpace: "nowrap",
  textDecoration: "none",
  transition: "filter .1s",
  selectors: {
    "&:active": { transform: "translateY(1px)" },
  },
});

export const variant = styleVariants({
  primary: [
    base,
    {
      background: vars.color.ac,
      color: vars.color.acInk,
      border: `1px solid ${vars.color.ac}`,
      selectors: {
        "&:hover": { color: vars.color.acInk, filter: "brightness(1.08)" },
      },
    },
  ],
  secondary: [
    base,
    {
      background: vars.color.s2,
      color: vars.color.tx,
      border: `1px solid ${vars.color.bd}`,
      selectors: {
        "&:hover": { color: vars.color.tx, background: vars.color.s3, borderColor: vars.color.tx3 },
      },
    },
  ],
});

export const arrow = style({
  font: vars.font.m10,
});
