import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "@styles/theme.css";

const headerActionHeight = "36px";
const headerActionBorderRadius = "999px";
const headerActionPadding = `0 ${vars.spacing.md}`;

export const page = style({
  flex: 1,
  minHeight: 0,
  height: "100%",
  overflow: "hidden",
  padding: vars.spacing.lg,
  gap: vars.spacing.lg,
  display: "flex",
  flexDirection: "column",
});

export const header = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  flexShrink: 0,
});

export const headerTop = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: vars.spacing.md,
});

export const logo = style({
  width: "280px",
  maxWidth: "100%",
  height: "56px",
});

export const githubLink = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: headerActionHeight,
  boxSizing: "border-box",
  gap: vars.spacing.xs,
  padding: headerActionPadding,
  borderRadius: headerActionBorderRadius,
  border: `1px solid ${vars.color.border}`,
  color: vars.color.textPrimary,
  textDecoration: "none",
  fontSize: "14px",
  transition: "background-color 150ms ease",
  selectors: {
    "&:hover": {
      backgroundColor: "#101c33",
    },
  },
});

export const githubIcon = style({
  width: "18px",
  height: "18px",
});

export const githubLabel = style({
  fontWeight: 600,
});

export const headerActions = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: vars.spacing.sm,
});

export const supportLink = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: headerActionHeight,
  boxSizing: "border-box",
  padding: `0 ${vars.spacing.sm}`,
  borderRadius: headerActionBorderRadius,
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  textDecoration: "none",
  transition: "background-color 150ms ease",
  selectors: {
    "&:hover": {
      backgroundColor: "#101c33",
    },
  },
});

export const supportImage = style({
  height: "36px",
  width: "auto",
});

export const etsyLink = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  height: headerActionHeight,
  boxSizing: "border-box",
  padding: headerActionPadding,
  borderRadius: headerActionBorderRadius,
  border: "1px solid #f1641e",
  backgroundColor: "#f1641e",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 700,
  transition: "background-color 150ms ease, border-color 150ms ease",
  selectors: {
    "&:hover": {
      backgroundColor: "#d9561d",
      borderColor: "#d9561d",
    },
  },
});

export const etsyWordmark = style({
  fontFamily: vars.font.body,
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: "0",
});

export const card = style({
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  borderRadius: "8px",
  padding: vars.spacing.md,
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  minWidth: 0,
});

export const sectionStack = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
  minHeight: 0,
});

export const cardTitle = style({
  fontWeight: 600,
});

export const projectHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
});

export const projectNameButton = style({
  flex: 1,
  display: "flex",
  alignItems: "center",
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  borderRadius: "8px",
  border: `1px solid transparent`,
  backgroundColor: "transparent",
  color: vars.color.textPrimary,
  textAlign: "left",
  cursor: "text",
  selectors: {
    "&:hover": {
      borderColor: vars.color.border,
      backgroundColor: "#0b1426",
    },
  },
});

export const projectNameText = style({
  fontWeight: 700,
  fontSize: "16px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const projectNameContent = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  minWidth: 0,
});

export const projectNameEditRow = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  width: "100%",
});

export const dirtyStar = style({
  color: vars.color.accent,
  fontWeight: 800,
  flexShrink: 0,
});

export const projectNameInput = style({
  flex: 1,
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1426",
  color: vars.color.textPrimary,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  fontWeight: 700,
  fontSize: "16px",
});

export const fieldRow = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const label = style({
  color: vars.color.textSecondary,
  fontSize: "14px",
});

export const textInput = style({
  width: "100%",
  borderRadius: "6px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0b1426",
  color: vars.color.textPrimary,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
});

export const buttonRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.spacing.sm,
});

// Buttons line up an icon and their label.
const baseButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  borderRadius: "6px",
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
} as const;

export const changelogButton = style({
  ...baseButton,
  boxSizing: "border-box",
  backgroundColor: "#0b1426",
  color: vars.color.textPrimary,
  border: `1px solid ${vars.color.border}`,
  borderRadius: headerActionBorderRadius,
  height: headerActionHeight,
  padding: headerActionPadding,
  fontSize: "14px",
  selectors: {
    "&:hover": {
      backgroundColor: "#101c33",
    },
  },
});

export const primaryButton = style({
  ...baseButton,
  backgroundColor: vars.color.accent,
  color: "#0b1426",
});

// Ordering a print is the one call to action of the project panel: full width, above the lists.
export const orderButton = style([
  primaryButton,
  {
    width: "100%",
    padding: `${vars.spacing.sm} ${vars.spacing.md}`,
    fontSize: "14px",
  },
]);

