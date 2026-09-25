import type { ReactNode } from "react";

import * as styles from "./ButtonLink.css";

interface ButtonLinkProps {
  href: string;
  variant?: keyof typeof styles.variant;
  children: ReactNode;
}

/** A link that looks like the kit's button, for calls to action that navigate. */
export function ButtonLink({ href, variant = "primary", children }: ButtonLinkProps) {
  return (
    <a className={styles.variant[variant]} href={href}>
      {children}
      <span className={styles.arrow} aria-hidden="true">
        →
      </span>
    </a>
  );
}
