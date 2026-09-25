import { darkColors } from "@salnika/uipirate";

import { UI_FONTS } from "./fonts";
import type { IslandId } from "./islands/entries";
import { absoluteUrl, OG_IMAGE_HEIGHT, OG_IMAGE_PATH, OG_IMAGE_WIDTH, SITE_NAME } from "./site";
import { jsonLdScript, pageStructuredData } from "./structuredData";
import type { ContentPage } from "./types";

interface IslandAssets {
  script: string;
  /** Chunks the script imports, preloaded so they do not load one after the other. */
  preloads: readonly string[];
}

/**
 * What the client build wrote for the pages: one stylesheet, and the scripts of the islands. A page
 * without an island loads no script at all.
 */
export interface PageAssets {
  stylesheets: readonly string[];
  islands: Partial<Record<IslandId, IslandAssets>>;
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? character);
}

/**
 * What the page needs before its stylesheet arrives, inline like the boot splash of index.html:
 * the dark ground, so no white shows at first or between two pages, and the cross-fade the
 * browser plays between two content pages when it can, under an app bar that stays put.
 */
const CRITICAL_STYLES = [
  `html{background:${darkColors.bg};color-scheme:dark}`,
  "@view-transition{navigation:auto}",
  '[role="banner"]{view-transition-name:app-bar}',
  "::view-transition-old(root){animation:150ms ease-in both page-out}",
  "::view-transition-new(root){animation:220ms ease-out both page-in}",
  "@keyframes page-out{to{opacity:0}}",
  "@keyframes page-in{from{opacity:0;transform:translateY(4px)}}",
  "@media (prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}",
].join("");

/** A whole page: the head every page shares, with its own metadata and JSON-LD, around `body`. */
export function renderDocument(page: ContentPage, body: string, assets: PageAssets): string {
  const url = absoluteUrl(page.path);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const image = absoluteUrl(OG_IMAGE_PATH);
  const island = page.island ? assets.islands[page.island] : undefined;

  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta name="theme-color" content="${darkColors.bg}">`,
    '<meta name="color-scheme" content="dark">',
    `<style>${CRITICAL_STYLES}</style>`,
    '<link rel="icon" type="image/png" href="/images/favicon.png">',
    '<meta property="og:type" content="article">',
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}">`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
    ...UI_FONTS.map(
      (font) => `<link rel="preload" href="${font.url}" as="font" type="font/woff2" crossorigin>`,
    ),
    ...assets.stylesheets.map((href) => `<link rel="stylesheet" href="${href}">`),
    ...(island?.preloads ?? []).map((href) => `<link rel="modulepreload" href="${href}">`),
    ...(island ? [`<script type="module" src="${island.script}"></script>`] : []),
    ...pageStructuredData(page).map(jsonLdScript),
  ];

  return `<!doctype html>
<html lang="en">
<head>
${head.join("\n")}
</head>
<body>
${body}
</body>
</html>
`;
}
