import React from 'react';

import { ElementPalette } from '@components/ElementPalette/ElementPalette';
import { PanelControls } from '@components/PanelControls/PanelControls';
import { type PanelElementType, type PanelModel } from '@lib/panelTypes';
import type { ReturnTypeUseI18n } from './types';
import * as styles from './PanelDesigner.css';

interface LeftPanelProps {
  t: ReturnTypeUseI18n;
  panelModel: PanelModel;
  placementType: PanelElementType | null;
  isCompact: boolean;
  showPanel: boolean;
  onClose: () => void;
  onChangeWidthMm: (nextMm: number) => void;
  onChangeWidthHp: (nextHp: number) => void;
  onSelectPaletteType: (type: PanelElementType | null) => void;
}

export function LeftPanel({
  t,
  panelModel,
  placementType,
  isCompact,
  showPanel,
  onClose,
  onChangeWidthHp,
  onChangeWidthMm,
  onSelectPaletteType
}: LeftPanelProps) {
  const containerClass = `${styles.leftColumn} ${
    isCompact ? `${styles.drawer} ${styles.drawerLeft} ${showPanel ? styles.drawerOpen : ''}` : ''
  }`;

  if (isCompact && !showPanel) {
    return null;
  }

  return (
    <div className={containerClass}>
      <div className={styles.sectionStack}>
        {isCompact ? (
          <div className={styles.drawerHeader}>
            <div className={styles.cardTitle}>{t.palette.title}</div>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Close
            </button>
          </div>
        ) : null}
        <div className={styles.card}>
          <PanelControls
            widthMm={panelModel.dimensions.widthMm}
            widthHp={panelModel.dimensions.widthHp}
            onChangeWidthMm={onChangeWidthMm}
            onChangeWidthHp={onChangeWidthHp}
          />
        </div>
        <div className={styles.card}>
          <ElementPalette activeType={placementType} onSelect={onSelectPaletteType} />
        </div>
      </div>
    </div>
  );
}
