import { PanelElementType } from '@lib/panelTypes';
import { type PanelCanvasPalette } from './renderScene';
import { themeValues } from '@styles/theme.css';

type ExtendedPalette = PanelCanvasPalette & {
  workspace?: string;
  text?: string;
};

export const elementFillColors: Record<PanelElementType, string> = {
  [PanelElementType.Jack]: '#38bdf8',
  [PanelElementType.Potentiometer]: '#f472b6',
  [PanelElementType.Switch]: '#facc15',
  [PanelElementType.Led]: '#f87171',
  [PanelElementType.Label]: '#f8fafc',
  [PanelElementType.Rectangle]: '#4ade80',
  [PanelElementType.Oval]: '#c084fc',
  [PanelElementType.Slot]: '#fb923c',
  [PanelElementType.Triangle]: '#22d3ee',
  [PanelElementType.Insert]: '#f59e0b'
};

export const elementStrokeColor = '#0f172a';

export const canvasPalette: ExtendedPalette = {
  workspace: '#030712',
  panelFill: '#111827',
  panelBorder: '#334155',
  grid: 'rgba(148, 163, 184, 0.2)',
  gridCenter: 'rgba(148, 163, 184, 0.45)',
  mountingHoleFill: '#0f172a',
  mountingHoleStroke: '#94a3b8',
  selection: '#ffffff',
  text: themeValues.color.textSecondary,
  clearanceLine: 'rgba(244, 114, 182, 0.4)',
  clearanceLabel: '#fbcfe8'
};

export const exportPalette: PanelCanvasPalette = {
  panelFill: canvasPalette.panelFill,
  panelBorder: canvasPalette.panelBorder,
  grid: canvasPalette.grid,
  gridCenter: canvasPalette.gridCenter,
  mountingHoleFill: canvasPalette.mountingHoleFill,
  mountingHoleStroke: canvasPalette.mountingHoleStroke,
  selection: canvasPalette.selection,
  clearanceLine: canvasPalette.clearanceLine,
  clearanceLabel: canvasPalette.clearanceLabel
};
