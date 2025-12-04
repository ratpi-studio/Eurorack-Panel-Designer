import { Toaster } from 'react-hot-toast';

import { PanelDesigner } from '@components/PanelDesigner/PanelDesigner';
import { I18nProvider } from '@i18n/I18nContext';

export function App() {
  return (
    <I18nProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0b1426',
            color: '#e2e8f0',
            border: '1px solid #1e293b'
          },
          success: {
            style: {
              background: '#0b1426',
              color: '#e2e8f0',
              border: '1px solid #0ea5e9'
            }
          },
          error: {
            style: {
              background: '#0b1426',
              color: '#fecdd3',
              border: '1px solid #b91c1c'
            }
          }
        }}
      />
      <PanelDesigner />
    </I18nProvider>
  );
}
