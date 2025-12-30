import React from 'react';

import { PanelCanvas } from '@components/PanelCanvas/PanelCanvas';
import { LeftPanel } from '@components/PanelDesigner/LeftPanel';
import { PanelHeader } from '@components/PanelDesigner/PanelHeader';
import { RightPanel } from '@components/PanelDesigner/RightPanel';
import { useResponsivePanels } from '@components/PanelDesigner/useResponsivePanels';
import { useI18n } from '@i18n/I18nContext';
import { createPanelElement } from '@lib/elements';
import { generateMountingHoles } from '@lib/mountingHoles';
import {
  PanelElementType,
  withElementProperties,
  type ElementMountingHoleConfig,
  type PanelElement,
  type MountingHole,
  type MountingHoleConfig,
  type PanelModel,
  type Vector2
} from '@lib/panelTypes';
import { createPanelDimensions, hpToMm, mmToCm } from '@lib/units';
import { changelogEntries } from '@lib/changelog';
import { computeElementMountingHoles } from '@lib/elementMountingHoles';
import type { ReferenceImage } from '@lib/referenceImage';
import { computeClearanceLines, applyClearanceLinePosition } from '@lib/clearance';
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
const LazyStlPreview = React.lazy(() =>
  import('@components/StlPreview/StlPreview').then((module) => ({
    default: module.StlPreview
  }))
);

