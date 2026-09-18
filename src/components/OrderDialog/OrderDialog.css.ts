import { style, styleVariants } from "@vanilla-extract/css";

import { modal, primaryButton } from "@components/PanelDesigner/PanelDesigner.css";
import { vars } from "@styles/theme.css";

const narrowScreen = "screen and (max-width: 640px)";

export const dialog = style([
  modal,
  {
    maxWidth: "760px",
    width: "min(760px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    boxSizing: "border-box",
  },
]);

export const layout = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: vars.spacing.lg,
  "@media": {
    [narrowScreen]: {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

export const column = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
  minWidth: 0,
});

export const previewFrame = style({
  height: "340px",
  borderRadius: "10px",
  border: `1px solid ${vars.color.border}`,
  overflow: "hidden",
  "@media": {
    [narrowScreen]: {
      height: "240px",
    },
  },
});

export const filamentField = style({
  margin: 0,
  padding: 0,
  border: "none",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  minWidth: 0,
});

export const legend = style({
  padding: 0,
  marginBottom: vars.spacing.xs,
  color: vars.color.textSecondary,
  fontSize: "14px",
});

export const swatches = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.spacing.sm,
});

const swatchOptionBase = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  padding: `${vars.spacing.xs} ${vars.spacing.md} ${vars.spacing.xs} ${vars.spacing.sm}`,
  borderRadius: "999px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1426",
  color: vars.color.textPrimary,
  fontSize: "13px",
  cursor: "pointer",
  selectors: {
    "&:focus-within": {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "2px",
    },
  },
});

export const swatchOption = styleVariants({
  idle: [swatchOptionBase],
  selected: [
    swatchOptionBase,
    {
      borderColor: vars.color.accent,
      backgroundColor: "#0f2238",
    },
  ],
});

// Hidden but still focusable, so the swatches work with the keyboard like radio buttons.
export const swatchInput = style({
  position: "absolute",
  opacity: 0,
  width: "1px",
  height: "1px",
  margin: 0,
  pointerEvents: "none",
});

export const swatch = style({
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  border: "1px solid rgba(255, 255, 255, 0.35)",
  flexShrink: 0,
});

export const summary = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: vars.spacing.sm,
  padding: vars.spacing.md,
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1426",
});

export const summaryItem = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const summaryValue = style({
  fontSize: "18px",
  fontWeight: 700,
  color: vars.color.textPrimary,
});

export const steps = style({
  margin: 0,
  paddingLeft: "20px",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  fontSize: "13px",
  color: vars.color.textSecondary,
});

export const issues = style({
  margin: 0,
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

const issueBase = style({
  padding: vars.spacing.sm,
  borderRadius: "8px",
  fontSize: "13px",
});

export const issue = styleVariants({
  warning: [
    issueBase,
    {
      border: "1px solid #a16207",
      backgroundColor: "rgba(161, 98, 7, 0.16)",
      color: "#fde68a",
    },
  ],
  blocking: [
    issueBase,
    {
      border: "1px solid #b91c1c",
      backgroundColor: "rgba(185, 28, 28, 0.16)",
      color: "#fecdd3",
    },
  ],
});

export const error = style({
  margin: 0,
  fontSize: "13px",
  color: "#fecdd3",
});

export const submitButton = style([
  primaryButton,
  {
    selectors: {
      "&:disabled": {
        opacity: 0.45,
        cursor: "not-allowed",
      },
    },
  },
]);
