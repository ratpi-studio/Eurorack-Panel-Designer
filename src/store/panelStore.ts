import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPanelElement } from '@lib/elements';
import {
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  sanitizePropertiesForType,
  withElementProperties,
  type PanelElement,
  type PanelElementPropertiesMap,
  type PanelModel,
  type Vector2
} from '@lib/panelTypes';
import { createPanelDimensions } from '@lib/units';

const DEFAULT_PANEL_WIDTH_CM = 10;

type DraftPropertiesState = Partial<{
  [T in PanelElementType]: PanelElementPropertiesMap[T];
}>;

type PanelState = {
  model: PanelModel;
  selectedElementId: string | null;
  placementType: PanelElementType | null;
  draftProperties: DraftPropertiesState;
};

type PanelActions = {
  setModel: (model: PanelModel) => void;
  setPlacementType: (type: PanelElementType | null) => void;
  setSelectedElement: (id: string | null) => void;
  setDraftProperties: (
    type: PanelElementType,
    properties: PanelElement['properties']
  ) => void;
  addElement: (type: PanelElementType, positionMm: Vector2) => string;
  moveElement: (id: string, positionMm: Vector2) => void;
  updateElement: (id: string, updater: (el: PanelElement) => PanelElement) => void;
  removeElement: (id: string) => void;
  reset: () => void;
};

const createInitialModel = (): PanelModel => ({
  dimensions: createPanelDimensions(DEFAULT_PANEL_WIDTH_CM),
  elements: [],
  options: { ...DEFAULT_PANEL_OPTIONS }
});

export const usePanelStore = create<PanelState & PanelActions>()(
  persist(
    (set, get) => ({
      model: createInitialModel(),
      selectedElementId: null,
      placementType: null,
      draftProperties: {},
      setModel: (model) => set({ model }),
      setPlacementType: (type) => set({ placementType: type }),
      setDraftProperties: (type, properties) =>
        set((state) => {
          const sanitized = sanitizePropertiesForType(type, properties);
          if (!sanitized) {
            const nextDraft = { ...state.draftProperties };
            delete nextDraft[type];
            return { draftProperties: nextDraft };
          }
          return {
            draftProperties: { ...state.draftProperties, [type]: sanitized }
          };
        }),
      setSelectedElement: (id) => set({ selectedElementId: id }),
      addElement: (type, positionMm) => {
        const element = withElementProperties(
          createPanelElement(type, positionMm),
          get().draftProperties[type]
        );
        set((state) => ({
          model: {
            ...state.model,
            elements: [...state.model.elements, element]
          },
          selectedElementId: element.id
        }));
        return element.id;
      },
      moveElement: (id, positionMm) =>
        set((state) => ({
          model: {
            ...state.model,
            elements: state.model.elements.map((element) =>
              element.id === id ? { ...element, positionMm } : element
            )
          }
        })),
      updateElement: (id, updater) =>
        set((state) => ({
          model: {
            ...state.model,
            elements: state.model.elements.map((element) =>
              element.id === id ? updater(element) : element
            )
          }
        })),
      removeElement: (id) =>
        set((state) => ({
          model: {
            ...state.model,
            elements: state.model.elements.filter((element) => element.id !== id)
          },
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
        })),
      reset: () =>
        set({
          model: createInitialModel(),
          selectedElementId: null,
          placementType: null
        })
    }),
    {
      name: 'panel-designer-store',
      version: 1
    }
  )
);
