import { style } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

// The numbered plate of the kit's board: number, title and a kicker over a full rule.
export const section = style({
  paddingTop: 52,
});

export const head = style({
  display: "flex",
  alignItems: "baseline",
  gap: 14,
  paddingBottom: 14,
  borderBottom: `1px solid ${vars.color.bd}`,
});

export const number = style({
  font: vars.font.m14,
  color: vars.color.ac,
  flex: "none",
});

export const title = style({
  margin: 0,
  fontSize: 21,
  fontWeight: 500,
  lineHeight: 1.25,
  letterSpacing: "-.01em",
  color: vars.color.tx,
});

export const kicker = style({
  marginLeft: "auto",
  font: vars.font.m10,
  letterSpacing: ".09em",
  color: vars.color.tx3,
  whiteSpace: "nowrap",
  "@media": {
    "screen and (max-width: 640px)": { display: "none" },
  },
});

export const body = style({
  display: "grid",
  gap: 20,
  paddingTop: 20,
  minWidth: 0,
});
