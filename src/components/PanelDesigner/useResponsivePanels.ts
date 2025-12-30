import React from 'react';

interface ResponsivePanelsState {
  isCompact: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  setShowLeftPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowRightPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useResponsivePanels(): ResponsivePanelsState {
  const [isCompact, setIsCompact] = React.useState(false);
  const [showLeftPanel, setShowLeftPanel] = React.useState(true);
  const [showRightPanel, setShowRightPanel] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia('(max-width: 1200px)');
    const handleChange = () => {
      const compact = media.matches;
      setIsCompact(compact);
      if (compact) {
        setShowLeftPanel(false);
        setShowRightPanel(false);
      } else {
        setShowLeftPanel(true);
        setShowRightPanel(true);
      }
    };
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return {
    isCompact,
    showLeftPanel,
    showRightPanel,
    setShowLeftPanel,
    setShowRightPanel
  };
}
