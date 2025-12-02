import { createGlobalTheme } from '@vanilla-extract/css';

const colorPalette = {
  background: '#020617',
  surface: '#0f172a',
  border: '#1e293b',
  textPrimary: '#e5e7eb',
  textSecondary: '#9ca3af',
  accent: '#38bdf8'
} as const;

const spacingScale = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px'
} as const;

const fontStacks = {
  body:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
} as const;

export const vars = createGlobalTheme(':root', {
  color: colorPalette,
  spacing: spacingScale,
  font: fontStacks
});

export const themeValues = {
  color: colorPalette,
  spacing: spacingScale,
  font: fontStacks
};
