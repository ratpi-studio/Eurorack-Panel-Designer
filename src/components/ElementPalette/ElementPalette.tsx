import React from 'react';

import { enUS } from '@i18n/en_US';
import { PanelElementType } from '@lib/panelTypes';

import * as styles from './ElementPalette.css';

interface ElementPaletteProps {
  activeType: PanelElementType | null;
  onSelect: (type: PanelElementType | null) => void;
}

const paletteItems: Array<{
  type: PanelElementType;
  label: string;
  description: string;
  color: string;
}> = [
  {
    type: PanelElementType.Jack,
    ...enUS.palette.items.jack
  },
  {
    type: PanelElementType.Potentiometer,
    ...enUS.palette.items.potentiometer
  },
  {
    type: PanelElementType.Switch,
    ...enUS.palette.items.switch
  },
  {
    type: PanelElementType.Led,
    ...enUS.palette.items.led
  },
  {
    type: PanelElementType.Label,
    ...enUS.palette.items.label
  }
];

export function ElementPalette({ activeType, onSelect }: ElementPaletteProps) {
  const t = enUS;
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{t.palette.title}</div>
          <div className={styles.subtitle}>{t.palette.subtitle}</div>
        </div>
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onSelect(null)}
        >
          {t.palette.clear}
        </button>
      </div>
      <div className={styles.list}>
        {paletteItems.map((item) => {
          const isActive = item.type === activeType;

          return (
            <button
              key={item.type}
              type="button"
              className={isActive ? styles.cardActive : styles.card}
              onClick={() => onSelect(isActive ? null : item.type)}
            >
              <div
                className={styles.swatch}
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <div className={styles.cardContent}>
                <div className={styles.cardTitle}>{item.label}</div>
                <div className={styles.cardDescription}>{item.description}</div>
              </div>
              <div className={styles.cardAction}>
                {isActive ? t.palette.place : t.palette.select}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
