import type { FaqEntry } from "../types";
import * as styles from "./Faq.css";

/** The questions of the page's FAQPage JSON-LD, shown as the structured data describes them. */
export function Faq({ entries }: { entries: readonly FaqEntry[] }) {
  return (
    <div className={styles.list}>
      {entries.map((entry) => (
        <div key={entry.question} className={styles.item}>
          <h3 className={styles.question}>{entry.question}</h3>
          <p className={styles.answer}>{entry.answer}</p>
        </div>
      ))}
    </div>
  );
}
