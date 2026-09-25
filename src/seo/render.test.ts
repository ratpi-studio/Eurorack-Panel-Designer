import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

import { CONTENT_PAGES } from "./pages";
import { PAGE_PATHS, SITE_FILE_NAMES } from "./paths";
import { renderSite, type PageAssets } from "./render";
import { SITE_ORIGIN } from "./site";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public");

const ASSETS: PageAssets = {
  stylesheets: ["/assets/seo/style-test.css"],
  islands: {
    "hp-calculator": {
      script: "/assets/seo/hp-calculator-test.js",
      preloads: ["/assets/seo/shared-test.js"],
    },
  },
};

const files = renderSite(ASSETS);
const pageFiles = CONTENT_PAGES.map((page) => {
  const file = files.find((candidate) => candidate.fileName === `${page.path.slice(1)}index.html`);
  if (!file) {
    throw new Error(`No file rendered for ${page.path}`);
  }
  return { page, html: file.source };
});

function attribute(html: string, pattern: RegExp): string | undefined {
  return pattern.exec(html)?.[1];
}

describe("content pages", () => {
  it("renders every page, with the sitemap, robots.txt and llms.txt", () => {
    expect(files.map((file) => file.fileName).sort()).toEqual(
      [
        ...CONTENT_PAGES.map((page) => `${page.path.slice(1)}index.html`),
        "llms-full.txt",
        "llms.txt",
        "robots.txt",
        "sitemap.xml",
      ].sort(),
    );
  });

  it.each(pageFiles)(
    "gives $page.path one heading, a short title and a canonical URL",
    ({ page, html }) => {
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
      expect(page.title.length).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeLessThanOrEqual(160);
      expect(attribute(html, /<link rel="canonical" href="([^"]+)">/)).toBe(
        `${SITE_ORIGIN}${page.path}`,
      );
    },
  );

  it.each(pageFiles)("only links $page.path to pages and files that exist", ({ html }) => {
    const known = new Set(["/", ...CONTENT_PAGES.map((page) => page.path)]);
    const links = [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
    const broken = links.filter(
      (href) =>
        !known.has(href) && !href.startsWith("/assets/") && !existsSync(path.join(publicDir, href)),
    );
    expect(broken).toEqual([]);
  });

  it.each(pageFiles)("writes valid JSON-LD on $page.path", ({ page, html }) => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)];
    const types = blocks.map((block) => (JSON.parse(block[1]) as { "@type": string })["@type"]);
    expect(types[0]).toBe("BreadcrumbList");
    expect(types.includes("FAQPage")).toBe(Boolean(page.faq?.length));
  });

  it.each(pageFiles)("shows the FAQ of $page.path that its JSON-LD describes", ({ page, html }) => {
    for (const entry of page.faq ?? []) {
      expect(html).toContain(`>${entry.question.replace(/'/g, "&#x27;")}<`);
    }
  });

  it.each(pageFiles)(
    "loads no script on $page.path but its island's, and its styles from a stylesheet",
    ({ page, html }) => {
      const scripts = [...html.matchAll(/<script(?: [^>]*)?>/g)]
        .map((match) => match[0])
        .filter((tag) => !tag.includes('type="application/ld+json"'));
      const island = page.island ? ASSETS.islands[page.island] : undefined;
      expect(scripts).toEqual(island ? [`<script type="module" src="${island.script}">`] : []);
      expect(html.includes(`<div id="${page.island}">`)).toBe(Boolean(island));
      expect(html.includes('<link rel="modulepreload" href="/assets/seo/shared-test.js">')).toBe(
        Boolean(island),
      );
      expect(html).toContain('<link rel="stylesheet" href="/assets/seo/style-test.css">');
    },
  );

  it.each(pageFiles)("paints $page.path on its dark ground before the stylesheet", ({ html }) => {
    const head = html.slice(0, html.indexOf("</head>"));
    const criticalStyles = head.indexOf("<style>html{background:#11110F;color-scheme:dark}");
    expect(head).toContain('<meta name="color-scheme" content="dark">');
    expect(criticalStyles).toBeGreaterThan(-1);
    expect(criticalStyles).toBeLessThan(head.indexOf('<link rel="stylesheet"'));
    expect(head).toContain("@view-transition{navigation:auto}");
  });

  it("lists every page in the sitemap and llms.txt", () => {
    const sitemap = files.find((file) => file.fileName === "sitemap.xml")?.source ?? "";
    const llms = files.find((file) => file.fileName === "llms.txt")?.source ?? "";
    for (const page of CONTENT_PAGES) {
      expect(sitemap).toContain(`<loc>${SITE_ORIGIN}${page.path}</loc>`);
      expect(llms).toContain(`(${SITE_ORIGIN}${page.path})`);
    }
  });

  it("quotes the pages as text in llms-full.txt, without the calculator's controls", () => {
    const full = files.find((file) => file.fileName === "llms-full.txt")?.source ?? "";
    expect(full).toContain("\n12 HP | 60.96 | 60.60 | DOEPFER\n");
    expect(full).toContain("How do I convert millimeters to HP?");
    expect(full).not.toContain("WIDTH IN HP");
  });

  it("publishes exactly the paths the dev server serves", () => {
    expect(CONTENT_PAGES.map((page) => page.path).sort()).toEqual(Object.values(PAGE_PATHS).sort());
    const siteFileNames = files
      .map((file) => file.fileName)
      .filter((fileName) => !fileName.endsWith("/index.html"));
    expect(siteFileNames.sort()).toEqual([...SITE_FILE_NAMES].sort());
  });
});
