export type ExportFormat = 'svg' | 'png' | 'stl';

const PREFERENCES_STORAGE_KEY = 'eurorack-panel-preferences';

interface PanelPreferences {
  preferredExportFormat?: ExportFormat;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const globalStore = (globalThis as { localStorage?: Storage }).localStorage;
  return globalStore ?? null;
}

function readPreferences(): PanelPreferences {
  const storage = getStorage();
  if (!storage) {
    return {};
  }

  const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const candidate = parsed as PanelPreferences;
    if (
      candidate.preferredExportFormat &&
      candidate.preferredExportFormat !== 'svg' &&
      candidate.preferredExportFormat !== 'png' &&
      candidate.preferredExportFormat !== 'stl'
    ) {
      return {};
    }

    return candidate;
  } catch {
    return {};
  }
}

function writePreferences(prefs: PanelPreferences): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
}

export function getPreferredExportFormat(): ExportFormat | null {
  const prefs = readPreferences();
  return prefs.preferredExportFormat ?? null;
}

export function setPreferredExportFormat(format: ExportFormat): void {
  const current = readPreferences();
  const next: PanelPreferences = {
    ...current,
    preferredExportFormat: format
  };
  writePreferences(next);
}

export const DEFAULT_EXPORT_FORMAT: ExportFormat = 'svg';

