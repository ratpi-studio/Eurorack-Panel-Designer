import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
  padding: `${vars.spacing.md}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: "12px",
  backgroundColor: vars.color.surface,
  boxShadow: "0 12px 30px rgba(2, 6, 23, 0.35)",
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.spacing.sm,
});

export const title = style({
  fontSize: "clamp(11px, 2.5vw, 14px)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const subtitle = style({
  fontSize: "13px",
  color: vars.color.textPrimary,
});

export const clearButton = style({
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "transparent",
  borderRadius: "8px",
  color: vars.color.textSecondary,
  padding: `6px ${vars.spacing.sm}`,
  cursor: "pointer",
  selectors: {
    "&:hover": {
      color: vars.color.textPrimary,
      borderColor: vars.color.textSecondary,
    },
  },
});

export const list = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(58px, 1fr))",
  gap: vars.spacing.xs,
  maxHeight: "520px",
  overflowY: "auto",
  padding: 0,
  paddingRight: vars.spacing.xs,
});

export const card = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minWidth: 0,
  padding: `${vars.spacing.xs} 2px`,
  backgroundColor: "transparent",
  borderRadius: "8px",
  border: "1px solid transparent",
  textAlign: "center",
  cursor: "pointer",
  color: vars.color.textPrimary,
  transition: "color 120ms ease",
  selectors: {
    "&:hover": {
      color: vars.color.accent,
    },
  },
});

export const cardActive = style([
  card,
  {
    color: vars.color.accent,
  },
]);

export const icon = style({
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  border: `1px solid ${vars.color.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#050c1b",
});

export const svgToolIcon = style({
  width: "36px",
  height: "36px",
  objectFit: "contain",
  display: "block",
  pointerEvents: "none",
});

export const cardContent = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2px",
  width: "100%",
});

export const cardTitle = style({
  fontWeight: 600,
  fontSize: "11px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
  textAlign: "center",
});

export const cardAction = style({
  fontSize: "12px",
  color: vars.color.textSecondary,
  fontWeight: 600,
  textTransform: "uppercase",
  textAlign: "right",
});
