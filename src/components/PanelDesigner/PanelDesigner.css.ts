import { style } from '@vanilla-extract/css';

import { vars } from '@styles/theme.css';

export const page = style({
  flex: 1,
  minHeight: 0,
  padding: vars.spacing.lg,
  gap: vars.spacing.lg,
  display: 'flex',
  flexDirection: 'column'
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.xs
});

export const headerTop = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.spacing.md
});

export const logo = style({
  width: '240px',
  height: '48px'
});

export const subtitle = style({
  margin: 0,
  color: vars.color.textSecondary
});

export const status = style({
  color: vars.color.textSecondary,
  fontSize: '14px',
  minHeight: '20px'
});

export const githubLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.xs,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  borderRadius: '999px',
  border: `1px solid ${vars.color.border}`,
  color: vars.color.textPrimary,
  textDecoration: 'none',
  transition: 'background-color 150ms ease',
  selectors: {
    '&:hover': {
      backgroundColor: '#101c33'
    }
  }
});

export const githubIcon = style({
  width: '18px',
  height: '18px'
});

export const githubLabel = style({
  fontWeight: 600
});

export const card = style({
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  borderRadius: '8px',
  padding: vars.spacing.md,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.sm,
  minWidth: 0
});

export const sectionStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.md,
  minHeight: 0
});

export const projectCard = card;

export const cardHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: vars.spacing.sm
});

export const cardTitle = style({
  fontWeight: 600
});

export const cardSubtitle = style({
  color: vars.color.textSecondary,
  fontSize: '14px'
});

export const fieldRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.xs
});

export const label = style({
  color: vars.color.textSecondary,
  fontSize: '14px'
});

export const textInput = style({
  width: '100%',
  borderRadius: '6px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: '#0b1426',
  color: vars.color.textPrimary,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`
});

export const buttonRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.spacing.sm
});

const baseButton = {
  borderRadius: '6px',
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600
} as const;

export const primaryButton = style({
  ...baseButton,
  backgroundColor: vars.color.accent,
  color: '#0b1426'
});

export const secondaryButton = style({
  ...baseButton,
  backgroundColor: vars.color.surface,
  color: vars.color.textPrimary,
  border: `1px solid ${vars.color.border}`
});

export const hiddenInput = style({
  display: 'none'
});

export const canvasSection = style({
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 320px) 1fr minmax(260px, 320px)',
  gap: vars.spacing.md,
  alignItems: 'start'
});

export const leftColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.md,
  minHeight: 0,
  overflow: 'auto',
  paddingRight: vars.spacing.sm
});

export const canvasColumn = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.spacing.sm,
  overflow: 'auto',
  padding: vars.spacing.sm,
  backgroundColor: '#0b1426',
  border: `1px solid ${vars.color.border}`,
  borderRadius: '10px'
});

export const shortcuts = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.spacing.sm,
  alignItems: 'center',
  color: vars.color.textSecondary,
  fontSize: '12px'
});

export const key = style({
  padding: '4px 6px',
  borderRadius: '6px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: '#0d1425',
  color: vars.color.textPrimary,
  fontWeight: 600
});

export const shortcutLabel = style({
  marginRight: vars.spacing.sm
});

export const rightColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.md,
  minHeight: 0,
  overflow: 'auto',
  paddingRight: vars.spacing.sm
});
