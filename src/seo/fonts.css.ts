import { globalFontFace } from "@vanilla-extract/css";

import { LATIN_UNICODE_RANGE, UI_FONTS } from "./fonts";

for (const font of UI_FONTS) {
  globalFontFace(font.family, {
    src: `url("${font.url}") format("woff2")`,
    fontWeight: "100 900",
    fontStyle: "normal",
    fontDisplay: "swap",
    unicodeRange: LATIN_UNICODE_RANGE,
  });
}
