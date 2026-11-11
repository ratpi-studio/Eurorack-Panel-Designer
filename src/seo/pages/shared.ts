/** Sources the pages cite, and how they print numbers. */

export const DOEPFER_URL = "https://doepfer.de/a100_man/a100m_e.htm";
export const INTELLIJEL_URL = "https://intellijel.com/support/1u-technical-specifications/";
export const PULP_LOGIC_URL = "https://pulplogic.com/1u_tiles/";
export const KOSMO_URL = "https://www.lookmumnocomputer.com/modular";
export const KOSMO_SPEC_URL = "https://lookmumnocomputer.discourse.group/t/kosmo-specification/896";

/** A width with its article, as it is read aloud: "a 4 HP", "an 8 HP", "an 18 HP". */
export function aWidthHp(widthHp: number): string {
  const startsWithVowelSound =
    widthHp === 8 || widthHp === 11 || widthHp === 18 || (widthHp >= 80 && widthHp < 90);
  return `${startsWithVowelSound ? "an" : "a"} ${widthHp} HP`;
}

/** Millimeters as panels are cut: two decimals, so 30.00 reads as a measurement. */
export function mm(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}
