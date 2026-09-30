import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  position: "absolute",
  top: vars.spacing.md,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 2,
  display: "flex",
  alignItems: "flex-start",
  gap: vars.spacing.sm,
  width: "max-content",
  maxWidth: `calc(100% - 2 * ${vars.spacing.md})`,
  padding: `${vars.spacing.sm} ${vars.spacing.sm} ${vars.spacing.sm} ${vars.spacing.md}`,
  borderRadius: "12px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "rgba(15, 23, 42, 0.92)",
  boxShadow: "0 12px 30px rgba(2, 6, 23, 0.5)",
  color: vars.color.textPrimary,
});

export const icon = style({
  flexShrink: 0,
  marginTop: "2px",
  color: vars.color.accent,
});

export const body = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  minWidth: 0,
  paddingTop: "1px",
});

export const title = style({
  fontSize: "12px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
});

export const hint = style({
  fontSize: "13px",
});

export const form = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
});

export const row = style({
  display: "flex",
  alignItems: "flex-end",
  gap: vars.spacing.sm,
});

export const field = style({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
});

export const label = style({
  fontSize: "11px",
  color: vars.color.textSecondary,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
});

export const input = style({
  width: "120px",
  height: "32px",
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

export const applyButton = style({
  height: "32px",
  padding: `0 ${vars.spacing.md}`,
  borderRadius: "8px",
  border: `1px solid ${vars.color.accent}`,
  backgroundColor: vars.color.accent,
  color: "#0b1426",
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
});
