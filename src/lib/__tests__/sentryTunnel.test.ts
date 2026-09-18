import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { POST } from "../../../api/sentry-tunnel";

const PROJECT_DSN =
  "https://05489173dd52acef4232f82e99d559a2@o4509397199486976.ingest.de.sentry.io/4510476688359504";

function envelope(
  dsn: string,
  binaryItem = new Uint8Array([0x1f, 0x8b, 0x00, 0xff]),
): Uint8Array<ArrayBuffer> {
  const header = new TextEncoder().encode(
    `${JSON.stringify({ dsn })}\n{"type":"replay_recording"}\n`,
  );
  const bytes = new Uint8Array(header.length + binaryItem.length);
  bytes.set(header);
  bytes.set(binaryItem, header.length);
  return bytes;
}

function post(body: Uint8Array<ArrayBuffer> | string): Promise<Response> {
  return POST(new Request("https://example.test/api/sentry-tunnel", { method: "POST", body }));
}

describe("sentry tunnel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards this project's envelopes byte for byte", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = envelope(PROJECT_DSN);

    const response = await post(body);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://o4509397199486976.ingest.de.sentry.io/api/4510476688359504/envelope/",
    );
    expect(Array.from(init?.body as Uint8Array)).toEqual(Array.from(body));
  });

  it("refuses other DSNs and malformed envelopes", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const otherProject = PROJECT_DSN.replace("4510476688359504", "123");
    const otherHost = PROJECT_DSN.replace("o4509397199486976.ingest.de.sentry.io", "evil.test");
    expect((await post(envelope(otherProject))).status).toBe(400);
    expect((await post(envelope(otherHost))).status).toBe(400);
    expect((await post("not an envelope")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
