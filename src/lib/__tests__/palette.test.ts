import { describe, expect, it } from "vite-plus/test";

import {
  derivePaletteFromModel,
  deriveExportPaletteFromModel,
  elementFillAlpha,
  elementTypeColors,
  withAlpha,
} from "../canvas/palette";
import { PanelElementType } from "../panelTypes";

const colors = { panelColor: "#0f2742", designColor: "#ffffff" };

describe("withAlpha", () => {
  it("converts hex colors to rgba", () => {
    expect(withAlpha("#38bdf8", 0.3)).toBe("rgba(56, 189, 248, 0.3)");
    expect(withAlpha("#FFF", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("clamps the alpha and leaves other color formats untouched", () => {
    expect(withAlpha("#000000", 2)).toBe("rgba(0, 0, 0, 1)");
    expect(withAlpha("rgb(1, 2, 3)", 0.5)).toBe("rgb(1, 2, 3)");
  });
});

describe("element styles", () => {
  it("tints cut-outs with their palette color in the editor", () => {
    const { elementStyles } = derivePaletteFromModel(colors);

    expect(elementStyles[PanelElementType.Jack]).toEqual({
      fill: withAlpha(elementTypeColors[PanelElementType.Jack], elementFillAlpha),
      stroke: elementTypeColors[PanelElementType.Jack],
    });
    expect(elementStyles[PanelElementType.Triangle].stroke).toBe(
      elementTypeColors[PanelElementType.Triangle],
    );
  });

  it("keeps printed text and artwork in the design color in the editor", () => {
    const { elementStyles } = derivePaletteFromModel(colors);
    const designStyle = { fill: colors.designColor, stroke: colors.panelColor };

    expect(elementStyles[PanelElementType.Label]).toEqual(designStyle);
    expect(elementStyles[PanelElementType.SvgArtwork]).toEqual(designStyle);
  });

  it("draws every element in the design color for exports", () => {
    const { elementStyles, palette } = deriveExportPaletteFromModel(colors);

    expect(palette.panelFill).toBe(colors.panelColor);
    Object.values(PanelElementType).forEach((type) => {
      expect(elementStyles[type]).toEqual({ fill: colors.designColor, stroke: colors.panelColor });
    });
  });
});
