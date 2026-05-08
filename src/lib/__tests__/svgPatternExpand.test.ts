// @vitest-environment jsdom

import { describe, expect, it } from "vite-plus/test";

import { expandSvgPatterns } from "@lib/svgPatternExpand";

describe("expandSvgPatterns", () => {
  it("inlines a userSpaceOnUse pattern across the full consumer rect", () => {
    const expanded = expandSvgPatterns(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <pattern id="tile" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M0 0L25 25" stroke="#000"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tile)"/>
      </svg>`,
    );

    const tileMatches = expanded.match(/translate\(/g);
    expect(tileMatches).not.toBeNull();
    expect((tileMatches ?? []).length).toBe(16);
    expect(expanded).not.toMatch(/<pattern\b/i);
    expect(expanded).not.toMatch(/url\(#tile\)/i);
  });

  it("returns the input unchanged when no pattern reference is present", () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="black"/></svg>`;
    expect(expandSvgPatterns(input)).toBe(input);
  });

  it("expands patterns referenced via the style attribute", () => {
    const expanded = expandSvgPatterns(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#000"/>
          </pattern>
        </defs>
        <rect width="50" height="50" style="fill: url(#grid)"/>
      </svg>`,
    );

    const tileMatches = expanded.match(/translate\(/g);
    expect((tileMatches ?? []).length).toBe(25);
  });

  it("supports objectBoundingBox patterns", () => {
    const expanded = expandSvgPatterns(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <pattern id="tile" width="0.25" height="0.25">
            <path d="M0 0L1 1" stroke="#000"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#tile)"/>
      </svg>`,
    );

    const tileMatches = expanded.match(/translate\(/g);
    expect((tileMatches ?? []).length).toBe(16);
  });
});
