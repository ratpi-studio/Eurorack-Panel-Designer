import React from "react";

import {
  DEFAULT_RIGHT_PANEL_TAB,
  getPreferredRightPanelTab,
  setPreferredRightPanelTab,
  type RightPanelTab,
} from "@lib/preferences";

interface RightPanelTabState {
  tab: RightPanelTab;
  setTab: (tab: RightPanelTab) => void;
  /**
   * Opens the Properties tab after something was selected on the canvas. The Components tab stays
   * open: it highlights the selection itself.
   */
  revealProperties: () => void;
}

/** The open tab of the right panel, remembered across visits. */
export function useRightPanelTab(): RightPanelTabState {
  const [tab, setTabState] = React.useState<RightPanelTab>(
    () => getPreferredRightPanelTab() ?? DEFAULT_RIGHT_PANEL_TAB,
  );

  const setTab = React.useCallback((next: RightPanelTab) => {
    setTabState(next);
    setPreferredRightPanelTab(next);
  }, []);

  const revealProperties = React.useCallback(() => {
    if (tab === "display") {
      setTab("properties");
    }
  }, [setTab, tab]);

  return { tab, setTab, revealProperties };
}
