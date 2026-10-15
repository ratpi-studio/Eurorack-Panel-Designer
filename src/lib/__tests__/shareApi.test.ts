import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { put } from "@vercel/blob";

import { GET, POST } from "../../../api/share";

const { blobs } = vi.hoisted(() => ({ blobs: new Map<string, string | Uint8Array>() }));

vi.mock("@vercel/blob", () => ({
  put: vi.fn<
    (pathname: string, body: string | Uint8Array) => Promise<{ pathname: string; url: string }>
  >(async (pathname, body) => {
    if (blobs.has(pathname)) {
      throw new Error("This blob already exists");
    }
    blobs.set(pathname, body);
    return { pathname, url: `https://blob.test/${pathname}` };
  }),
  get: vi.fn<(pathname: string) => Promise<Record<string, unknown> | null>>(async (pathname) => {
    const body = blobs.get(pathname);
    if (body === undefined) {
      return null;
    }
    // A copy on its own ArrayBuffer, as Response takes no view of a shared or resizable one.
    const content = typeof body === "string" ? body : new Uint8Array(body);
    return {
      statusCode: 200,
      stream: new Response(content).body,
      headers: new Headers(),
      blob: {},
    };
  }),
}));

const CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]{8}$/;
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("card pixels"),
]);

function design() {
  return {
    version: 6,
    model: {
      dimensions: { widthCm: 6.06, widthMm: 60.6, widthHp: 12, heightMm: 128.5 },
      elements: [],
    },
  };
}

function shareBody(overrides: Record<string, unknown> = {}) {
  return {
    design: design(),
    name: "VCF",
    size: "12 HP",
    card: PNG.toString("base64"),
    app: { version: "0.15.0", commit: "abc1234" },
    ...overrides,
  };
}

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("https://example.test/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function get(path: string): Promise<Response> {
  return GET(new Request(`https://example.test${path}`));
}

async function readRecord(code: string): Promise<Record<string, unknown>> {
  return (await (await get(`/api/share?code=${code}`)).json()) as Record<string, unknown>;
}

async function share(overrides: Record<string, unknown> = {}): Promise<string> {
  const response = await post(shareBody(overrides));
  expect(response.status).toBe(201);
  return ((await response.json()) as { code: string }).code;
}

describe("share API", () => {
  beforeEach(() => {
    blobs.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores a design and its card under a code, and serves both back", async () => {
    const code = await share();

    expect(code).toMatch(CODE_PATTERN);
    expect([...blobs.keys()].sort()).toEqual([
      `shares/${code}/card.png`,
      `shares/${code}/design.json`,
    ]);

    const stored = await get(`/api/share?code=${code}`);
    expect(stored.status).toBe(200);
    expect(stored.headers.get("Content-Type")).toBe("application/json");
    expect(stored.headers.get("Cache-Control")).toContain("immutable");
    expect(await stored.json()).toMatchObject({
      code,
      name: "VCF",
      size: "12 HP",
      app: { version: "0.15.0", commit: "abc1234" },
      design: design(),
    });

    const card = await get(`/api/share?code=${code}&card=1`);
    expect(card.status).toBe(200);
    expect(card.headers.get("Content-Type")).toBe("image/png");
    expect(Buffer.from(await card.arrayBuffer())).toEqual(PNG);
  });

  it("serves the card at the address its link preview uses", async () => {
    blobs.set("shares/0123ABCD/card.png", PNG);

    const card = await get("/p/0123ABCD/card.png");

    expect(card.status).toBe(200);
    expect(card.headers.get("Content-Type")).toBe("image/png");
  });

  it("falls back on the site's card for a share that has none", async () => {
    blobs.set("shares/0123ABCD/design.json", JSON.stringify({ code: "0123ABCD" }));

    const card = await get("/api/share?code=0123ABCD&card=1");

    expect(card.status).toBe(302);
    expect(card.headers.get("Location")).toBe("https://example.test/images/og.png");
  });

  it("reads codes the way people type them", async () => {
    blobs.set("shares/0123ABCD/design.json", JSON.stringify({ code: "0123ABCD" }));

    expect((await get("/api/share?code=0123ABCD")).status).toBe(200);
    expect((await get("/api/share?code=o123-abcd")).status).toBe(200);
    expect((await get("/api/share?code=0123ABCE")).status).toBe(404);
    expect((await get("/api/share?code=0123")).status).toBe(400);
    expect((await get("/api/share?code=U123ABCD")).status).toBe(400);
  });

  it("refuses what is not a design with a PNG card", async () => {
    const gif = Buffer.from("GIF89a, not a PNG").toString("base64");
    const hugeCard = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]).toString("base64");

    expect((await post("{not json")).status).toBe(400);
    expect((await post(shareBody({ design: undefined }))).status).toBe(400);
    expect((await post(shareBody({ design: { version: 6, model: {} } }))).status).toBe(400);
    expect((await post(shareBody({ card: undefined }))).status).toBe(400);
    expect((await post(shareBody({ card: gif }))).status).toBe(400);
    expect((await post(shareBody({ card: "***" }))).status).toBe(400);
    expect((await post(shareBody({ card: hugeCard }))).status).toBe(400);
    expect((await post(shareBody({ padding: "x".repeat(4 * 1024 * 1024) }))).status).toBe(413);
    expect(blobs.size).toBe(0);
  });

  it("keeps names and sizes short and on one line, and names unnamed designs", async () => {
    const named = await share({ name: `  Big\n${"x".repeat(200)}  `, size: 12 });
    const unnamed = await share({ name: "   " });

    expect(await readRecord(named)).toMatchObject({ name: `Big ${"x".repeat(76)}`, size: "" });
    expect(await readRecord(unnamed)).toMatchObject({ name: "Untitled panel" });
  });

  it("tries another code when the first one is taken", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(put).mockRejectedValueOnce(new Error("This blob already exists"));

    await share();

    expect(blobs.size).toBe(2);
  });

  it("keeps the link working when only its card fails to store", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const store = vi.mocked(put).getMockImplementation();
    if (!store) {
      throw new Error("The blob mock lost its implementation.");
    }
    vi.mocked(put).mockImplementationOnce(store).mockRejectedValueOnce(new Error("Blob is down"));

    const code = await share();

    expect([...blobs.keys()]).toEqual([`shares/${code}/design.json`]);
    expect((await get(`/p/${code}/card.png`)).status).toBe(302);
  });
});
