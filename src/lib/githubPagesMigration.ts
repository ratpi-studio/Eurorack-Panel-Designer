import { normalizePanelModel, type PanelModelInput } from "./panelTypes";
import { parseSerializedPanel, serializePanelModel } from "./serialization";
import { getStorage, importProjects, listProjects } from "./storage";

// Keys written by the app, sent by the GitHub Pages redirect page (github-pages/index.html).
const STORE_KEY = "panel-designer-store";
const PROJECTS_KEY = "eurorack-panel-projects";
const PREFERENCES_KEY = "eurorack-panel-preferences";

export const GITHUB_PAGES_DATA_PREFIX = "#github-pages-data=";

export interface GithubPagesImportNames {
  /** Project name for the previous autosaved design, when this browser already has a design. */
  sessionProjectName: string;
  /** Appended to imported projects whose name is already taken. */
  projectNameSuffix: string;
}

/** Reads the localStorage values handed over in the URL fragment by the redirect page. */
export function readGithubPagesData(hash: string): Record<string, string> | null {
  if (!hash.startsWith(GITHUB_PAGES_DATA_PREFIX)) {
    return null;
  }
  const parsed: unknown = JSON.parse(
    decodeURIComponent(hash.slice(GITHUB_PAGES_DATA_PREFIX.length)),
  );
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid GitHub Pages data");
  }
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function hasElements(rawStore: string | null): boolean {
  if (!rawStore) {
    return false;
  }
  try {
    const { state } = JSON.parse(rawStore) as { state?: { model?: { elements?: unknown } } };
    const elements = state?.model?.elements;
    // Unknown shapes count as a design, so they are never overwritten.
    return !Array.isArray(elements) || elements.length > 0;
  } catch {
    return true;
  }
}

/** Canonical form of a design, to tell whether it is already kept. */
function designKey(model: unknown): string | null {
  try {
    return JSON.stringify(normalizePanelModel(model as PanelModelInput));
  } catch {
    return null;
  }
}

function storeDesignKey(rawStore: string | null): string | null {
  if (!rawStore) {
    return null;
  }
  try {
    return designKey((JSON.parse(rawStore) as { state?: { model?: unknown } }).state?.model);
  } catch {
    return null;
  }
}

function storeToProject(rawStore: string, name: string) {
  const { state } = JSON.parse(rawStore) as { state: { model: PanelModelInput } };
  const payload = parseSerializedPanel(serializePanelModel(normalizePanelModel(state.model)));
  return [{ name, payload, updatedAt: Date.now() }];
}

/**
 * Imports data moved from the GitHub Pages address without overwriting anything saved here: the
 * previous design becomes the current one only when this browser has none, otherwise it is kept
 * as a saved project. Safe to run again: the redirect page sends the data on every visit.
 */
export function importGithubPagesData(
  data: Record<string, string>,
  names: GithubPagesImportNames,
): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const previousStore = data[STORE_KEY];
  if (previousStore && hasElements(previousStore)) {
    const currentStore = storage.getItem(STORE_KEY);
    if (!hasElements(currentStore)) {
      storage.setItem(STORE_KEY, previousStore);
    } else {
      const previousDesign = storeDesignKey(previousStore);
      const alreadyKept =
        previousDesign === storeDesignKey(currentStore) ||
        listProjects().some((project) => designKey(project.payload.model) === previousDesign);
      if (!alreadyKept) {
        importProjects(
          storeToProject(previousStore, names.sessionProjectName),
          names.projectNameSuffix,
        );
      }
    }
  }

  if (data[PROJECTS_KEY]) {
    importProjects(JSON.parse(data[PROJECTS_KEY]), names.projectNameSuffix);
  }

  if (data[PREFERENCES_KEY] && !storage.getItem(PREFERENCES_KEY)) {
    storage.setItem(PREFERENCES_KEY, data[PREFERENCES_KEY]);
  }
}
