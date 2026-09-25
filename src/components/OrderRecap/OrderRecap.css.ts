import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

const narrowScreen = "screen and (max-width: 640px)";

export const root = style({
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: vars.spacing.xl,
  boxSizing: "border-box",
  backgroundColor: vars.color.background,
  color: vars.color.textPrimary,
  "@media": {
    [narrowScreen]: {
      padding: vars.spacing.lg,
    },
  },
});

export const card = style({
  width: "100%",
  maxWidth: "880px",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.lg,
  padding: vars.spacing.xl,
  boxSizing: "border-box",
  border: `1px solid ${vars.color.border}`,
  borderRadius: "16px",
  backgroundColor: vars.color.surface,
  boxShadow: "0 16px 40px rgba(2, 6, 23, 0.45)",
  "@media": {
    [narrowScreen]: {
      padding: vars.spacing.lg,
    },
  },
});

export const title = style({
  margin: 0,
  fontSize: "22px",
  fontWeight: 700,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: "16px",
  fontWeight: 600,
});

export const status = style({
  margin: 0,
  color: vars.color.textSecondary,
});

export const label = style({
  fontSize: "11px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
});

export const hint = style({
  margin: 0,
  fontSize: "13px",
  color: vars.color.textSecondary,
});

export const codeBlock = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  padding: vars.spacing.md,
  borderRadius: "12px",
  border: `1px solid ${vars.color.accent}`,
  backgroundColor: "#0b1220",
});

export const codeRow = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: vars.spacing.md,
});

export const code = style({
  fontFamily: vars.font.mono,
  fontSize: "28px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  userSelect: "all",
  "@media": {
    [narrowScreen]: {
      fontSize: "22px",
    },
  },
});

export const copyButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  height: "36px",
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

export const layout = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
  gap: vars.spacing.lg,
  "@media": {
    [narrowScreen]: {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

export const previewFrame = style({
  height: "380px",
  borderRadius: "12px",
  border: `1px solid ${vars.color.border}`,
  overflow: "hidden",
  "@media": {
    [narrowScreen]: {
      height: "260px",
    },
  },
});

export const previewFallback = style({
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const column = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.lg,
  minWidth: 0,
});

export const detailsGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: vars.spacing.md,
  margin: 0,
});

export const detailItem = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  margin: 0,
});

export const detailValue = style({
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  fontSize: "15px",
  fontWeight: 600,
});

export const swatch = style({
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  border: "1px solid rgba(255, 255, 255, 0.35)",
  flexShrink: 0,
});

export const howTo = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
});

export const steps = style({
  margin: 0,
  paddingLeft: "20px",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  fontSize: "14px",
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

export const files = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  paddingTop: vars.spacing.lg,
  borderTop: `1px solid ${vars.color.border}`,
});

export const fileButtons = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.spacing.sm,
});

export const error = style({
  margin: 0,
  fontSize: "13px",
  color: "#fecdd3",
});

export const editLink = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  textAlign: "center",
  color: vars.color.textSecondary,
  textDecoration: "none",
  selectors: {
    "&:hover": {
      color: vars.color.accent,
    },
  },
});
