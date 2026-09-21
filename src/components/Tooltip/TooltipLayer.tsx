import React from "react";
import { createPortal } from "react-dom";

import { placeTooltip } from "@lib/tooltipPlacement";

import * as styles from "./Tooltip.css";

/** Gives an element a tooltip: the value of the attribute is the text shown. */
export const TOOLTIP_ATTRIBUTE = "data-tooltip";

/**
 * Props of an element that only shows an icon: its accessible name and its tooltip say the same
 * thing, so screen readers read the name and the tooltip itself stays silent.
 */
export function iconLabelProps(label: string): { "aria-label": string; "data-tooltip": string } {
  return { "aria-label": label, "data-tooltip": label };
}

const SHOW_DELAY_MS = 400;
/** Moving on to the next element within this time shows its tooltip at once. */
const WARM_WINDOW_MS = 500;

interface ActiveTooltip {
  trigger: HTMLElement;
  text: string;
}

function findTrigger(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(`[${TOOLTIP_ATTRIBUTE}]`) : null;
}

/**
 * Shows the tooltip of the element under the pointer, or focused with the keyboard. Elements ask
 * for one with `data-tooltip`; this single layer serves the whole app, so tooltips never change
 * the layout of what they describe and show above scrolling panels. Touch screens get none, as a
 * tap acts at once.
 */
export function TooltipLayer() {
  const [active, setActive] = React.useState<ActiveTooltip | null>(null);
  const bubbleRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let current: HTMLElement | null = null;
    let showTimer: number | undefined;
    let isShown = false;
    let hiddenAt = Number.NEGATIVE_INFINITY;

    const show = (trigger: HTMLElement, immediately: boolean) => {
      const text = trigger.getAttribute(TOOLTIP_ATTRIBUTE);
      window.clearTimeout(showTimer);
      current = trigger;
      if (!text) {
        return;
      }
      const reveal = () => {
        if (current !== trigger || !trigger.isConnected) {
          return;
        }
        isShown = true;
        setActive({ trigger, text });
      };
      if (immediately || performance.now() - hiddenAt < WARM_WINDOW_MS) {
        reveal();
      } else {
        showTimer = window.setTimeout(reveal, SHOW_DELAY_MS);
      }
    };

    const hide = () => {
      window.clearTimeout(showTimer);
      if (isShown) {
        hiddenAt = performance.now();
      }
      isShown = false;
      current = null;
      setActive(null);
    };

    const handlePointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      const trigger = findTrigger(event.target);
      if (trigger && trigger !== current) {
        show(trigger, false);
      }
    };

    const handlePointerOut = (event: PointerEvent) => {
      const next = event.relatedTarget;
      if (current && !(next instanceof Node && current.contains(next))) {
        hide();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const trigger = findTrigger(event.target);
      if (trigger && event.target instanceof Element && event.target.matches(":focus-visible")) {
        show(trigger, true);
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (current && event.target instanceof Node && current.contains(event.target)) {
        hide();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" && event.key !== "Shift") {
        hide();
      }
    };

    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("blur", hide);
    return () => {
      window.clearTimeout(showTimer);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("blur", hide);
    };
  }, []);

  // The bubble is measured once rendered, then moved next to its element and revealed.
  React.useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!active || !bubble) {
      return;
    }
    const placement = placeTooltip(
      active.trigger.getBoundingClientRect(),
      { width: bubble.offsetWidth, height: bubble.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
    );
    bubble.style.left = `${placement.left}px`;
    bubble.style.top = `${placement.top}px`;
    bubble.dataset.side = placement.side;
    bubble.style.visibility = "visible";
  }, [active]);

  if (!active) {
    return null;
  }

  return createPortal(
    <div ref={bubbleRef} className={styles.bubble} aria-hidden="true">
      {active.text}
    </div>,
    document.body,
  );
}
