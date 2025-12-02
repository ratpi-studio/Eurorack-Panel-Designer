import React from 'react';

import { PanelCanvas } from '@components/PanelCanvas/PanelCanvas';
import { PanelControls } from '@components/PanelControls/PanelControls';
import { DisplayOptions } from '@components/DisplayOptions/DisplayOptions';
import { ElementPalette } from '@components/ElementPalette/ElementPalette';
import { ElementProperties } from '@components/ElementProperties/ElementProperties';
import { useI18n } from '@i18n/I18nContext';
import { createPanelElement } from '@lib/elements';
import { generateMountingHoles } from '@lib/mountingHoles';
import {
  PanelElementType,
  withElementProperties,
  type PanelElement,
  type MountingHole,
  type PanelModel,
  type Vector2
} from '@lib/panelTypes';
import { createPanelDimensions, hpToMm, mmToCm } from '@lib/units';
import { usePanelStore } from '@store/panelStore';
import { usePanelHistory } from '@store/usePanelHistory';
import { useProjects } from '@store/useProjects';
import * as styles from './PanelDesigner.css';

const DEFAULT_ZOOM = 1;
const DEFAULT_PAN: Vector2 = { x: 0, y: 0 };
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const GITHUB_REPO_URL = 'https://github.com/ratpi-studio/Eurorack-Panel-Designer';

function computeMountingHoles(model: PanelModel): MountingHole[] {
  return generateMountingHoles({
    widthHp: model.dimensions.widthHp,
    widthMm: model.dimensions.widthMm,
    heightMm: model.dimensions.heightMm
  });
}

