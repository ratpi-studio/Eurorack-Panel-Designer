import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
});

export const dropZone = style({
  border: `1px dashed ${vars.color.border}`,
  borderRadius: "8px",
  backgroundColor: "#050c1b",
  color: vars.color.textPrimary,
  minHeight: "112px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: vars.spacing.md,
  cursor: "pointer",
  transition: "border-color 120ms ease, background-color 120ms ease",
  selectors: {
    "&:hover": {
      borderColor: vars.color.accent,
      backgroundColor: "#0b1426",
    },
  },
});

export const dropZoneActive = style([
  dropZone,
  {
    borderColor: vars.color.accent,
    backgroundColor: "#0b1426",
  },
]);

export const hiddenInput = style({
  display: "none",
});

export const library = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: vars.spacing.sm,
  maxHeight: "360px",
  overflowY: "auto",
});

export const libraryButton = style({
  border: `1px solid ${vars.color.border}`,
  borderRadius: "8px",
  backgroundColor: "#050c1b",
  color: vars.color.textPrimary,
  padding: vars.spacing.sm,
  cursor: "pointer",
  aspectRatio: "1 / 1",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: vars.spacing.xs,
  fontWeight: 600,
  overflow: "hidden",
  selectors: {
    "&:hover": {
      borderColor: vars.color.accent,
    },
  },
});

export const previewFrame = style({
  width: "100%",
  flex: 1,
  minHeight: 0,
  borderRadius: "6px",
  backgroundColor: "#f8fafc",
  border: `1px solid ${vars.color.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.spacing.xs,
  overflow: "hidden",
});

export const previewImage = style({
  display: "block",
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
});

export const libraryName = style({
  width: "100%",
  minHeight: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  lineHeight: 1.15,
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const message = style({
  color: vars.color.textSecondary,
  fontSize: "13px",
});

export const error = style({
  color: "#fecaca",
  fontSize: "13px",
});
