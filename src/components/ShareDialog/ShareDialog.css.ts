import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const field = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  marginTop: vars.spacing.xs,
});

export const label = style({
  fontSize: "12px",
  color: vars.color.textSecondary,
});

export const linkRow = style({
  display: "flex",
  gap: vars.spacing.sm,
  alignItems: "center",
});

export const linkInput = style({
  flex: 1,
  minWidth: 0,
  height: "32px",
  padding: `0 ${vars.spacing.sm}`,
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.background,
  color: vars.color.textPrimary,
  fontFamily: vars.font.mono,
  fontSize: "13px",
});

export const error = style({
  margin: 0,
  fontSize: "13px",
  color: "#fecdd3",
});
