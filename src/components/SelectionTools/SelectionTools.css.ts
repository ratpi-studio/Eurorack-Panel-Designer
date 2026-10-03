import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  padding: vars.spacing.md,
  borderRadius: "12px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
});

export const header = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const title = style({
  fontSize: "14px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
});

export const actions = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: vars.spacing.xs,
});

export const separator = style({
  width: "1px",
  height: "20px",
  margin: `0 2px`,
  backgroundColor: vars.color.border,
});

export const form = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: vars.spacing.sm,
  paddingTop: vars.spacing.sm,
  borderTop: `1px solid ${vars.color.border}`,
});

export const formTitle = style({
  gridColumn: "span 2",
  fontSize: "13px",
  fontWeight: 600,
  color: vars.color.textPrimary,
});

export const field = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minWidth: 0,
});

export const fieldWide = style([field, { gridColumn: "span 2" }]);

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
      boxShadow: "0 0 0 2px rgba(56, 189, 248, 0.25)",
    },
    '&[aria-invalid="true"]': {
      borderColor: "#f87171",
    },
  },
});

export const select = style([input, { cursor: "pointer" }]);

export const checkboxRow = style({
  gridColumn: "span 2",
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  fontSize: "13px",
  color: vars.color.textPrimary,
  cursor: "pointer",
});

export const checkbox = style({
  width: "16px",
  height: "16px",
  flexShrink: 0,
});

export const hint = style({
  gridColumn: "span 2",
  margin: 0,
  fontSize: "12px",
  lineHeight: 1.4,
  color: vars.color.textSecondary,
});

export const warning = style([hint, { color: "#fbbf24" }]);

export const hintStrong = style([hint, { color: vars.color.textPrimary }]);

export const buttonCell = style({
  display: "flex",
  alignItems: "flex-end",
});

export const buttonCellWide = style([buttonCell, { gridColumn: "span 2" }]);

export const footer = style({
  gridColumn: "span 2",
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  paddingTop: vars.spacing.xs,
});

export const count = style({
  flex: 1,
  fontSize: "12px",
  color: vars.color.textSecondary,
});

const buttonBase = {
  height: "36px",
  padding: `0 ${vars.spacing.md}`,
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  selectors: {
    "&:disabled": {
      opacity: 0.4,
      cursor: "not-allowed",
    },
    "&:focus-visible": {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "2px",
    },
  },
} as const;

export const secondaryButton = style({
  ...buttonBase,
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "transparent",
  color: vars.color.textPrimary,
  whiteSpace: "nowrap",
});

export const applyButton = style({
  ...buttonBase,
  minWidth: "64px",
  border: `1px solid ${vars.color.accent}`,
  backgroundColor: vars.color.accent,
  color: "#0b1426",
});
