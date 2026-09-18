// Keep this import first: it initializes Sentry before the rest of the app is evaluated.
import { rootErrorHandlers, sentryEnabled } from "./instrument";

import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { inject } from "@vercel/analytics";

import { enUS } from "@i18n/en_US";
import { App } from "./App";

import "@styles/globals.css.ts";

const ErrorFallback = () => <div role="alert">{enUS.app.errorFallback}</div>;

async function bootstrap() {
  // Initialize Vercel Web Analytics
  inject();

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element "#root" is missing in index.html');
  }

  const root = ReactDOM.createRoot(rootElement, rootErrorHandlers);

  if (sentryEnabled) {
    root.render(
      <React.StrictMode>
        <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
          <App />
        </Sentry.ErrorBoundary>
      </React.StrictMode>,
    );
    return;
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
