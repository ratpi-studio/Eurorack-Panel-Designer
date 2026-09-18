import React from "react";

import { ElementTypeIcon } from "@components/ElementTypeIcon/ElementTypeIcon";
import { useI18n } from "@i18n/I18nContext";
import { PanelElementType } from "@lib/panelTypes";

import * as styles from "./ElementPalette.css";

interface ElementPaletteProps {
  activeType: PanelElementType | null;
  onSelect: (type: PanelElementType | null) => void;
  onOpenSvgArtwork: () => void;
}

const ICON_SIZE = 36;

export function ElementPalette({ activeType, onSelect, onOpenSvgArtwork }: ElementPaletteProps) {
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
        ...t.palette.items.jack,
      },
      {
        type: PanelElementType.Potentiometer,
        ...t.palette.items.potentiometer,
      },
      {
        type: PanelElementType.Switch,
        ...t.palette.items.switch,
      },
      {
        type: PanelElementType.Led,
        ...t.palette.items.led,
      },
      {
        type: PanelElementType.Label,
        ...t.palette.items.label,
      },
      {
        type: PanelElementType.Rectangle,
        ...t.palette.items.rectangle,
      },
      {
        type: PanelElementType.Oval,
        ...t.palette.items.oval,
      },
      {
        type: PanelElementType.Slot,
        ...t.palette.items.slot,
      },
      {
        type: PanelElementType.Triangle,
        ...t.palette.items.triangle,
      },
      {
        type: PanelElementType.Insert,
        ...t.palette.items.insert,
      },
      {
        type: PanelElementType.SvgArtwork,
        ...t.palette.items.svgArtwork,
      },
    ],
    [t],
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{t.palette.title}</div>
          <div className={styles.subtitle}>{t.palette.subtitle}</div>
        </div>
        <button type="button" className={styles.clearButton} onClick={() => onSelect(null)}>
          {t.palette.clear}
        </button>
      </div>
      <div className={styles.list}>
        {paletteItems.map((item) => {
          const isActive = item.type === activeType;
          const isSvgArtwork = item.type === PanelElementType.SvgArtwork;
          return (
            <button
              key={item.type}
              type="button"
              className={isActive ? styles.cardActive : styles.card}
              onClick={() => {
                if (isSvgArtwork) {
                  onOpenSvgArtwork();
                  return;
                }
                onSelect(isActive ? null : item.type);
              }}
            >
              <div className={styles.cardContent}>
                <div className={styles.icon} aria-hidden>
                  <ElementTypeIcon type={item.type} color={item.color} size={ICON_SIZE} />
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
