export interface TooltipRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TooltipSize {
  width: number;
  height: number;
}

export interface TooltipPlacement {
  left: number;
  top: number;
  side: "top" | "bottom";
}

/** Space between the tooltip and the element it describes. */
export const TOOLTIP_GAP_PX = 6;
/** Space kept between the tooltip and the edges of the window. */
export const TOOLTIP_MARGIN_PX = 8;

/**
 * Where a tooltip goes: centered above the element, or below it when there is no room above,
 * and slid sideways to stay inside the window.
 */
export function placeTooltip(
  trigger: TooltipRect,
  tooltip: TooltipSize,
  viewport: TooltipSize,
): TooltipPlacement {
  const above = trigger.top - TOOLTIP_GAP_PX - tooltip.height;
  const side = above >= TOOLTIP_MARGIN_PX ? "top" : "bottom";
  const top = side === "top" ? above : trigger.top + trigger.height + TOOLTIP_GAP_PX;

  const centered = trigger.left + trigger.width / 2 - tooltip.width / 2;
  const maxLeft = viewport.width - TOOLTIP_MARGIN_PX - tooltip.width;
  const left = Math.max(TOOLTIP_MARGIN_PX, Math.min(centered, maxLeft));

  return { left, top, side };
}
