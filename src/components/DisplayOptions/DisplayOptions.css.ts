import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  padding: vars.spacing.md,
  border: `1px solid ${vars.color.border}`,
  borderRadius: "12px",
  backgroundColor: vars.color.surface,
  boxShadow: "0 12px 30px rgba(2, 6, 23, 0.35)",
});

export const toolbar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: vars.spacing.sm,
});

export const toggles = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.spacing.xs,
});

export const sliderField = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
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

export const colorField = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const colorPickerRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
});

export const colorInput = style({
  width: "44px",
  height: "36px",
  flex: "0 0 auto",
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1220",
  cursor: "pointer",
  padding: "3px",
  outline: "none",
  selectors: {
    "&::-webkit-color-swatch-wrapper": {
      padding: 0,
    },
    "&::-webkit-color-swatch": {
      border: "none",
      borderRadius: "5px",
    },
    "&::-moz-color-swatch": {
      border: "none",
      borderRadius: "5px",
    },
    "&:hover": {
      filter: "brightness(1.1)",
    },
    "&:focus": {
      borderColor: vars.color.accent,
      boxShadow: `0 0 0 2px rgba(56, 189, 248, 0.25)`,
    },
  },
});

export const colorValue = style({
  minWidth: 0,
  height: "36px",
  flex: "1 1 auto",
  display: "flex",
  alignItems: "center",
  padding: `0 ${vars.spacing.sm}`,
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1220",
  color: vars.color.textPrimary,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "13px",
  textTransform: "uppercase",
  overflow: "hidden",
});
