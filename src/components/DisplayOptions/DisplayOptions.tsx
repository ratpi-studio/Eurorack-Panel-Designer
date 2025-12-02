import React from 'react';

import { enUS } from '@i18n/en_US';
import type { PanelOptions } from '@lib/panelTypes';

import * as styles from './DisplayOptions.css';

interface DisplayOptionsProps {
  options: PanelOptions;
  onChange: (options: Partial<PanelOptions>) => void;
  onResetView: () => void;
}

export function DisplayOptions({
  options,
  onChange,
  onResetView
}: DisplayOptionsProps) {
  const t = enUS;
  const [gridInput, setGridInput] = React.useState(() => options.gridSizeMm.toString());

  React.useEffect(() => {
    setGridInput(options.gridSizeMm.toString());
  }, [options.gridSizeMm]);

  const handleToggle =
    (key: keyof PanelOptions) => (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [key]: event.target.checked });

  const handleGridSize = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setGridInput(value);
    if (value.trim() === '') {
      return;
    }
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    onChange({ gridSizeMm: parsed });
  };

  return (
    <div className={styles.root}>
      <div className={styles.title}>{t.display.title}</div>
      <div className={styles.options}>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={options.showGrid}
            onChange={handleToggle('showGrid')}
          />
          <span>{t.display.grid}</span>
        </label>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={options.snapToGrid}
            onChange={handleToggle('snapToGrid')}
          />
          <span>{t.display.snap}</span>
        </label>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={options.showMountingHoles}
            onChange={handleToggle('showMountingHoles')}
          />
          <span>{t.display.holes}</span>
        </label>
      </div>
      <label className={styles.sliderField}>
        <span className={styles.label}>{t.display.gridSpacing}</span>
        <input
          type="number"
          min={0}
          step={0.5}
          value={gridInput}
          className={styles.input}
          onChange={handleGridSize}
        />
      </label>
      <button type="button" className={styles.resetButton} onClick={onResetView}>
        {t.display.reset}
      </button>
    </div>
  );
}
