import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';

import '@styles/globals.css.ts';

const SENTRY_DSN = 'https://05489173dd52acef4232f82e99d559a2@o4509397199486976.ingest.de.sentry.io/4510476688359504';
const release = import.meta.env.VITE_SENTRY_RELEASE;

const ErrorFallback = () => (
  <div role="alert">
    Une erreur inattendue est survenue. Veuillez recharger la page.
  </div>
);

async function bootstrap() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element "#root" is missing in index.html');
  }

  const root = ReactDOM.createRoot(rootElement);
  const shouldEnableSentry = Boolean(SENTRY_DSN) && import.meta.env.MODE !== 'test';

  if (shouldEnableSentry) {
    const { init, ErrorBoundary } = await import('@sentry/react');
    init({
      dsn: SENTRY_DSN,
      sendDefaultPii: true,
      enabled: import.meta.env.MODE !== 'test',
      environment: import.meta.env.MODE,
      ...(release ? { release } : {})
    });

    root.render(
      <React.StrictMode>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    return;
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();
