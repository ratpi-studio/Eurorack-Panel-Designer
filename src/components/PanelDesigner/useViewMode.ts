import React from "react";

import {
  DEFAULT_VIEW_MODE,
  getPreferredViewMode,
  setPreferredViewMode,
  type ViewMode,
} from "@lib/preferences";

/** The render area mode, remembered across visits. */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = React.useState<ViewMode>(
    () => getPreferredViewMode() ?? DEFAULT_VIEW_MODE,
  );

  const setViewMode = React.useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    setPreferredViewMode(mode);
  }, []);

  return [viewMode, setViewMode];
}
