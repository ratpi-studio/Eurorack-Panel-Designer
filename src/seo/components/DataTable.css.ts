import { globalStyle, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

/** Wide tables scroll sideways on small screens instead of squeezing their numbers. */
export const scroller = style({
  overflowX: "auto",
});

export const minWidth = styleVariants({
  none: {},
  md: { minWidth: 520 },
  lg: { minWidth: 680 },
});

globalStyle(`${scroller} td`, {
  paddingTop: 7,
  paddingBottom: 7,
  lineHeight: 1.45,
});

// The first column names the row: "1.5 HP" stays on one line.
globalStyle(`${scroller} td:first-child`, {
  whiteSpace: "nowrap",
});

globalStyle(`${scroller} code`, {
  font: vars.font.m11,
  color: vars.color.tx,
  background: vars.color.s2,
  border: `1px solid ${vars.color.bd}`,
  borderRadius: vars.radius.r,
  padding: "1px 4px",
  whiteSpace: "nowrap",
});

// Links in a table are underlined like those of running text: colour never carries meaning alone.
globalStyle(`${scroller} a`, {
  color: vars.color.ac,
  textDecoration: "underline",
  textDecorationColor: vars.color.ac24,
  textUnderlineOffset: 3,
});

globalStyle(`${scroller} a:hover`, {
  color: vars.color.tx,
  textDecorationColor: vars.color.tx3,
});

export const note = style({
  fontSize: 13,
});
