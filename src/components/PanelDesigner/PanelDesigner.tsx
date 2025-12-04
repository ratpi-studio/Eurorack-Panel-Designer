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
import { StlPreview } from '@components/StlPreview/StlPreview';
import { type ExportFormat } from '@lib/exportPreferences';
import { usePanelStore } from '@store/panelStore';
import { usePanelHistory } from '@store/usePanelHistory';
import { useProjects } from '@store/useProjects';
import toast from 'react-hot-toast';
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
  const selectedElementIds = usePanelStore((state) => state.selectedElementIds);
  const setSelectedElementIds = usePanelStore((state) => state.setSelectedElementIds);
  const addSelectedElements = usePanelStore((state) => state.addSelectedElements);
  const toggleElementSelection = usePanelStore((state) => state.toggleElementSelection);
  const clearSelection = usePanelStore((state) => state.clearSelection);
  const draftProperties = usePanelStore((state) => state.draftProperties);
  const setDraftProperties = usePanelStore((state) => state.setDraftProperties);
  const [zoom, setZoom] = React.useState(DEFAULT_ZOOM);
  const [pan, setPan] = React.useState<Vector2>({ ...DEFAULT_PAN });
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);
  const [isStlModalOpen, setIsStlModalOpen] = React.useState(false);
  const [stlThicknessInput, setStlThicknessInput] = React.useState('2');
  const [isCompact, setIsCompact] = React.useState(false);
  const [showLeftPanel, setShowLeftPanel] = React.useState(true);
  const [showRightPanel, setShowRightPanel] = React.useState(true);
  const previewThickness = React.useMemo(() => {
    const parsed = Number.parseFloat(stlThicknessInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 2;
    }
    return parsed;
  }, [stlThicknessInput]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia('(max-width: 1200px)');
    const handleChange = () => {
      const compact = media.matches;
      setIsCompact(compact);
      if (compact) {
        setShowLeftPanel(false);
        setShowRightPanel(false);
      } else {
        setShowLeftPanel(true);
        setShowRightPanel(true);
      }
    };
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const {
    clearHistory,
    updateModel,
    undo,
    redo,
    beginMove,
    endMove,
    addElement,
    moveElement,
    moveElements,
    updateElement,
    updateElementProperties,
    removeElement,
    removeElements
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
      clearSelection();
    },
    [clearSelection, updateModel]
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
      clearSelection();
    },
    [clearSelection, updateModel]
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
    handleExportStl,
    handleExportKicadSvg,
    handleExportKicadPcb,
    exportFormat,
    setExportFormat,
    handleReset
  } = useProjects({
    canvasRef,
    mountingHoles,
    resetView,
    clearHistory
  });

  const leftVisible = !isCompact || showLeftPanel;
  const rightVisible = !isCompact || showRightPanel;
  const canvasSectionClass = isCompact ? styles.canvasSectionCompact : styles.canvasSection;

  React.useEffect(() => {
    if (!statusMessage) {
      return;
    }
    const { message, variant } = statusMessage;
    const toastId = `status-${variant}-${message}`;
    if (variant === 'error') {
      toast.error(message, { id: toastId });
      return;
    }
    if (variant === 'success') {
      toast.success(message, { id: toastId });
      return;
    }
    toast(message, { id: toastId });
  }, [statusMessage]);

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

  const handleRemoveSelection = React.useCallback(() => {
    if (!selectedElementIds.length) {
      return;
    }
    if (selectedElementIds.length === 1) {
      handleRemoveElement(selectedElementIds[0]);
      return;
    }
    removeElements(selectedElementIds);
  }, [handleRemoveElement, removeElements, selectedElementIds]);

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
        clearSelection();
        return;
      }

      if (!isEditingField && (event.key === 'Backspace' || event.key === 'Delete')) {
        if (selectedElementIds.length > 0) {
          event.preventDefault();
          handleRemoveSelection();
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
  }, [clearSelection, handleRemoveSelection, redo, selectedElementIds.length, setPlacementType, undo]);

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
      clearSelection();
      setPlacementType(type);
    },
    [clearSelection, setPlacementType]
  );

  const exportButtonLabel = React.useMemo(() => {
    switch (exportFormat) {
      case 'png':
        return t.projects.exportPng;
      case 'stl':
        return t.projects.exportStl;
      case 'kicadSvg':
        return t.projects.exportKicadSvg;
      case 'kicadPcb':
        return t.projects.exportKicadPcb;
      case 'svg':
      default:
        return t.projects.exportSvg;
    }
  }, [
    exportFormat,
    t.projects.exportKicadPcb,
    t.projects.exportKicadSvg,
    t.projects.exportPng,
    t.projects.exportStl,
    t.projects.exportSvg
  ]);

  const handleExportClick = React.useCallback(() => {
    switch (exportFormat) {
      case 'png':
        handleExportPng();
        return;
      case 'stl':
        setIsStlModalOpen(true);
        return;
      case 'kicadSvg':
        handleExportKicadSvg();
        return;
      case 'kicadPcb':
        handleExportKicadPcb();
        return;
      case 'svg':
      default:
        handleExportSvg();
    }
  }, [
    exportFormat,
    handleExportKicadPcb,
    handleExportKicadSvg,
    handleExportPng,
    handleExportSvg
  ]);

  const handleSelectExportFormat = React.useCallback(
    (format: ExportFormat) => {
      setExportFormat(format);
      setIsExportMenuOpen(false);

      switch (format) {
        case 'png':
          handleExportPng();
          return;
        case 'stl':
          setIsStlModalOpen(true);
          return;
        case 'kicadSvg':
          handleExportKicadSvg();
          return;
        case 'kicadPcb':
          handleExportKicadPcb();
          return;
        case 'svg':
        default:
          handleExportSvg();
      }
    },
    [
      handleExportKicadPcb,
      handleExportKicadSvg,
      handleExportPng,
      handleExportSvg,
      setExportFormat
    ]
  );

  const handleConfirmStlExport = React.useCallback(() => {
    const thickness = Number.parseFloat(stlThicknessInput);
    if (!Number.isFinite(thickness) || thickness <= 0) {
      return;
    }
    handleExportStl(thickness);
    setIsStlModalOpen(false);
  }, [handleExportStl, stlThicknessInput]);

  const handleCancelStlExport = React.useCallback(() => {
    setIsStlModalOpen(false);
  }, []);

  return (
    <>
      <main className={styles.page}>
        <section className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <img src="/images/logo.svg" alt={t.app.title} className={styles.logo} />
          </div>
          <div className={styles.headerActions}>
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
            <a
              className={styles.supportLink}
              href="https://ko-fi.com/T6T01PMWCO"
              target="_blank"
              rel="noreferrer"
              aria-label="Support the project on Ko-fi"
            >
              <img
                className={styles.supportImage}
                src="/images/kofi5.png"
                alt="Buy me a coffee on Ko-fi"
              />
            </a>
          </div>
        </div>
        </section>
        <section className={canvasSectionClass}>
        {leftVisible ? (
          <div
            className={`${styles.leftColumn} ${
              isCompact
                ? `${styles.drawer} ${styles.drawerLeft} ${showLeftPanel ? styles.drawerOpen : ''}`
                : ''
            }`}
          >
            <div className={styles.sectionStack}>
              {isCompact ? (
                <div className={styles.drawerHeader}>
                  <div className={styles.cardTitle}>{t.palette.title}</div>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setShowLeftPanel(false)}
                  >
                    Close
                  </button>
                </div>
              ) : null}
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
        ) : null}
        <div className={styles.canvasColumn}>
          {isCompact ? (
            <div className={styles.compactToggleBar}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setShowLeftPanel((prev) => !prev);
                  setShowRightPanel(false);
                }}
              >
                Tools
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setShowRightPanel((prev) => !prev);
                  setShowLeftPanel(false);
                }}
              >
                Properties
              </button>
            </div>
          ) : null}
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
            onMoveElements={moveElements}
            onMoveStart={beginMove}
            onMoveEnd={endMove}
            onZoomChange={handleZoomChange}
            onPanChange={handlePanChange}
            onSelectElement={setSelectedElementId}
            onAddSelectedElements={addSelectedElements}
            onSelectElements={setSelectedElementIds}
            onToggleElementSelection={toggleElementSelection}
            onClearSelection={clearSelection}
            displayOptions={panelModel.options}
            selectedElementIds={selectedElementIds}
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
        {rightVisible ? (
          <aside
            className={`${styles.rightColumn} ${
              isCompact
                ? `${styles.drawer} ${styles.drawerRight} ${showRightPanel ? styles.drawerOpen : ''}`
                : ''
            }`}
          >
            <div className={styles.card}>
              {isCompact ? (
                <div className={styles.drawerHeader}>
                  <div className={styles.cardTitle}>{t.projects.title}</div>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setShowRightPanel(false)}
                  >
                    Close
                  </button>
                </div>
              ) : null}
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
                <div className={styles.exportSplitButton}>
                  <button
                    type="button"
                    className={styles.exportSplitMain}
                    onClick={handleExportClick}
                  >
                    {exportButtonLabel}
                  </button>
                  <button
                    type="button"
                    aria-label={t.projects.exportMenuLabel}
                    className={styles.exportSplitToggle}
                    onClick={() => setIsExportMenuOpen((open) => !open)}
                  >
                    ▾
                  </button>
                  {isExportMenuOpen ? (
                    <div className={styles.exportMenu}>
                      <button
                        type="button"
                        className={styles.exportMenuItem}
                        onClick={() => handleSelectExportFormat('svg')}
                      >
                        {t.projects.exportSvg}
                      </button>
                      <button
                        type="button"
                        className={styles.exportMenuItem}
                        onClick={() => handleSelectExportFormat('png')}
                      >
                        {t.projects.exportPng}
                      </button>
                      <button
                        type="button"
                        className={styles.exportMenuItem}
                        onClick={() => handleSelectExportFormat('kicadSvg')}
                      >
                        {t.projects.exportKicadSvg}
                      </button>
                      <button
                        type="button"
                        className={styles.exportMenuItem}
                        onClick={() => handleSelectExportFormat('kicadPcb')}
                      >
                        {t.projects.exportKicadPcb}
                      </button>
                      <button
                        type="button"
                        className={styles.exportMenuItem}
                        onClick={() => handleSelectExportFormat('stl')}
                      >
                        {t.projects.exportStl}
                      </button>
                    </div>
                  ) : null}
                </div>
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
                selectionCount={selectedElementIds.length}
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
                    handleRemoveSelection();
                  } else {
                    setPlacementType(null);
                  }
                }}
              />
            </div>
          </aside>
        ) : null}
        </section>
      </main>
      {isStlModalOpen ? (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stl-export-title"
          onClick={handleCancelStlExport}
        >
          <div
            className={styles.modal}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <h2 id="stl-export-title" className={styles.modalTitle}>
              {t.projects.stlDialog.title}
            </h2>
            <p className={styles.modalDescription}>{t.projects.stlDialog.description}</p>
            <label className={styles.fieldRow}>
              <span className={styles.label}>{t.projects.stlDialog.thicknessLabel}</span>
              <input
                className={styles.textInput}
                type="number"
                min={0}
                step={0.1}
                value={stlThicknessInput}
                onChange={(event) => setStlThicknessInput(event.target.value)}
              />
              <span className={styles.hint}>{t.projects.stlDialog.thicknessHint}</span>
            </label>
            <div className={styles.previewSection}>
              <span className={styles.label}>{t.projects.stlDialog.previewLabel}</span>
              <StlPreview
                model={panelModel}
                mountingHoles={mountingHoles}
                thicknessMm={previewThickness}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleCancelStlExport}
              >
                {t.projects.stlDialog.cancel}
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleConfirmStlExport}
              >
                {t.projects.stlDialog.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
