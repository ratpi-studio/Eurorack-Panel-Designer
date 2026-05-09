const DEFAULT_BASE_EUR = 8;
const DEFAULT_PER_HP_EUR = 1.5;

function parseNumber(raw: unknown, fallback: number): number {
  if (typeof raw !== "string" || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function calculatePriceEur(widthHp: number): number {
  const base = parseNumber(import.meta.env.VITE_PRICE_BASE_EUR, DEFAULT_BASE_EUR);
  const perHp = parseNumber(import.meta.env.VITE_PRICE_PER_HP_EUR, DEFAULT_PER_HP_EUR);
  const safeWidth = Number.isFinite(widthHp) && widthHp > 0 ? widthHp : 0;
  const total = base + safeWidth * perHp;
  return Math.round(total * 100) / 100;
}
