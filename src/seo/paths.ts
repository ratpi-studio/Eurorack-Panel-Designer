/**
 * Where the content pages and the files for crawlers are published. Plain values, so the build
 * plugin can read them without loading the pages: the dev server only renders these paths, and
 * leaves every other request, such as the editor's modules, to Vite.
 */

export const PAGE_PATHS = {
  hpCalculator: "/eurorack-hp-calculator/",
  hpToMm: "/eurorack-hp-to-mm/",
  dimensions: "/eurorack-panel-dimensions/",
  drillSizes: "/eurorack-drill-sizes/",
  printing: "/3d-print-eurorack-panel/",
  kicad: "/kicad-eurorack-panel/",
} as const;

export const SITE_FILE_NAMES = ["sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt"] as const;
