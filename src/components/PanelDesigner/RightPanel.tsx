import {
  Box,
  ChevronDown,
  CircuitBoard,
  Download,
  FileBraces,
  FileCode,
  FileImage,
  FilePlus2,
  FileUp,
  FolderOpen,
  ImagePlus,
  Layers,
  MonitorCog,
  Pencil,
  Save,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import React from "react";

import {
  ComponentList,
  useElementTypeLabels,
  type ComponentListProps,
} from "@components/ComponentList/ComponentList";
import { DisplayOptions } from "@components/DisplayOptions/DisplayOptions";
import { ElementMountingHoles } from "@components/ElementMountingHoles/ElementMountingHoles";
import { ElementProperties } from "@components/ElementProperties/ElementProperties";
import { IconButton } from "@components/IconButton/IconButton";
import { MountingHoleSettings } from "@components/MountingHoleSettings/MountingHoleSettings";
import { ReferenceImageControls } from "@components/ReferenceImageControls/ReferenceImageControls";
import { iconLabelProps } from "@components/Tooltip/TooltipLayer";
import { describeComponents } from "@lib/componentList";
import { findCrowdedElements } from "@lib/elementParts";
import { getVisibleElements } from "@lib/elementVisibility";
import type { ExportFormat, RightPanelTab } from "@lib/preferences";
import {
  PanelElementType,
  type DesignReliefConfig,
  type ElementMountingHoleConfig,
  type MountingHoleConfig,
  type PanelElement,
  type PanelModel,
  type Vector2,
} from "@lib/panelTypes";
import type { ReferenceImage } from "@lib/referenceImage";
import type { StoredProject } from "@lib/storage";
import * as styles from "./PanelDesigner.css";
import type { ReturnTypeUseI18n } from "./types";

interface ProjectPanelProps {
  t: ReturnTypeUseI18n;
  resolvedProjectName: string;
  projectName: string;
  isEditingProjectName: boolean;
  hasUnsavedChanges: boolean;
  projectNameInputRef: React.RefObject<HTMLInputElement | null>;
  onProjectNameChange: (value: string) => void;
  onStartEditingProjectName: () => void;
  onCommitProjectName: () => void;
  onProjectNameKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  selectedSavedName: string;
  projects: StoredProject[];
  onSelectSavedName: (value: string) => void;
  onLoadSelected: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onDeleteOrReset: () => void;
  onImportJsonClick: () => void;
  onImportReferenceImageClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  referenceImageInputRef: React.RefObject<HTMLInputElement | null>;
  onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReferenceFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  exportFormat: ExportFormat;
  exportButtonLabel: string;
  isExportMenuOpen: boolean;
  onToggleExportMenu: () => void;
  onExportClick: () => void;
  onExportJson: () => void;
  onSelectExportFormat: (format: ExportFormat) => void;
  /** Opens the order dialog; the button is hidden when ordering is not configured. */
  onOrderPrint?: () => void;
  /** Closes the drawer the panel sits in on small screens. */
  onClose?: () => void;
}

interface PropertiesPanelProps {
  t: ReturnTypeUseI18n;
  panelModel: PanelModel;
  displayOptions: PanelModel["options"];
  mountingHolesSelected: boolean;
  referenceImage: ReferenceImage | null;
  referenceImageSelected: boolean;
  elementForProperties: PanelElement | null;
  selectedElement: PanelElement | null;
  selectedElementCount: number;
  placementType: PanelElementType | null;
  snapEnabled: boolean;
  onDisplayOptionsChange: (options: Partial<PanelModel["options"]>) => void;
  onColorsChange: (colors: { panelColor?: string; designColor?: string }) => void;
  onDesignReliefChange: (relief: Partial<DesignReliefConfig>) => void;
  onResetView: () => void;
  onMountingHoleConfigChange: (updates: Partial<MountingHoleConfig>) => void;
  onClearMountingHoleSelection: () => void;
  onReferenceImageChange: (updates: Partial<ReferenceImage>) => void;
  onImportReferenceImageClick: () => void;
  onRemoveReferenceImage: () => void;
  onChangePosition: (positionMm: Vector2) => void;
  onChangeRotation: (rotationDeg: number) => void;
  onChangeProperties: (properties: PanelElement["properties"]) => void;
  onRemove: () => void;
  onChangeDraftProperties: (type: PanelElementType, properties: PanelElement["properties"]) => void;
  onChangeElementHoleConfig: (updates: Partial<ElementMountingHoleConfig>) => void;
  onChangeElementHoleRotation: (rotationDeg: number) => void;
  onToggleElementHoleEnabled: (enabled: boolean) => void;
}

interface RightPanelProps {
  isCompact: boolean;
  showPanel: boolean;
  onClose: () => void;
  projectPanel: ProjectPanelProps;
  activeTab: RightPanelTab;
  onChangeTab: (tab: RightPanelTab) => void;
  propertiesPanel: PropertiesPanelProps;
  componentsPanel: ComponentListProps;
}

const TAB_ORDER: readonly RightPanelTab[] = ["display", "properties", "components"];
const TAB_PANEL_ID = "right-panel-tab-panel";

function ProjectPanel({
  t,
  resolvedProjectName,
  projectName,
  isEditingProjectName,
  hasUnsavedChanges,
  projectNameInputRef,
  onProjectNameChange,
  onStartEditingProjectName,
  onCommitProjectName,
  onProjectNameKeyDown,
  selectedSavedName,
  projects,
  onSelectSavedName,
  onLoadSelected,
  onNewProject,
  onSaveProject,
  onDeleteOrReset,
  onImportJsonClick,
  onImportReferenceImageClick,
  fileInputRef,
  referenceImageInputRef,
  onImportJson,
  onReferenceFileChange,
  exportFormat,
  exportButtonLabel,
  isExportMenuOpen,
  onToggleExportMenu,
  onExportClick,
  onExportJson,
  onSelectExportFormat,
  onOrderPrint,
  onClose,
}: ProjectPanelProps) {
  const exportRef = React.useRef<HTMLDivElement>(null);
  const exportMenuItems: Array<{ format: ExportFormat; label: string; Icon: LucideIcon }> = [
    { format: "svg", label: t.projects.exportSvg, Icon: FileCode },
    { format: "png", label: t.projects.exportPng, Icon: FileImage },
    { format: "kicadSvg", label: t.projects.exportKicadSvg, Icon: CircuitBoard },
    { format: "kicadPcb", label: t.projects.exportKicadPcb, Icon: CircuitBoard },
    { format: "stl", label: t.projects.exportStl, Icon: Box },
  ];

  // The export menu closes on a click elsewhere or on Escape, like any menu.
  React.useEffect(() => {
    if (!isExportMenuOpen) {
      return undefined;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !exportRef.current?.contains(event.target)) {
        onToggleExportMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onToggleExportMenu();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExportMenuOpen, onToggleExportMenu]);

  return (
    <>
      <div className={styles.projectHeader}>
        {isEditingProjectName ? (
          <input
            ref={projectNameInputRef}
            className={styles.projectNameInput}
            type="text"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            onBlur={onCommitProjectName}
            onKeyDown={onProjectNameKeyDown}
            aria-label={t.projects.nameLabel}
            placeholder={t.projects.nameLabel}
          />
        ) : (
          <button
            type="button"
            className={styles.projectNameButton}
            onClick={onStartEditingProjectName}
            data-tooltip={t.projects.editNameLabel}
          >
            <span className={styles.projectNameText}>{resolvedProjectName}</span>
            {hasUnsavedChanges ? (
              <span
                className={styles.unsavedDot}
                role="img"
                aria-label={t.projects.unsavedChanges}
              />
            ) : null}
          </button>
        )}
        <IconButton
          label={t.projects.editNameLabel}
          icon={Pencil}
          variant="ghost"
          onClick={isEditingProjectName ? onCommitProjectName : onStartEditingProjectName}
        />
        {onClose ? (
          <IconButton label={t.layout.closePanel} icon={X} variant="ghost" onClick={onClose} />
        ) : null}
      </div>

      <div className={styles.projectToolbar}>
        <div className={styles.toolbarGroup}>
          <IconButton label={t.projects.newProject} icon={FilePlus2} onClick={onNewProject} />
          <IconButton label={t.projects.save} icon={Save} onClick={onSaveProject} />
          <IconButton label={t.projects.importJson} icon={FileUp} onClick={onImportJsonClick} />
          <IconButton
            label={t.projects.importImage}
            icon={ImagePlus}
            onClick={onImportReferenceImageClick}
          />
        </div>
        <div ref={exportRef} className={styles.exportSplitButton}>
          <button
            type="button"
            className={styles.exportSplitMain}
            onClick={onExportClick}
            {...iconLabelProps(exportButtonLabel)}
          >
            <Download />
            <span>{t.projects.exportFormatShort[exportFormat]}</span>
          </button>
          <button
            type="button"
            className={styles.exportSplitToggle}
            onClick={onToggleExportMenu}
            aria-expanded={isExportMenuOpen}
            aria-haspopup="true"
            {...iconLabelProps(t.projects.exportMenuLabel)}
          >
            <ChevronDown />
          </button>
          {isExportMenuOpen ? (
            <div className={styles.exportMenu}>
              <button
                type="button"
                className={styles.exportMenuItem}
                onClick={() => {
                  onToggleExportMenu();
                  onExportJson();
                }}
              >
                <FileBraces />
                {t.projects.exportJson}
              </button>
              {exportMenuItems.map(({ format, label, Icon }) => (
                <button
                  key={format}
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => onSelectExportFormat(format)}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.savedProjectsRow}>
        <select
          className={styles.savedProjectsSelect}
          aria-label={t.projects.savedLabel}
          value={selectedSavedName}
          onChange={(event) => onSelectSavedName(event.target.value)}
        >
          <option value="">{t.projects.savedPlaceholder}</option>
          {projects.map((project) => (
            <option key={project.name} value={project.name}>
              {project.name}
            </option>
          ))}
        </select>
        <IconButton
          label={t.projects.load}
          icon={FolderOpen}
          disabled={!selectedSavedName}
          onClick={onLoadSelected}
        />
        <IconButton
          label={
            selectedSavedName ? t.projects.deleteSelected(selectedSavedName) : t.projects.reset
          }
          icon={Trash2}
          variant="danger"
          onClick={onDeleteOrReset}
        />
      </div>

      {onOrderPrint ? (
        <button type="button" className={styles.orderButton} onClick={onOrderPrint}>
          <ShoppingCart />
          {t.projects.orderPrint}
        </button>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className={styles.hiddenInput}
        onChange={onImportJson}
      />
      <input
        ref={referenceImageInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={onReferenceFileChange}
      />
    </>
  );
}

function DisplayTab({
  panelModel,
  displayOptions,
  onDisplayOptionsChange,
  onColorsChange,
  onResetView,
}: PropertiesPanelProps) {
  return (
    <DisplayOptions
      options={displayOptions}
      panelColor={panelModel.panelColor}
      designColor={panelModel.designColor}
      onChange={onDisplayOptionsChange}
      onColorsChange={onColorsChange}
      onResetView={onResetView}
    />
  );
}

function PropertiesTab({
  panelModel,
  mountingHolesSelected,
  referenceImage,
  referenceImageSelected,
  elementForProperties,
  selectedElement,
  selectedElementCount,
  placementType,
  snapEnabled,
  onColorsChange,
  onDesignReliefChange,
  onMountingHoleConfigChange,
  onClearMountingHoleSelection,
  onReferenceImageChange,
  onImportReferenceImageClick,
  onRemoveReferenceImage,
  onChangePosition,
  onChangeRotation,
  onChangeProperties,
  onRemove,
  onChangeDraftProperties,
  onChangeElementHoleConfig,
  onChangeElementHoleRotation,
  onToggleElementHoleEnabled,
}: PropertiesPanelProps) {
  const typeLabels = useElementTypeLabels();
  // The name the components list shows, so both panels call the element the same way.
  const elementName = React.useMemo(() => {
    if (!selectedElement) {
      return null;
    }
    return (
      describeComponents(panelModel.elements, typeLabels).find(
        (item) => item.id === selectedElement.id,
      )?.name ?? null
    );
  }, [panelModel.elements, selectedElement, typeLabels]);
  // Hidden elements are left out of the panel, so they crowd nothing.
  const isCrowded = React.useMemo(
    () =>
      selectedElement !== null &&
      findCrowdedElements(getVisibleElements(panelModel.elements)).has(selectedElement.id),
    [panelModel.elements, selectedElement],
  );

  if (mountingHolesSelected) {
    return (
      <MountingHoleSettings
        config={panelModel.mountingHoleConfig}
        onChange={onMountingHoleConfigChange}
        onClose={onClearMountingHoleSelection}
      />
    );
  }

  if (referenceImage && referenceImageSelected) {
    return (
      <ReferenceImageControls
        image={referenceImage}
        onChange={onReferenceImageChange}
        onReplace={onImportReferenceImageClick}
        onRemove={onRemoveReferenceImage}
      />
    );
  }

  return (
    <div className={styles.sectionStack}>
      <ElementProperties
        element={elementForProperties}
        name={elementName}
        selectionCount={selectedElementCount}
        crowded={isCrowded}
        designColor={panelModel.designColor}
        designRelief={panelModel.designRelief}
        onChangeDesignColor={(designColor) => onColorsChange({ designColor })}
        onChangeDesignRelief={onDesignReliefChange}
        onChangePosition={onChangePosition}
        onChangeRotation={onChangeRotation}
        onChangeProperties={(properties) => {
          if (selectedElement) {
            onChangeProperties(properties);
            return;
          }
          if (placementType) {
            onChangeDraftProperties(placementType, properties);
          }
        }}
        onRemove={onRemove}
      />
      {selectedElement ? (
        <ElementMountingHoles
          config={panelModel.elementHoleConfig}
          onChangeConfig={onChangeElementHoleConfig}
          onChangeElementRotation={onChangeElementHoleRotation}
          element={selectedElement}
          onToggleElementEnabled={onToggleElementHoleEnabled}
          snapEnabled={snapEnabled}
        />
      ) : null}
    </div>
  );
}

interface RightPanelTabsProps {
  t: ReturnTypeUseI18n;
  activeTab: RightPanelTab;
  componentCount: number;
  onChangeTab: (tab: RightPanelTab) => void;
}

// The display tab avoids the eye icon, which hides and shows components in their list.
const TAB_ICONS: Record<RightPanelTab, LucideIcon> = {
  display: MonitorCog,
  properties: SlidersHorizontal,
  components: Layers,
};

function RightPanelTabs({ t, activeTab, componentCount, onChangeTab }: RightPanelTabsProps) {
  const tabRefs = React.useRef<Partial<Record<RightPanelTab, HTMLButtonElement | null>>>({});
  const labels: Record<RightPanelTab, string> = {
    display: t.rightPanel.display,
    properties: t.rightPanel.properties,
    components: t.rightPanel.components,
  };

  // Arrow keys move between tabs, as in any tab list.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = TAB_ORDER.indexOf(activeTab);
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % TAB_ORDER.length
        : event.key === "ArrowLeft"
          ? (index - 1 + TAB_ORDER.length) % TAB_ORDER.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? TAB_ORDER.length - 1
              : null;
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    const nextTab = TAB_ORDER[nextIndex];
    onChangeTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={t.rightPanel.tabsLabel}
      className={styles.tabList}
      onKeyDown={handleKeyDown}
    >
      {TAB_ORDER.map((tab) => {
        const isActive = tab === activeTab;
        const Icon = TAB_ICONS[tab];
        const showCount = tab === "components" && componentCount > 0;
        return (
          <button
            key={tab}
            ref={(node) => {
              tabRefs.current[tab] = node;
            }}
            type="button"
            role="tab"
            id={`right-panel-tab-${tab}`}
            aria-selected={isActive}
            aria-controls={TAB_PANEL_ID}
            tabIndex={isActive ? 0 : -1}
            className={styles.tab[isActive ? "active" : "idle"]}
            onClick={() => onChangeTab(tab)}
            {...iconLabelProps(
              showCount ? t.rightPanel.componentsWithCount(componentCount) : labels[tab],
            )}
          >
            <Icon />
            {showCount ? (
              <span className={styles.tabCount} aria-hidden="true">
                {componentCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function RightPanel({
  isCompact,
  showPanel,
  onClose,
  projectPanel,
  activeTab,
  onChangeTab,
  propertiesPanel,
  componentsPanel,
}: RightPanelProps) {
  const containerClass = `${styles.rightColumn} ${
    isCompact ? `${styles.drawer} ${styles.drawerRight} ${showPanel ? styles.drawerOpen : ""}` : ""
  }`;

  if (isCompact && !showPanel) {
    return null;
  }

  return (
    <aside className={containerClass}>
      <div className={styles.card}>
        <ProjectPanel {...projectPanel} onClose={isCompact ? onClose : undefined} />
      </div>
      <div className={styles.card}>
        <RightPanelTabs
          t={projectPanel.t}
          activeTab={activeTab}
          componentCount={componentsPanel.elements.length}
          onChangeTab={onChangeTab}
        />
        <div
          role="tabpanel"
          id={TAB_PANEL_ID}
          aria-labelledby={`right-panel-tab-${activeTab}`}
          className={styles.tabPanel}
        >
          {activeTab === "display" ? <DisplayTab {...propertiesPanel} /> : null}
          {activeTab === "properties" ? <PropertiesTab {...propertiesPanel} /> : null}
          {activeTab === "components" ? <ComponentList {...componentsPanel} /> : null}
        </div>
      </div>
    </aside>
  );
}
