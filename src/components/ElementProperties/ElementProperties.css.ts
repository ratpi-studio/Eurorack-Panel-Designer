import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
  padding: vars.spacing.md,
  borderRadius: "12px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  boxShadow: "0 12px 30px rgba(2, 6, 23, 0.35)",
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.spacing.sm,
});

export const actions = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
});

export const importButton = style({
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  color: vars.color.textPrimary,
  fontWeight: 600,
  borderRadius: "8px",
  padding: `8px ${vars.spacing.sm}`,
  cursor: "pointer",
  selectors: {
    "&:hover": {
      borderColor: vars.color.accent,
    },
  },
});

export const title = style({
  fontSize: "14px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
});

export const subtitle = style({
  fontSize: "13px",
  color: vars.color.textPrimary,
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

export const fieldWide = style([
  field,
  {
    gridColumn: "span 2",
  },
]);

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

export const select = style([
  input,
  {
    cursor: "pointer",
  },
]);

export const hint = style({
  fontSize: "12px",
  lineHeight: 1.4,
  color: vars.color.textSecondary,
});

export const partHint = style([
  hint,
  {
    gridColumn: "span 2",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: vars.spacing.sm,
    marginTop: `-${vars.spacing.xs}`,
  },
]);

export const inlineButton = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "transparent",
  color: vars.color.accent,
  fontSize: "12px",
  fontWeight: 600,
  borderRadius: "6px",
  padding: "2px 8px",
  cursor: "pointer",
  selectors: {
    "&:hover": {
      borderColor: vars.color.accent,
    },
  },
});

export const sectionHeader = style({
  gridColumn: "span 2",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  paddingTop: vars.spacing.sm,
  borderTop: `1px solid ${vars.color.border}`,
});

export const sectionTitle = style({
  fontSize: "12px",
  fontWeight: 600,
  color: vars.color.textPrimary,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
});

export const warnings = style({
  gridColumn: "span 2",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  margin: 0,
  padding: vars.spacing.sm,
  listStyle: "none",
  borderRadius: "8px",
  border: "1px solid rgba(250, 204, 21, 0.45)",
  backgroundColor: "rgba(250, 204, 21, 0.08)",
  color: "#fde68a",
  fontSize: "12px",
  lineHeight: 1.4,
});

// A warning with its icon, which stays on the first line of a longer text.
export const warning = style({
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
});

export const warningIcon = style({
  marginTop: "1px",
});

export const empty = style({
  padding: vars.spacing.md,
  borderRadius: "12px",
  border: `1px dashed ${vars.color.border}`,
  color: vars.color.textSecondary,
  textAlign: "center",
});

export const selectionSummary = style({
  fontSize: "13px",
  color: vars.color.textPrimary,
  lineHeight: 1.5,
});
