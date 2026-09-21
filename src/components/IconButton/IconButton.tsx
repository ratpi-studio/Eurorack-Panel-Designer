import type { LucideIcon } from "lucide-react";
import type React from "react";

import { iconLabelProps } from "@components/Tooltip/TooltipLayer";

import * as styles from "./IconButton.css";

export type IconButtonVariant = keyof typeof styles.button;

interface IconButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label" | "type"
> {
  /** What the button does: its accessible name and its tooltip. */
  label: string;
  icon: LucideIcon;
  variant?: IconButtonVariant;
}

/** A button that only shows an icon, named by `label` for screen readers and its tooltip. */
export function IconButton({
  label,
  icon: Icon,
  variant = "outline",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={className ? `${styles.button[variant]} ${className}` : styles.button[variant]}
      {...iconLabelProps(label)}
      {...props}
    >
      <Icon />
    </button>
  );
}
