import React from 'react';

import { useI18n } from '@i18n/I18nContext';
import { PanelElementType } from '@lib/panelTypes';

import * as styles from './ElementPalette.css';

interface ElementPaletteProps {
  activeType: PanelElementType | null;
  onSelect: (type: PanelElementType | null) => void;
}

const ICON_SIZE = 36;

export function ElementPalette({ activeType, onSelect }: ElementPaletteProps) {
  const t = useI18n();

  const paletteItems: Array<{
    type: PanelElementType;
    label: string;
    description: string;
    color: string;
  }> = React.useMemo(
    () => [
      {
        type: PanelElementType.Jack,
        ...t.palette.items.jack
      },
      {
        type: PanelElementType.Potentiometer,
        ...t.palette.items.potentiometer
      },
      {
        type: PanelElementType.Switch,
        ...t.palette.items.switch
      },
      {
        type: PanelElementType.Led,
        ...t.palette.items.led
      },
      {
        type: PanelElementType.Label,
        ...t.palette.items.label
      },
      {
        type: PanelElementType.Rectangle,
        ...t.palette.items.rectangle
      },
      {
        type: PanelElementType.Oval,
        ...t.palette.items.oval
      },
      {
        type: PanelElementType.Slot,
        ...t.palette.items.slot
      },
      {
        type: PanelElementType.Triangle,
        ...t.palette.items.triangle
      },
      {
        type: PanelElementType.Insert,
        ...t.palette.items.insert
      }
    ],
    [t]
  );

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
              <div className={styles.cardContent}>
                <div className={styles.icon} aria-hidden>
                  {renderIcon(item.type, item.color)}
                </div>
                <div className={styles.cardTitle}>{item.label}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function renderIcon(type: PanelElementType, color: string): React.ReactNode {
  const commonProps = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    viewBox: '0 0 36 36',
    role: 'presentation',
    focusable: false
  } as const;

  switch (type) {
    case PanelElementType.Jack:
    case PanelElementType.Potentiometer:
    case PanelElementType.Led:
      return (
        <svg {...commonProps}>
          <circle
            cx="18"
            cy="18"
            r="9"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    case PanelElementType.Switch:
    case PanelElementType.Rectangle:
      return (
        <svg {...commonProps}>
          <rect
            x="9"
            y="6"
            width="18"
            height="24"
            stroke={color}
            strokeWidth="2"
            fill="none"
            rx="2"
          />
        </svg>
      );
    case PanelElementType.Oval:
      return (
        <svg {...commonProps}>
          <ellipse
            cx="18"
            cy="18"
            rx="12"
            ry="7"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    case PanelElementType.Slot:
      return (
        <svg {...commonProps}>
          <rect
            x="8"
            y="10"
            width="20"
            height="16"
            stroke={color}
            strokeWidth="2"
            fill="none"
            rx="8"
            ry="8"
          />
        </svg>
      );
    case PanelElementType.Triangle:
      return (
        <svg {...commonProps}>
          <polygon
            points="18,6 28,26 8,26"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    case PanelElementType.Label:
      return (
        <svg {...commonProps}>
          <line x1="8" y1="14" x2="28" y2="14" stroke={color} strokeWidth="2" />
          <line x1="8" y1="22" x2="24" y2="22" stroke={color} strokeWidth="2" />
        </svg>
      );
    case PanelElementType.Insert:
      return (
        <svg {...commonProps}>
          <circle
            cx="18"
            cy="18"
            r="11"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="18"
            cy="18"
            r="5"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle
            cx="18"
            cy="18"
            r="9"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
  }
}
