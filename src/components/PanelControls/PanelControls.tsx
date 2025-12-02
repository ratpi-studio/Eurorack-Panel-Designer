import React from 'react';

import { enUS } from '@i18n/en_US';

import * as styles from './PanelControls.css';

interface PanelControlsProps {
  widthMm: number;
  widthHp: number;
  onChangeWidthMm: (widthMm: number) => void;
  onChangeWidthHp: (widthHp: number) => void;
}

function sanitizeInput(value: string): number {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

export function PanelControls({
  widthMm,
  widthHp,
  onChangeWidthMm,
  onChangeWidthHp
}: PanelControlsProps) {
  const t = enUS;
  const [widthHpInput, setWidthHpInput] = React.useState(() => widthHp.toString());
  const [widthMmInput, setWidthMmInput] = React.useState(() => widthMm.toFixed(1));

  React.useEffect(() => {
    setWidthHpInput(widthHp.toString());
  }, [widthHp]);

  React.useEffect(() => {
    setWidthMmInput(widthMm.toFixed(1));
  }, [widthMm]);

  const handleWidthMmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setWidthMmInput(value);

    if (value.trim() === '') {
      return;
    }

    const nextMm = sanitizeInput(value);
    if (Number.isNaN(nextMm) || nextMm <= 0 || Math.abs(nextMm - widthMm) < 0.001) {
      return;
    }

    onChangeWidthMm(nextMm);
  };

  const handleWidthHpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setWidthHpInput(value);

    if (value.trim() === '') {
      return;
    }

    const nextHp = sanitizeInput(value);
    if (Number.isNaN(nextHp) || nextHp <= 0 || nextHp === widthHp) {
      return;
    }

    onChangeWidthHp(nextHp);
  };

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="panel-width-hp">
          {t.controls.widthHpLabel}
        </label>
        <input
          id="panel-width-hp"
          className={styles.input}
          type="number"
          min={0}
          step={1}
          value={widthHpInput}
          onChange={handleWidthHpChange}
        />
        <span className={styles.hint}>{t.controls.widthHpHint}</span>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="panel-width-mm">
          {t.controls.widthMmLabel}
        </label>
        <input
          id="panel-width-mm"
          className={styles.input}
          type="number"
          min={0}
          step={1}
          value={widthMmInput}
          onChange={handleWidthMmChange}
        />
        <span className={styles.hint}>{t.controls.widthMmHint}</span>
      </div>
    </div>
  );
}
