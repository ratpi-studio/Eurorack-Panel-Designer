import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

/** The line length of running text, for what sits among it: an alert, a note. */
export const measure = style({
  maxWidth: "70ch",
});

// Running text is set larger than the kit's control text: these pages are read, not operated.
export const prose = style({
  maxWidth: "70ch",
  fontSize: 15,
  lineHeight: 1.7,
  color: vars.color.tx2,
});

export const small = style({
  fontSize: 13,
  lineHeight: 1.6,
});

globalStyle(`${prose} p`, { margin: "0 0 14px" });
globalStyle(`${prose} > :last-child`, { marginBottom: 0 });
globalStyle(`${prose} strong`, { color: vars.color.tx, fontWeight: 600 });

globalStyle(`${prose} h3`, {
  margin: "28px 0 8px",
  fontSize: 16,
  fontWeight: 500,
  color: vars.color.tx,
});

globalStyle(`${prose} > h3:first-child`, { marginTop: 0 });

// Colour never carries meaning alone: links in text keep an underline.
globalStyle(`${prose} a`, {
  color: vars.color.ac,
  textDecoration: "underline",
  textDecorationColor: vars.color.ac24,
  textUnderlineOffset: 3,
});

globalStyle(`${prose} a:hover`, {
  color: vars.color.tx,
  textDecorationColor: vars.color.tx3,
});

globalStyle(`${prose} code`, {
  font: vars.font.m12,
  color: vars.color.tx,
  background: vars.color.s2,
  border: `1px solid ${vars.color.bd}`,
  borderRadius: vars.radius.r,
  padding: "1px 5px",
});

globalStyle(`${prose} ul, ${prose} ol`, { margin: "0 0 14px", paddingLeft: 22 });
globalStyle(`${prose} li`, { margin: "7px 0" });
globalStyle(`${prose} li::marker`, { color: vars.color.tx3 });
