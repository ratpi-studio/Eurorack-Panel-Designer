import {
  ArrowLeftRight,
  BookOpen,
  Calculator,
  CircuitBoard,
  Drill,
  LayoutTemplate,
  Printer,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import React from "react";

import { iconLabelProps } from "@components/Tooltip/TooltipLayer";

import { PAGE_PATHS } from "../../seo/paths";
import * as styles from "./PanelDesigner.css";

/** The content pages the menu links, by the key of their label in the copy. */
const RESOURCE_LINKS = [
  { key: "calculator", href: PAGE_PATHS.hpCalculator, Icon: Calculator },
  { key: "templates", href: PAGE_PATHS.templates, Icon: LayoutTemplate },
  { key: "hpToMm", href: PAGE_PATHS.hpToMm, Icon: ArrowLeftRight },
  { key: "dimensions", href: PAGE_PATHS.dimensions, Icon: Ruler },
  { key: "drillSizes", href: PAGE_PATHS.drillSizes, Icon: Drill },
  { key: "printing", href: PAGE_PATHS.printing, Icon: Printer },
  { key: "kicad", href: PAGE_PATHS.kicad, Icon: CircuitBoard },
] as const satisfies readonly { key: string; href: string; Icon: LucideIcon }[];

export type ResourceLinkKey = (typeof RESOURCE_LINKS)[number]["key"];

export interface ResourcesMenuCopy {
  label: string;
  links: Record<ResourceLinkKey, string>;
}

interface ResourcesMenuProps {
  copy: ResourcesMenuCopy;
}

/**
 * The tools, templates and guides published next to the editor, in a menu of the header. The links
 * stay in the page while the menu is closed, only hidden: the editor is the page search engines
 * land on, and they follow the links they find in it once it has rendered.
 */
export function ResourcesMenu({ copy }: ResourcesMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const menuId = React.useId();

  // The menu closes on a click elsewhere or on Escape, like any menu.
  React.useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.resourcesMenuRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.changelogButton}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={menuId}
        {...iconLabelProps(copy.label)}
      >
        <BookOpen />
      </button>
      <nav id={menuId} className={styles.resourcesMenu} aria-label={copy.label} hidden={!isOpen}>
        {RESOURCE_LINKS.map(({ key, href, Icon }) => (
          <a key={key} className={styles.resourcesMenuLink} href={href}>
            <Icon />
            {copy.links[key]}
          </a>
        ))}
      </nav>
    </div>
  );
}
