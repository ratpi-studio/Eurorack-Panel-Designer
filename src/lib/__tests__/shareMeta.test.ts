import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

import {
  injectShareMeta,
  normalizeShareCode,
  readShareCode,
  readShareSummary,
} from "../../../api/_share";

// The real page, so a change to its head that the injection would miss fails here.
const EDITOR_PAGE = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../index.html"),
  "utf8",
);

function count(html: string, pattern: RegExp): number {
  return [...html.matchAll(new RegExp(pattern, "g"))].length;
}

function metaContent(html: string, attribute: string): string | undefined {
  const tag = new RegExp(`<meta\\s+(?:property|name)="${attribute}"\\s+content="([^"]*)"`).exec(
    html,
  );
  return tag?.[1];
}

describe("shared design page metadata", () => {
  const page = injectShareMeta(EDITOR_PAGE, "7K3Q9XMB", { name: "VCF", size: "12 HP" });

  it("replaces the editor's title, description, canonical and link preview with the design's", () => {
    expect(count(page, /<title>/)).toBe(1);
    expect(page).toContain("<title>VCF — 12 HP | Eurorack Panel Designer</title>");
    expect(count(page, /name="description"/)).toBe(1);
    expect(count(page, /rel="canonical"/)).toBe(1);
    expect(page).toContain(
      '<link rel="canonical" href="https://www.eurorackpanel.com/p/7K3Q9XMB" />',
    );
    expect(metaContent(page, "og:title")).toBe("VCF — 12 HP");
    expect(metaContent(page, "og:url")).toBe("https://www.eurorackpanel.com/p/7K3Q9XMB");
    expect(metaContent(page, "og:image")).toBe("https://www.eurorackpanel.com/p/7K3Q9XMB/card.png");
    expect(metaContent(page, "twitter:image")).toBe(
      "https://www.eurorackpanel.com/p/7K3Q9XMB/card.png",
    );
    for (const tag of ["og:title", "og:image", "og:image:alt", "twitter:title", "twitter:image"]) {
      expect(count(page, new RegExp(`"${tag}"`))).toBe(1);
    }
    expect(metaContent(page, "robots")).toBe("noindex");
  });

  it("keeps the rest of the editor's page as it was", () => {
    const withoutHead = (html: string) => html.slice(html.indexOf("</head>"));
    expect(withoutHead(page)).toBe(withoutHead(EDITOR_PAGE));
    expect(page).toContain('<script type="application/ld+json">');
    expect(count(page, /<\/head>/)).toBe(1);
  });

  it("escapes the name, and takes it literally", () => {
    const hostile = injectShareMeta(EDITOR_PAGE, "7K3Q9XMB", {
      name: '<script>alert("x")</script> $& $1',
      size: "",
    });

    expect(hostile).not.toContain('<script>alert("x")</script>');
    expect(hostile).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; $&amp; $1");
    expect(count(hostile, /<\/head>/)).toBe(1);
  });

  it("keeps the site's card for a code that names no design", () => {
    const unknown = injectShareMeta(EDITOR_PAGE, "7K3Q9XMB", null);

    expect(unknown).toContain("<title>Shared panel | Eurorack Panel Designer</title>");
    expect(metaContent(unknown, "og:image")).toBe("https://www.eurorackpanel.com/images/og.png");
    expect(metaContent(unknown, "robots")).toBe("noindex");
  });
});

describe("share codes", () => {
  it("reads codes the way people type them", () => {
    expect(normalizeShareCode("7K3Q9XMB")).toBe("7K3Q9XMB");
    expect(normalizeShareCode("7k3q-9xmb")).toBe("7K3Q9XMB");
    expect(normalizeShareCode("o123 abcd")).toBe("0123ABCD");
    expect(normalizeShareCode("I23L ABCD")).toBe("1231ABCD");
    expect(normalizeShareCode("7K3Q9XM")).toBeNull();
    expect(normalizeShareCode("U23QABCD")).toBeNull();
  });

  it("finds the code in the rewritten query or in the original path", () => {
    expect(readShareCode(new URL("https://x.test/api/share-page?code=7K3Q9XMB"))).toBe("7K3Q9XMB");
    expect(readShareCode(new URL("https://x.test/p/7K3Q9XMB"))).toBe("7K3Q9XMB");
    expect(readShareCode(new URL("https://x.test/p/7K3Q9XMB/card.png"))).toBe("7K3Q9XMB");
    expect(readShareCode(new URL("https://x.test/api/share-page"))).toBeNull();
  });

  it("reads the name and size of a stored share", () => {
    expect(readShareSummary({ name: "VCF", size: "12 HP" })).toEqual({
      name: "VCF",
      size: "12 HP",
    });
    expect(readShareSummary({ name: "VCF" })).toEqual({ name: "VCF", size: "" });
    expect(readShareSummary({ name: "" })).toBeNull();
    expect(readShareSummary("VCF")).toBeNull();
  });
});
