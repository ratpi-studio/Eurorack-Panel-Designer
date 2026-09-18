import { style } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

export const root = style({
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  // A neutral, lighter spot behind the panel keeps dark and blue panel colors readable.
  background: "radial-gradient(ellipse at 50% 45%, #3a3f48 0%, #1c1f25 55%, #0c0e12 100%)",
});

export const canvas = style({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
  cursor: "grab",
  touchAction: "none",
  selectors: {
    "&:active": {
      cursor: "grabbing",
    },
  },
});

export const message = style({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.spacing.lg,
  textAlign: "center",
  color: vars.color.textSecondary,
  fontSize: "14px",
  pointerEvents: "none",
  selectors: {
    "&[hidden]": {
      display: "none",
    },
  },
});
