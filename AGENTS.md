# AGENTS - eurorack_panel_designer

This file documents the conventions that match the project in its current form.

## 1. Project snapshot

- Single-page web app for designing 3U Eurorack panels around a central canvas.
- The app is local-first: editor state is persisted in the browser, projects can be saved locally, and layouts can be imported/exported.
- Core user flows today include:
  - panel sizing in mm / HP
  - element placement and editing
  - mounting holes and clearance guides
  - reference image overlay
  - undo / redo
  - JSON, PNG, SVG, KiCad, and STL export

Keep changes aligned with that product shape: practical, canvas-first, DIY-friendly, and export-oriented.

## 2. Current stack

- Framework: `React 19`
- Build tooling: `Vite` through `vite-plus`
- Language: strict `TypeScript`
- State: `zustand` for the main editor store, with dedicated hooks around history and project workflows
- Styling: `vanilla-extract` only
- Notifications: `react-hot-toast`
- Icons: `lucide-react`
- 3D/STL preview and geometry helpers: `three`
- Monitoring / analytics: `@sentry/react` and `@vercel/analytics`
- Tests: `Vitest`
- Package manager: `pnpm`, typically invoked through `vp`

Prefer Vite+ commands when working in the repository:

- `vp install`
- `vp dev`
- `vp lint`
- `vp test`
- `vp check`
- `vp run build`

## 3. Architecture map

- `src/components/`
  - React UI and orchestration.
  - `PanelDesigner` is the main shell.
  - `RightPanel` keeps the project controls on top and three tabs below: Display, Properties, and Components (`ComponentList`). The open tab is a preference (`useRightPanelTab`); canvas selections open Properties unless Components is open.
  - `PanelCanvas` and its hooks handle canvas interaction and rendering orchestration.
- `src/store/`
  - `panelStore.ts` is the main persisted Zustand store.
  - `usePanelHistory.ts` owns undo / redo behavior.
  - `useProjects.ts` owns save/load/import/export workflows and browser project management.
- `src/lib/`
  - Non-React model logic, geometry, unit conversion, serialization, storage helpers, export builders, and canvas drawing helpers.
  - `src/lib/canvas/` contains drawing and transform logic used by the canvas and PNG export path.
  - `src/lib/view3d/` contains the live 3D view: a `three` scene that renders the STL geometry from `exportStl.ts`, and camera framing math.
  - `parts.ts` is the catalog of real parts (the hole to drill for them, the nut or washer they show on the front) and of knobs, with the sources of their numbers. `elementParts.ts` applies a part to an element (`applyPartChoice`) and outlines the hardware on the front (`getFrontOutline`, `findCrowdedElements`).
  - `src/lib/text/` contains the text pipeline: the curated fonts (`textFonts.ts`, files and licenses in `public/fonts/`), on-demand font loading (`textFontLoader.ts`), the layout every output draws from (`textLayout.ts`), and the polygons the STL extrudes (`textPolygons.ts`).
- `src/i18n/`
  - User-facing copy lives here. The app currently ships with `en_US.ts`.
- `src/styles/`
  - Shared theme tokens and global styles via `vanilla-extract`.
- `scripts/`
  - Small maintenance scripts, such as the SVG library manifest generator.
- `api/`
  - Vercel Functions: `sentry-tunnel.ts` relays error reports, and `order.ts` stores and serves the designs ordered on Etsy.
  - Ordering is behind the `VITE_ORDERING_ENABLED` flag, read at build time by the app (`isOrderingEnabled` in `src/lib/order.ts`) and at runtime by `api/order.ts`, which only gates new designs.
  - `order.ts` repeats the widths and filament ids of `src/lib/orderCatalog.ts` instead of importing app code; its tests check that both agree. Change them together, and mirror price or width changes on the Etsy listing.
- `github-pages/`
  - The page published on GitHub Pages. It redirects to the Vercel deployment and hands over the data saved in that origin's localStorage, which `src/lib/githubPagesMigration.ts` imports. Keep its storage keys in sync with the app.

## 4. Code conventions

- Always write application code in TypeScript (`.ts` / `.tsx`).
- Prefer named exports. The current app entry points already follow this pattern.
- Use `PascalCase` for React components and `camelCase` for utility / domain modules.
- Prefer path aliases for cross-folder imports:
  - `@components`
  - `@lib`
  - `@store`
  - `@i18n`
  - `@styles`
