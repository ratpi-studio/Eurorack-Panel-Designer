import React from 'react';

import { useI18n } from '@i18n/I18nContext';
import { type ElementMountingHoleConfig, type PanelElement } from '@lib/panelTypes';

import * as styles from './ElementMountingHoles.css';

interface ElementMountingHolesProps {
  config: ElementMountingHoleConfig;
  onChangeConfig: (updates: Partial<ElementMountingHoleConfig>) => void;
  onChangeElementRotation: (rotationDeg: number) => void;
  onToggleElementEnabled: (enabled: boolean) => void;
  snapEnabled: boolean;
  element: PanelElement | null;
}

export function ElementMountingHoles({
  config,
  onChangeConfig,
  onChangeElementRotation,
  onToggleElementEnabled,
  snapEnabled,
  element
}: ElementMountingHolesProps) {
  const t = useI18n();
  const rotationStep = snapEnabled ? 45 : 1;
  const sliderValue = element?.mountingHoleRotationDeg ?? config.rotationDeg;
  const enabled = element?.mountingHolesEnabled === true;

  if (!element) {
    return null;
  }

  return (
    <div className={styles.root}>
      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={enabled}
          onChange={(event) => onToggleElementEnabled(event.target.checked)}
        />
        <span className={styles.label}>{t.elementHoles.enableLabel}</span>
      </label>
      {enabled ? (
        <>
          <p className={styles.description}>{t.elementHoles.description}</p>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t.elementHoles.countLabel}</span>
              <input
                className={styles.numberInput}
                type="number"
                min={1}
                max={12}
                step={1}
                value={config.count}
                onChange={(event) =>
                  onChangeConfig({
                    count: Math.max(1, Number.parseInt(event.target.value, 10) || 1)
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t.elementHoles.diameterLabel}</span>
              <input
                className={styles.numberInput}
                type="number"
                min={0.5}
                step={0.1}
                value={config.diameterMm}
                onChange={(event) =>
                  onChangeConfig({
                    diameterMm: Math.max(0.1, Number.parseFloat(event.target.value) || 0)
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t.elementHoles.offsetLabel}</span>
              <input
                className={styles.numberInput}
                type="number"
                min={0}
                step={0.5}
                value={config.offsetMm}
                onChange={(event) =>
                  onChangeConfig({
                    offsetMm: Math.max(0, Number.parseFloat(event.target.value) || 0)
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t.elementHoles.defaultRotationLabel}</span>
              <input
                className={styles.numberInput}
                type="number"
                min={-360}
                max={360}
                step={5}
                value={config.rotationDeg}
                onChange={(event) =>
                  onChangeConfig({
                    rotationDeg: Number.parseFloat(event.target.value) || 0
                  })
                }
              />
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              {t.elementHoles.rotationLabel}
              <span className={styles.rotationValue}>{sliderValue.toFixed(0)}°</span>
            </span>
            <input
              className={styles.slider}
              type="range"
              min={-360}
              max={360}
              step={rotationStep}
              value={sliderValue}
              onChange={(event) => {
                const value = Number.parseFloat(event.target.value);
                onChangeElementRotation(Number.isFinite(value) ? value : 0);
              }}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}
