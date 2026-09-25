import { absoluteUrl, SITE_NAME, SITE_ORIGIN } from "./site";
import type { ContentPage, FaqEntry } from "./types";

function breadcrumb(page: ContentPage): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: page.label, item: absoluteUrl(page.path) },
    ],
  };
}

function faqPage(entries: readonly FaqEntry[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** The JSON-LD of a page: its breadcrumb, its FAQ when it has one, and its own objects. */
export function pageStructuredData(page: ContentPage): object[] {
  return [
    breadcrumb(page),
    ...(page.faq?.length ? [faqPage(page.faq)] : []),
    ...(page.structuredData ?? []),
  ];
}

export function jsonLdScript(data: object): string {
  // U+2028/U+2029 are valid JSON but break a script body; "</" would close the tag early.
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `<script type="application/ld+json">${json}</script>`;
}
