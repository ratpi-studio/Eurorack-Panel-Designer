// What the shop prints through its Etsy listing. The listing mirrors these values: one "Width"
// option per HP, priced with `orderPriceEur`. api/order.ts repeats the widths and filament ids to
// validate designs without importing app code; the order API tests check that both agree.

export const ORDER_MIN_WIDTH_HP = 1;
export const ORDER_MAX_WIDTH_HP = 42;
/** Thickness of printed panels, used for the order preview and the STL made from an order. */
export const ORDER_PANEL_THICKNESS_MM = 2;

const BASE_PRICE_EUR = 9;
const PRICE_PER_HP_EUR = 1;

export function orderPriceEur(widthHp: number): number {
  return BASE_PRICE_EUR + PRICE_PER_HP_EUR * widthHp;
}

export function isOrderableWidth(widthHp: number): boolean {
  return (
    Number.isInteger(widthHp) && widthHp >= ORDER_MIN_WIDTH_HP && widthHp <= ORDER_MAX_WIDTH_HP
  );
}

/** Filaments in stock. A panel is printed in two of them: the body, then text and patterns. */
export const FILAMENTS = [
  { id: "white", hex: "#f4f4f1" },
  { id: "black", hex: "#1c1c1e" },
  { id: "skyBlue", hex: "#87ceeb" },
] as const;

export type FilamentId = (typeof FILAMENTS)[number]["id"];

export function isFilamentId(value: unknown): value is FilamentId {
  return FILAMENTS.some((filament) => filament.id === value);
}

export function filamentHex(id: FilamentId): string {
  return FILAMENTS.find((filament) => filament.id === id)?.hex ?? FILAMENTS[0].hex;
}

function parseHexColor(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  const digits =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : match[1];
  const value = Number.parseInt(digits, 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/** The filament closest to a design color, to preselect it when ordering. */
export function nearestFilament(hex: string): FilamentId {
  const color = parseHexColor(hex);
  if (!color) {
    return FILAMENTS[0].id;
  }
  let best: FilamentId = FILAMENTS[0].id;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const filament of FILAMENTS) {
    const candidate = parseHexColor(filament.hex);
    if (!candidate) {
      continue;
    }
    const distance = candidate.reduce(
      (sum, channel, index) => sum + (channel - color[index]) ** 2,
      0,
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = filament.id;
    }
  }
  return best;
}
