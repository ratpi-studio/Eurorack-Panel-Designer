import { describe, expect, it } from "vite-plus/test";

import { buildPanelSurfacePolygon } from "@lib/panelSurface";
import { PanelElementType, type PanelElement } from "@lib/panelTypes";
import { buildSvgArtworkMaskMarkup, isBlackSvgPaint, sanitizeSvgArtwork } from "@lib/svgArtwork";

describe("sanitizeSvgArtwork", () => {
  it("removes executable and external SVG content", () => {
    const sanitized = sanitizeSvgArtwork(`
      <svg viewBox="0 0 10 10" onload="alert(1)">
        <script>alert(1)</script>
        <foreignObject><div>bad</div></foreignObject>
        <a href="https://example.com"><path d="M0 0H10V10Z" /></a>
        <path onclick="alert(1)" d="M0 0H10V10Z" fill="black" />
      </svg>
    `);

    expect(sanitized.viewBox).toEqual({ minX: 0, minY: 0, width: 10, height: 10 });
    expect(sanitized.svgText).not.toMatch(/script|foreignObject|onload|onclick|https:/i);
  });

  it("uses only black paints as the decorative mask", () => {
    const masked = buildSvgArtworkMaskMarkup(
      `<svg viewBox="0 0 10 10">
        <rect width="10" height="10" fill="white" />
        <path fill="black" stroke="red" d="M0 0H10V10Z" />
        <circle cx="5" cy="5" r="2" />
      </svg>`,
      "#abcdef",
    );

    expect(masked).toContain("#abcdef");
    expect(masked).not.toContain(`fill="white"`);
    expect(masked).not.toContain(`stroke="red"`);
    expect(masked).toContain(`fill="none"`);
  });

  it("recognizes black SVG paint values", () => {
    expect(isBlackSvgPaint("black")).toBe(true);
    expect(isBlackSvgPaint("#000000")).toBe(true);
    expect(isBlackSvgPaint("rgb(0 0 0 / 1)")).toBe(true);
    expect(isBlackSvgPaint("white")).toBe(false);
    expect(isBlackSvgPaint("#111111")).toBe(false);
  });

  it("preserves local url(#id) paint references so patterns still render", () => {
    const masked = buildSvgArtworkMaskMarkup(
      `<svg viewBox="0 0 10 10">
        <defs>
          <pattern id="tile" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill="#fff"/>
            <path stroke="#000" d="M0 0L2 2"/>
          </pattern>
        </defs>
        <rect width="10" height="10" fill="url(#tile)"/>
      </svg>`,
      "#abcdef",
    );

    expect(masked).toContain("url(#tile)");
    expect(masked).toContain("#abcdef");
    expect(masked).not.toMatch(/fill="#fff"/i);
  });
});

describe("buildPanelSurfacePolygon", () => {
  it("contains panel outline, mounting holes, and cutout rings", () => {
    const element: PanelElement = {
      id: "jack-1",
      type: PanelElementType.Jack,
      positionMm: { x: 10, y: 10 },
      properties: { diameterMm: 6 },
    };

    const polygon = buildPanelSurfacePolygon({
      panelSizeMm: { x: 20, y: 30 },
      mountingHoles: [
        {
          center: { x: 5, y: 5 },
          diameterMm: 3,
          shape: "circle",
        },
      ],
      elements: [element],
    });

    expect(polygon).toHaveLength(3);
    expect(polygon[0]).toEqual([
      [0, 0],
      [20, 0],
      [20, 30],
      [0, 30],
    ]);
    expect(polygon[1].length).toBeGreaterThan(8);
    expect(polygon[2].length).toBeGreaterThan(8);
  });
});