export function PanelDesigner() {
  const t = useI18n();
  const panelModel = usePanelStore((state) => state.model);
  const placementType = usePanelStore((state) => state.placementType);
  const setPlacementType = usePanelStore((state) => state.setPlacementType);
  const selectedElementId = usePanelStore((state) => state.selectedElementId);
  const setSelectedElementId = usePanelStore((state) => state.setSelectedElement);
  const draftProperties = usePanelStore((state) => state.draftProperties);
  const setDraftProperties = usePanelStore((state) => state.setDraftProperties);
  const [zoom, setZoom] = React.useState(DEFAULT_ZOOM);
  const [pan, setPan] = React.useState<Vector2>({ ...DEFAULT_PAN });
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const {
    clearHistory,
    updateModel,
    undo,
    redo,
    beginMove,
    endMove,
    addElement,
    moveElement,
    updateElement,
    updateElementProperties,
    removeElement
  } = usePanelHistory();

  const mountingHoles = React.useMemo(
    () => computeMountingHoles(panelModel),
    [
      panelModel.dimensions.heightMm,
      panelModel.dimensions.widthHp,
      panelModel.dimensions.widthMm
    ]
  );

  const handleSetWidthFromMm = React.useCallback(
    (widthMm: number) => {
      updateModel((prev) => ({
        ...prev,
        dimensions: createPanelDimensions(mmToCm(widthMm))
      }));
      setSelectedElementId(null);
    },
    [setSelectedElementId, updateModel]
  );

  const handleSetWidthFromHp = React.useCallback(
    (widthHp: number) => {
      updateModel((prev) => {
        const currentMmPerHp =
          prev.dimensions.widthHp > 0
            ? prev.dimensions.widthMm / prev.dimensions.widthHp
            : undefined;
        const widthMm = hpToMm(widthHp, currentMmPerHp);
        const widthCm = mmToCm(widthMm);

        return {
          ...prev,
          dimensions: createPanelDimensions(widthCm, currentMmPerHp)
        };
      });
      setSelectedElementId(null);
    },
    [setSelectedElementId, updateModel]
  );

  const resetView = React.useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setPan({ ...DEFAULT_PAN });
  }, []);

  const clampZoom = React.useCallback(
    (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)),
    []
  );

  const handleZoomChange = React.useCallback(
    (nextZoom: number) => {
      setZoom((prev) => {
        const resolved = clampZoom(nextZoom);
        return Number.isFinite(resolved) ? resolved : prev;
      });
    },
    [clampZoom]
  );

  const handlePanChange = React.useCallback((nextPan: Vector2) => {
    setPan({
      x: Number.isFinite(nextPan.x) ? nextPan.x : 0,
      y: Number.isFinite(nextPan.y) ? nextPan.y : 0
    });
  }, []);

  const handleDisplayOptionsChange = React.useCallback(
    (options: Partial<typeof panelModel.options>) => {
      updateModel((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          ...options
        }
      }));
    },
    [updateModel]
  );

  const {
    projectName,
    setProjectName,
    projects,
    activeProjectName,
    selectedSavedName,
    setSelectedSavedName,
    statusMessage,
    fileInputRef,
    refreshProjects,
    handleSaveProject,
    handleLoadProject,
    handleDeleteProject,
    handleExportJson,
    handleImportJson,
    handleExportPng,
    handleExportSvg,
    handleReset
  } = useProjects({
    canvasRef,
    mountingHoles,
    resetView,
    clearHistory
  });

  const handlePlaceElement = React.useCallback(
    (type: PanelElementType, positionMm: Vector2) => {
      return addElement(type, positionMm);
    },
    [addElement]
  );

  const handleMoveElement = React.useCallback(
    (elementId: string, positionMm: Vector2) => {
      moveElement(elementId, positionMm);
    },
    [moveElement]
  );

  const handleUpdateElement = React.useCallback(
    (elementId: string, updater: (element: PanelElement) => PanelElement) => {
      updateElement(elementId, updater);
    },
    [updateElement]
  );

  const handleUpdateProperties = React.useCallback(
    (elementId: string, properties: PanelElement['properties']) => {
      updateElementProperties(elementId, properties);
    },
    [updateElementProperties]
  );

  const handleRemoveElement = React.useCallback(
    (elementId: string) => {
      removeElement(elementId);
    },
    [removeElement]
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditingField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (event.key === 'Escape') {
        setPlacementType(null);
        setSelectedElementId(null);
        return;
      }

      if (!isEditingField && (event.key === 'Backspace' || event.key === 'Delete')) {
        if (selectedElementId) {
          event.preventDefault();
          handleRemoveElement(selectedElementId);
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleRemoveElement, redo, selectedElementId, undo]);

  const selectedElement = React.useMemo(
    () => panelModel.elements.find((element) => element.id === selectedElementId) ?? null,
    [panelModel.elements, selectedElementId]
  );

  const draftElement = React.useMemo<PanelElement | null>(() => {
    if (!placementType) {
      return null;
    }
    const base = createPanelElement(placementType, { x: 0, y: 0 });
    return {
      ...withElementProperties(base, draftProperties[placementType] ?? null),
      id: 'draft'
    };
  }, [draftProperties, placementType]);

  const elementForProperties = selectedElement ?? draftElement;

  const handleSelectPaletteType = React.useCallback(
    (type: PanelElementType | null) => {
      setSelectedElementId(null);
      setPlacementType(type);
    },
    [setPlacementType, setSelectedElementId]
  );

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <img src="/images/logo.svg" alt={t.app.title} className={styles.logo} />
          </div>
          <a
            className={styles.githubLink}
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub repository"
          >
            <svg
              className={styles.githubIcon}
              viewBox="0 0 16 16"
              role="img"
              aria-hidden="true"
            >
              <path
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82A7.62 7.62 0 0 1 8 3.44a7.6 7.6 0 0 1 2.01.27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
                fill="currentColor"
              />
            </svg>
            <span className={styles.githubLabel}>GitHub</span>
          </a>
        </div>
        <div className={styles.status}>{statusMessage}</div>
      </section>
      <section className={styles.canvasSection}>
        <div className={styles.leftColumn}>
          <div className={styles.sectionStack}>
            <div className={styles.card}>
              <PanelControls
                widthMm={panelModel.dimensions.widthMm}
                widthHp={panelModel.dimensions.widthHp}
                onChangeWidthMm={(nextMm) => {
                  handleSetWidthFromMm(nextMm);
                  resetView();
                }}
                onChangeWidthHp={(nextHp) => {
                  handleSetWidthFromHp(nextHp);
                  resetView();
                }}
              />
            </div>
            <div className={styles.card}>
              <DisplayOptions
                options={panelModel.options}
                onChange={handleDisplayOptionsChange}
                onResetView={resetView}
              />
            </div>
            <div className={styles.card}>
              <ElementPalette activeType={placementType} onSelect={handleSelectPaletteType} />
            </div>
          </div>
        </div>
        <div className={styles.canvasColumn}>
          <PanelCanvas
            canvasRef={canvasRef}
            model={panelModel}
            mountingHoles={mountingHoles}
            zoom={zoom}
            pan={pan}
            zoomLimits={{ min: MIN_ZOOM, max: MAX_ZOOM }}
            placementType={placementType}
            onPlaceElement={handlePlaceElement}
            onMoveElement={handleMoveElement}
            onMoveStart={beginMove}
            onMoveEnd={endMove}
            onZoomChange={handleZoomChange}
            onPanChange={handlePanChange}
            onSelectElement={setSelectedElementId}
            displayOptions={panelModel.options}
            selectedElementId={selectedElementId}
            draftProperties={draftProperties}
          />
          <div className={styles.shortcuts}>
            <span className={styles.key}>{t.shortcuts.shift}</span>
            <span className={styles.shortcutLabel}>{t.shortcuts.disableSnap}</span>
            <span className={styles.key}>{t.shortcuts.esc}</span>
            <span className={styles.shortcutLabel}>{t.shortcuts.cancelPlacement}</span>
            <span className={styles.key}>{t.shortcuts.deleteKey}</span>
            <span className={styles.shortcutLabel}>{t.shortcuts.deleteSelection}</span>
            <span className={styles.key}>{t.shortcuts.undoShortcut}</span>
            <span className={styles.shortcutLabel}>{t.shortcuts.undo}</span>
            <span className={styles.key}>{t.shortcuts.redoShortcut}</span>
            <span className={styles.shortcutLabel}>{t.shortcuts.redo}</span>
          </div>
        </div>
        <aside className={styles.rightColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>{t.projects.title}</div>
                <div className={styles.cardSubtitle}>{t.projects.subtitle}</div>
              </div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => refreshProjects()}
              >
                {t.projects.refresh}
              </button>
            </div>
            <label className={styles.fieldRow}>
              <span className={styles.label}>{t.projects.nameLabel}</span>
              <input
                className={styles.textInput}
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={t.projects.nameLabel}
              />
            </label>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.primaryButton} onClick={handleSaveProject}>
                {t.projects.save}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={handleExportJson}>
                {t.projects.exportJson}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={handleExportPng}>
                {t.projects.exportPng}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={handleExportSvg}>
                {t.projects.exportSvg}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={handleReset}>
                {t.projects.reset}
              </button>
            </div>
            <label className={styles.fieldRow}>
              <span className={styles.label}>{t.projects.savedLabel}</span>
              <select
                className={styles.textInput}
                value={selectedSavedName}
                onChange={(event) => setSelectedSavedName(event.target.value)}
              >
                <option value="">—</option>
                {projects.map((project) => (
                  <option key={project.name} value={project.name}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!selectedSavedName}
                onClick={() => selectedSavedName && handleLoadProject(selectedSavedName)}
              >
                {t.projects.load}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={!selectedSavedName}
                onClick={() => selectedSavedName && handleDeleteProject(selectedSavedName)}
              >
                {t.projects.delete}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => fileInputRef.current?.click()}
              >
                {t.projects.importJson}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className={styles.hiddenInput}
                onChange={handleImportJson}
              />
            </div>
          </div>
          <div className={styles.card}>
            <ElementProperties
              element={elementForProperties}
              onChangePosition={(positionMm) => {
                if (selectedElement) {
                  updateElement(selectedElement.id, (element) => ({
                    ...element,
                    positionMm
                  }));
                }
              }}
              onChangeRotation={(rotationDeg) => {
                if (selectedElement) {
                  handleUpdateElement(selectedElement.id, (element) => ({
                    ...element,
                    rotationDeg
                  }));
                }
              }}
              onChangeProperties={(properties) => {
                if (selectedElement) {
                  handleUpdateProperties(selectedElement.id, properties);
                  return;
                }
                if (placementType) {
                  setDraftProperties(placementType, properties);
                }
              }}
              onRemove={() => {
                if (selectedElement) {
                  handleRemoveElement(selectedElement.id);
                } else {
                  setPlacementType(null);
                }
              }}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}
