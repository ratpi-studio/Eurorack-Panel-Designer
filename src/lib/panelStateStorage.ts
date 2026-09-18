import type { PersistStorage, StorageValue } from "zustand/middleware";

import type { ReferenceImage } from "./referenceImage";

interface PersistedPanelState {
  referenceImage: ReferenceImage | null;
  referenceImageSelected: boolean;
}

type StateStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface PanelStateStorageOptions {
  /** The reference image does not fit in browser storage: the state was saved without it. */
  onReferenceImageDropped: (error: unknown, imageChars: number) => void;
  /** Nothing could be saved. Called once until a save succeeds again. */
  onSaveFailed: (error: unknown) => void;
  getStorage?: () => StateStorage;
}

export function isQuotaExceededError(error: unknown): boolean {
  const name =
    typeof error === "object" && error !== null ? (error as { name?: unknown }).name : undefined;
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED";
}

/**
 * localStorage adapter for the persisted panel store that never throws on write. The whole state
 * is rewritten on every change, so an oversized reference image would otherwise make every update
 * throw and stop saving the design.
 */
// S may include undefined: zustand infers the persisted type from `migrate`, which can return it.
export function createPanelStateStorage<S extends PersistedPanelState | undefined>({
  onReferenceImageDropped,
  onSaveFailed,
  getStorage = () => window.localStorage,
}: PanelStateStorageOptions): PersistStorage<S> | undefined {
  let storage: StateStorage;
  try {
    storage = getStorage();
  } catch {
    // Storage disabled by the browser: the store stays in memory, as with createJSONStorage.
    return undefined;
  }

  let droppedImageDataUrl: string | null = null;
  let saveFailureReported = false;

  const write = (name: string, value: StorageValue<S>) =>
    storage.setItem(name, JSON.stringify(value));
  const withoutImage = (value: StorageValue<S>): StorageValue<S> => ({
    ...value,
    state: { ...value.state, referenceImage: null, referenceImageSelected: false } as S,
  });

  return {
    getItem: (name) => {
      const raw = storage.getItem(name);
      return raw ? (JSON.parse(raw) as StorageValue<S>) : null;
    },
    setItem: (name, value) => {
      const image = value.state?.referenceImage;
      try {
        if (image && image.dataUrl === droppedImageDataUrl) {
          // Already known not to fit: skip the full write, it runs on every change.
          write(name, withoutImage(value));
        } else {
          try {
            write(name, value);
          } catch (error) {
            if (!image || !isQuotaExceededError(error)) {
              throw error;
            }
            droppedImageDataUrl = image.dataUrl;
            onReferenceImageDropped(error, image.dataUrl.length);
            write(name, withoutImage(value));
          }
        }
        saveFailureReported = false;
      } catch (error) {
        if (!saveFailureReported) {
          saveFailureReported = true;
          onSaveFailed(error);
        }
      }
    },
    removeItem: (name) => storage.removeItem(name),
  };
}
