import { describe, expect, it } from "vite-plus/test";

import { buildPanelSvg } from "@lib/exportSvg";
import {
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG,
  DEFAULT_MOUNTING_HOLE_CONFIG,
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  type PanelModel,
} from "@lib/panelTypes";
import { createPanelDimensions } from "@lib/units";

function createModel(): PanelModel {
  return {
    dimensions: createPanelDimensions(4),
    elements: [
      {
        id: "svg-1",
        type: PanelElementType.SvgArtwork,
        positionMm: { x: 10, y: 20 },
        rotationDeg: 15,
        properties: {
          svgText:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" /></svg>',
          viewBox: { minX: 0, minY: 0, width: 10, height: 10 },
          widthMm: 12,
          heightMm: 12,
          color: "#ff00aa",
          stlThicknessMm: 0.6,
          stlPenetrationMm: 0.2,
          label: "",
        },
      },
    ],
    options: { ...DEFAULT_PANEL_OPTIONS },
    mountingHoleConfig: { ...DEFAULT_MOUNTING_HOLE_CONFIG },
    elementHoleConfig: { ...DEFAULT_ELEMENT_MOUNTING_HOLE_CONFIG },
    clearance: { ...DEFAULT_CLEARANCE_CONFIG },
  };
}

describe("buildPanelSvg", () => {
  it("includes clipped decorative SVG artwork", () => {
    const svg = buildPanelSvg(createModel(), []);

    expect(svg).toContain(`clipPath id="panel-surface-clip"`);
    expect(svg).toContain(`clip-path="url(#panel-surface-clip)"`);
    expect(svg).toContain(`#ff00aa`);
    expect(svg).toContain(`rotate(15)`);
  });
});
