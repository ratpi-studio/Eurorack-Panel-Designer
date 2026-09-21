import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
});

export const header = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: vars.spacing.sm,
});

export const title = style({
  fontWeight: 600,
  fontSize: "16px",
});

export const description = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: "13px",
});

export const closeButton = style({
  alignSelf: "flex-start",
});

export const field = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const label = style({
  fontSize: "13px",
  color: vars.color.textSecondary,
});

export const numberInput = style({
  width: "100%",
  borderRadius: "6px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1426",
  color: vars.color.textPrimary,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
});

export const shapeGroup = style({
  display: "flex",
  gap: vars.spacing.xs,
});
