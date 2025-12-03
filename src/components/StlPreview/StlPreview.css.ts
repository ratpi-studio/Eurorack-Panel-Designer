import { style } from '@vanilla-extract/css';

import { vars } from '@styles/theme.css';

export const root = style({
  width: '100%',
  height: '240px',
  borderRadius: '10px',
  border: `1px solid ${vars.color.border}`,
  backgroundColor: '#0b1226',
  overflow: 'hidden',
  position: 'relative'
});

export const canvas = style({
  width: '100%',
  height: '100%',
  display: 'block'
});

export const overlay = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.textSecondary,
  fontSize: '14px',
  pointerEvents: 'none'
});
