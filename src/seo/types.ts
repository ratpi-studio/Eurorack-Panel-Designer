import type { ReactNode } from "react";

import type { IslandId } from "./islands/entries";

export interface PageLink {
  /** Path with a leading and a trailing slash, for example "/eurorack-hp-to-mm/". */
  path: string;
  /** Short label used in the navigation and the footer. */
  label: string;
  /** Tools compute something; references are tables and guides. */
  group: "tools" | "reference";
}

/** A figure of the spec sheet at the top of a page. */
export interface PageFact {
  label: string;
  value: string;
  unit?: string;
}

export interface FaqEntry {
  question: string;
  /** Plain text: it is shown on the page and repeated as is in the FAQPage JSON-LD. */
  answer: string;
}

export interface ContentPage extends PageLink {
  /** The `<title>`, and the heading unless `heading` is set. */
  title: string;
  heading?: string;
  description: string;
  /** Mono overline above the heading, for example "Reference / widths". */
  kicker: string;
  /** First paragraph of the page: the answer, before any prose. */
  lead: ReactNode;
  facts: PageFact[];
  faq?: FaqEntry[];
  /** JSON-LD objects, beside the breadcrumb every page gets and the FAQPage built from `faq`. */
  structuredData?: object[];
  /** The island the page shows, whose script the page loads. */
  island?: IslandId;
  /** The numbered sections under the lead. */
  Body: () => ReactNode;
}
