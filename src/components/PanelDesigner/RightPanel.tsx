import React from 'react';

import { DisplayOptions } from '@components/DisplayOptions/DisplayOptions';
import { ElementMountingHoles } from '@components/ElementMountingHoles/ElementMountingHoles';
import { ElementProperties } from '@components/ElementProperties/ElementProperties';
import { MountingHoleSettings } from '@components/MountingHoleSettings/MountingHoleSettings';
import { ReferenceImageControls } from '@components/ReferenceImageControls/ReferenceImageControls';
import type { ExportFormat } from '@lib/exportPreferences';
import {
  PanelElementType,
  type ElementMountingHoleConfig,
  type MountingHoleConfig,
  type PanelElement,
  type PanelModel,
  type Vector2
} from '@lib/panelTypes';
import type { ReferenceImage } from '@lib/referenceImage';
import type { StoredProject } from '@lib/storage';
import * as styles from './PanelDesigner.css';
import type { ReturnTypeUseI18n } from './types';

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
  exportButtonLabel: string;
  isExportMenuOpen: boolean;
  onToggleExportMenu: () => void;
  onExportClick: () => void;
  onExportJson: () => void;
  onSelectExportFormat: (format: ExportFormat) => void;
}

interface PropertiesPanelProps {
  t: ReturnTypeUseI18n;
  panelModel: PanelModel;
  displayOptions: PanelModel['options'];
  mountingHolesSelected: boolean;
  referenceImage: ReferenceImage | null;
  referenceImageSelected: boolean;
  elementForProperties: PanelElement | null;
  selectedElement: PanelElement | null;
  selectedElementCount: number;
  placementType: PanelElementType | null;
  snapEnabled: boolean;
  onDisplayOptionsChange: (options: Partial<PanelModel['options']>) => void;
  onResetView: () => void;
  onMountingHoleConfigChange: (updates: Partial<MountingHoleConfig>) => void;
  onClearMountingHoleSelection: () => void;
  onReferenceImageChange: (updates: Partial<ReferenceImage>) => void;
  onImportReferenceImageClick: () => void;
  onRemoveReferenceImage: () => void;
  onChangePosition: (positionMm: Vector2) => void;
  onChangeRotation: (rotationDeg: number) => void;
  onChangeProperties: (properties: PanelElement['properties']) => void;
  onRemove: () => void;
  onChangeDraftProperties: (type: PanelElementType, properties: PanelElement['properties']) => void;
  onChangeElementHoleConfig: (updates: Partial<ElementMountingHoleConfig>) => void;
  onChangeElementHoleRotation: (rotationDeg: number) => void;
  onToggleElementHoleEnabled: (enabled: boolean) => void;
}

