import { Eye, EyeOff, Lock, LockOpen, Trash2 } from "lucide-react";
import React from "react";

import { ElementTypeIcon } from "@components/ElementTypeIcon/ElementTypeIcon";
import { IconButton } from "@components/IconButton/IconButton";
import { iconLabelProps } from "@components/Tooltip/TooltipLayer";
import { useI18n } from "@i18n/I18nContext";
import { elementTypeColors } from "@lib/canvas/palette";
import { describeComponents, type ComponentListItem } from "@lib/componentList";
import { PanelElementType, type PanelElement } from "@lib/panelTypes";

import * as styles from "./ComponentList.css";

export interface ComponentListProps {
  elements: PanelElement[];
  selectedIds: string[];
  /** `additive` adds the element to the selection, or removes it, instead of replacing it. */
  onSelect: (id: string, additive: boolean) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  /** An empty name goes back to the default one (type and number). */
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onShowAll: () => void;
}

const ICON_SIZE_PX = 18;

/** Localized names of the element types, as the palette shows them. */
export function useElementTypeLabels(): Record<PanelElementType, string> {
  const t = useI18n();
  return React.useMemo(
    () =>
      Object.fromEntries(
        Object.values(PanelElementType).map((type) => [type, t.palette.items[type]?.label ?? type]),
      ) as Record<PanelElementType, string>,
    [t],
  );
}

/** Every placed element, to select, hide, lock, rename or delete it. */
export function ComponentList({
  elements,
  selectedIds,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onRename,
  onRemove,
  onShowAll,
}: ComponentListProps) {
  const t = useI18n();
  const copy = t.components;
  const typeLabels = useElementTypeLabels();
  const items = React.useMemo(
    () => describeComponents(elements, typeLabels),
    [elements, typeLabels],
  );
  const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const hiddenCount = items.filter((item) => item.hidden).length;

  const [renaming, setRenaming] = React.useState<{ id: string; value: string } | null>(null);
  // Escape blurs the field to leave it: the blur then drops the new name instead of saving it.
  const cancelRenameRef = React.useRef(false);

  const startRenaming = (item: ComponentListItem) => {
    cancelRenameRef.current = false;
    setRenaming({ id: item.id, value: item.name });
  };

  const finishRenaming = (item: ComponentListItem) => {
    const value = renaming?.value.trim() ?? item.name;
    setRenaming(null);
    if (cancelRenameRef.current || value === item.name || (!value && !item.isRenamed)) {
      return;
    }
    onRename(item.id, value);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.summary}>{copy.summary(items.length, hiddenCount)}</span>
        {hiddenCount > 0 ? (
          <IconButton label={copy.showAll} icon={Eye} variant="ghost" onClick={onShowAll} />
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>{copy.empty}</p>
      ) : (
        <ul className={styles.list} aria-label={copy.listLabel}>
          {items.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <li key={item.id} className={styles.row[isSelected ? "selected" : "idle"]}>
                {renaming?.id === item.id ? (
                  <input
                    className={styles.renameInput}
                    aria-label={copy.rename(item.name)}
                    value={renaming.value}
                    autoFocus
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => setRenaming({ id: item.id, value: event.target.value })}
                    onBlur={() => finishRenaming(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      } else if (event.key === "Escape") {
                        // Keep Escape from also clearing the selection.
                        event.stopPropagation();
                        cancelRenameRef.current = true;
                        event.currentTarget.blur();
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.selectButton}
                    aria-pressed={isSelected}
                    onClick={(event) =>
                      onSelect(item.id, event.shiftKey || event.metaKey || event.ctrlKey)
                    }
                    onDoubleClick={() => startRenaming(item)}
                    onKeyDown={(event) => {
                      if (event.key === "F2") {
                        event.preventDefault();
                        startRenaming(item);
                      }
                    }}
                  >
                    <span className={styles.icon}>
                      <ElementTypeIcon
                        type={item.type}
                        color={elementTypeColors[item.type]}
                        size={ICON_SIZE_PX}
                      />
                    </span>
                    <span className={styles.text[item.hidden ? "hidden" : "shown"]}>
                      <span className={styles.name}>{item.name}</span>
                      {item.detail ? <span className={styles.detail}>{item.detail}</span> : null}
                    </span>
                  </button>
                )}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionButton[item.hidden ? "active" : "idle"]}
                    aria-pressed={item.hidden}
                    {...iconLabelProps(item.hidden ? copy.show(item.name) : copy.hide(item.name))}
                    onClick={() => onToggleHidden(item.id)}
                  >
                    {item.hidden ? <EyeOff /> : <Eye />}
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton[item.locked ? "active" : "idle"]}
                    aria-pressed={item.locked}
                    {...iconLabelProps(item.locked ? copy.unlock(item.name) : copy.lock(item.name))}
                    onClick={() => onToggleLocked(item.id)}
                  >
                    {item.locked ? <Lock /> : <LockOpen />}
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton.danger}
                    {...iconLabelProps(copy.remove(item.name))}
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className={styles.hint}>{copy.hint}</p>
    </div>
  );
}
