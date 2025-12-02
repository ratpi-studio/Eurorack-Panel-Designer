import React from 'react';

import { enUS } from '@i18n/en_US';

type I18n = typeof enUS;

const I18nContext = React.createContext<I18n | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const value = React.useMemo(() => enUS, []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const context = React.useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}

