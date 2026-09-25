import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

import { sphereColor, sphereUnit } from "./Sphere.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.spacing.lg,
  color: vars.color.textSecondary,
  fontSize: "14px",
  textAlign: "center",
  vars: { [sphereColor]: vars.color.accent },
});

export const size = styleVariants({
  /** 72 px across, for small frames. */
  sm: { vars: { [sphereUnit]: "0.24px" } },
  /** 120 px across, for a page or a view. */
  md: { vars: { [sphereUnit]: "0.4px" } },
});
