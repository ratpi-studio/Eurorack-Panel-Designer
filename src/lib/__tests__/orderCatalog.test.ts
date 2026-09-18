import { describe, expect, it } from "vite-plus/test";

import {
  FILAMENTS,
  ORDER_MAX_WIDTH_HP,
  filamentHex,
  isFilamentId,
  isOrderableWidth,
  nearestFilament,
  orderPriceEur,
} from "@lib/orderCatalog";
import { DEFAULT_DESIGN_COLOR, DEFAULT_PANEL_COLOR } from "@lib/panelTypes";

describe("order catalog", () => {
  it("prices a panel at a base price plus a price per HP", () => {
    expect(orderPriceEur(1)).toBe(10);
    expect(orderPriceEur(10)).toBe(19);
    expect(orderPriceEur(ORDER_MAX_WIDTH_HP)).toBe(51);
  });

  it("sells whole widths from 1 HP up to the largest printable panel", () => {
    expect(isOrderableWidth(1)).toBe(true);
    expect(isOrderableWidth(ORDER_MAX_WIDTH_HP)).toBe(true);
    expect(isOrderableWidth(0)).toBe(false);
    expect(isOrderableWidth(ORDER_MAX_WIDTH_HP + 1)).toBe(false);
    expect(isOrderableWidth(12.5)).toBe(false);
  });

  it("preselects the filament closest to each design color", () => {
    expect(nearestFilament(DEFAULT_PANEL_COLOR)).toBe("skyBlue");
    expect(nearestFilament(DEFAULT_DESIGN_COLOR)).toBe("white");
    expect(nearestFilament("#000")).toBe("black");
    expect(nearestFilament("#1a1a1a")).toBe("black");
    expect(nearestFilament("not a color")).toBe(FILAMENTS[0].id);
  });

  it("knows its filaments", () => {
    expect(FILAMENTS.map((filament) => filament.id)).toEqual(["white", "black", "skyBlue"]);
    expect(isFilamentId("black")).toBe(true);
    expect(isFilamentId("red")).toBe(false);
    expect(filamentHex("skyBlue")).toBe(FILAMENTS[2].hex);
  });
});
