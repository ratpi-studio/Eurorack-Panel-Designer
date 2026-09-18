import { getStorage } from "./storage";

export type ExportFormat = "svg" | "png" | "stl" | "kicadSvg" | "kicadPcb";

/** What the render area shows: the 2D editor, the live 3D view, or both side by side. */
export type ViewMode = "2d" | "3d" | "split";

/** The open tab of the right panel, under the project card. */
export type RightPanelTab = "display" | "properties" | "components";

const PREFERENCES_STORAGE_KEY = "eurorack-panel-preferences";

const EXPORT_FORMATS: readonly ExportFormat[] = ["svg", "png", "stl", "kicadSvg", "kicadPcb"];
const VIEW_MODES: readonly ViewMode[] = ["2d", "3d", "split"];
const RIGHT_PANEL_TABS: readonly RightPanelTab[] = ["display", "properties", "components"];

interface PanelPreferences {
  preferredExportFormat?: ExportFormat;
  viewMode?: ViewMode;
  rightPanelTab?: RightPanelTab;
}

function pickAllowed<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.find((candidate) => candidate === value);
}

function readPreferences(): PanelPreferences {
  try {
    const raw = getStorage()?.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    // Drop unknown values one by one, so a bad field does not reset the others.
    const candidate = parsed as Record<string, unknown>;
    const preferences: PanelPreferences = {};
    const preferredExportFormat = pickAllowed(candidate.preferredExportFormat, EXPORT_FORMATS);
    if (preferredExportFormat) {
      preferences.preferredExportFormat = preferredExportFormat;
    }
    const viewMode = pickAllowed(candidate.viewMode, VIEW_MODES);
    if (viewMode) {
      preferences.viewMode = viewMode;
    }
    const rightPanelTab = pickAllowed(candidate.rightPanelTab, RIGHT_PANEL_TABS);
    if (rightPanelTab) {
      preferences.rightPanelTab = rightPanelTab;
    }
    return preferences;
  } catch {
    return {};
  }
}

function updatePreferences(updates: PanelPreferences): void {
  try {
    const storage = getStorage();
    if (!storage) {
      return;
    }
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ ...readPreferences(), ...updates }));
  } catch {
    // Storage is full or blocked: the preference only lasts for this session.
  }
}

export function getPreferredExportFormat(): ExportFormat | null {
  return readPreferences().preferredExportFormat ?? null;
}

export function setPreferredExportFormat(format: ExportFormat): void {
  updatePreferences({ preferredExportFormat: format });
}

export function getPreferredViewMode(): ViewMode | null {
  return readPreferences().viewMode ?? null;
}

export function setPreferredViewMode(mode: ViewMode): void {
  updatePreferences({ viewMode: mode });
}

export function getPreferredRightPanelTab(): RightPanelTab | null {
  return readPreferences().rightPanelTab ?? null;
}

export function setPreferredRightPanelTab(tab: RightPanelTab): void {
  updatePreferences({ rightPanelTab: tab });
}

export const DEFAULT_EXPORT_FORMAT: ExportFormat = "svg";

export const DEFAULT_VIEW_MODE: ViewMode = "2d";

export const DEFAULT_RIGHT_PANEL_TAB: RightPanelTab = "properties";
