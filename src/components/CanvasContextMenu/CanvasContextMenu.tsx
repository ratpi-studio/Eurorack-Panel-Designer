import type { LucideIcon } from "lucide-react";
import React from "react";

import * as styles from "./CanvasContextMenu.css";

export interface ContextMenuItem {
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

interface CanvasContextMenuProps {
  /** Where the menu opens, in viewport pixels. */
  x: number;
  y: number;
  /** Groups of items, drawn with a line between them. */
  groups: ContextMenuItem[][];
  onClose: () => void;
}

// Keeps the menu off the edges of the window.
const VIEWPORT_MARGIN_PX = 8;

/** The menu a right click on the canvas opens; it closes on a choice, Esc, or a click elsewhere. */
export function CanvasContextMenu({ x, y, groups, onClose }: CanvasContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) {
      return;
    }
    const { width, height } = menu.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - width - VIEWPORT_MARGIN_PX);
    const top = Math.min(y, window.innerHeight - height - VIEWPORT_MARGIN_PX);
    menu.style.left = `${Math.max(VIEWPORT_MARGIN_PX, left)}px`;
    menu.style.top = `${Math.max(VIEWPORT_MARGIN_PX, top)}px`;
    menu.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [x, y]);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    const handleClose = () => onClose();
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", handleClose);
    window.addEventListener("blur", handleClose);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("blur", handleClose);
    };
  }, [onClose]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "ArrowDown"
        ? items[(index + 1) % items.length]
        : items[(index - 1 + items.length) % items.length];
    next?.focus();
  };

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      style={{ left: x, top: y }}
      onKeyDown={handleMenuKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {groups
        .filter((group) => group.length > 0)
        .map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {groupIndex > 0 ? <div className={styles.separator} role="separator" /> : null}
            {group.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={item.danger ? `${styles.item} ${styles.danger}` : styles.item}
                  disabled={item.disabled}
                  onClick={() => {
                    onClose();
                    item.onSelect();
                  }}
                >
                  <Icon />
                  <span className={styles.itemLabel}>{item.label}</span>
                  {item.shortcut ? <span className={styles.shortcut}>{item.shortcut}</span> : null}
                </button>
              );
            })}
          </React.Fragment>
        ))}
    </div>
  );
}
