# AGENTS – eurorack_panel_designer

This file describes the conventions to follow when working on this repository.

## 1. Project vision

- Web app for designing Eurorack panels with a central canvas.
- Keep feature additions consistent with the existing UX (canvas-focused, DIY-friendly).

## 2. Required stack and technical choices

- Framework: `React` (v19) + `Vite` (SPA, client-side rendering).
- Language: strict `TypeScript` (`"strict": true` in `tsconfig.json`).
- UI: `React` with function components and hooks.
- Global state: managed via dedicated React hooks (and/or Context) exposing the panel model and UI state.
- Styles: `vanilla-extract` only.  
  - No Tailwind.  
  - No CSS-in-JS like styled-components/emotion.
- Lint: `oxlint` for JS/TS.
- Formatting: `prettier` recommended, standard config if added.
- Tests: unit tests for business logic (conversions, hole generation, serialization) as soon as a module gains complexity.

## 3. Code organization

- Use the current structure as the template:
  - `src/` root for the SPA.
  - `src/components/` for reusable React components.
  - `src/store/` for the global state access layer.
  - `src/lib/` for pure business logic (no React).
  - `src/styles/` for `vanilla-extract` themes and styles.
- Keep computation logic (units, holes, etc.) in `lib/`, not in components.
- Components should contain minimal logic: rendering + orchestration of `store`/`lib` calls.

## 4. Coding conventions

- Always write TypeScript (`.ts` / `.tsx`); no `.js` for application code.
- File names: `PascalCase` for components, `camelCase` for utility modules.
- Avoid default exports (the root `App` component can stay default-exported).
- Avoid single-letter variables except in obvious, tiny loops.
- Prefer pure functions in `lib` (no side effects).
- Keep components small and focused; create subcomponents if a file grows too long or complex.

## 5. Canvas and business logic

- Panel and element rendering must be driven by a clear data model in `store`/`lib`, not internal canvas component state.
- cm → mm → HP conversions and hole generation must be testable without React (`lib/` functions).
- The canvas should simply project that state (zoom, pan, grid, holes, elements) into pixels.

## 6. Adding dependencies

- Before adding a library:
  - Check whether the feature can be built with the current stack.
  - Prefer lightweight, well-maintained libraries.
- Do not add:
  - Other frontend frameworks (e.g., Vue, Svelte).
  - Other global state managers (Redux, MobX, etc.) unless explicitly documented by new architecture notes.

## 7. Documentation and PRs

- Document important decisions in PR comments or the README.
- Keep this `AGENTS.md` file up to date if conventions evolve.
