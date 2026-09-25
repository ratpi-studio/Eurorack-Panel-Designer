import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@salnika/uipirate";

/** Content column, and the gutter it keeps from the viewport edges. */
const CONTENT_WIDTH = 1180;
const GUTTER = "clamp(16px, 4vw, 32px)";

globalStyle("html", {
  colorScheme: "dark",
  WebkitTextSizeAdjust: "100%",
  // Anchors land under the sticky app bar, not behind it.
  scrollPaddingTop: 56,
});

// The kit gives its own controls a focus ring; links get the same one.
globalStyle("a:focus-visible", {
  outline: `2px solid ${vars.color.ac}`,
  outlineOffset: 2,
  borderRadius: vars.radius.r,
});

export const shell = style({
  display: "flex",
  flexDirection: "column",
});

export const skipLink = style({
  position: "absolute",
  left: 8,
  top: -48,
  zIndex: 100,
  padding: "8px 12px",
  background: vars.color.ac,
  color: vars.color.acInk,
  font: vars.font.m11,
  selectors: {
    "&:focus": { top: 8, color: vars.color.acInk },
  },
});

export const brand = style({
  color: vars.color.tx,
  selectors: {
    "&:hover": { color: vars.color.ac },
  },
  "@media": {
    "screen and (max-width: 480px)": { fontSize: 11, letterSpacing: ".1em" },
  },
});

export const revision = style({
  "@media": {
    "screen and (max-width: 560px)": { display: "none" },
  },
});

export const pageNav = style({
  background: vars.color.s1,
  borderBottom: `1px solid ${vars.color.bd}`,
});

export const pageNavInner = style({
  display: "flex",
  alignItems: "stretch",
  gap: 24,
  maxWidth: CONTENT_WIDTH,
  margin: "0 auto",
  padding: `0 ${GUTTER}`,
  overflowX: "auto",
  scrollbarWidth: "none",
  selectors: {
    "&::-webkit-scrollbar": { display: "none" },
  },
});

export const navGroup = style({
  display: "flex",
  alignItems: "center",
  gap: 2,
  flex: "none",
});

export const navGroupLabel = style({
  font: vars.font.m9,
  letterSpacing: ".12em",
  color: vars.color.tx3,
  marginRight: 6,
});

export const navLink = style({
  display: "flex",
  alignItems: "center",
  height: 38,
  padding: "0 8px",
  font: vars.font.m10,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: vars.color.tx2,
  whiteSpace: "nowrap",
  borderBottom: "2px solid transparent",
  selectors: {
    "&:hover": { color: vars.color.tx },
    '&[aria-current="page"]': { color: vars.color.tx, borderBottomColor: vars.color.ac },
  },
});

export const main = style({
  flex: 1,
  width: "100%",
  maxWidth: CONTENT_WIDTH,
  margin: "0 auto",
  padding: `0 ${GUTTER} 72px`,
});

export const masthead = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)",
  gap: 48,
  alignItems: "end",
  padding: "48px 0 36px",
  borderBottom: `1px solid ${vars.color.bd}`,
  "@media": {
    "screen and (max-width: 960px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      gap: 28,
      paddingTop: 32,
    },
  },
});

export const kicker = style({
  margin: "0 0 16px",
  font: vars.font.m10,
  letterSpacing: ".16em",
  color: vars.color.ac,
});

export const headline = style({
  margin: 0,
  fontSize: "clamp(30px, 4.6vw, 50px)",
  fontWeight: 500,
  lineHeight: 1.05,
  letterSpacing: "-.025em",
  color: vars.color.tx,
  textWrap: "balance",
});

export const lede = style({
  margin: "20px 0 0",
  maxWidth: "62ch",
  fontSize: 16,
  lineHeight: 1.6,
  color: vars.color.tx2,
  textWrap: "pretty",
});

globalStyle(`${lede} strong`, { color: vars.color.tx, fontWeight: 600 });

globalStyle(`${lede} code`, {
  font: vars.font.m12,
  color: vars.color.tx,
  background: vars.color.s2,
  border: `1px solid ${vars.color.bd}`,
  borderRadius: vars.radius.r,
  padding: "1px 5px",
});

export const cta = style({
  marginTop: 56,
});

export const ctaBody = style({
  display: "grid",
  gap: 14,
  justifyItems: "start",
  padding: "20px clamp(16px, 3vw, 24px) 24px",
});

export const ctaTitle = style({
  margin: 0,
  fontSize: 22,
  fontWeight: 500,
  letterSpacing: "-.01em",
  color: vars.color.tx,
});

export const ctaText = style({
  margin: 0,
  maxWidth: "62ch",
  fontSize: 15,
  lineHeight: 1.65,
  color: vars.color.tx2,
});

export const footer = style({
  borderTop: `1px solid ${vars.color.bd}`,
  background: vars.color.s1,
});

export const footerInner = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 28,
  maxWidth: CONTENT_WIDTH,
  margin: "0 auto",
  padding: `32px ${GUTTER}`,
});

export const footerList = style({
  listStyle: "none",
  margin: "10px 0 0",
  padding: 0,
  display: "grid",
  gap: 8,
  fontSize: 14,
});

globalStyle(`${footerList} a`, { color: vars.color.tx2 });
globalStyle(`${footerList} a:hover`, { color: vars.color.ac });
globalStyle(`${footerList} a[aria-current="page"]`, { color: vars.color.tx });
