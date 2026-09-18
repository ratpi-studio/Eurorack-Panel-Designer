import * as Sentry from "@sentry/react";

/** User-facing flows whose caught failures are reported, sent as the `flow` tag. */
export type MonitoredFlow = "export-png" | "export-stl" | "stl-geometry";

// Chrome and Firefox name the DOM method; WebKit only says "The object can not be found here."
const DOM_MUTATION_MESSAGE = /removeChild|insertBefore|The object can not be found here/i;

/**
 * Groups errors whose message differs across browser engines into a single issue.
 * Returns undefined to keep Sentry's default grouping.
 */
export function getErrorFingerprint(error: unknown): string[] | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === "QuotaExceededError") {
    return ["storage-quota-exceeded"];
  }
  if (
    name === "NotFoundError" &&
    typeof message === "string" &&
    DOM_MUTATION_MESSAGE.test(message)
  ) {
    // Something outside React (browser translation, extensions) moved nodes React still owns.
    return ["dom-mutated-outside-react"];
  }
  return undefined;
}

const ANONYMOUS_ID_KEY = "sentry-anonymous-id";

type IdStorage = Pick<Storage, "getItem" | "setItem">;

function createId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Random per-browser id, so Sentry can count affected users without collecting IP addresses.
 * Falls back to a per-session id when storage is unavailable or full.
 */
export function getAnonymousUserId(
  getStorage: () => IdStorage = () => window.localStorage,
): string {
  try {
    const storage = getStorage();
    const existing = storage.getItem(ANONYMOUS_ID_KEY);
    if (existing) {
      return existing;
    }
    const id = createId();
    storage.setItem(ANONYMOUS_ID_KEY, id);
    return id;
  } catch {
    return createId();
  }
}

/** Reports an error that a flow caught to show its own message to the user. */
export function reportError(error: unknown, flow: MonitoredFlow): void {
  Sentry.captureException(error, { tags: { flow } });
}

const reportedDegradations = new Set<string>();

/**
 * Reports a failure the flow recovered from with a degraded result. Each stage is reported once
 * per page load, since the STL preview reruns the same geometry on every change.
 */
export function reportDegradation(error: unknown, flow: MonitoredFlow, stage: string): void {
  const key = `${flow}:${stage}`;
  if (reportedDegradations.has(key)) {
    return;
  }
  reportedDegradations.add(key);
  Sentry.captureException(error, { level: "warning", tags: { flow, stage } });
}
