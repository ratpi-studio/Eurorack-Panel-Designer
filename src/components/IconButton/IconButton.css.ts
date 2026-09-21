import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

const DANGER_COLOR = "#f87171";

const base = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "32px",
  height: "32px",
  padding: 0,
  borderRadius: "8px",
  cursor: "pointer",
  transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease",
  selectors: {
    "&:disabled": {
      opacity: 0.4,
      cursor: "not-allowed",
    },
    "&:focus-visible": {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "2px",
    },
    // Toggles: the option they switch is on.
    '&[aria-pressed="true"]': {
      borderColor: vars.color.accent,
      backgroundColor: "rgba(56, 189, 248, 0.16)",
      color: vars.color.accent,
    },
  },
});

export const button = styleVariants({
  outline: [
    base,
    {
      border: `1px solid ${vars.color.border}`,
      backgroundColor: "#0b1426",
      color: vars.color.textPrimary,
      selectors: {
        "&:hover:not(:disabled)": {
          borderColor: vars.color.accent,
        },
      },
    },
  ],
  ghost: [
    base,
    {
      border: "1px solid transparent",
      backgroundColor: "transparent",
      color: vars.color.textSecondary,
      selectors: {
        "&:hover:not(:disabled)": {
          backgroundColor: vars.color.border,
          color: vars.color.textPrimary,
        },
      },
    },
  ],
  primary: [
    base,
    {
      border: `1px solid ${vars.color.accent}`,
      backgroundColor: vars.color.accent,
      color: "#0b1426",
      selectors: {
        "&:hover:not(:disabled)": {
          filter: "brightness(1.08)",
        },
      },
    },
  ],
  danger: [
    base,
    {
      border: `1px solid ${vars.color.border}`,
      backgroundColor: "#0b1426",
      color: DANGER_COLOR,
      selectors: {
        "&:hover:not(:disabled)": {
          borderColor: DANGER_COLOR,
          backgroundColor: "rgba(248, 113, 113, 0.12)",
        },
      },
    },
  ],
});
