import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { put } from "@vercel/blob";

import { GET, POST } from "../../../api/order";
import { FILAMENTS, ORDER_MAX_WIDTH_HP } from "../orderCatalog";

const { blobs } = vi.hoisted(() => ({ blobs: new Map<string, string>() }));

vi.mock("@vercel/blob", () => ({
  put: vi.fn<(pathname: string, body: string) => Promise<{ pathname: string; url: string }>>(
    async (pathname, body) => {
      if (blobs.has(pathname)) {
        throw new Error("This blob already exists");
      }
      blobs.set(pathname, body);
      return { pathname, url: `https://blob.test/${pathname}` };
    },
  ),
  get: vi.fn<(pathname: string) => Promise<Record<string, unknown> | null>>(async (pathname) => {
    const body = blobs.get(pathname);
    if (body === undefined) {
      return null;
    }
    return { statusCode: 200, stream: new Response(body).body, headers: new Headers(), blob: {} };
  }),
}));

const CODE_PATTERN = /^EPD-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

function design(widthHp: number) {
  return {
    version: 6,
    model: {
      dimensions: { widthCm: widthHp * 0.508, widthMm: widthHp * 5.08, widthHp, heightMm: 128.5 },
      elements: [],
    },
  };
}

function orderBody(overrides: Record<string, unknown> = {}) {
  return {
    design: design(12),
    filaments: { panel: "black", details: "white" },
    app: { version: "0.10.0", commit: "abc1234" },
    ...overrides,
  };
}

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("https://example.test/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function getCode(code: string): Promise<Response> {
  return GET(new Request(`https://example.test/api/order?code=${encodeURIComponent(code)}`));
}

describe("order API", () => {
  beforeEach(() => {
    blobs.clear();
    vi.stubEnv("VITE_ORDERING_ENABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("only takes new designs while the ordering flag is on", async () => {
    blobs.set("orders/0123ABCD/design.json", JSON.stringify({ code: "EPD-0123-ABCD" }));
    for (const flag of ["", "false", "0", "yes"]) {
      vi.stubEnv("VITE_ORDERING_ENABLED", flag);
      expect((await post(orderBody())).status).toBe(404);
    }
    expect(blobs.size).toBe(1);
    // Codes already given keep working, so orders placed before can still be printed.
    expect((await getCode("EPD-0123-ABCD")).status).toBe(200);

    vi.stubEnv("VITE_ORDERING_ENABLED", " TRUE ");
    expect((await post(orderBody())).status).toBe(201);
    vi.stubEnv("VITE_ORDERING_ENABLED", "1");
    expect((await post(orderBody())).status).toBe(201);
  });

  it("stores a design under a readable code and serves it back", async () => {
    const response = await post(orderBody());

    expect(response.status).toBe(201);
    const { code } = (await response.json()) as { code: string };
    expect(code).toMatch(CODE_PATTERN);
    expect([...blobs.keys()]).toEqual([`orders/${code.slice(4).replace("-", "")}/design.json`]);

    const stored = await getCode(code);
    expect(stored.status).toBe(200);
    expect(stored.headers.get("Cache-Control")).toContain("immutable");
    const record = (await stored.json()) as Record<string, unknown>;
    expect(record).toMatchObject({
      code,
      widthHp: 12,
      filaments: { panel: "black", details: "white" },
      app: { version: "0.10.0", commit: "abc1234" },
      design: design(12),
    });
  });

  it("reads codes the way people type them", async () => {
    blobs.set("orders/0123ABCD/design.json", JSON.stringify({ code: "EPD-0123-ABCD" }));

    expect((await getCode("EPD-0123-ABCD")).status).toBe(200);
    expect((await getCode("epd o123 abcd")).status).toBe(200);
    expect((await getCode("0123abcd")).status).toBe(200);
    expect((await getCode("EPD-0123-ABCE")).status).toBe(404);
    expect((await getCode("EPD-0123")).status).toBe(400);
    expect((await getCode("EPD-U123-ABCD")).status).toBe(400);
  });

  it("accepts the widths and filaments of the catalog, and nothing else", async () => {
    for (const filament of FILAMENTS) {
      const body = orderBody({ filaments: { panel: filament.id, details: filament.id } });
      expect((await post(body)).status).toBe(201);
    }
    expect((await post(orderBody({ design: design(ORDER_MAX_WIDTH_HP) }))).status).toBe(201);
    expect((await post(orderBody({ design: design(1) }))).status).toBe(201);

    expect((await post(orderBody({ design: design(ORDER_MAX_WIDTH_HP + 1) }))).status).toBe(400);
    expect((await post(orderBody({ design: design(0) }))).status).toBe(400);
    expect((await post(orderBody({ design: design(10.5) }))).status).toBe(400);
    const red = orderBody({ filaments: { panel: "red", details: "white" } });
    expect((await post(red)).status).toBe(400);
  });

  it("refuses malformed or oversized requests", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect((await post(orderBody({ design: undefined }))).status).toBe(400);
    expect((await post(orderBody({ design: { version: 6, model: {} } }))).status).toBe(400);
    expect((await post(orderBody({ filaments: undefined }))).status).toBe(400);
    const huge = orderBody({ padding: "x".repeat(2 * 1024 * 1024) });
    expect((await post(huge)).status).toBe(413);
    expect(blobs.size).toBe(0);
  });

  it("keeps only short strings from the app info", async () => {
    const response = await post(orderBody({ app: { version: 7, commit: "c".repeat(200) } }));
    const { code } = (await response.json()) as { code: string };
    const record = (await (await getCode(code)).json()) as { app: unknown };

    expect(record.app).toEqual({ version: "", commit: "c".repeat(64) });
  });

  it("tries another code when the first one is taken", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(put).mockRejectedValueOnce(new Error("This blob already exists"));

    const response = await post(orderBody());

    expect(response.status).toBe(201);
    expect(blobs.size).toBe(1);
  });
});
