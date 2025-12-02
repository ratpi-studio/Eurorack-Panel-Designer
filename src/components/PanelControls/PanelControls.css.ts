import { style } from '@vanilla-extract/css';

import { vars } from '@styles/theme.css';

export const root = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.spacing.md,
  alignItems: 'flex-end',
  width: '100%',
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  borderRadius: '12px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  boxShadow: '0 12px 30px rgba(2, 6, 23, 0.35)'
});

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.xs,
  minWidth: '140px',
  flex: '1 1 160px'
});

export const label = style({
  fontSize: '12px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.textSecondary
});

export const input = style({
  width: '100%',
  height: '36px',
  padding: `0 ${vars.spacing.sm}`,
  borderRadius: '8px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: '#0b1220',
  color: vars.color.textPrimary,
  fontSize: '14px',
  outline: 'none',
  selectors: {
    '&:focus': {
      borderColor: vars.color.accent,
      boxShadow: `0 0 0 2px rgba(56, 189, 248, 0.25)`
    }
  }
});

export const hint = style({
  fontSize: '12px',
  color: vars.color.textSecondary
});
