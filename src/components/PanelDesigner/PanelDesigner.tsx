import React from 'react';

import { PanelCanvas } from '@components/PanelCanvas/PanelCanvas';
import { PanelControls } from '@components/PanelControls/PanelControls';
import { DisplayOptions } from '@components/DisplayOptions/DisplayOptions';
import { ElementPalette } from '@components/ElementPalette/ElementPalette';
import { ElementProperties } from '@components/ElementProperties/ElementProperties';
import { enUS } from '@i18n/en_US';
import { createPanelElement } from '@lib/elements';
import { buildPanelSvg } from '@lib/exportSvg';
import { generateMountingHoles } from '@lib/mountingHoles';
import {
  DEFAULT_PANEL_OPTIONS,
  PanelElementType,
  withElementProperties,
  type PanelElement,
  type MountingHole,
  type PanelModel,
  type Vector2
} from '@lib/panelTypes';
import {
  deleteProject,
  listProjects,
  loadProject,
  saveProject,
  type StoredProject
} from '@lib/storage';
import {
  deserializePanelModel,
  serializePanelModel
} from '@lib/serialization';
import { createPanelDimensions, hpToMm, mmToCm } from '@lib/units';
import { usePanelStore } from '@store/panelStore';
import * as styles from './PanelDesigner.css';

const DEFAULT_ZOOM = 1;
const DEFAULT_PAN: Vector2 = { x: 0, y: 0 };
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const MAX_HISTORY = 100;
const GITHUB_REPO_URL = 'https://github.com/ratpi-studio/Eurorack-Panel-Designer';

function computeMountingHoles(model: PanelModel): MountingHole[] {
  return generateMountingHoles({
    widthHp: model.dimensions.widthHp,
    widthMm: model.dimensions.widthMm,
    heightMm: model.dimensions.heightMm
  });
}