- Keep React components focused on rendering and orchestration.
- Move calculations, geometry, serialization, and export logic out of components and into `src/lib/`.
- Keep new user-facing copy in the i18n layer instead of hardcoding strings in components.
- Use `vanilla-extract` `.css.ts` files for styling. Do not introduce Tailwind, CSS modules, or CSS-in-JS.
- Take icons from `lucide-react`, imported by name so only the icons used are bundled. `LucideProvider` in `App.tsx` sizes them to 16 px; pass `size` only to depart from it. An icon next to a label stays decorative (Lucide hides it from screen readers); an icon-only button needs an `aria-label`. Panel parts Lucide lacks (jack, knob, toggle, LED, insert, oval, slot) are drawn in `src/components/ElementTypeIcon/elementIcons.ts` with `createLucideIcon`, on Lucide's 24 px grid.

## 5. State and model rules

- `PanelModel` and related types in `src/lib/panelTypes.ts` are the source of truth for the editor data model.
- The canvas must remain a projection of store state, not an independent source of truth.
- Elements can be `hidden` or `locked`. Both stay in the model and in saves. Hidden elements are left out of everything that draws or builds the panel (canvas, 3D view, PNG/SVG/KiCad/STL exports, orders): go through `getVisibleElements` / `withoutHiddenElements` (`src/lib/elementVisibility.ts`) in any new output. Locked elements are only left out of canvas picking, moving, and resizing (`isElementInteractive`).
- A panel is as wide as it is cut, not as wide as its pitch on the rack grid: take its width from `panelWidthMmForHp` (`panelTypes.ts`), through `createPanelDimensions` or `panelDimensionsFromHp`, never from `widthHp * DEFAULT_MM_PER_HP`. `hpToMm` is the grid pitch, which mounting holes and rails follow. Normalization recomputes the width from `widthHp`, so saved designs pick up any change to the table.
- Panel mounting holes sit on the rails, not on the panel: `buildColumnXs` (`mountingHoles.ts`) anchors the first column at `horizontalOffsetMm` from the left edge and puts every other one a whole number of `DEFAULT_MM_PER_HP` from it. Keep any new placement on that grid, and keep the drawing it comes from in the comment.
- Jacks, knobs, switches and LEDs can stand for a real part (`partId`), and knobs name the knob that goes on them (`knobId`). Normalization drops the ids that do not exist or do not fit the element type. The part only sets the hole when it is picked: the element keeps its own `diameterMm`, which users may change.
- Switches have a round hole (`diameterMm`, for toggles) or a rectangular one (`widthMm` × `heightMm`), so a switch is not always a box. Where a geometry depends on the hole shape, go through `hasRoundHole` (or `isCircularElementProperties` on the properties) rather than the element type.
- When changing the panel schema or element model, update all affected layers together:
  - `src/lib/panelTypes.ts`
  - normalization logic
  - serialization / deserialization
  - persisted Zustand migrations in `src/store/panelStore.ts`
  - local project storage compatibility
  - exports and geometry helpers
  - relevant tests
- Browser persistence matters in this project. Backward compatibility or explicit migration is required when saved data formats change.
- Browser storage is small (about 5 MB per origin, shared by the autosave and saved projects). The store persists through `createPanelStateStorage` (`src/lib/panelStateStorage.ts`), which never throws: when storage is full it keeps saving the design without the reference image and warns the user. Keep large payloads out of the persisted state, or downscale them like reference images.

## 6. Canvas, geometry, and export guidance

