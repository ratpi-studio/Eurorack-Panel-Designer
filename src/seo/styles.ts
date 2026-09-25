/**
 * Client entry that gathers every stylesheet of the content pages: the kit's, the fonts, and each
 * `.css.ts` of `src/seo/`. The client build extracts them into one file that every page links,
 * pages without an island included.
 */

import "@salnika/uipirate/style.css";

import.meta.glob("./**/*.css.ts", { eager: true });
