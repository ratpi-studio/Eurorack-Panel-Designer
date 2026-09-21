/**
 * The shell every static content page is rendered into. These pages carry no JavaScript on
 * purpose: search engines render JS late, and no major AI crawler runs it at all, so anything
 * that has to be read by a machine is plain HTML served as-is.
 */

import {
  absoluteUrl,
  buildDate,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  REPO_URL,
  SITE_NAME,
  SITE_ORIGIN,
} from "./site";

export interface PageLink {
  /** Path with a leading and a trailing slash, for example "/eurorack-hp-to-mm/". */
  path: string;
  /** Short label used in the footer and in the sibling-page list. */
  label: string;
}

export interface ContentPage extends PageLink {
  title: string;
  description: string;
  /** First sentence of the page: the answer, before any prose. */
  lead: string;
  bodyHtml: string;
  /** JSON-LD objects appended to the page, beside the breadcrumb every page gets. */
  structuredData?: object[];
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? character);
}

/** A number of millimeters as the panels are cut: two decimals, so 30.00 reads as a measurement. */
export function mm(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

const STYLES = `
:root{color-scheme:dark;--bg:#020617;--panel:#0b1220;--line:#1e293b;--text:#e2e8f0;--muted:#94a3b8;--link:#38bdf8}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--link)}
header,main,footer{max-width:820px;margin:0 auto;padding:0 20px}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:24px;padding-bottom:24px;flex-wrap:wrap}
header a.brand{font-weight:700;color:var(--text);text-decoration:none;letter-spacing:.01em}
.cta{display:inline-block;background:var(--link);color:#02121f;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:8px}
h1{font-size:1.9rem;line-height:1.2;margin:8px 0 12px}
h2{font-size:1.25rem;margin:36px 0 10px}
.lead{font-size:1.1rem;color:#f1f5f9;background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--link);border-radius:8px;padding:14px 16px;margin:0 0 24px}
table{width:100%;border-collapse:collapse;margin:16px 0;font-variant-numeric:tabular-nums}
caption{text-align:left;color:var(--muted);font-size:.9rem;padding-bottom:8px}
th,td{border-bottom:1px solid var(--line);padding:7px 10px;text-align:left}
th{color:var(--muted);font-weight:600;font-size:.85rem;text-transform:uppercase;letter-spacing:.04em}
td:not(:first-child),th:not(:first-child){text-align:right}
.wide{max-height:560px;overflow:auto;border:1px solid var(--line);border-radius:8px}
.wide table{margin:0}
.wide th{position:sticky;top:0;background:var(--panel)}
code{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:.92em}
ul,ol{padding-left:22px}
li{margin:6px 0}
footer{border-top:1px solid var(--line);margin-top:56px;padding-top:24px;padding-bottom:56px;color:var(--muted);font-size:.92rem}
footer ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 16px}
.sources{color:var(--muted);font-size:.92rem}
@media(max-width:600px){h1{font-size:1.55rem}th,td{padding:6px 8px}}
`;

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

function jsonLdScript(data: object): string {
  // U+2028/U+2029 are valid JSON but break a script body; "</" would close the tag early.
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `<script type="application/ld+json">${json}</script>`;
}

export function renderPage(page: ContentPage, siblings: readonly PageLink[]): string {
  const url = absoluteUrl(page.path);
  const others = siblings.filter((sibling) => sibling.path !== page.path);
  const structuredData = [breadcrumb(page), ...(page.structuredData ?? [])];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#020617">
<link rel="icon" type="image/png" href="/images/favicon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
<meta property="og:title" content="${escapeHtml(page.title)}">
<meta property="og:description" content="${escapeHtml(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${absoluteUrl(OG_IMAGE_PATH)}">
<meta property="og:image:width" content="${OG_IMAGE_WIDTH}">
<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(page.title)}">
<meta name="twitter:description" content="${escapeHtml(page.description)}">
<meta name="twitter:image" content="${absoluteUrl(OG_IMAGE_PATH)}">
<style>${STYLES}</style>
${structuredData.map(jsonLdScript).join("\n")}
</head>
<body>
<header>
<a class="brand" href="/">${escapeHtml(SITE_NAME)}</a>
<a class="cta" href="/">Open the editor</a>
</header>
<main>
<h1>${escapeHtml(page.title)}</h1>
<p class="lead">${page.lead}</p>
${page.bodyHtml}
<h2>Draw it instead of measuring it</h2>
<p>${escapeHtml(SITE_NAME)} applies every number on this page automatically: pick a width in HP or
millimeters, drop the parts, and export an STL, an SVG, a PNG or a KiCad Edge.Cuts outline. It runs
in the browser, it is free, and it needs no account.</p>
<p><a class="cta" href="/">Open the editor</a></p>
</main>
<footer>
<ul>${others.map((other) => `<li><a href="${other.path}">${escapeHtml(other.label)}</a></li>`).join("")}</ul>
<p>${escapeHtml(SITE_NAME)} is open source under the MIT license.
<a href="${REPO_URL}">Source on GitHub</a>. Page updated ${buildDate()}.</p>
</footer>
</body>
</html>
`;
}