- Keep unit conversion (`cm`, `mm`, `HP`), mounting hole generation, clearance rules, and geometry helpers testable without React.
- Canvas interaction logic belongs in the dedicated canvas hooks and `src/lib/canvas/` helpers, not in unrelated UI components.
- Hover, click, and drag pick elements through `pickElementAtPoint` (`src/lib/canvas/elementGeometry.ts`): cut-outs before the design layer (`isDesignElement`), which is drawn around them, then the smallest element, then the one placed last. The design layer also gives way to mounting holes, and to placing from the palette, except for a selected element.
- Export logic belongs in `src/lib/` and supporting store hooks, not inline in presentation components.
- `three` is already part of the project for STL generation / preview. Reuse that stack for 3D-related work instead of adding another rendering solution.
- Cut-outs that overlap each other or cross the panel edge are merged into single openings in every output (STL, SVG, KiCad, canvas, PNG). `splitOverlappingCutouts` (`src/lib/panelSurface.ts`) finds them; `mergePanelSurface` (`src/lib/mergedPanelSurface.ts`) merges them with `polygon-clipping`. Designs without overlaps keep their exact previous output.
- `polygon-clipping` stays out of the startup bundle: only modules loaded on demand import it (`exportStl`, `exportSvg`, `exportKicad`, `mergedPanelSurface`, `text/textPolygons`), so Rolldown puts it in its own chunk. Load these modules with `import()`, like the export handlers in `useProjects.ts` and `loadPanelSurfaceMerge` for the canvas.
- Leave chunking to Rolldown: do not add `manualChunks` or `codeSplitting` groups. In 0.10.0, manual vendor chunks and Rolldown's runtime helpers imported each other in a cycle, and every page load crashed in production while the dev server worked. `chunkCycleGuardPlugin` in `vite.config.ts` now fails the build on any cycle between chunks. After touching the build setup, load the production build (`vp build`, then `vp preview`), not only the dev server.
- Panels print in two colors: the panel body, and the design layer (SVG patterns and texts) raised on the front in `designColor`. The design layer shares one relief, `PanelModel.designRelief`: never give a pattern or a text a height of its own. `designLayer.ts` holds the helpers every output shares; the STL merges the layer into one extrusion (`buildDesignLayerPolygons`).
- Every output draws text from the same outlines: `getLabelTextLayout` (canvas and PNG through `Path2D`, SVG as paths, STL through `textPolygons`), so they match. Text over an SVG pattern either clears it (the knockout zone is the text's ink bounds grown by the padding, see `getLabelKnockoutRing`) or merges with it. Fonts load on demand with `loadTextFonts`: await it before a synchronous export builder, and re-render on `subscribeTextFonts` in live views. opentype.js (from `three/examples/jsm/libs`) is only loaded with `import()`, so it stays out of the startup bundle.
- New parts and knobs need numbers from a datasheet or the seller's page: add them to `PANEL_PARTS` or `PANEL_KNOBS` with their source in the comment of `parts.ts`, and a label in `properties.partOptions` or `properties.knobOptions`. `parts.ts` only imports types from `panelTypes.ts`, which imports it: keep it that way to avoid a module cycle.
- The knob, nut and washer outlines are an editor overlay (`showHardware`), like the dimensions: never draw them in an export.
- New fonts must print well at small sizes and carry an SIL OFL or Apache 2.0 license: add the file and its license under `public/fonts/<folder>/`, an entry in `TEXT_FONTS` (with its measured stem width), and a label in `properties.fontOptions`.
- If you add a new element type, wire it through the full pipeline:
  - element type definitions
  - element factory / defaults
  - properties editor UI
  - canvas rendering
  - clearance / mounting-hole interactions if relevant
  - serialization
  - export logic
  - tests

## 7. Testing and quality

- Add or update Vitest coverage for non-trivial business logic, especially in:
  - units and conversions
  - hole generation
  - element geometry
  - serialization / migrations
  - storage
  - export helpers
- Keep tests under the existing `src/lib/**/*.test.ts` pattern.
- Run `vp test`, `vp lint`, and `vp run build` after meaningful changes when feasible.

## 8. Documentation and repo-specific notes

- Keep documentation in English.
- Update `README.md` when user-facing behavior or setup changes materially.
- `CHANGELOG.md` is consumed by a virtual module in `vite.config.ts`. Keep the existing heading format (`## version - date`) unless you also update the parser.
- Keep this `AGENTS.md` file in sync when project conventions evolve.

## 9. Dependency policy

- Prefer the existing stack and patterns before adding new libraries.
- Favor lightweight dependencies with a clear maintenance story.
- Do not introduce:
  - another frontend framework
  - another state manager unless the architecture is intentionally changed
  - another styling system

## 10. Monitoring

- Sentry is initialized in `src/instrument.ts`, which `src/main.tsx` imports first.
- Errors thrown before Sentry starts, such as a bundle that fails to load or evaluate, are sent by the inline script of `index.html` through the tunnel. It only needs the `VITE_SENTRY_*` values that `vite.config.ts` sets (the DSN included) and stays silent once `instrument.ts` sets `window.__sentryStarted`. Keep it free of imports.
- It only reports from official deployments: `vite.config.ts` sets the environment at build time (`vercel-<env>` on Vercel, `SENTRY_ENVIRONMENT` elsewhere). Local dev servers, local builds, and forks stay silent.
- Releases are named after the commit SHA; there is no release file to bump.
- When a user-facing flow catches an error to show its own message, also report it with `reportError` from `@lib/monitoring` (`reportDegradation` for fallbacks that return a degraded result).
- Session replay only records sessions that hit an error, and keeps form inputs masked.
