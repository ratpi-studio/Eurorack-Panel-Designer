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
  - `PanelCanvas` and its hooks handle canvas interaction and rendering orchestration.
- `src/store/`
  - `panelStore.ts` is the main persisted Zustand store.
  - `usePanelHistory.ts` owns undo / redo behavior.
  - `useProjects.ts` owns save/load/import/export workflows and browser project management.
- `src/lib/`
  - Non-React model logic, geometry, unit conversion, serialization, storage helpers, export builders, and canvas drawing helpers.
  - `src/lib/canvas/` contains drawing and transform logic used by the canvas and PNG export path.
- `src/i18n/`
  - User-facing copy lives here. The app currently ships with `en_US.ts`.
- `src/styles/`
  - Shared theme tokens and global styles via `vanilla-extract`.
- `scripts/`
  - Small maintenance scripts, currently including the Sentry release bump helper.

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

## 5. State and model rules

- `PanelModel` and related types in `src/lib/panelTypes.ts` are the source of truth for the editor data model.
- The canvas must remain a projection of store state, not an independent source of truth.
- When changing the panel schema or element model, update all affected layers together:
  - `src/lib/panelTypes.ts`
  - normalization logic
  - serialization / deserialization
  - persisted Zustand migrations in `src/store/panelStore.ts`
  - local project storage compatibility
  - exports and geometry helpers
  - relevant tests
- Browser persistence matters in this project. Backward compatibility or explicit migration is required when saved data formats change.

## 6. Canvas, geometry, and export guidance

- Keep unit conversion (`cm`, `mm`, `HP`), mounting hole generation, clearance rules, and geometry helpers testable without React.
- Canvas interaction logic belongs in the dedicated canvas hooks and `src/lib/canvas/` helpers, not in unrelated UI components.
- Export logic belongs in `src/lib/` and supporting store hooks, not inline in presentation components.
- `three` is already part of the project for STL generation / preview. Reuse that stack for 3D-related work instead of adding another rendering solution.
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
