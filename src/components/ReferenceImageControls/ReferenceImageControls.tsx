import React from 'react';

import { useI18n } from '@i18n/I18nContext';
import type { ReferenceImage } from '@lib/referenceImage';

import * as styles from './ReferenceImageControls.css';

interface ReferenceImageControlsProps {
  image: ReferenceImage;
  onChange: (updates: Partial<ReferenceImage>) => void;
  onReplace: () => void;
  onRemove: () => void;
}

function sanitizeNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function ReferenceImageControls({
  image,
  onChange,
  onReplace,
  onRemove
}: ReferenceImageControlsProps) {
  const t = useI18n();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>{t.referenceImage.title}</div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onReplace}>
            {t.referenceImage.replace}
          </button>
          <button type="button" className={styles.danger} onClick={onRemove}>
            {t.referenceImage.remove}
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>{t.referenceImage.positionX}</span>
          <input
            className={styles.input}
            type="number"
            step={0.5}
            value={image.positionMm.x.toFixed(1)}
            onChange={(event) =>
              onChange({
                positionMm: {
                  ...image.positionMm,
                  x: Math.max(0, sanitizeNumber(event.target.value, image.positionMm.x))
                }
              })
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t.referenceImage.positionY}</span>
          <input
            className={styles.input}
            type="number"
            step={0.5}
            value={image.positionMm.y.toFixed(1)}
            onChange={(event) =>
              onChange({
                positionMm: {
                  ...image.positionMm,
                  y: Math.max(0, sanitizeNumber(event.target.value, image.positionMm.y))
                }
              })
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t.referenceImage.width}</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            step={0.5}
            value={image.widthMm.toFixed(1)}
            onChange={(event) =>
              onChange({ widthMm: Math.max(1, sanitizeNumber(event.target.value, image.widthMm)) })
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t.referenceImage.height}</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            step={0.5}
            value={image.heightMm.toFixed(1)}
            onChange={(event) =>
              onChange({
                heightMm: Math.max(1, sanitizeNumber(event.target.value, image.heightMm))
              })
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t.referenceImage.rotation}</span>
          <input
            className={styles.input}
            type="number"
            step={1}
            value={image.rotationDeg.toFixed(0)}
            onChange={(event) =>
              onChange({ rotationDeg: sanitizeNumber(event.target.value, image.rotationDeg) })
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t.referenceImage.opacity}</span>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={image.opacity}
            onChange={(event) =>
              onChange({ opacity: Math.min(1, Math.max(0, Number(event.target.value))) })
            }
          />
        </label>
      </div>
    </div>
  );
}

