import React from "react";

import { useI18n } from "@i18n/I18nContext";
import type { DesignReliefConfig } from "@lib/panelTypes";

import * as styles from "./ElementProperties.css";

interface DesignReliefFieldsProps {
  relief: DesignReliefConfig;
  onChange: (relief: Partial<DesignReliefConfig>) => void;
}

type ReliefField = keyof DesignReliefConfig;

/** The relief every text and SVG pattern shares: editing it from one element edits the panel. */
export function DesignReliefFields({ relief, onChange }: DesignReliefFieldsProps) {
  const t = useI18n();
  // What the user is typing, until the field loses focus; otherwise the panel's value shows.
  const [draft, setDraft] = React.useState<{ field: ReliefField; value: string } | null>(null);

  const valueOf = (field: ReliefField) =>
    draft?.field === field ? draft.value : relief[field].toString();

  const handleChange = (field: ReliefField, value: string) => {
    setDraft({ field, value });
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      onChange({ [field]: Math.max(0, parsed) });
    }
  };

  const fields: Array<{ field: ReliefField; label: string }> = [
    { field: "thicknessMm", label: t.properties.reliefThickness },
    { field: "penetrationMm", label: t.properties.reliefPenetration },
  ];

  return (
    <>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{t.properties.reliefTitle}</span>
        <span className={styles.hint}>{t.properties.reliefHint}</span>
      </div>
      {fields.map(({ field, label }) => (
        <label key={field} className={styles.field}>
          <span className={styles.label}>{label}</span>
          <input
            className={styles.input}
            type="number"
            min={0}
            step={0.1}
            value={valueOf(field)}
            onChange={(event) => handleChange(field, event.target.value)}
            onBlur={() => setDraft(null)}
          />
        </label>
      ))}
    </>
  );
}
