/**
 * Facts about the published site, shared by the static content pages, the sitemap, robots.txt and
 * llms.txt. Production serves on www: the apex redirects to it with a 308, set on the Vercel
 * project domains, so every canonical URL and every sitemap entry uses the www host.
 */

export const SITE_ORIGIN = "https://www.eurorackpanel.com";
export const SITE_NAME = "Eurorack Panel Designer";
export const SITE_TAGLINE = "Free online Eurorack front panel editor";

export const SITE_DESCRIPTION =
  "Design Eurorack front panels in the browser: real part holes from their datasheets, HP to mm " +
  "conversion, live 3D preview, and STL, SVG, PNG and KiCad Edge.Cuts exports. Free, open source, " +
  "no account.";

export const REPO_URL = "https://github.com/ratpi-studio/Eurorack-Panel-Designer";
export const OG_IMAGE_PATH = "/images/og.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Crawlers named in robots.txt. Allowed by default; naming them keeps a later edit deliberate. */
export const NAMED_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "Google-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
] as const;

export function absoluteUrl(pathname: string): string {
  return `${SITE_ORIGIN}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/** The day the deployment was built: the honest "last updated" for generated pages. */
export function buildDate(): string {
  return new Date().toISOString().slice(0, 10);
}
