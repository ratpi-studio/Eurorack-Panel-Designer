import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.spacing.sm,
});

export const title = style({
  fontSize: "13px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
});

export const actions = style({
  display: "flex",
  gap: vars.spacing.xs,
});

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: vars.spacing.sm,
});

export const field = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

export const label = style({
  fontSize: "12px",
  color: vars.color.textSecondary,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
});

export const input = style({
  width: "100%",
  height: "36px",
  padding: `0 ${vars.spacing.sm}`,
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1220",
  color: vars.color.textPrimary,
  fontSize: "14px",
  outline: "none",
  selectors: {
    "&:focus": {
      borderColor: vars.color.accent,
      boxShadow: `0 0 0 2px rgba(56, 189, 248, 0.25)`,
    },
  },
});

export const slider = style({
  width: "100%",
});
