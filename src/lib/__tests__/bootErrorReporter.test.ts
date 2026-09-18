// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vite-plus/test";

// The reporter is the inline script of index.html: these tests run it as the build ships it, with
// the %VITE_…% placeholders filled in.
const indexHtml = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../index.html"),
  "utf8",
);
const reporterSource = /<script data-boot-error-reporter>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1];

const DSN = "https://key@o1.ingest.de.sentry.io/2";
const BUNDLE_URL = `${location.origin}/assets/react-vendor-abc123.js`;

const listeners: [string, EventListenerOrEventListenerObject, boolean | undefined][] = [];

function startReporter(values: Record<string, string>) {
  if (!reporterSource) {
    throw new Error("index.html has no boot error reporter");
  }
  const source = reporterSource.replace(/%(VITE_[A-Z_]+)%/g, (_, key: string) => values[key] ?? "");
  new Function(source)();
}

function startOfficialReporter() {
  startReporter({
    VITE_SENTRY_DSN: DSN,
    VITE_SENTRY_ENVIRONMENT: "vercel-production",
    VITE_SENTRY_RELEASE: "abc1234",
    VITE_SENTRY_TUNNEL: "/api/sentry-tunnel",
  });
}

function bundleError(message: string): Error {
  const error = new TypeError(message);
  error.stack = `TypeError: ${message}\n    at ${BUNDLE_URL}:1:476`;
  return error;
}

function throwFromBundle(error: Error, filename = BUNDLE_URL) {
  window.dispatchEvent(
    new ErrorEvent("error", { error, message: error.message, filename, lineno: 1, colno: 476 }),
  );
}

function sentEnvelope(fetchMock: Mock<typeof fetch>, call = 0) {
  const [url, init] = fetchMock.mock.calls[call];
  const [header, item, event] = String(init?.body)
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  return { url, header, item, event };
}

describe("boot error reporter", () => {
  let fetchMock: Mock<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    // Records the reporter's listeners to remove them after each test. Vitest turns error events
    // into test failures while no "error" listener is registered, so keep one for the whole test.
    const addEventListener = window.addEventListener;
    vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
      const capture = typeof options === "boolean" ? options : options?.capture;
      listeners.push([type, listener, capture]);
      addEventListener.call(window, type, listener, options);
    });
    window.addEventListener("error", () => undefined);
    delete window.__sentryStarted;
  });

  afterEach(() => {
    for (const [type, listener, capture] of listeners.splice(0)) {
      window.removeEventListener(type, listener, capture);
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends an error thrown before Sentry starts through the tunnel", () => {
    startOfficialReporter();

    throwFromBundle(bundleError("t is not a function"));

    expect(fetchMock).toHaveBeenCalledOnce();
    const { url, header, item, event } = sentEnvelope(fetchMock);
    expect(url).toBe("/api/sentry-tunnel");
    expect(header).toMatchObject({ dsn: DSN, event_id: event.event_id });
    expect(item).toEqual({ type: "event" });
    expect(event).toMatchObject({
      level: "fatal",
      platform: "javascript",
      environment: "vercel-production",
      release: "abc1234",
      tags: { flow: "boot" },
      exception: {
        values: [
          {
            type: "TypeError",
            value: "t is not a function",
            mechanism: { type: "onerror", handled: false },
            stacktrace: { frames: [{ filename: BUNDLE_URL, lineno: 1, colno: 476 }] },
          },
        ],
      },
    });
    expect(event.event_id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("leaves errors to Sentry once it has started, and sends only the first one", () => {
    startOfficialReporter();

    window.__sentryStarted = true;
    throwFromBundle(bundleError("handled by Sentry"));
    expect(fetchMock).not.toHaveBeenCalled();

    delete window.__sentryStarted;
    throwFromBundle(bundleError("first"));
    throwFromBundle(bundleError("second"));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(sentEnvelope(fetchMock).event).toMatchObject({
      exception: { values: [{ value: "first" }] },
    });
  });

  it("ignores errors from browser extensions", () => {
    startOfficialReporter();
    const error = new Error("extension failure");
    error.stack = "Error: extension failure\n    at chrome-extension://abc/content.js:1:1";

    throwFromBundle(error, "chrome-extension://abc/content.js");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a script of the site that fails to load", () => {
    startOfficialReporter();
    const script = document.createElement("script");
    script.src = `${location.origin}/assets/index-abc123.js`;
    document.body.append(script);

    script.dispatchEvent(new Event("error"));
    script.remove();

    expect(sentEnvelope(fetchMock).event).toMatchObject({
      exception: { values: [{ type: "LoadError", value: `Failed to load ${script.src}` }] },
    });
  });

  it("reports a rejected chunk import", () => {
    startOfficialReporter();
    const rejection = new Event("unhandledrejection");
    Object.defineProperty(rejection, "reason", {
      value: new TypeError(`Failed to fetch dynamically imported module: ${BUNDLE_URL}`),
    });

    window.dispatchEvent(rejection);

    expect(sentEnvelope(fetchMock).event).toMatchObject({
      exception: { values: [{ type: "TypeError" }] },
    });
  });

  it("stays off outside official deployments", () => {
    startReporter({ VITE_SENTRY_DSN: DSN, VITE_SENTRY_ENVIRONMENT: "", VITE_SENTRY_TUNNEL: "" });
    throwFromBundle(bundleError("local build"));

    // Placeholders left as they are, when the HTML is not built by Vite.
    new Function(reporterSource ?? "")();
    throwFromBundle(bundleError("unbuilt html"));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
