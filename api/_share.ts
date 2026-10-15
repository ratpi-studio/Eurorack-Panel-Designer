// Helpers of the share endpoints (share.ts, share-page.ts) and of their tests. The leading
// underscore keeps Vercel from publishing this file as a function of its own. Like order.ts, it
// imports nothing from src/: functions are bundled on their own, without the app's path aliases.

/** Where the site is published: the links and cards of a shared design point there. */
export const SITE_ORIGIN = "https://www.eurorackpanel.com";

// Crockford base32 has no I, L, O or U, so codes survive being retyped from a screen.
export const SHARE_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const SHARE_CODE_LENGTH = 8;

/** Reads a code the way people type it: any case, dashes or not, O for 0, I and L for 1. */
export function normalizeShareCode(input: string): string | null {
  const code = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (
    code.length !== SHARE_CODE_LENGTH ||
    [...code].some((char) => !SHARE_CODE_ALPHABET.includes(char))
  ) {
    return null;
  }
  return code;
}

/**
 * The code of a request, from its `code` parameter (vercel.json rewrites /p/<code> to it) or, should
 * the function see the address before the rewrite, from the /p/<code> path itself.
 */
export function readShareCode(url: URL): string | null {
  const fromPath = /^\/p\/([^/]+)/.exec(url.pathname)?.[1];
  return normalizeShareCode(url.searchParams.get("code") ?? fromPath ?? "");
}

export function shareDesignPath(code: string): string {
  return `shares/${code}/design.json`;
}

export function shareCardPath(code: string): string {
  return `shares/${code}/card.png`;
}

export function sharePageUrl(code: string): string {
  return `${SITE_ORIGIN}/p/${code}`;
}

export function shareCardUrl(code: string): string {
  return `${SITE_ORIGIN}/p/${code}/card.png`;
}

/** What a stored design says about itself, for its page title and its link preview. */
export interface ShareSummary {
  name: string;
  /** The panel's size as people name it, e.g. "12 HP", or "" when the design did not say. */
  size: string;
}

/** The name and size of a stored share, or null when the record does not look like one. */
export function readShareSummary(record: unknown): ShareSummary | null {
  if (typeof record !== "object" || record === null) {
    return null;
  }
  const { name, size } = record as { name?: unknown; size?: unknown };
  if (typeof name !== "string" || !name) {
    return null;
  }
  return { name, size: typeof size === "string" ? size : "" };
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
 * The tags index.html carries for the editor itself, which a shared design's page replaces with its
 * own. Their attributes may span several lines, as the formatter wraps them.
 */
const REPLACED_TAGS = [
  /<title>[\s\S]*?<\/title>\s*/gi,
  /<meta\b[^>]*\bname="(?:description|robots)"[^>]*>\s*/gi,
  /<link\b[^>]*\brel="canonical"[^>]*>\s*/gi,
  /<meta\b[^>]*\bproperty="og:[^"]*"[^>]*>\s*/gi,
  /<meta\b[^>]*\bname="twitter:[^"]*"[^>]*>\s*/gi,
];

const SITE_CARD_URL = `${SITE_ORIGIN}/images/og.png`;

/**
 * The editor's index.html with the metadata of a shared design in place of its own: the design's
 * name as the title, its card as the link preview, and `noindex`, as the page is there to be
 * followed from a link rather than found in a search. An unknown code keeps the site's card.
 */
export function injectShareMeta(html: string, code: string, summary: ShareSummary | null): string {
  const heading = summary ? [summary.name, summary.size].filter(Boolean).join(" — ") : "";
  const title = escapeHtml(heading || "Shared panel");
  const description = escapeHtml(
    summary
      ? `${summary.name}, a front panel designed with Eurorack Panel Designer. Open it in the editor to change it, or export it as STL, SVG or KiCad Edge.Cuts.`
      : "A front panel shared from Eurorack Panel Designer.",
  );
  const url = sharePageUrl(code);
  const image = summary ? shareCardUrl(code) : SITE_CARD_URL;
  const tags = [
    `<title>${title} | Eurorack Panel Designer</title>`,
    `<meta name="description" content="${description}" />`,
    '<meta name="robots" content="noindex" />',
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Eurorack Panel Designer" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${title}, drawn by Eurorack Panel Designer" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];
  const stripped = REPLACED_TAGS.reduce((result, pattern) => result.replace(pattern, ""), html);
  // A function, not a string: a name holding "$&" would otherwise be read as a replacement pattern.
  return stripped.replace(/<\/head>/i, () => `    ${tags.join("\n    ")}\n  </head>`);
}
