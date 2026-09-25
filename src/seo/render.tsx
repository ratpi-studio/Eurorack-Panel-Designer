/**
 * Server entry of the content pages, which `scripts/seo/plugin.ts` builds and runs, for the
 * production build and for the dev server alike. It renders every page to plain HTML, since
 * search engines render JavaScript late and no major AI crawler runs it at all; only islands run
 * in the browser.
 */

import { renderToStaticMarkup, renderToString } from "react-dom/server";

import packageJson from "../../package.json";
import { IslandHtmlContext } from "./components/Island";
import { SeoLayout } from "./components/SeoLayout";
import { renderDocument, type PageAssets } from "./document";
import { islandIdentifierPrefix, ISLAND_ENTRIES, type IslandId } from "./islands/entries";
import { ISLANDS } from "./islands/islands";
import { CONTENT_PAGES } from "./pages";
import { buildDate } from "./site";
import { siteFiles, toPlainText, type PageText, type SiteFile } from "./siteFiles";
import type { ContentPage, PageLink } from "./types";

export type { PageAssets } from "./document";
export type { SiteFile } from "./siteFiles";

const LINKS: readonly PageLink[] = CONTENT_PAGES.map(({ path, label, group }) => ({
  path,
  label,
  group,
}));

function pageFileName(page: ContentPage): string {
  return `${page.path.replace(/^\/|\/$/g, "")}/index.html`;
}

/** Each island on its own, with the root and the id prefix its client entry hydrates with. */
function renderIslands(): Record<IslandId, string> {
  const ids = Object.keys(ISLAND_ENTRIES) as IslandId[];
  return Object.fromEntries(
    ids.map((id) => [
      id,
      renderToString(ISLANDS[id](), { identifierPrefix: islandIdentifierPrefix(id) }),
    ]),
  ) as Record<IslandId, string>;
}

function renderPage(
  page: ContentPage,
  assets: PageAssets,
  islands: Record<IslandId, string>,
  updated: string,
): string {
  const body = renderToStaticMarkup(
    <IslandHtmlContext.Provider value={islands}>
      <SeoLayout page={page} pages={LINKS} version={packageJson.version} updated={updated} />
    </IslandHtmlContext.Provider>,
  );
  return renderDocument(page, body, assets);
}

/** The page as text, islands left out: what llms-full.txt quotes. */
function pageText(page: ContentPage): PageText {
  const Body = page.Body;
  return {
    page,
    lead: toPlainText(renderToStaticMarkup(<p>{page.lead}</p>)),
    body: toPlainText(renderToStaticMarkup(<Body />)),
  };
}

/** Every file the content pages publish: the pages, the sitemap, robots.txt and llms.txt. */
export function renderSite(assets: PageAssets): SiteFile[] {
  const islands = renderIslands();
  const updated = buildDate();
  return [
    ...CONTENT_PAGES.map((page) => ({
      fileName: pageFileName(page),
      source: renderPage(page, assets, islands, updated),
    })),
    ...siteFiles(CONTENT_PAGES, CONTENT_PAGES.map(pageText)),
  ];
}
