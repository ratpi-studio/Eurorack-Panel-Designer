import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.spacing.sm,
  minHeight: "24px",
});

export const summary = style({
  fontSize: "12px",
  color: vars.color.textSecondary,
});

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

const rowBase = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  padding: "2px",
  borderRadius: "8px",
  border: "1px solid transparent",
  selectors: {
    "&:hover": {
      backgroundColor: "#101c33",
    },
  },
});

export const row = styleVariants({
  idle: [rowBase],
  selected: [
    rowBase,
    {
      backgroundColor: "#0f2238",
      borderColor: vars.color.accent,
      selectors: {
        "&:hover": {
          backgroundColor: "#0f2238",
        },
      },
    },
  ],
});

export const selectButton = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  padding: `${vars.spacing.xs} ${vars.spacing.xs}`,
  border: "none",
  borderRadius: "6px",
  background: "none",
  color: vars.color.textPrimary,
  textAlign: "left",
  cursor: "pointer",
  selectors: {
    "&:focus-visible": {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "1px",
    },
  },
});

export const icon = style({
  flexShrink: 0,
  width: "24px",
  height: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "6px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#050c1b",
});

export const text = styleVariants({
  shown: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  hidden: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    opacity: 0.45,
  },
});

export const name = style({
  fontSize: "13px",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const detail = style({
  fontSize: "11px",
  color: vars.color.textSecondary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const renameInput = style({
  flex: 1,
  minWidth: 0,
  margin: `0 ${vars.spacing.xs}`,
  borderRadius: "6px",
  border: `1px solid ${vars.color.accent}`,
  backgroundColor: "#0b1426",
  color: vars.color.textPrimary,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  fontSize: "13px",
});

export const actions = style({
  display: "flex",
  alignItems: "center",
  gap: "2px",
  flexShrink: 0,
});

const actionButtonBase = style({
  width: "26px",
  height: "26px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  borderRadius: "6px",
  background: "none",
  color: vars.color.textSecondary,
  cursor: "pointer",
  selectors: {
    "&:hover": {
      backgroundColor: "#16233d",
      color: vars.color.textPrimary,
    },
    "&:focus-visible": {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "1px",
    },
  },
});

export const actionButton = styleVariants({
  idle: [actionButtonBase],
  // Hidden or locked: keep the state visible even when the row is not hovered.
  active: [actionButtonBase, { color: vars.color.accent }],
  danger: [
    actionButtonBase,
    {
      selectors: {
        "&:hover": {
          backgroundColor: "rgba(185, 28, 28, 0.2)",
          color: "#fecdd3",
        },
      },
    },
  ],
});

export const empty = style({
  margin: 0,
  padding: `${vars.spacing.md} 0`,
  fontSize: "13px",
  color: vars.color.textSecondary,
});

export const hint = style({
  margin: 0,
  fontSize: "12px",
  color: vars.color.textSecondary,
});
