import React from "react";

import { copyElements } from "@lib/elementTransforms";
import type { PanelElement, PanelModel } from "@lib/panelTypes";
import { usePanelStore } from "@store/panelStore";

// How far each paste or duplicate lands from the previous one, when the grid does not snap.
const PASTE_OFFSET_MM = 5;

/*
 * The copied elements live as long as the page, so they can be pasted into another design
 * loaded afterward. They stay out of the persisted store: SVG patterns can be large.
 */
let clipboard: PanelElement[] = [];
let pasteCount = 0;
const clipboardListeners = new Set<() => void>();

function setClipboard(elements: PanelElement[]) {
  clipboard = structuredClone(elements);
  pasteCount = 0;
  clipboardListeners.forEach((listener) => listener());
}

function subscribeClipboard(listener: () => void) {
  clipboardListeners.add(listener);
  return () => {
    clipboardListeners.delete(listener);
  };
}

const getClipboardSize = () => clipboard.length;

/** Read at the time of a key press, which may come before a re-render after a copy. */
export const hasCopiedElements = () => clipboard.length > 0;

interface ElementClipboardInput {
  panelModel: PanelModel;
  selectedElementIds: string[];
  updateModel: (updater: (model: PanelModel) => PanelModel) => void;
  removeElements: (ids: string[]) => void;
}

export function useElementClipboard({
  panelModel,
  selectedElementIds,
  updateModel,
  removeElements,
}: ElementClipboardInput) {
  const setSelectedElementIds = usePanelStore((state) => state.setSelectedElementIds);
  const clipboardSize = React.useSyncExternalStore(subscribeClipboard, getClipboardSize);

  const selectedElements = React.useMemo(() => {
    const ids = new Set(selectedElementIds);
    return panelModel.elements.filter((element) => ids.has(element.id));
  }, [panelModel.elements, selectedElementIds]);

  const pasteStepMm = panelModel.options.snapToGrid
    ? panelModel.options.gridSizeMm
    : PASTE_OFFSET_MM;

  /** Adds the elements to the design in one undo step, and selects them. */
  const addCopies = React.useCallback(
    (copies: PanelElement[]) => {
      if (!copies.length) {
        return 0;
      }
      updateModel((prev) => ({ ...prev, elements: [...prev.elements, ...copies] }));
      setSelectedElementIds(copies.map((copy) => copy.id));
      return copies.length;
    },
    [setSelectedElementIds, updateModel],
  );

  const copySelection = React.useCallback(() => {
    if (!selectedElements.length) {
      return false;
    }
    setClipboard(selectedElements);
    return true;
  }, [selectedElements]);

  const cutSelection = React.useCallback(() => {
    if (!copySelection()) {
      return false;
    }
    // The cut elements come back where they were on the first paste.
    pasteCount = -1;
    removeElements(selectedElements.map((element) => element.id));
    return true;
  }, [copySelection, removeElements, selectedElements]);

  const paste = React.useCallback(() => {
    if (!clipboard.length) {
      return 0;
    }
    pasteCount += 1;
    const offset = pasteCount * pasteStepMm;
    return addCopies(copyElements(clipboard, { x: offset, y: offset }));
  }, [addCopies, pasteStepMm]);

  const duplicateSelection = React.useCallback(
    () => addCopies(copyElements(selectedElements, { x: pasteStepMm, y: pasteStepMm })),
    [addCopies, pasteStepMm, selectedElements],
  );

  return {
    canPaste: clipboardSize > 0,
    copySelection,
    cutSelection,
    paste,
    duplicateSelection,
  };
}
