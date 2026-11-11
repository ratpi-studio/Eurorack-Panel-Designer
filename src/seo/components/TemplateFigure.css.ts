import { style } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

export const figure = style({
  maxWidth: 560,
});

export const footerValue = style({
  font: vars.font.m11,
  color: vars.color.tx2,
});

/** The downloads and the way into the editor, on one row that wraps on small screens. */
export const actions = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 16,
});

export const terms = style({
  margin: "12px 0 0",
  fontSize: 13,
  color: vars.color.tx3,
});