function computeMountingHoles(model: PanelModel): MountingHole[] {
  return generateMountingHoles({
    widthHp: model.dimensions.widthHp,
    widthMm: model.dimensions.widthMm,
    heightMm: model.dimensions.heightMm,
    config: model.mountingHoleConfig
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
  const clearElementSelection = usePanelStore((state) => state.clearSelection);
  const draftProperties = usePanelStore((state) => state.draftProperties);
  const setDraftProperties = usePanelStore((state) => state.setDraftProperties);
  const referenceImage = usePanelStore((state) => state.referenceImage);
  const referenceImageSelected = usePanelStore((state) => state.referenceImageSelected);
  const setReferenceImage = usePanelStore((state) => state.setReferenceImage);
  const updateReferenceImage = usePanelStore((state) => state.updateReferenceImage);
  const selectReferenceImage = usePanelStore((state) => state.selectReferenceImage);
  const [zoom, setZoom] = React.useState(DEFAULT_ZOOM);
  const [pan, setPan] = React.useState<Vector2>({ ...DEFAULT_PAN });
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);
  const [isStlModalOpen, setIsStlModalOpen] = React.useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [stlThicknessInput, setStlThicknessInput] = React.useState('2');
  const { isCompact, showLeftPanel, showRightPanel, setShowLeftPanel, setShowRightPanel } =
    useResponsivePanels();
  const [mountingHolesSelected, setMountingHolesSelected] = React.useState(false);
  const previewThickness = React.useMemo(() => {
    const parsed = Number.parseFloat(stlThicknessInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 2;
    }
    return parsed;
  }, [stlThicknessInput]);

  const handleClearMountingHoleSelection = React.useCallback(() => {
    setMountingHolesSelected(false);
  }, []);

  const handleClearReferenceSelection = React.useCallback(() => {
    selectReferenceImage(false);
  }, [selectReferenceImage]);

  const clearSelection = React.useCallback(() => {
    clearElementSelection();
    handleClearMountingHoleSelection();
    handleClearReferenceSelection();
  }, [clearElementSelection, handleClearMountingHoleSelection, handleClearReferenceSelection]);

  const handleSelectMountingHoles = React.useCallback(() => {
    clearElementSelection();
    setPlacementType(null);
    setMountingHolesSelected(true);
    selectReferenceImage(false);
  }, [clearElementSelection, selectReferenceImage, setPlacementType]);

  const handleSelectReferenceImage = React.useCallback(() => {
    clearElementSelection();
    setPlacementType(null);
    setMountingHolesSelected(false);
    selectReferenceImage(true);
  }, [clearElementSelection, selectReferenceImage, setPlacementType]);

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
        [panelModel]
      );

  const elementMountingHoles = React.useMemo(
    () => computeElementMountingHoles(panelModel.elements, panelModel.elementHoleConfig),
    [panelModel.elements, panelModel.elementHoleConfig]
  );

  const clearanceLines = React.useMemo(
    () => computeClearanceLines(panelModel.clearance, panelModel.dimensions.heightMm),
    [panelModel.clearance, panelModel.dimensions.heightMm]
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

  const combinedMountingHoles = React.useMemo(
    () =>
      elementMountingHoles.length ? [...mountingHoles, ...elementMountingHoles] : mountingHoles,
    [elementMountingHoles, mountingHoles]
  );

  const {
    projectName,
    setProjectName,
    projects,
    hasUnsavedChanges,
    selectedSavedName,
    setSelectedSavedName,
    statusMessage,
    fileInputRef,
    handleSaveProject,
    handleLoadProject,
    handleDeleteProject,
    handleUndoDeleteProject,
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
    mountingHoles: combinedMountingHoles,
    resetView,
    clearHistory
  });

  const projectNameBeforeEditRef = React.useRef(projectName);
  const projectNameInputRef = React.useRef<HTMLInputElement | null>(null);
  const referenceImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const isClearanceDragActiveRef = React.useRef(false);
  const clearanceHistoryPushedRef = React.useRef(false);
  const [isEditingProjectName, setIsEditingProjectName] = React.useState(false);

  const resolvedProjectName = React.useMemo(() => {
    const trimmed = projectName.trim();
    return trimmed || t.projects.defaultName;
  }, [projectName, t.projects.defaultName]);

  React.useEffect(() => {
    if (!isEditingProjectName) {
      return;
    }
    const input = projectNameInputRef.current;
    if (!input) {
      return;
    }
    input.focus();
    input.select();
  }, [isEditingProjectName]);

  const handleStartEditingProjectName = React.useCallback(() => {
    projectNameBeforeEditRef.current = resolvedProjectName;
    setIsEditingProjectName(true);
  }, [resolvedProjectName]);

  const handleCommitProjectName = React.useCallback(() => {
    const trimmed = projectName.trim();
    setProjectName(trimmed || t.projects.defaultName);
    setIsEditingProjectName(false);
  }, [projectName, setProjectName, t.projects.defaultName]);

  const handleCancelProjectNameEdit = React.useCallback(() => {
    setProjectName(projectNameBeforeEditRef.current || t.projects.defaultName);
    setIsEditingProjectName(false);
  }, [setProjectName, t.projects.defaultName]);

  const handleProjectNameKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleCommitProjectName();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancelProjectNameEdit();
      }
    },
    [handleCancelProjectNameEdit, handleCommitProjectName]
  );

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

  const handleRemoveReferenceImage = React.useCallback(() => {
    setReferenceImage(null);
    selectReferenceImage(false);
  }, [selectReferenceImage, setReferenceImage]);

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
        if (referenceImageSelected && referenceImage) {
          event.preventDefault();
          handleRemoveReferenceImage();
          return;
        }
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
          if (handleUndoDeleteProject()) {
            return;
          }
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    clearSelection,
    handleRemoveSelection,
    handleRemoveReferenceImage,
    handleUndoDeleteProject,
    referenceImage,
    referenceImageSelected,
    redo,
    selectedElementIds.length,
    setPlacementType,
    undo
  ]);

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

  const handleSelectedElementHoleRotationChange = React.useCallback(
    (rotationDeg: number) => {
      const target = selectedElement;
      if (!target) {
        return;
      }
      handleUpdateElement(target.id, (element) => ({
        ...element,
        mountingHoleRotationDeg: rotationDeg
      }));
    },
    [handleUpdateElement, selectedElement]
  );

  const handleSelectPaletteType = React.useCallback(
    (type: PanelElementType | null) => {
      clearSelection();
      setPlacementType(type);
    },
    [clearSelection, setPlacementType]
  );

  const handleImportReferenceImageClick = React.useCallback(() => {
    referenceImageInputRef.current?.click();
  }, []);

  const handleReferenceFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setPlacementType(null);
      setMountingHolesSelected(false);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const aspect = img.width > 0 && img.height > 0 ? img.width / img.height : 1;
          const maxWidth = panelModel.dimensions.widthMm * 0.8;
          const maxHeight = panelModel.dimensions.heightMm * 0.8;
          let widthMm = Math.min(maxWidth, Math.max(40, panelModel.dimensions.widthMm * 0.6));
          let heightMm = widthMm / aspect;
          if (heightMm > maxHeight) {
            heightMm = maxHeight;
            widthMm = heightMm * aspect;
          }
          const positionMm = {
            x: panelModel.dimensions.widthMm / 2,
            y: panelModel.dimensions.heightMm / 2
          };
          setReferenceImage({
            dataUrl,
            positionMm,
            widthMm,
            heightMm,
            rotationDeg: 0,
            opacity: 0.35,
            naturalWidth: img.width,
            naturalHeight: img.height
          });
          selectReferenceImage(true);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    [
      panelModel.dimensions.heightMm,
      panelModel.dimensions.widthMm,
      selectReferenceImage,
      setReferenceImage,
      setPlacementType,
      setMountingHolesSelected
    ]
  );

  const handleReferenceImageChange = React.useCallback(
    (updates: Partial<ReferenceImage>) => {
      updateReferenceImage(updates);
    },
    [updateReferenceImage]
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

  const handleMountingHoleConfigChange = React.useCallback(
    (updates: Partial<MountingHoleConfig>) => {
      updateModel((prev) => ({
        ...prev,
        mountingHoleConfig: {
          ...prev.mountingHoleConfig,
          ...updates
        }
      }));
    },
    [updateModel]
  );

  const handleElementHoleConfigChange = React.useCallback(
    (updates: Partial<ElementMountingHoleConfig>) => {
      updateModel((prev) => ({
        ...prev,
        elementHoleConfig: {
          ...prev.elementHoleConfig,
          ...updates
        }
      }));
    },
    [updateModel]
  );

  const handleClearanceLineChange = React.useCallback(
    (line: 'top' | 'bottom', positionMm: number) => {
      updateModel(
        (prev) => ({
          ...prev,
          clearance: applyClearanceLinePosition(
            prev.clearance,
            prev.dimensions.heightMm,
            line,
            positionMm
          )
        }),
        {
          skipHistory: isClearanceDragActiveRef.current && clearanceHistoryPushedRef.current
        }
      );

      if (isClearanceDragActiveRef.current && !clearanceHistoryPushedRef.current) {
        clearanceHistoryPushedRef.current = true;
      }
    },
    [updateModel]
  );

  const handleClearanceDragStart = React.useCallback(() => {
    isClearanceDragActiveRef.current = true;
    clearanceHistoryPushedRef.current = false;
  }, []);

  const handleClearanceDragEnd = React.useCallback(() => {
    isClearanceDragActiveRef.current = false;
    clearanceHistoryPushedRef.current = false;
  }, []);

  const openConfirmDialog = React.useCallback((message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  }, []);

  const openChangelog = React.useCallback(() => {
    setIsChangelogOpen(true);
  }, []);

  const closeChangelog = React.useCallback(() => {
    setIsChangelogOpen(false);
  }, []);

  const handleConfirmYes = React.useCallback(() => {
    if (confirmDialog) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  }, [confirmDialog]);

  const handleConfirmNo = React.useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const handleNewProject = React.useCallback(() => {
    if (hasUnsavedChanges) {
      handleSaveProject();
    }
    handleReset();
  }, [handleReset, handleSaveProject, hasUnsavedChanges]);

  const handleDeleteOrReset = React.useCallback(() => {
    if (selectedSavedName) {
      const name = selectedSavedName;
      openConfirmDialog(t.projects.messages.confirmDeleteSelected(name), () =>
        handleDeleteProject(name)
      );
    } else {
      openConfirmDialog(t.projects.messages.confirmReset, () => handleReset());
    }
  }, [handleDeleteProject, handleReset, openConfirmDialog, selectedSavedName, t.projects.messages]);

  const handleToggleExportMenu = React.useCallback(() => {
    setIsExportMenuOpen((open) => !open);
  }, []);

  const handleChangeElementPosition = React.useCallback(
    (positionMm: Vector2) => {
      if (!selectedElement) {
        return;
      }
      updateElement(selectedElement.id, (element) => ({
        ...element,
        positionMm
      }));
    },
    [selectedElement, updateElement]
  );

  const handleChangeElementRotation = React.useCallback(
    (rotationDeg: number) => {
      if (!selectedElement) {
        return;
      }
      handleUpdateElement(selectedElement.id, (element) => ({
        ...element,
        rotationDeg
      }));
    },
    [handleUpdateElement, selectedElement]
  );

  const handleChangeElementProperties = React.useCallback(
    (properties: PanelElement['properties']) => {
      if (selectedElement) {
        handleUpdateProperties(selectedElement.id, properties);
        return;
      }
      if (placementType) {
        setDraftProperties(placementType, properties);
      }
    },
    [handleUpdateProperties, placementType, selectedElement, setDraftProperties]
  );

  const handleRemoveElementOrPlacement = React.useCallback(() => {
    if (selectedElement) {
      handleRemoveSelection();
      return;
    }
    setPlacementType(null);
  }, [handleRemoveSelection, selectedElement, setPlacementType]);

  const handleToggleElementHoleEnabled = React.useCallback(
    (enabled: boolean) => {
      if (!selectedElement) {
        return;
      }
      handleUpdateElement(selectedElement.id, (element) => ({
        ...element,
        mountingHolesEnabled: enabled
      }));
    },
    [handleUpdateElement, selectedElement]
  );

  const projectPanelProps = {
    t,
    resolvedProjectName,
    projectName,
    isEditingProjectName,
    hasUnsavedChanges,
    projectNameInputRef,
    onProjectNameChange: (value: string) => setProjectName(value),
    onStartEditingProjectName: handleStartEditingProjectName,
    onCommitProjectName: handleCommitProjectName,
    onProjectNameKeyDown: handleProjectNameKeyDown,
    selectedSavedName,
    projects,
    onSelectSavedName: setSelectedSavedName,
    onLoadSelected: () => selectedSavedName && handleLoadProject(selectedSavedName),
    onNewProject: handleNewProject,
    onSaveProject: handleSaveProject,
    onDeleteOrReset: handleDeleteOrReset,
    onImportJsonClick: () => fileInputRef.current?.click(),
    onImportReferenceImageClick: handleImportReferenceImageClick,
    fileInputRef,
    referenceImageInputRef,
    onImportJson: handleImportJson,
    onReferenceFileChange: handleReferenceFileChange,
    exportButtonLabel,
    isExportMenuOpen,
    onToggleExportMenu: handleToggleExportMenu,
    onExportClick: handleExportClick,
    onExportJson: handleExportJson,
    onSelectExportFormat: handleSelectExportFormat
  };

  const propertiesPanelProps = {
    t,
    panelModel,
    displayOptions: panelModel.options,
    mountingHolesSelected,
    referenceImage,
    referenceImageSelected,
    elementForProperties,
    selectedElement,
    selectedElementCount: selectedElementIds.length,
    placementType,
    snapEnabled: panelModel.options.snapToGrid,
    onDisplayOptionsChange: handleDisplayOptionsChange,
    onResetView: resetView,
    onMountingHoleConfigChange: handleMountingHoleConfigChange,
    onClearMountingHoleSelection: handleClearMountingHoleSelection,
    onReferenceImageChange: handleReferenceImageChange,
    onImportReferenceImageClick: handleImportReferenceImageClick,
    onRemoveReferenceImage: handleRemoveReferenceImage,
    onChangePosition: handleChangeElementPosition,
    onChangeRotation: handleChangeElementRotation,
    onChangeProperties: handleChangeElementProperties,
    onRemove: handleRemoveElementOrPlacement,
    onChangeDraftProperties: setDraftProperties,
    onChangeElementHoleConfig: handleElementHoleConfigChange,
    onChangeElementHoleRotation: handleSelectedElementHoleRotationChange,
    onToggleElementHoleEnabled: handleToggleElementHoleEnabled
  };

  return (
    <>
      <main className={styles.page}>
        <PanelHeader
          title={t.app.title}
          changelogLabel={t.changelog.buttonLabel}
          onOpenChangelog={openChangelog}
        />
        <section className={canvasSectionClass}>
          {leftVisible ? (
            <LeftPanel
              t={t}
              panelModel={panelModel}
              placementType={placementType}
              isCompact={isCompact}
              showPanel={showLeftPanel}
              onClose={() => setShowLeftPanel(false)}
              onChangeWidthMm={(nextMm) => {
                handleSetWidthFromMm(nextMm);
                resetView();
              }}
              onChangeWidthHp={(nextHp) => {
                handleSetWidthFromHp(nextHp);
                resetView();
              }}
              onSelectPaletteType={handleSelectPaletteType}
            />
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
              elementMountingHoles={elementMountingHoles}
              referenceImage={referenceImage}
              referenceImageSelected={referenceImageSelected}
              mountingHolesSelected={mountingHolesSelected}
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
              onSelectReferenceImage={handleSelectReferenceImage}
              onClearReferenceSelection={handleClearReferenceSelection}
              onUpdateReferenceImage={handleReferenceImageChange}
              onSelectMountingHoles={handleSelectMountingHoles}
              onClearMountingHoleSelection={handleClearMountingHoleSelection}
              displayOptions={panelModel.options}
              selectedElementIds={selectedElementIds}
              draftProperties={draftProperties}
              clearanceLines={clearanceLines}
              onClearanceLineChange={handleClearanceLineChange}
              onClearanceLineDragStart={handleClearanceDragStart}
              onClearanceLineDragEnd={handleClearanceDragEnd}
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
            <RightPanel
              isCompact={isCompact}
              showPanel={showRightPanel}
              onClose={() => setShowRightPanel(false)}
              projectPanel={projectPanelProps}
              propertiesPanel={propertiesPanelProps}
            />
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
              <React.Suspense
                fallback={
                  <div className={styles.previewFallback}>
                    {t.projects.stlDialog.previewLoading}
                  </div>
                }
              >
                <LazyStlPreview
                  model={panelModel}
                  mountingHoles={mountingHoles}
                  thicknessMm={previewThickness}
                />
              </React.Suspense>
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
      {confirmDialog ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div
            className={styles.modal}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <p className={styles.modalDescription}>{confirmDialog.message}</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={handleConfirmNo}>
                {t.projects.messages.confirmNo}
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleConfirmYes}>
                {t.projects.messages.confirmYes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isChangelogOpen ? (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="changelog-title"
          onClick={closeChangelog}
        >
          <div
            className={styles.modal}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <h2 id="changelog-title" className={styles.modalTitle}>
              {t.changelog.title}
            </h2>
            <p className={styles.modalDescription}>{t.changelog.description}</p>
            <div className={styles.changelogList}>
              {changelogEntries.map((entry) => (
                <div key={entry.version} className={styles.changelogEntry}>
                  <div className={styles.changelogEntryMeta}>
                    <span className={styles.changelogVersion}>v{entry.version}</span>
                    <span className={styles.changelogDate}>{entry.date}</span>
                  </div>
                  <ul className={styles.changelogHighlights}>
                    {entry.highlights.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <a
                className={styles.changelogLink}
                href="/CHANGELOG.md"
                target="_blank"
                rel="noreferrer"
              >
                {t.changelog.viewFull}
              </a>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={closeChangelog}>
                {t.changelog.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
