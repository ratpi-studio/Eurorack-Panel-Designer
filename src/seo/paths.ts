/**
 * Where the content pages and the files for crawlers are published. Plain values, so the build
 * plugin can read them without loading the pages: the dev server only renders these paths, and
 * leaves every other request, such as the editor's modules, to Vite.
 */

export const PAGE_PATHS = {
  hpCalculator: "/eurorack-hp-calculator/",
  templates: "/eurorack-panel-templates/",
  hpToMm: "/eurorack-hp-to-mm/",
  dimensions: "/eurorack-panel-dimensions/",
  drillSizes: "/eurorack-drill-sizes/",
  printing: "/3d-print-eurorack-panel/",
  kicad: "/kicad-eurorack-panel/",
  terms: "/terms/",
} as const;

/** Widest blank panel published as a template: the widest one Doepfer's table lists. */
export const TEMPLATE_MAX_HP = 42;

/** Every width a blank panel template is published at, in whole HP. */
export const TEMPLATE_WIDTHS_HP: readonly number[] = Array.from(
  { length: TEMPLATE_MAX_HP },
  (_, index) => index + 1,
);

/**
 * The widths that get a page of their own, beside their row on the templates page: the ones blank
 * panels and modules commonly come in. The others only have their files, so the site does not grow
 * a page for widths nobody looks for.
 */
export const TEMPLATE_PAGE_WIDTHS_HP: readonly number[] = [
  1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 42,
];

/** The files of a template: an SVG outline, an STL to print, and a KiCad board outline. */
export const TEMPLATE_FILE_EXTENSIONS = ["svg", "stl", "kicad_pcb"] as const;
export type TemplateFileExtension = (typeof TEMPLATE_FILE_EXTENSIONS)[number];

export function templatePagePath(widthHp: number): string {
  return `${PAGE_PATHS.templates}${widthHp}hp/`;
}

/** Where a template file is published, named so that a download says what it is. */
export function templateFilePath(widthHp: number, extension: TemplateFileExtension): string {
  return `${PAGE_PATHS.templates}eurorack-blank-panel-${widthHp}hp.${extension}`;
}

/** Every page the build renders: the ones above, and a page per template width. */
export const ALL_PAGE_PATHS: readonly string[] = [
  ...Object.values(PAGE_PATHS),
  ...TEMPLATE_PAGE_WIDTHS_HP.map(templatePagePath),
];

/** Every template file the build writes, by the path it is published at. */
export const TEMPLATE_FILE_PATHS: readonly string[] = TEMPLATE_WIDTHS_HP.flatMap((widthHp) =>
  TEMPLATE_FILE_EXTENSIONS.map((extension) => templateFilePath(widthHp, extension)),
);

export const SITE_FILE_NAMES = ["sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt"] as const;
