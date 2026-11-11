import { TEMPLATE_PAGE_WIDTHS_HP } from "../paths";
import type { ContentPage } from "../types";
import { drillSizesPage } from "./drillSizes";
import { hpCalculatorPage } from "./hpCalculator";
import { hpToMmPage } from "./hpToMm";
import { kicadPage } from "./kicad";
import { panelDimensionsPage } from "./panelDimensions";
import { printingPage } from "./printing";
import { templatesPage } from "./templates";
import { templateWidthPage } from "./templateWidth";
import { termsPage } from "./terms";

/**
 * Every content page, in navigation order. Adding one here is enough: the build renders it, and
 * the navigation, the footer, the sitemap and llms.txt list it. The pages of the template widths
 * come last: the templates page links them, not the navigation.
 */
export const CONTENT_PAGES: readonly ContentPage[] = [
  hpCalculatorPage,
  templatesPage,
  hpToMmPage,
  panelDimensionsPage,
  drillSizesPage,
  printingPage,
  kicadPage,
  termsPage,
  ...TEMPLATE_PAGE_WIDTHS_HP.map(templateWidthPage),
];
