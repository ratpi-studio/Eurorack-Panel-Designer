import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const menu = style({
  position: "fixed",
  zIndex: 50,
  minWidth: "220px",
  padding: "4px",
  borderRadius: "10px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "rgba(15, 23, 42, 0.98)",
  boxShadow: "0 16px 40px rgba(2, 6, 23, 0.6)",
  display: "flex",
  flexDirection: "column",
});

export const item = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  width: "100%",
  height: "32px",
  padding: `0 ${vars.spacing.sm}`,
  border: "none",
  borderRadius: "6px",
  backgroundColor: "transparent",
  color: vars.color.textPrimary,
  fontSize: "13px",
  textAlign: "left",
  cursor: "pointer",
  outline: "none",
  selectors: {
    "&:hover:not(:disabled), &:focus-visible": {
      backgroundColor: "rgba(56, 189, 248, 0.15)",
    },
    "&:disabled": {
      opacity: 0.4,
      cursor: "default",
    },
  },
});

export const danger = style({
  color: "#f87171",
});

export const itemLabel = style({
  flex: 1,
});

export const shortcut = style({
  fontSize: "11px",
  color: vars.color.textSecondary,
});

export const separator = style({
  height: "1px",
  margin: "4px 6px",
  backgroundColor: vars.color.border,
});
