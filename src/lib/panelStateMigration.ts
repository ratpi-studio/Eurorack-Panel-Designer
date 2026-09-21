import { normalizePanelModel, type PanelModel, type PanelModelInput } from "./panelTypes";

/**
 * Version of the editor state autosaved in browser storage (`panel-designer-store`).
 * - v5: reference images changed shape, so older ones are dropped.
 * - v8: panel options gained `showDimensions`.
 * - v9: the relief moved from each SVG artwork to the panel (`designRelief`), and texts gained a
 *   font and a pattern overlap mode.
 * - v10: panel options gained `showHardware`, and elements can name a real part.
 * - v11: panels are as wide as they are cut, a few tenths of a millimeter under the HP grid.
 * - v12: panels have a format, 1U to 4U or a custom size; older autosaves are 3U.
 */
export const PANEL_STATE_VERSION = 12;

interface PersistedPanelState {
  model?: PanelModel | PanelModelInput | null;
  referenceImage?: unknown;
  referenceImageSelected?: boolean;
}

/**
 * Brings autosaved editor state from an older version up to date. Normalizing the model fills in
 * what older saves lack; saves without a model before v7 start from `createInitialModel`.
 */
export function migratePersistedPanelState<TState extends PersistedPanelState>(
  state: TState | undefined,
  version: number,
  createInitialModel: () => PanelModel,
): TState | undefined {
  if (!state) {
    return state;
  }
  const model = state.model ? normalizePanelModel(state.model as PanelModelInput) : null;
  if (version && version < 7) {
    return {
      ...state,
      ...(version < 5 ? { referenceImage: null, referenceImageSelected: false } : {}),
      model: model ?? createInitialModel(),
    };
  }
  return model ? { ...state, model } : state;
}
