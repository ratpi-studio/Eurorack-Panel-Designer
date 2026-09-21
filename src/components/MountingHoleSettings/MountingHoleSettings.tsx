import { Circle, X } from "lucide-react";
import React from "react";

import { SlotIcon } from "@components/ElementTypeIcon/elementIcons";
import { IconButton } from "@components/IconButton/IconButton";
import { useI18n } from "@i18n/I18nContext";
import { type MountingHoleConfig } from "@lib/panelTypes";

import * as styles from "./MountingHoleSettings.css";

interface MountingHoleSettingsProps {
  config: MountingHoleConfig;
  onChange: (updates: Partial<MountingHoleConfig>) => void;
  onClose: () => void;
}

export function MountingHoleSettings({ config, onChange, onClose }: MountingHoleSettingsProps) {
  const t = useI18n();

  const handleShapeChange = (shape: MountingHoleConfig["shape"]) => {
    if (shape === config.shape) {
      return;
    }
    if (shape === "slot") {
      onChange({
        shape,
        slotLengthMm: Math.max(config.slotLengthMm, config.diameterMm),
      });
      return;
    }
    onChange({ shape });
  };

  const handleDiameterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    if (!Number.isFinite(value)) {
      return;
    }
    const diameter = Math.max(0.1, value);
    const updates: Partial<MountingHoleConfig> = { diameterMm: diameter };
    if (config.shape === "slot" && config.slotLengthMm < diameter) {
      updates.slotLengthMm = diameter;
    }
    onChange(updates);
  };

  const handleSlotLengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    if (!Number.isFinite(value)) {
      return;
    }
    onChange({
      slotLengthMm: Math.max(config.diameterMm, value),
    });
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{t.mountingHoles.title}</div>
          <p className={styles.description}>{t.mountingHoles.description}</p>
        </div>
        <IconButton
          label={t.mountingHoles.close}
          icon={X}
          variant="ghost"
          className={styles.closeButton}
          onClick={onClose}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{t.mountingHoles.shapeLabel}</span>
        <div className={styles.shapeGroup} role="group" aria-label={t.mountingHoles.shapeLabel}>
          <IconButton
            label={t.mountingHoles.typeCircle}
            icon={Circle}
            aria-pressed={config.shape === "circle"}
            onClick={() => handleShapeChange("circle")}
          />
          <IconButton
            label={t.mountingHoles.typeSlot}
            icon={SlotIcon}
            aria-pressed={config.shape === "slot"}
            onClick={() => handleShapeChange("slot")}
          />
        </div>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>{t.mountingHoles.diameterLabel}</span>
        <input
          className={styles.numberInput}
          type="number"
          min={0.1}
          step={0.1}
          value={config.diameterMm}
          onChange={handleDiameterChange}
        />
      </label>
      {config.shape === "slot" ? (
        <label className={styles.field}>
          <span className={styles.label}>{t.mountingHoles.slotLengthLabel}</span>
          <input
            className={styles.numberInput}
            type="number"
            min={config.diameterMm}
            step={0.5}
            value={config.slotLengthMm}
            onChange={handleSlotLengthChange}
          />
        </label>
      ) : null}
    </div>
  );
}
