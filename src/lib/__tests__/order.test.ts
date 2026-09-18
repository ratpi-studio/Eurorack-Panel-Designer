import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { createPanelElement } from "@lib/elements";
import { generateMountingHoles } from "@lib/mountingHoles";
import {
  OrderRequestError,
  computeOrderMountingHoles,
  createOrder,
  fetchOrder,
  getEtsyListingUrl,
  isBlockingIssue,
  isOrderingEnabled,
  listOrderIssues,
} from "@lib/order";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_DESIGN_RELIEF,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  SERIALIZATION_VERSION,
  type PanelElement,
  type PanelModel,
} from "@lib/panelTypes";
import { serializePanelModel } from "@lib/serialization";

function createPanel(widthHp: number, elements: PanelElement[] = []): PanelModel {
  return {
    dimensions: {
      widthCm: (widthHp * 5.08) / 10,
      widthMm: widthHp * 5.08,
      widthHp,
      heightMm: 128.5,
    },
    elements,
    options: { ...DEFAULT_PANEL_OPTIONS },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
    panelColor: "#226bbf",
    designColor: "#ffffff",
    designRelief: { ...DEFAULT_DESIGN_RELIEF },
  };
}

const jack = () => createPanelElement(PanelElementType.Jack, { x: 20, y: 40 });
const label = () => createPanelElement(PanelElementType.Label, { x: 20, y: 20 });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("order helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("takes orders only with the flag on and an Etsy listing to send buyers to", () => {
    vi.stubEnv("VITE_ETSY_LISTING_URL", " https://www.etsy.com/listing/1 ");
    expect(getEtsyListingUrl()).toBe("https://www.etsy.com/listing/1");
    for (const [flag, enabled] of [
      ["", false],
      ["false", false],
      ["true", true],
      [" TRUE ", true],
      ["1", true],
    ] as const) {
      vi.stubEnv("VITE_ORDERING_ENABLED", flag);
      expect(isOrderingEnabled()).toBe(enabled);
    }

    vi.stubEnv("VITE_ETSY_LISTING_URL", "");
    expect(getEtsyListingUrl()).toBeNull();
    expect(isOrderingEnabled()).toBe(false);
  });

  it("blocks panels wider than the shop prints", () => {
    const issues = listOrderIssues(createPanel(43), { panel: "black", details: "white" });

    expect(issues).toEqual([{ kind: "tooWide", widthHp: 43, maxWidthHp: 42 }]);
    expect(issues.every(isBlockingIssue)).toBe(true);
    expect(listOrderIssues(createPanel(42), { panel: "black", details: "white" })).toEqual([]);
  });

  it("warns when text and patterns share the panel color", () => {
    const sameColors = { panel: "white", details: "white" } as const;
    const pattern = createPanelElement(PanelElementType.SvgArtwork, { x: 10, y: 10 });

    const issues = listOrderIssues(createPanel(8, [label()]), sameColors);
    expect(issues).toEqual([{ kind: "sameFilament" }]);
    expect(issues.some(isBlockingIssue)).toBe(false);
    expect(listOrderIssues(createPanel(8, [pattern]), sameColors)).toEqual([
      { kind: "sameFilament" },
    ]);
    expect(listOrderIssues(createPanel(8, [jack()]), sameColors)).toEqual([]);
  });

  it("leaves hidden elements out of orders, and says so", async () => {
    const hiddenJack = { ...jack(), mountingHolesEnabled: true, hidden: true };
    const model = createPanel(12, [hiddenJack, label()]);
    model.elementHoleConfig = { ...model.elementHoleConfig, enabled: true, count: 2 };
    const panelHoles = generateMountingHoles({
      widthHp: 12,
      widthMm: model.dimensions.widthMm,
      heightMm: 128.5,
      config: model.mountingHoleConfig,
    });

    expect(listOrderIssues(model, { panel: "black", details: "white" })).toEqual([
      { kind: "hiddenElements", count: 1 },
    ]);
    // The screw holes around the hidden jack are not drilled either.
    expect(computeOrderMountingHoles(model)).toHaveLength(panelHoles.length);

    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ code: "EPD-7K3Q-9XMB" }, 201));
    vi.stubGlobal("fetch", fetchMock);
    await createOrder(model, { panel: "black", details: "white" });
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
      design: { model: PanelModel };
    };
    expect(body.design.model.elements.map((element) => element.type)).toEqual([
      PanelElementType.Label,
    ]);
  });

  it("warns about texts that may not print well", () => {
    const tiny = label();
    if (tiny.type === PanelElementType.Label) {
      tiny.properties = { ...tiny.properties, fontSizePt: 4 };
    }

    const issues = listOrderIssues(createPanel(8, [label(), tiny]), {
      panel: "black",
      details: "white",
    });

    expect(issues).toEqual([{ kind: "textPrint", count: 1 }]);
    expect(issues.some(isBlockingIssue)).toBe(false);
  });

  it("includes the holes around elements, as the STL export does", () => {
    const model = createPanel(12, [{ ...jack(), mountingHolesEnabled: true }]);
    model.elementHoleConfig = { ...model.elementHoleConfig, enabled: true, count: 2 };
    const panelHoles = generateMountingHoles({
      widthHp: 12,
      widthMm: model.dimensions.widthMm,
      heightMm: 128.5,
      config: model.mountingHoleConfig,
    });

    expect(computeOrderMountingHoles(model)).toHaveLength(panelHoles.length + 2);
  });

  it("sends the design, the filaments and the app version, and returns the code", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ code: "EPD-7K3Q-9XMB" }, 201));
    vi.stubGlobal("fetch", fetchMock);
    const model = createPanel(10, [label()]);

    const code = await createOrder(model, { panel: "black", details: "skyBlue" });

    expect(code).toBe("EPD-7K3Q-9XMB");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/order");
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(body.design).toEqual({ version: SERIALIZATION_VERSION, model });
    expect(body.filaments).toEqual({ panel: "black", details: "skyBlue" });
    expect(body.app).toEqual(expect.objectContaining({ version: expect.any(String) }));
  });

  it("reports the HTTP status of a failed order, or 0 when the server is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("Too large", { status: 413 })),
    );
    await expect(
      createOrder(createPanel(4), { panel: "white", details: "black" }),
    ).rejects.toMatchObject({
      name: "OrderRequestError",
      status: 413,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => Promise.reject(new TypeError("offline"))),
    );
    const error = await fetchOrder("EPD-7K3Q-9XMB").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(OrderRequestError);
    expect((error as OrderRequestError).status).toBe(0);
  });

  it("loads a stored design back into a panel model", async () => {
    const model = createPanel(6, [jack(), label()]);
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        code: "EPD-7K3Q-9XMB",
        createdAt: "2026-09-18T12:00:00.000Z",
        widthHp: 6,
        filaments: { panel: "black", details: "white" },
        app: { version: "0.10.0", commit: "abc1234" },
        design: JSON.parse(serializePanelModel(model)) as unknown,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const record = await fetchOrder("epd-7k3q-9xmb");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/order?code=epd-7k3q-9xmb");
    expect(record).toMatchObject({
      code: "EPD-7K3Q-9XMB",
      widthHp: 6,
      filaments: { panel: "black", details: "white" },
      app: { version: "0.10.0", commit: "abc1234" },
    });
    expect(record.model).toEqual(model);
  });

  it("tells a missing design apart from other failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("Design not found", { status: 404 })),
    );

    await expect(fetchOrder("EPD-0000-0000")).rejects.toMatchObject({ status: 404 });
  });
});
