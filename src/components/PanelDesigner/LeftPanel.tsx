import { X } from "lucide-react";
import React from "react";

import { ElementPalette } from "@components/ElementPalette/ElementPalette";
import { IconButton } from "@components/IconButton/IconButton";
import { PanelControls } from "@components/PanelControls/PanelControls";
import type { PanelFormat } from "@lib/panelFormat";
import { type PanelElementType, type PanelModel } from "@lib/panelTypes";
import type { ReturnTypeUseI18n } from "./types";
import * as styles from "./PanelDesigner.css";

interface LeftPanelProps {
  t: ReturnTypeUseI18n;
  panelModel: PanelModel;
  placementType: PanelElementType | null;
  isCompact: boolean;
  showPanel: boolean;
  onClose: () => void;
  onChangeFormat: (format: PanelFormat) => void;
  onChangeWidthMm: (nextMm: number) => void;
  onChangeWidthHp: (nextHp: number) => void;
  onChangeHeightMm: (nextMm: number) => void;
  onSelectPaletteType: (type: PanelElementType | null) => void;
  onOpenSvgArtwork: () => void;
}

export function LeftPanel({
  t,
  panelModel,
  placementType,
  isCompact,
  showPanel,
  onClose,
  onChangeFormat,
  onChangeWidthHp,
  onChangeWidthMm,
  onChangeHeightMm,
  onSelectPaletteType,
  onOpenSvgArtwork,
}: LeftPanelProps) {
  const containerClass = `${styles.leftColumn} ${
    isCompact ? `${styles.drawer} ${styles.drawerLeft} ${showPanel ? styles.drawerOpen : ""}` : ""
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
            <IconButton label={t.layout.closePanel} icon={X} variant="ghost" onClick={onClose} />
          </div>
        ) : null}
        <div className={styles.card}>
          <PanelControls
            format={panelModel.format}
            widthMm={panelModel.dimensions.widthMm}
            widthHp={panelModel.dimensions.widthHp}
            heightMm={panelModel.dimensions.heightMm}
            onChangeFormat={onChangeFormat}
            onChangeWidthMm={onChangeWidthMm}
            onChangeWidthHp={onChangeWidthHp}
            onChangeHeightMm={onChangeHeightMm}
          />
        </div>
        <div className={styles.card}>
          <ElementPalette
            activeType={placementType}
            onSelect={onSelectPaletteType}
            onOpenSvgArtwork={onOpenSvgArtwork}
          />
        </div>
      </div>
    </div>
  );
}
