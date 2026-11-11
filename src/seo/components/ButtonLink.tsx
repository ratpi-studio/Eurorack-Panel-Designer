import type { ReactNode } from "react";

import * as styles from "./ButtonLink.css";

interface ButtonLinkProps {
  href: string;
  variant?: keyof typeof styles.variant;
  /** The link saves a file instead of opening a page. */
  download?: boolean;
  children: ReactNode;
}

/** A link that looks like the kit's button, for calls to action that navigate or download. */
export function ButtonLink({ href, variant = "primary", download, children }: ButtonLinkProps) {
  return (
    <a className={styles.variant[variant]} href={href} download={download}>
      {children}
      <span className={styles.arrow} aria-hidden="true">
        {download ? "↓" : "→"}
      </span>
    </a>
  );
}
