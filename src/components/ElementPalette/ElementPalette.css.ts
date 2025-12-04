import { style } from '@vanilla-extract/css';

import { vars } from '@styles/theme.css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.md,
  padding: `${vars.spacing.md}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: '12px',
  backgroundColor: vars.color.surface,
  boxShadow: '0 12px 30px rgba(2, 6, 23, 0.35)'
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.spacing.sm
});

export const title = style({
  fontSize: 'clamp(11px, 2.5vw, 14px)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.textSecondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
});

export const subtitle = style({
  fontSize: '13px',
  color: vars.color.textPrimary
});

export const clearButton = style({
  border: `1px solid ${vars.color.border}`,
  backgroundColor: 'transparent',
  borderRadius: '8px',
  color: vars.color.textSecondary,
  padding: `6px ${vars.spacing.sm}`,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      color: vars.color.textPrimary,
      borderColor: vars.color.textSecondary
    }
  }
});

export const list = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.spacing.sm,
  maxHeight: '520px',
  overflowY: 'auto',
  padding: '1em 0',
  paddingRight: vars.spacing.xs,
  '@media': {
    '(max-width: 960px)': {
      gridTemplateColumns: '1fr'
    }
  }
});

export const card = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  backgroundColor: '#0b1220',
  borderRadius: '10px',
  border: `1px solid ${vars.color.border}`,
  textAlign: 'center',
  cursor: 'pointer',
  color: vars.color.textPrimary,
  transition: 'border-color 120ms ease, transform 120ms ease',
  selectors: {
    '&:hover': {
      borderColor: vars.color.accent,
      transform: 'translateY(-1px)'
    }
  }
});

export const cardActive = style([
  card,
  {
    borderColor: vars.color.accent,
    boxShadow: `0 0 0 1px ${vars.color.accent}`
  }
]);

export const icon = style({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  border: `1px solid ${vars.color.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#050c1b'
});

export const cardContent = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.spacing.xs,
  width: '100%'
});

export const cardTitle = style({
  fontWeight: 600,
  fontSize: '11px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  textAlign: 'center'
});

export const cardAction = style({
  fontSize: '12px',
  color: vars.color.textSecondary,
  fontWeight: 600,
  textTransform: 'uppercase',
  textAlign: 'right'
});
