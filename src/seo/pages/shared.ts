/** Sources the pages cite, and how they print numbers. */

export const DOEPFER_URL = "https://doepfer.de/a100_man/a100m_e.htm";
export const INTELLIJEL_URL = "https://intellijel.com/support/1u-technical-specifications/";
export const PULP_LOGIC_URL = "https://pulplogic.com/1u_tiles/";

/** Millimeters as panels are cut: two decimals, so 30.00 reads as a measurement. */
export function mm(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}
