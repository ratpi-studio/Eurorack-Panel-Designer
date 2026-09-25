import type { ReactNode } from "react";

import * as styles from "./Section.css";

interface SectionProps {
  /** Two digits, "01" for the first section of the page. */
  number: string;
  title: string;
  /** What the section holds, in the kit's mono capitals: "TABLE / 43 ROWS". Decorative. */
  kicker?: string;
  children: ReactNode;
}

export function Section({ number, title, kicker, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <span className={styles.number} aria-hidden="true">
          {number}
        </span>
        <h2 className={styles.title}>{title}</h2>
        {kicker ? (
          <span className={styles.kicker} aria-hidden="true">
            {kicker}
          </span>
        ) : null}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
