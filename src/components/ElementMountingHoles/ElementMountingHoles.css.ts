import { style } from '@vanilla-extract/css';

import { vars } from '@styles/theme.css';

export const root = style({
  marginTop: vars.spacing.md,
  paddingTop: vars.spacing.md,
  borderTop: `1px solid ${vars.color.border}`,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.sm
});

export const toggleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.spacing.sm
});

export const checkbox = style({
  width: '18px',
  height: '18px'
});

export const label = style({
  fontSize: '14px',
  color: vars.color.textPrimary
});

export const description = style({
  margin: 0,
  color: vars.color.textSecondary,
  fontSize: '13px'
});

export const grid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.sm
});

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.xs
});

export const fieldLabel = style({
  fontSize: '13px',
  color: vars.color.textSecondary
});

export const numberInput = style({
  borderRadius: '6px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: '#0b1426',
  color: vars.color.textPrimary,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`
});

export const slider = style({
  width: '100%'
});

export const rotationValue = style({
  marginLeft: vars.spacing.xs,
  fontSize: '12px',
  color: vars.color.textSecondary
});
