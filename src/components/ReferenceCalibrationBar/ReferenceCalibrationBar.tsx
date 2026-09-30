import { Ruler, X } from "lucide-react";
import React from "react";

import { IconButton } from "@components/IconButton/IconButton";
import { useI18n } from "@i18n/I18nContext";
import { getCalibrationDistanceMm } from "@lib/referenceImage";
import type { Vector2 } from "@lib/panelTypes";

import * as styles from "./ReferenceCalibrationBar.css";

interface ReferenceCalibrationBarProps {
  points: Vector2[];
  onApply: (realDistanceMm: number) => void;
  onCancel: () => void;
}

/** Guides the two clicks of the calibration, then asks for the distance they stand for. */
export function ReferenceCalibrationBar({
  points,
  onApply,
  onCancel,
}: ReferenceCalibrationBarProps) {
  const t = useI18n();
  const [first, second] = points;
  const measuredMm = first && second ? getCalibrationDistanceMm(first, second) : null;

  return (
    <div className={styles.root} translate="no">
      <Ruler className={styles.icon} />
      <div className={styles.body}>
        <div className={styles.title}>{t.referenceImage.calibrationTitle}</div>
        {measuredMm === null ? (
          <div className={styles.hint} aria-live="polite">
            {first ? t.referenceImage.calibrationPickSecond : t.referenceImage.calibrationPickFirst}
          </div>
        ) : (
          // Remounted for each pair of points, so the field starts again from their distance.
          <CalibrationDistanceForm
            key={`${second.x},${second.y}`}
            measuredMm={measuredMm}
            onApply={onApply}
          />
        )}
      </div>
      <IconButton
        label={t.referenceImage.calibrationCancel}
        icon={X}
        variant="ghost"
        onClick={onCancel}
      />
    </div>
  );
}

function CalibrationDistanceForm({
  measuredMm,
  onApply,
}: {
  measuredMm: number;
  onApply: (realDistanceMm: number) => void;
}) {
  const t = useI18n();
  const [value, setValue] = React.useState(() => String(Number(measuredMm.toFixed(2))));
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const distanceMm = Number.parseFloat(value);
  const isValid = Number.isFinite(distanceMm) && distanceMm > 0;

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (isValid) {
          onApply(distanceMm);
        }
      }}
    >
      <div className={styles.hint}>{t.referenceImage.calibrationMeasured(measuredMm)}</div>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>{t.referenceImage.calibrationDistance}</span>
          <input
            ref={inputRef}
            className={styles.input}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={value}
            aria-invalid={!isValid}
            title={isValid ? undefined : t.referenceImage.calibrationInvalid}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <button type="submit" className={styles.applyButton} disabled={!isValid}>
          {t.referenceImage.calibrationApply}
        </button>
      </div>
    </form>
  );
}