interface RightPanelProps {
  isCompact: boolean;
  showPanel: boolean;
  onClose: () => void;
  projectPanel: ProjectPanelProps;
  propertiesPanel: PropertiesPanelProps;
}

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
  exportButtonLabel,
  isExportMenuOpen,
  onToggleExportMenu,
  onExportClick,
  onExportJson,
  onSelectExportFormat
}: ProjectPanelProps) {
  return (
    <>
      <div className={styles.projectHeader}>
        {isEditingProjectName ? (
          <div className={styles.projectNameEditRow}>
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
            {hasUnsavedChanges ? (
              <span className={styles.dirtyStar} aria-hidden="true">
                *
              </span>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className={styles.projectNameButton}
            onClick={onStartEditingProjectName}
            title={t.projects.nameLabel}
          >
            <span className={styles.projectNameContent}>
              <span className={styles.projectNameText}>{resolvedProjectName}</span>
              {hasUnsavedChanges ? (
                <span className={styles.dirtyStar} aria-hidden="true">
                  *
                </span>
              ) : null}
            </span>
          </button>
        )}
        <button
          type="button"
          className={styles.iconButton}
          onClick={isEditingProjectName ? onCommitProjectName : onStartEditingProjectName}
          aria-label={t.projects.editNameLabel}
        >
          <svg className={styles.editIcon} viewBox="0 0 20 20" role="img" aria-hidden="true">
            <path
              d="M15.73 2.29a1 1 0 0 0-1.41 0l-1.73 1.73 3.39 3.39 1.73-1.73a1 1 0 0 0 0-1.41zM2 14.67 3.91 18l3.32-1.91 7.13-7.13-3.39-3.39L2 14.67z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.secondaryButton} onClick={onNewProject}>
          {t.projects.newProject}
        </button>
        <button type="button" className={styles.primaryButton} onClick={onSaveProject}>
          {t.projects.save}
        </button>
        <div className={styles.exportSplitButton}>
          <button type="button" className={styles.exportSplitMain} onClick={onExportClick}>
            {exportButtonLabel}
          </button>
          <button
            type="button"
            aria-label={t.projects.exportMenuLabel}
            className={styles.exportSplitToggle}
            onClick={onToggleExportMenu}
          >
            ▾
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
                {t.projects.exportJson}
              </button>
              <button
                type="button"
                className={styles.exportMenuItem}
                onClick={() => onSelectExportFormat('svg')}
              >
                {t.projects.exportSvg}
              </button>
              <button
                type="button"
                className={styles.exportMenuItem}
                onClick={() => onSelectExportFormat('png')}
              >
                {t.projects.exportPng}
              </button>
              <button
                type="button"
                className={styles.exportMenuItem}
                onClick={() => onSelectExportFormat('kicadSvg')}
              >
                {t.projects.exportKicadSvg}
              </button>
              <button
                type="button"
                className={styles.exportMenuItem}
                onClick={() => onSelectExportFormat('kicadPcb')}
              >
                {t.projects.exportKicadPcb}
              </button>
              <button
                type="button"
                className={styles.exportMenuItem}
                onClick={() => onSelectExportFormat('stl')}
              >
                {t.projects.exportStl}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <label className={styles.fieldRow}>
        <span className={styles.label}>{t.projects.savedLabel}</span>
        <select
          className={styles.textInput}
          value={selectedSavedName}
          onChange={(event) => onSelectSavedName(event.target.value)}
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
          onClick={onLoadSelected}
        >
          {t.projects.load}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onImportJsonClick}>
          {t.projects.importJson}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onDeleteOrReset}>
          {t.projects.delete}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onImportReferenceImageClick}
        >
          {t.properties.importImage}
        </button>
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
      </div>
    </>
  );
}

function PropertiesPanel({
  panelModel,
  displayOptions,
  mountingHolesSelected,
  referenceImage,
  referenceImageSelected,
  elementForProperties,
  selectedElement,
  selectedElementCount,
  placementType,
  snapEnabled,
  onDisplayOptionsChange,
  onResetView,
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
  onToggleElementHoleEnabled
}: PropertiesPanelProps) {
  return (
    <>
      <div className={styles.card}>
        <DisplayOptions options={displayOptions} onChange={onDisplayOptionsChange} onResetView={onResetView} />
      </div>
      {mountingHolesSelected ? (
        <div className={styles.card}>
          <MountingHoleSettings
            config={panelModel.mountingHoleConfig}
            onChange={onMountingHoleConfigChange}
            onClose={onClearMountingHoleSelection}
          />
        </div>
      ) : null}
      <div className={styles.card}>
        {referenceImage && referenceImageSelected ? (
          <ReferenceImageControls
            image={referenceImage}
            onChange={onReferenceImageChange}
            onReplace={onImportReferenceImageClick}
            onRemove={onRemoveReferenceImage}
          />
        ) : (
          <>
            <ElementProperties
              element={elementForProperties}
              selectionCount={selectedElementCount}
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
          </>
        )}
      </div>
    </>
  );
}

export function RightPanel({ isCompact, showPanel, onClose, projectPanel, propertiesPanel }: RightPanelProps) {
  const containerClass = `${styles.rightColumn} ${
    isCompact ? `${styles.drawer} ${styles.drawerRight} ${showPanel ? styles.drawerOpen : ''}` : ''
  }`;

  if (isCompact && !showPanel) {
    return null;
  }

  return (
    <aside className={containerClass}>
      <div className={styles.card}>
        {isCompact ? (
          <div className={styles.drawerHeader}>
            <div className={styles.cardTitle}>{projectPanel.resolvedProjectName}</div>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Close
            </button>
          </div>
        ) : null}
        <ProjectPanel {...projectPanel} />
      </div>
      <PropertiesPanel {...propertiesPanel} />
    </aside>
  );
}
