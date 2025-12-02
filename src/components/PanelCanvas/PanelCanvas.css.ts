import { style } from '@vanilla-extract/css';

import { vars } from '@styles/theme.css';

export const root = style({
  position: 'relative',
  flex: '0 0 auto',
  borderRadius: '20px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  boxShadow: '0 25px 60px rgba(2, 6, 23, 0.55)',
  overflow: 'hidden',
  overscrollBehavior: 'none',
  touchAction: 'none'
});

export const canvas = style({
  width: '100%',
  height: '100%',
  display: 'block',
  cursor: 'crosshair',
  touchAction: 'none'
});

export const canvasPanning = style({
  cursor: 'grabbing'
});

export const hud = style({
  position: 'absolute',
  left: vars.spacing.md,
  bottom: vars.spacing.md,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  borderRadius: '999px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: 'rgba(15, 23, 42, 0.85)',
  color: vars.color.textSecondary,
  fontSize: '12px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  pointerEvents: 'none',
  userSelect: 'none'
});
