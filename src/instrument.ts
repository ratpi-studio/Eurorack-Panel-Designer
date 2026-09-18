import * as Sentry from "@sentry/react";
import type { RootOptions } from "react-dom/client";

import { getAnonymousUserId, getErrorFingerprint } from "@lib/monitoring";

const SENTRY_DSN =
  "https://05489173dd52acef4232f82e99d559a2@o4509397199486976.ingest.de.sentry.io/4510476688359504";

// Only official deployments get an environment at build time (see vite.config.ts), so local dev
// servers, local builds and forks never report to this project.
const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT;

export const sentryEnabled = Boolean(environment) && import.meta.env.PROD;

if (sentryEnabled) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    tunnel: import.meta.env.VITE_SENTRY_TUNNEL || undefined,
    // No IP addresses: users are counted with an anonymous id instead.
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      // The UI copy is not sensitive; form inputs (project names) stay masked.
      Sentry.replayIntegration({ maskAllText: false }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      const fingerprint = getErrorFingerprint(hint.originalException);
      if (fingerprint) {
        event.fingerprint = fingerprint;
      }
      return event;
    },
  });
  Sentry.setUser({ id: getAnonymousUserId() });
}

const logError = (error: unknown) => console.error(error);

// Adds the component stack to errors React reports outside the ErrorBoundary. React would
// otherwise send them to `reportError`, so they are still logged here.
export const rootErrorHandlers: RootOptions = sentryEnabled
  ? {
      onUncaughtError: Sentry.reactErrorHandler(logError),
      onRecoverableError: Sentry.reactErrorHandler(logError),
    }
  : {};
