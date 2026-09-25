import type { ReactNode } from "react";
import { cx } from "@salnika/uipirate";

import * as styles from "./Prose.css";

interface ProseProps {
  /** Smaller print, for sources and notes. */
  small?: boolean;
  children: ReactNode;
}

export function Prose({ small = false, children }: ProseProps) {
  return <div className={cx(styles.prose, small && styles.small)}>{children}</div>;
}