export const secondaryButton = style({
  ...baseButton,
  backgroundColor: vars.color.surface,
  color: vars.color.textPrimary,
  border: `1px solid ${vars.color.border}`,
});

export const iconButton = style({
  ...baseButton,
  backgroundColor: vars.color.surface,
  color: vars.color.textPrimary,
  border: `1px solid ${vars.color.border}`,
  padding: vars.spacing.xs,
});

export const exportSplitButton = style({
  position: "relative",
  display: "inline-flex",
});

export const exportSplitMain = style({
  ...baseButton,
  backgroundColor: vars.color.accent,
  color: "#0b1426",
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
});

export const exportSplitToggle = style({
  ...baseButton,
  backgroundColor: vars.color.accent,
  color: "#0b1426",
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderLeft: "1px solid rgba(15, 23, 42, 0.4)",
  paddingInline: vars.spacing.xs,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const exportMenu = style({
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 4,
  minWidth: "160px",
  backgroundColor: vars.color.surface,
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.65)",
  zIndex: 20,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
});

export const exportMenuItem = style({
  ...baseButton,
  justifyContent: "flex-start",
  gap: vars.spacing.sm,
  borderRadius: 0,
  width: "100%",
  textAlign: "left",
  backgroundColor: "transparent",
  color: vars.color.textPrimary,
  selectors: {
    "&:hover": {
      backgroundColor: "#101c33",
    },
  },
});

export const hiddenInput = style({
  display: "none",
});

export const canvasSection = style({
  flex: 1,
  minHeight: 0,
  height: "100%",
  overflow: "hidden",
  display: "grid",
  gridTemplateColumns: "minmax(260px, 320px) 1fr minmax(260px, 320px)",
  gap: vars.spacing.md,
  alignItems: "start",
});

export const canvasSectionCompact = style({
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: vars.spacing.md,
  alignItems: "start",
  position: "relative",
});

export const leftColumn = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
  minHeight: 0,
  height: "100%",
  overflow: "auto",
  paddingRight: vars.spacing.sm,
});

export const canvasColumn = style({
  minWidth: 0,
  maxHeight: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.spacing.sm,
  overflow: "auto",
  padding: vars.spacing.sm,
  backgroundColor: "#0b1426",
  border: `1px solid ${vars.color.border}`,
  borderRadius: "10px",
});

export const canvasToolbar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: vars.spacing.sm,
  width: "100%",
  maxWidth: "1200px",
});

export const viewModeSwitch = style({
  display: "inline-flex",
  padding: "2px",
  gap: "2px",
  borderRadius: "8px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
});

export const viewModeButton = style({
  ...baseButton,
  backgroundColor: "transparent",
  color: vars.color.textSecondary,
  fontSize: "13px",
  selectors: {
    "&:hover": {
      color: vars.color.textPrimary,
    },
    '&[aria-pressed="true"]': {
      backgroundColor: vars.color.accent,
      color: "#0b1426",
    },
  },
});

export const compactToggles = style({
  display: "flex",
  gap: vars.spacing.sm,
  marginLeft: "auto",
});

export const viewport = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gridTemplateRows: "minmax(0, 1fr)",
  gap: vars.spacing.sm,
  flex: "0 0 auto",
  width: "100%",
  maxWidth: "1200px",
  aspectRatio: "5 / 3",
  minHeight: "432px",
});

export const viewportSplit = style([
  viewport,
  {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    "@media": {
      // Too narrow for two columns: stack the 3D view under the 2D editor.
      "screen and (max-width: 720px)": {
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: "repeat(2, minmax(0, 1fr))",
        aspectRatio: "auto",
        minHeight: "720px",
      },
    },
  },
]);

export const viewportPane = style({
  position: "relative",
  minWidth: 0,
  minHeight: 0,
  borderRadius: "20px",
  border: `1px solid ${vars.color.border}`,
  boxShadow: "0 25px 60px rgba(2, 6, 23, 0.55)",
  overflow: "hidden",
});

export const viewportFallback = style({
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#050c1b",
  color: vars.color.textSecondary,
  fontSize: "14px",
});

export const shortcuts = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.spacing.sm,
  alignItems: "center",
  color: vars.color.textSecondary,
  fontSize: "12px",
});

export const key = style({
  padding: "4px 6px",
  borderRadius: "6px",
  border: `1px solid ${vars.color.border}`,
  backgroundColor: "#0d1425",
  color: vars.color.textPrimary,
  fontWeight: 600,
});

