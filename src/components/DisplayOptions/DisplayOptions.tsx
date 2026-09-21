import {
  CircleDashed,
  CircleDot,
  Grid3x3,
  Magnet,
  RulerDimensionLine,
  Scan,
  type LucideIcon,
} from "lucide-react";
import React from "react";

import { IconButton } from "@components/IconButton/IconButton";
import { useI18n } from "@i18n/I18nContext";
import { DEFAULT_DESIGN_COLOR, DEFAULT_PANEL_COLOR, type PanelOptions } from "@lib/panelTypes";

import * as styles from "./DisplayOptions.css";

interface DisplayOptionsProps {
  options: PanelOptions;
  panelColor: string;
  designColor: string;
  onChange: (options: Partial<PanelOptions>) => void;
  onColorsChange: (colors: { panelColor?: string; designColor?: string }) => void;
  onResetView: () => void;
}

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

type CanvasToggle =
  | "showGrid"
  | "snapToGrid"
  | "showMountingHoles"
  | "showDimensions"
  | "showHardware";

export function toColorInputValue(color: string, fallback: string): string {
  return HEX_COLOR_PATTERN.test(color) ? color : fallback;
}

export function DisplayOptions({
  options,
  panelColor,
  designColor,
  onChange,
  onColorsChange,
  onResetView,
}: DisplayOptionsProps) {
  const t = useI18n();
  const [gridInput, setGridInput] = React.useState(() => options.gridSizeMm.toString());

  React.useEffect(() => {
    setGridInput(options.gridSizeMm.toString());
  }, [options.gridSizeMm]);

  const toggles: Array<{ key: CanvasToggle; label: string; icon: LucideIcon }> = [
    { key: "showGrid", label: t.display.grid, icon: Grid3x3 },
    { key: "snapToGrid", label: t.display.snap, icon: Magnet },
    { key: "showMountingHoles", label: t.display.holes, icon: CircleDot },
    { key: "showDimensions", label: t.display.dimensions, icon: RulerDimensionLine },
    // Dashed, as the canvas draws the outlines of knobs and nuts.
    { key: "showHardware", label: t.display.hardware, icon: CircleDashed },
  ];

  const handleGridSize = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setGridInput(value);
    if (value.trim() === "") {
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
      <div className={styles.toolbar}>
        <div className={styles.toggles} role="group" aria-label={t.display.overlaysLabel}>
          {toggles.map(({ key, label, icon }) => (
            <IconButton
              key={key}
              label={label}
              icon={icon}
              aria-pressed={options[key]}
              onClick={() => onChange({ [key]: !options[key] })}
            />
          ))}
        </div>
        <IconButton label={t.display.reset} icon={Scan} onClick={onResetView} />
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
      <ColorPickerField
        label={t.display.panelColor}
        value={toColorInputValue(panelColor, DEFAULT_PANEL_COLOR)}
        onChange={(color) => onColorsChange({ panelColor: color })}
      />
      <ColorPickerField
        label={t.display.designColor}
        value={toColorInputValue(designColor, DEFAULT_DESIGN_COLOR)}
        onChange={(color) => onColorsChange({ designColor: color })}
      />
    </div>
  );
}

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPickerField({ label, value, onChange }: ColorPickerFieldProps) {
  const normalizedValue = value.toLowerCase();

  return (
    <label className={styles.colorField}>
      <span className={styles.label}>{label}</span>
      <span className={styles.colorPickerRow}>
        <input
          type="color"
          value={normalizedValue}
          className={styles.colorInput}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className={styles.colorValue}>{normalizedValue}</span>
      </span>
    </label>
  );
}
