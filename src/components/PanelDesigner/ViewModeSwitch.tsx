import type { ViewMode } from "@lib/preferences";
import type { ReturnTypeUseI18n } from "./types";
import * as styles from "./PanelDesigner.css";

interface ViewModeSwitchProps {
  t: ReturnTypeUseI18n;
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeSwitch({ t, value, onChange }: ViewModeSwitchProps) {
  const options: Array<{ mode: ViewMode; label: string }> = [
    { mode: "2d", label: t.view3d.mode2d },
    { mode: "3d", label: t.view3d.mode3d },
    { mode: "split", label: t.view3d.modeSplit },
  ];

  return (
    <div className={styles.viewModeSwitch} role="group" aria-label={t.view3d.modeLabel}>
      {options.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          className={styles.viewModeButton}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
