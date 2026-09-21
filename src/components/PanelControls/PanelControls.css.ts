import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
  width: "100%",
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  borderRadius: "12px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  boxShadow: "0 12px 30px rgba(2, 6, 23, 0.35)",
});

export const formatSection = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const formatHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.spacing.sm,
});

export const customToggle = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  fontSize: "12px",
  color: vars.color.textPrimary,
  cursor: "pointer",
  userSelect: "none",
});

export const checkbox = style({
  margin: 0,
  accentColor: vars.color.accent,
  cursor: "pointer",
});

export const segmented = style({
  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "minmax(0, 1fr)",
  gap: "2px",
  padding: "2px",
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1220",
});

export const segment = style({
  position: "relative",
  display: "flex",
});

export const segmentInput = style({
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: 0,
  opacity: 0,
  pointerEvents: "none",
});

export const segmentLabel = style({
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "28px",
  padding: `0 ${vars.spacing.xs}`,
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color: vars.color.textSecondary,
  whiteSpace: "nowrap",
  cursor: "pointer",
  userSelect: "none",
  selectors: {
    "&:hover": {
      color: vars.color.textPrimary,
    },
    [`${segmentInput}:checked + &`]: {
      backgroundColor: vars.color.accent,
      color: "#0b1426",
    },
    [`${segmentInput}:focus-visible + &`]: {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "1px",
    },
    [`${segmentInput}:disabled + &`]: {
      opacity: 0.45,
      cursor: "not-allowed",
    },
  },
});

export const fields = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.spacing.md,
  alignItems: "flex-end",
});

export const field = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  minWidth: "140px",
  flex: "1 1 160px",
});

export const label = style({
  fontSize: "12px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
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

export const hint = style({
  margin: 0,
  fontSize: "12px",
  color: vars.color.textSecondary,
});

export const notes = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const note = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  margin: 0,
  fontSize: "12px",
  color: vars.color.textSecondary,
});
