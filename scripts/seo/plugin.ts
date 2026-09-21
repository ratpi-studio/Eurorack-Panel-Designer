/**
 * Emits everything a crawler reads without running JavaScript: the static content pages, the
 * sitemap, robots.txt and llms.txt. No major AI crawler renders JS, so these files are the only
 * description of the product those crawlers ever see.
 *
 * Only the production build (base "/") emits them: the GitHub Pages build serves a `noindex`
 * redirect and would publish the pages under a path their absolute links do not match.
 */

import type { Plugin } from "vite-plus";

import { renderPage, type ContentPage } from "./layout";
import { buildContentPages, pageLinks } from "./pages";
import {
  absoluteUrl,
  buildDate,
  NAMED_CRAWLERS,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_TAGLINE,
} from "./site";

function sitemap(pages: readonly ContentPage[]): string {
  const today = buildDate();
  const entries = [
    { loc: `${SITE_ORIGIN}/`, priority: "1.0" },
    ...pages.map((page) => ({ loc: absoluteUrl(page.path), priority: "0.8" })),
  ];

  const urls = entries
    .map(
      ({ loc, priority }) =>
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function robots(): string {
  const named = NAMED_CRAWLERS.map((agent) => `User-agent: ${agent}\nAllow: /\n`).join("\n");
  return `# ${SITE_NAME} — ${SITE_TAGLINE}\n# Every crawler is welcome. The agents below are named so that narrowing this\n# file later has to be a deliberate edit rather than an accident.\n\nUser-agent: *\nAllow: /\n\n${named}\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

function llmsTxt(pages: readonly ContentPage[]): string {
  const links = pages
    .map((page) => `- [${page.title}](${absoluteUrl(page.path)}): ${page.description}`)
    .join("\n");

  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} runs entirely in the browser. It has no account, no upload and no paid tier: designs
are kept in the browser's own storage and exported as files. It is open source under the MIT
license.

## What it does

- Panel formats: 3U Eurorack (128.50 mm), 1U Intellijel (39.65 mm), 1U Pulp Logic tiles (43.18 mm,
  in multiples of 6 HP), 2U (84.05 mm), 4U (172.95 mm), or any custom size from 5 to 1000 mm.
- Widths in HP or millimeters, cut at the widths Doepfer publishes: a 6 HP panel is 30.00 mm, not
  30.48 mm.
- Real parts with the hole their datasheet calls for: Thonkiconn jacks (6 mm), Alpha 9 mm pots and
  Bourns PEC11R encoders (7 mm), Dailywell sub-mini (5 mm) and mini (6.35 mm) toggles, 3 mm and
  5 mm LEDs. Knobs, nuts and washers are outlined, in red where they collide.
- Mounting holes generated on the rail grid: first column 7.5 mm from the left edge, rows 3 mm from
  the top and bottom, 3.4 mm across.
- Text in five bundled fonts and SVG patterns, raised on the front for a two-colour 3D print.
- Live 3D preview of the panel as it will be exported.
- Exports: STL, SVG, PNG, JSON, and KiCad Edge.Cuts as SVG or .kicad_pcb.

## Reference pages

${links}

## Project

- [Editor](${SITE_ORIGIN}/): the application itself.
- [Source code](${REPO_URL}): React, TypeScript, MIT license.
`;
}

function toPlainText(html: string): string {
  return html
    .replace(/<\/(h2|p|li|tr|table|ul|ol|div)>/g, "\n")
    .replace(/<li>/g, "- ")
    .replace(/<\/t[dh]>\s*<t[dh][^>]*>/g, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+/gm, "")
    .trim();
}

function llmsFullTxt(pages: readonly ContentPage[]): string {
  const sections = pages
    .map(
      (page) =>
        `# ${page.title}\nURL: ${absoluteUrl(page.path)}\n\n${toPlainText(page.lead)}\n\n${toPlainText(page.bodyHtml)}`,
    )
    .join("\n\n---\n\n");

  return `${llmsTxt(pages)}\n---\n\n${sections}\n`;
}

export function seoPagesPlugin(base: string): Plugin {
  return {
    name: "eurorack-seo-pages",
    apply: "build",
    generateBundle() {
      if (base !== "/") {
        return;
      }

      const pages = buildContentPages();
      const links = pageLinks(pages);

      for (const page of pages) {
        this.emitFile({
          type: "asset",
          fileName: `${page.path.replace(/^\/|\/$/g, "")}/index.html`,
          source: renderPage(page, links),
        });
      }

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap(pages) });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots() });
      this.emitFile({ type: "asset", fileName: "llms.txt", source: llmsTxt(pages) });
      this.emitFile({ type: "asset", fileName: "llms-full.txt", source: llmsFullTxt(pages) });
    },
  };
}
