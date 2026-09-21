import { Box, Columns2, Square, type LucideIcon } from "lucide-react";

import { iconLabelProps } from "@components/Tooltip/TooltipLayer";
import type { ViewMode } from "@lib/preferences";
import type { ReturnTypeUseI18n } from "./types";
import * as styles from "./PanelDesigner.css";

interface ViewModeSwitchProps {
  t: ReturnTypeUseI18n;
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeSwitch({ t, value, onChange }: ViewModeSwitchProps) {
  const options: Array<{ mode: ViewMode; label: string; Icon: LucideIcon }> = [
    { mode: "2d", label: t.view3d.mode2d, Icon: Square },
    { mode: "3d", label: t.view3d.mode3d, Icon: Box },
    { mode: "split", label: t.view3d.modeSplit, Icon: Columns2 },
  ];

  return (
    <div className={styles.viewModeSwitch} role="group" aria-label={t.view3d.modeLabel}>
      {options.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          className={styles.viewModeButton}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          {...iconLabelProps(label)}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