export function PanelDesigner() {
  const t = enUS;
  const panelModel = usePanelStore((state) => state.model);
  const setModel = usePanelStore((state) => state.setModel);
  const placementType = usePanelStore((state) => state.placementType);
  const setPlacementType = usePanelStore((state) => state.setPlacementType);
  const selectedElementId = usePanelStore((state) => state.selectedElementId);
  const setSelectedElementId = usePanelStore((state) => state.setSelectedElement);
  const draftProperties = usePanelStore((state) => state.draftProperties);
  const setDraftProperties = usePanelStore((state) => state.setDraftProperties);
  const [projectName, setProjectName] = React.useState(t.projects.defaultName);
  const [projects, setProjects] = React.useState<StoredProject[]>([]);
  const [activeProjectName, setActiveProjectName] = React.useState<string | null>(null);
  const [selectedSavedName, setSelectedSavedName] = React.useState<string>('');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(DEFAULT_ZOOM);
  const [pan, setPan] = React.useState<Vector2>({ ...DEFAULT_PAN });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const historyRef = React.useRef<PanelModel[]>([]);
  const futureRef = React.useRef<PanelModel[]>([]);
  const moveHistoryPushedRef = React.useRef(false);

  const pushHistory = React.useCallback((model: PanelModel) => {
    const snapshot = JSON.parse(JSON.stringify(model)) as PanelModel;
    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
  }, []);

  const clearHistory = React.useCallback(() => {
    historyRef.current = [];
    futureRef.current = [];
  }, []);

  const updatePanelModel = React.useCallback(
    (updater: (model: PanelModel) => PanelModel, options?: { skipHistory?: boolean }) => {
      const current = usePanelStore.getState().model;
      if (!options?.skipHistory) {
        pushHistory(current);
        futureRef.current = [];
      }
      setModel(updater(current));
    },
    [pushHistory, setModel]
  );

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
      updatePanelModel((prev) => ({
        ...prev,
        dimensions: createPanelDimensions(mmToCm(widthMm))
      }));
      setSelectedElementId(null);
    },
    [updatePanelModel]
  );

  const handleSetWidthFromHp = React.useCallback(
    (widthHp: number) => {
      updatePanelModel((prev) => {
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
    [updatePanelModel]
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
      updatePanelModel((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          ...options
        }
      }));
    },
    [updatePanelModel]
  );

  const refreshProjects = React.useCallback(() => {
    setProjects(listProjects());
  }, []);

  React.useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleSaveProject = React.useCallback(() => {
    const trimmedName = projectName.trim() || 'Untitled panel';
    const saved = saveProject(trimmedName, panelModel);
    setProjects(saved);
    setActiveProjectName(trimmedName);
    setSelectedSavedName(trimmedName);
    setStatusMessage(t.projects.messages.saveSuccess(trimmedName));
  }, [panelModel, projectName, t.projects.messages]);

  const handleLoadProject = React.useCallback(
    (name: string) => {
      const model = loadProject(name);
      if (!model) {
        setStatusMessage(t.projects.messages.loadError(name));
        return;
      }
      setModel(model);
      clearHistory();
      setSelectedElementId(null);
      setPlacementType(null);
      resetView();
      setActiveProjectName(name);
      setSelectedSavedName(name);
      setStatusMessage(t.projects.messages.loadSuccess(name));
    },
    [clearHistory, resetView, t.projects.messages]
  );

  const handleDeleteProject = React.useCallback(
    (name: string) => {
      const next = deleteProject(name);
      setProjects(next);
      if (activeProjectName && activeProjectName.toLowerCase() === name.toLowerCase()) {
        setActiveProjectName(null);
      }
      if (selectedSavedName && selectedSavedName.toLowerCase() === name.toLowerCase()) {
        setSelectedSavedName('');
      }
      setStatusMessage(t.projects.messages.deleteSuccess(name));
    },
    [activeProjectName, selectedSavedName, t.projects.messages]
  );

  const handleExportJson = React.useCallback(() => {
    const payload = serializePanelModel(panelModel);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage(t.projects.messages.jsonExport);
  }, [panelModel, projectName, t.projects.messages]);

  const handleImportJson = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      file
        .text()
        .then((text) => {
          const model = deserializePanelModel(text);
          setModel(model);
          clearHistory();
          setProjectName(file.name.replace(/\.json$/i, ''));
          setSelectedElementId(null);
          setPlacementType(null);
          resetView();
          setStatusMessage(t.projects.messages.importSuccess(file.name));
        })
        .catch(() => {
          setStatusMessage(t.projects.messages.importError);
        })
        .finally(() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });
    },
    [clearHistory, resetView, setModel, t.projects.messages]
  );

  const handleExportPng = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setStatusMessage(t.projects.messages.pngError);
      return;
    }
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}.png`;
    link.href = url;
    link.click();
    setStatusMessage(t.projects.messages.pngSuccess);
  }, [projectName, t.projects.messages]);

  const handleExportSvg = React.useCallback(() => {
    const svg = buildPanelSvg(panelModel, mountingHoles, {
      stroke: '#f5f3f0',
      panelStroke: '#f5f3f0',
      background: null,
      strokeWidth: 0.8
    });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = (projectName || 'panel').trim().replace(/\s+/g, '-');
    link.download = `${baseName || 'panel'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage(t.projects.messages.svgExport);
  }, [mountingHoles, panelModel, projectName, t.projects.messages]);

  const handleReset = React.useCallback(() => {
    setModel({
      dimensions: createPanelDimensions(10),
      elements: [],
      options: { ...DEFAULT_PANEL_OPTIONS }
    });
    clearHistory();
    futureRef.current = [];
    setPlacementType(null);
    setSelectedElementId(null);
    setProjectName(t.projects.defaultName);
    setStatusMessage(t.projects.messages.reset);
    resetView();
  }, [
    clearHistory,
    resetView,
    setModel,
    setPlacementType,
    setSelectedElementId,
    t.projects.defaultName,
    t.projects.messages.reset
  ]);

  const handleMoveStart = React.useCallback(() => {
    moveHistoryPushedRef.current = false;
  }, []);

  const handleMoveEnd = React.useCallback(() => {
    moveHistoryPushedRef.current = false;
  }, []);

  const handleUndo = React.useCallback(() => {
    const previous = historyRef.current.pop();
    const current = usePanelStore.getState().model;
    if (!previous) {
      return;
    }
    const snapshot = JSON.parse(JSON.stringify(current)) as PanelModel;
    futureRef.current.push(snapshot);
    setModel(previous);
    setSelectedElementId(null);
  }, [setModel, setSelectedElementId]);

  const handleRedo = React.useCallback(() => {
    const next = futureRef.current.pop();
    const current = usePanelStore.getState().model;
    if (!next) {
      return;
    }
    const snapshot = JSON.parse(JSON.stringify(current)) as PanelModel;
    historyRef.current.push(snapshot);
    setModel(next);
    setSelectedElementId(null);
  }, [setModel, setSelectedElementId]);

  const handlePlaceElement = React.useCallback(
    (type: PanelElementType, positionMm: Vector2) => {
      let newId = '';
      updatePanelModel((prev) => {
        const element: PanelElement = createPanelElement(type, positionMm);
        newId = element.id;
        return {
          ...prev,
          elements: [...prev.elements, element]
        };
      });
      return newId;
    },
    [updatePanelModel]
  );

  const handleMoveElement = React.useCallback(
    (elementId: string, positionMm: Vector2) => {
      if (!moveHistoryPushedRef.current) {
        const current = usePanelStore.getState().model;
        pushHistory(current);
        futureRef.current = [];
        moveHistoryPushedRef.current = true;
      }
      updatePanelModel(
        (prev) => ({
          ...prev,
          elements: prev.elements.map((element) =>
            element.id === elementId ? { ...element, positionMm } : element
          )
        }),
        { skipHistory: true }
      );
    },
    [pushHistory, updatePanelModel]
  );

  const handleUpdateElement = React.useCallback(
    (elementId: string, updater: (element: PanelElement) => PanelElement) => {
      updatePanelModel((prev) => ({
        ...prev,
        elements: prev.elements.map((element) =>
          element.id === elementId ? updater(element) : element
        )
      }));
    },
    [updatePanelModel]
  );

  const handleUpdateProperties = React.useCallback(
    (elementId: string, properties: PanelElement['properties']) => {
      updatePanelModel((prev) => ({
        ...prev,
        elements: prev.elements.map((element) =>
          element.id === elementId
            ? withElementProperties(element, properties)
            : element
        )
      }));
    },
    [updatePanelModel]
  );

  const handleRemoveElement = React.useCallback(
    (elementId: string) => {
      updatePanelModel((prev) => ({
        ...prev,
        elements: prev.elements.filter((element) => element.id !== elementId)
      }));
      if (usePanelStore.getState().selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [setSelectedElementId, updatePanelModel]
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
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleRedo, handleRemoveElement, handleUndo, selectedElementId]);

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
            onMoveStart={handleMoveStart}
            onMoveEnd={handleMoveEnd}
            onZoomChange={handleZoomChange}
            onPanChange={handlePanChange}
            onSelectElement={setSelectedElementId}
            displayOptions={panelModel.options}
            selectedElementId={selectedElementId}
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
                Reset design
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
                  handleMoveElement(selectedElement.id, positionMm);
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
