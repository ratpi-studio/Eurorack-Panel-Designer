import { style } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

export const list = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 1,
  margin: 0,
  background: vars.color.bd2,
  border: `1px solid ${vars.color.bd2}`,
});

export const item = style({
  background: vars.color.s1,
  padding: "16px 18px 18px",
});

export const question = style({
  margin: 0,
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.35,
  color: vars.color.tx,
});

export const answer = style({
  margin: "8px 0 0",
  fontSize: 15,
  lineHeight: 1.65,
  color: vars.color.tx2,
});
