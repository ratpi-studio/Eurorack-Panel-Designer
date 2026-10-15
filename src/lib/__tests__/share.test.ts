import { describe, expect, it } from "vite-plus/test";

import { enUS } from "@i18n/en_US";
import { fitLines } from "@lib/canvas/shareCard";
import { type PanelModel } from "@lib/panelTypes";
import {
  describePanelSize,
  openDesignUrl,
  readOpenDesignParam,
  readShareCodeFromPath,
  sharePageUrl,
} from "@lib/share";

function panel(
  dimensions: Partial<PanelModel["dimensions"]>,
  format: Partial<PanelModel["format"]>,
): PanelModel {
  return {
    dimensions: { widthCm: 6.06, widthMm: 60.6, widthHp: 12, heightMm: 128.5, ...dimensions },
    format: { system: "eurorack", rackUnits: 3, oneUSpec: "intellijel", custom: false, ...format },
  } as PanelModel;
}

describe("panel size of a shared design", () => {
  const size = (model: PanelModel) => enUS.share.size(describePanelSize(model));

  it("names Eurorack panels in HP, with their row when it is not 3U", () => {
    expect(size(panel({}, {}))).toBe("12 HP");
    expect(size(panel({ widthHp: 8 }, { rackUnits: 1 }))).toBe("8 HP, 1U");
  });

  it("names Kosmo panels in centimeters and custom sizes in millimeters", () => {
    expect(size(panel({ widthCm: 10 }, { system: "kosmo" }))).toBe("Kosmo, 10 cm");
    expect(size(panel({ widthMm: 73.25, heightMm: 128.5 }, { custom: true }))).toBe(
      "73.3 × 128.5 mm",
    );
  });
});

describe("share addresses", () => {
  it("reads the code of a shared design's page", () => {
    expect(readShareCodeFromPath("/p/7K3Q9XMB")).toBe("7K3Q9XMB");
    expect(readShareCodeFromPath("/p/7K3Q9XMB/")).toBe("7K3Q9XMB");
    expect(readShareCodeFromPath("/p/")).toBeNull();
    expect(readShareCodeFromPath("/order/EPD-0123-ABCD")).toBeNull();
    expect(readShareCodeFromPath("/")).toBeNull();
  });

  it("reads the design the editor was asked to open", () => {
    expect(readOpenDesignParam("?design=7K3Q9XMB")).toBe("7K3Q9XMB");
    expect(readOpenDesignParam("?design=%20")).toBeNull();
    expect(readOpenDesignParam("")).toBeNull();
  });

  it("builds the page and editor addresses of a code", () => {
    expect(sharePageUrl("7K3Q9XMB", "https://www.eurorackpanel.com")).toBe(
      "https://www.eurorackpanel.com/p/7K3Q9XMB",
    );
    expect(openDesignUrl("7K3Q9XMB")).toBe("/?design=7K3Q9XMB");
  });
});

describe("share card text", () => {
  // Ten pixels per character: enough to check the wrapping without a canvas.
  const measure = { measureText: (text: string) => ({ width: text.length * 10 }) as TextMetrics };

  it("wraps on words, in as many lines as allowed", () => {
    expect(fitLines(measure, "Dual VCA with CV mix", 110, 2)).toEqual(["Dual VCA", "with CV mix"]);
    expect(fitLines(measure, "VCF", 110, 2)).toEqual(["VCF"]);
  });

  it("cuts what does not fit with an ellipsis", () => {
    // 100 px holds ten characters, the ellipsis included.
    expect(fitLines(measure, "A very long module name that goes on", 100, 2)).toEqual([
      "A very",
      "long modu…",
    ]);
    expect(fitLines(measure, "Supercalifragilistic", 100, 2)).toEqual(["Supercali…"]);
  });
});
