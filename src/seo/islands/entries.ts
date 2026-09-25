/**
 * Entry points of the content pages, shared by the pages and by the build plugin
 * (`scripts/seo/plugin.ts`), which must not import anything that needs a bundler to load.
 *
 * Pages are rendered to HTML at build time. An island is the part of a page that also runs in the
 * browser: its entry hydrates the HTML the build rendered for it, on the pages that show it.
 */

export const SEO_RENDER_ENTRY = "src/seo/render.tsx";

/** Imports every stylesheet the pages use, so the client build gathers them into one file. */
export const SEO_STYLES_ENTRY = "src/seo/styles.ts";

export const ISLAND_ENTRIES = {
  "hp-calculator": "src/seo/islands/hpCalculator.client.tsx",
} as const;

export type IslandId = keyof typeof ISLAND_ENTRIES;

/** React prefixes the ids it generates with this, so an island's ids never meet the page's. */
export function islandIdentifierPrefix(id: IslandId): string {
  return `${id}-`;
}
