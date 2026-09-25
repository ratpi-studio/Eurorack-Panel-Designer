import type { ContentPage } from "../types";
import { drillSizesPage } from "./drillSizes";
import { hpCalculatorPage } from "./hpCalculator";
import { hpToMmPage } from "./hpToMm";
import { kicadPage } from "./kicad";
import { panelDimensionsPage } from "./panelDimensions";
import { printingPage } from "./printing";

/**
 * Every content page, in navigation order. Adding one here is enough: the build renders it, and
 * the navigation, the footer, the sitemap and llms.txt list it.
 */
export const CONTENT_PAGES: readonly ContentPage[] = [
  hpCalculatorPage,
  hpToMmPage,
  panelDimensionsPage,
  drillSizesPage,
  printingPage,
  kicadPage,
];
