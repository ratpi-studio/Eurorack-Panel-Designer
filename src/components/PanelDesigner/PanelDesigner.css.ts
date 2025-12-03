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
  width: '280px',
  height: '56px'
});

const subtitle = style({
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

export const headerActions = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.sm
});

export const supportLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  borderRadius: '999px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  transition: 'background-color 150ms ease',
  selectors: {
    '&:hover': {
      backgroundColor: '#101c33'
    }
  }
});

export const supportImage = style({
  height: '36px',
  width: 'auto'
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

const projectCard = card;

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

export const exportSplitButton = style({
  position: 'relative',
  display: 'inline-flex'
});

export const exportSplitMain = style({
  ...baseButton,
  backgroundColor: vars.color.accent,
  color: '#0b1426',
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0
});

export const exportSplitToggle = style({
  ...baseButton,
  backgroundColor: vars.color.accent,
  color: '#0b1426',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderLeft: '1px solid rgba(15, 23, 42, 0.4)',
  paddingInline: vars.spacing.xs,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

export const exportMenu = style({
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 4,
  minWidth: '160px',
  backgroundColor: vars.color.surface,
  borderRadius: '8px',
  border: `1px solid ${vars.color.border}`,
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.65)',
  zIndex: 20,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
});

export const exportMenuItem = style({
  ...baseButton,
  borderRadius: 0,
  width: '100%',
  textAlign: 'left',
  backgroundColor: 'transparent',
  color: vars.color.textPrimary,
  selectors: {
    '&:hover': {
      backgroundColor: '#101c33'
    }
  }
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

export const canvasSectionCompact = style({
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.spacing.md,
  alignItems: 'start',
  position: 'relative'
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

export const drawer = style({
  position: 'fixed',
  top: '72px',
  bottom: vars.spacing.md,
  width: 'min(360px, calc(100% - 32px))',
  zIndex: 30,
  transform: 'translateX(-120%)',
  transition: 'transform 200ms ease, opacity 200ms ease',
  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
  overflow: 'auto',
  opacity: 0
});

export const drawerRight = style({
  right: vars.spacing.md,
  left: 'auto',
  transform: 'translateX(120%)'
});

export const drawerLeft = style({
  left: vars.spacing.md,
  right: 'auto'
});

export const drawerOpen = style({
  transform: 'translateX(0)',
  opacity: 1
});

export const compactToggleBar = style({
  display: 'flex',
  gap: vars.spacing.sm,
  marginBottom: vars.spacing.sm,
  width: '100%',
  justifyContent: 'flex-end'
});

export const drawerHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: vars.spacing.sm
});

export const hint = style({
  fontSize: '12px',
  color: vars.color.textSecondary
});

export const modalBackdrop = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.88)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 40
});

export const modal = style({
  backgroundColor: vars.color.surface,
  borderRadius: '12px',
  border: `1px solid ${vars.color.border}`,
  padding: vars.spacing.lg,
  minWidth: '280px',
  maxWidth: '360px',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.sm,
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7)'
});

export const modalTitle = style({
  margin: 0,
  fontWeight: 600,
  fontSize: '16px'
});

export const modalDescription = style({
  margin: 0,
  fontSize: '14px',
  color: vars.color.textSecondary
});

export const modalActions = style({
  marginTop: vars.spacing.sm,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.spacing.sm
});

export const previewSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.xs
});
