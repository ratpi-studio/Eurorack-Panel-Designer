import { describe, expect, it } from "vite-plus/test";

import { placeTooltip, TOOLTIP_GAP_PX, TOOLTIP_MARGIN_PX } from "../tooltipPlacement";

const viewport = { width: 1000, height: 800 };
const tooltip = { width: 100, height: 24 };

describe("tooltip placement", () => {
  it("centers the tooltip above the element", () => {
    expect(placeTooltip({ left: 400, top: 300, width: 40, height: 32 }, tooltip, viewport)).toEqual(
      {
        left: 370,
        top: 300 - TOOLTIP_GAP_PX - 24,
        side: "top",
      },
    );
  });

  it("goes below an element at the top of the window", () => {
    const placement = placeTooltip(
      { left: 400, top: 10, width: 40, height: 32 },
      tooltip,
      viewport,
    );

    expect(placement.side).toBe("bottom");
    expect(placement.top).toBe(10 + 32 + TOOLTIP_GAP_PX);
  });

  it("stays inside the window next to its edges", () => {
    expect(placeTooltip({ left: 0, top: 300, width: 20, height: 20 }, tooltip, viewport).left).toBe(
      TOOLTIP_MARGIN_PX,
    );
    expect(
      placeTooltip({ left: 990, top: 300, width: 10, height: 20 }, tooltip, viewport).left,
    ).toBe(viewport.width - TOOLTIP_MARGIN_PX - tooltip.width);
  });
});
