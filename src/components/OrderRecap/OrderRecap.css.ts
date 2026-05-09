import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: vars.spacing.xl,
  backgroundColor: vars.color.background,
  color: vars.color.textPrimary,
});

export const card = style({
  width: "100%",
  maxWidth: "720px",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.lg,
  padding: vars.spacing.xl,
  border: `1px solid ${vars.color.border}`,
  borderRadius: "16px",
  backgroundColor: vars.color.surface,
  boxShadow: "0 16px 40px rgba(2, 6, 23, 0.45)",
});

export const title = style({
  margin: 0,
  fontSize: "22px",
  fontWeight: 700,
});

export const status = style({
  margin: 0,
  color: vars.color.textSecondary,
});

export const thumbnailWrapper = style({
  display: "flex",
  justifyContent: "center",
  padding: vars.spacing.md,
  borderRadius: "12px",
  backgroundColor: "#0b1220",
  border: `1px solid ${vars.color.border}`,
});

export const thumbnail = style({
  maxWidth: "100%",
  height: "auto",
  borderRadius: "8px",
});

export const detailsGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: vars.spacing.md,
});

export const detailItem = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const detailLabel = style({
  fontSize: "11px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
});

export const detailValue = style({
  fontSize: "15px",
  fontWeight: 600,
});

export const detailColor = style([
  detailValue,
  {
    display: "flex",
    alignItems: "center",
    gap: vars.spacing.xs,
  },
]);

export const swatch = style({
  width: "20px",
  height: "20px",
  borderRadius: "4px",
  border: `1px solid ${vars.color.border}`,
});

export const idBlock = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const idRow = style({
  display: "flex",
  gap: vars.spacing.sm,
});

export const idInput = style({
  flex: 1,
  fontFamily: vars.font.mono,
  fontSize: "16px",
  padding: `0 ${vars.spacing.sm}`,
  height: "40px",
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1220",
  color: vars.color.textPrimary,
});

export const copyButton = style({
  height: "40px",
  padding: `0 ${vars.spacing.md}`,
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "transparent",
  color: vars.color.textPrimary,
  cursor: "pointer",
  selectors: {
    "&:hover": {
      borderColor: vars.color.accent,
    },
  },
});

export const idHelp = style({
  fontSize: "13px",
  color: vars.color.textSecondary,
});

export const buyButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.spacing.sm,
  padding: `14px ${vars.spacing.lg}`,
  borderRadius: "12px",
  fontWeight: 700,
  fontSize: "16px",
  textDecoration: "none",
  backgroundColor: vars.color.accent,
  color: "#0f172a",
  cursor: "pointer",
  selectors: {
    "&:hover": {
      filter: "brightness(1.05)",
    },
  },
});

export const editLink = style({
  textAlign: "center",
  color: vars.color.textSecondary,
  textDecoration: "none",
  selectors: {
    "&:hover": {
      color: vars.color.accent,
    },
  },
});
