import React from 'react';

import { PanelDesigner } from '@components/PanelDesigner/PanelDesigner';
import { I18nProvider } from '@i18n/I18nContext';

export function App() {
  return (
    <I18nProvider>
      <PanelDesigner />
    </I18nProvider>
  );
}

