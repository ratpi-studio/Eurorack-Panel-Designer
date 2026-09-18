// Keep these imports first, in this order: data moved from GitHub Pages must reach localStorage
// before the store hydrates, then Sentry initializes before the rest of the app is evaluated.
import { notifyGithubPagesMigration } from "./migrateFromGithubPages";
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
  notifyGithubPagesMigration();

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
