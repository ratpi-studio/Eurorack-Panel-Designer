import { keyframes, style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

const appear = keyframes({
  from: { opacity: 0, transform: "translateY(2px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});

export const bubble = style({
  position: "fixed",
  left: 0,
  top: 0,
  // Above the drawers and dialogs.
  zIndex: 1000,
  maxWidth: "260px",
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  borderRadius: "6px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1220",
  boxShadow: "0 8px 20px rgba(2, 6, 23, 0.5)",
  color: vars.color.textPrimary,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.35,
  pointerEvents: "none",
  visibility: "hidden",
  animation: `${appear} 120ms ease-out`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      animation: "none",
    },
  },
});
