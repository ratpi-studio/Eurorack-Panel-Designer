import { globalStyle } from '@vanilla-extract/css';

import { vars } from './theme.css';

globalStyle('*', {
  boxSizing: 'border-box',
});

globalStyle('html, body, #root', {
  margin: 0,
  padding: 0,
  height: '100%',
  fontFamily: vars.font.body,
  backgroundColor: vars.color.background,
  color: vars.color.textPrimary,
});

globalStyle('body', {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
});

globalStyle('#root', {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
});

globalStyle('main', {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'transparent',
});

globalStyle('h1', {
  marginBottom: vars.spacing.md,
});

globalStyle('p', {
  margin: 0,
  color: vars.color.textSecondary,
});
