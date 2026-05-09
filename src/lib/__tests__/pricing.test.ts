import { describe, expect, it, vi } from "vite-plus/test";

import { calculatePriceEur } from "../pricing";

describe("calculatePriceEur", () => {
  it("returns base + perHp × widthHp using defaults when env vars are absent", () => {
    vi.stubEnv("VITE_PRICE_BASE_EUR", "");
    vi.stubEnv("VITE_PRICE_PER_HP_EUR", "");
    expect(calculatePriceEur(8)).toBeCloseTo(8 + 8 * 1.5, 5);
    vi.unstubAllEnvs();
  });

  it("uses configured env values", () => {
    vi.stubEnv("VITE_PRICE_BASE_EUR", "10");
    vi.stubEnv("VITE_PRICE_PER_HP_EUR", "2");
    expect(calculatePriceEur(4)).toBeCloseTo(18, 5);
    vi.unstubAllEnvs();
  });

  it("clamps non-positive widths", () => {
    vi.stubEnv("VITE_PRICE_BASE_EUR", "5");
    vi.stubEnv("VITE_PRICE_PER_HP_EUR", "1");
    expect(calculatePriceEur(0)).toBeCloseTo(5, 5);
    expect(calculatePriceEur(-3)).toBeCloseTo(5, 5);
    vi.unstubAllEnvs();
  });
});