export const shortcutLabel = style({
  marginRight: vars.spacing.sm,
});

export const rightColumn = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
  minHeight: 0,
  height: "100%",
  overflow: "auto",
  paddingRight: vars.spacing.sm,
});

export const drawer = style({
  position: "fixed",
  top: "72px",
  bottom: vars.spacing.md,
  width: "min(360px, calc(100% - 32px))",
  zIndex: 30,
  transform: "translateX(-120%)",
  transition: "transform 200ms ease, opacity 200ms ease",
  boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
  overflow: "auto",
  opacity: 0,
});

export const drawerRight = style({
  right: vars.spacing.md,
  left: "auto",
  transform: "translateX(120%)",
});

export const drawerLeft = style({
  left: vars.spacing.md,
  right: "auto",
});

export const drawerOpen = style({
  transform: "translateX(0)",
  opacity: 1,
});

export const drawerHeader = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: vars.spacing.sm,
});

export const hint = style({
  fontSize: "12px",
  color: vars.color.textSecondary,
});

export const modalBackdrop = style({
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.88)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
});

export const modal = style({
  backgroundColor: vars.color.surface,
  borderRadius: "12px",
  border: `1px solid ${vars.color.border}`,
  padding: vars.spacing.lg,
  minWidth: "280px",
  maxWidth: "360px",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  boxShadow: "0 24px 80px rgba(0, 0, 0, 0.7)",
});

export const modalWide = style([
  modal,
  {
    maxWidth: "520px",
    width: "min(520px, calc(100vw - 32px))",
  },
]);

export const modalTitle = style({
  margin: 0,
  fontWeight: 600,
  fontSize: "16px",
});

export const modalDescription = style({
  margin: 0,
  fontSize: "14px",
  color: vars.color.textSecondary,
});

export const modalActions = style({
  marginTop: vars.spacing.sm,
  display: "flex",
  justifyContent: "flex-end",
  gap: vars.spacing.sm,
});

export const previewSection = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const stlPreviewFrame = style({
  height: "240px",
  borderRadius: "10px",
  border: `1px solid ${vars.color.border}`,
  overflow: "hidden",
});

export const changelogList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  maxHeight: "min(60vh, 420px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  paddingRight: vars.spacing.xs,
});

export const changelogEntry = style({
  border: `1px solid ${vars.color.border}`,
  borderRadius: "8px",
  padding: vars.spacing.sm,
  backgroundColor: "#050c1b",
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const changelogEntryMeta = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: vars.spacing.sm,
});

export const changelogVersion = style({
  fontWeight: 600,
});

export const changelogDate = style({
  color: vars.color.textSecondary,
  fontSize: "12px",
});

export const changelogHighlights = style({
  margin: 0,
  paddingLeft: "20px",
  color: vars.color.textSecondary,
  fontSize: "14px",
  lineHeight: 1.4,
  listStylePosition: "outside",
});

export const changelogLink = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  color: vars.color.accent,
  fontWeight: 600,
  textDecoration: "none",
  alignSelf: "flex-start",
  selectors: {
    "&:hover": {
      textDecoration: "underline",
    },
  },
});

export const tabList = style({
  display: "flex",
  gap: "2px",
  padding: "3px",
  borderRadius: "8px",
  backgroundColor: "#0b1426",
  border: `1px solid ${vars.color.border}`,
});

// The icon sits above the label: side by side, the three tabs overflow the 320 px column.
const tabBase = style({
  flex: 1,
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2px",
  padding: `6px ${vars.spacing.xs}`,
  border: "none",
  borderRadius: "6px",
  background: "none",
  color: vars.color.textSecondary,
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  selectors: {
    "&:hover": {
      color: vars.color.textPrimary,
    },
    "&:focus-visible": {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "1px",
    },
  },
});

export const tab = styleVariants({
  idle: [tabBase],
  active: [
    tabBase,
    {
      backgroundColor: vars.color.surface,
      color: vars.color.textPrimary,
      boxShadow: `inset 0 -2px 0 ${vars.color.accent}`,
    },
  ],
});

export const tabLabel = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.spacing.xs,
});

export const tabCount = style({
  minWidth: "18px",
  padding: "0 5px",
  borderRadius: "999px",
  backgroundColor: "#16233d",
  color: vars.color.textSecondary,
  fontSize: "11px",
  lineHeight: "18px",
  textAlign: "center",
});

export const tabPanel = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  minWidth: 0,
  paddingTop: vars.spacing.xs,
});
