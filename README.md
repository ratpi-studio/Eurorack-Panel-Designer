![Vercel Deploy](https://deploy-badge.vercel.app/vercel/eurorack-panel-designer-oss8)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/ratpi-studio/Eurorack-Panel-Designer?utm_source=oss&utm_medium=github&utm_campaign=ratpi-studio%2FEurorack-Panel-Designer&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

[Online version](https://eurorack-panel-designer-oss8.vercel.app/)

# Eurorack Panel Designer

Single-page web app to sketch Eurorack front panels. The canvas mirrors a real 3U panel: convert cm/mm/HP on the fly, drop elements (jacks, pots, switches, LEDs, labels), tweak their properties, and export or save layouts locally.

![Interactive editor demo](./public/images/demo.gif)

## Features

- Canvas-driven editor with zoom, pan, snapping, and optional grid.
- Automatic conversion between centimeters, millimeters, and HP.
- Library of panel elements with editable geometry, rotation, and labels.
- Generated mounting holes that update with the panel width.
- Local projects (save/load/delete) plus JSON, PNG, SVG, KiCad Edge.Cuts (SVG or `.kicad_pcb`), and STL exports (vector extrusion, thickness picker, and live 3D preview).

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) with client-side routing.
- Strict TypeScript, unit-tested core logic.
- State managed with [Zustand](https://zustand-demo.pmnd.rs/).
- Styling via [vanilla-extract](https://vanilla-extract.style/).

## Getting started

1. Install [Node.js 20+](https://nodejs.org/) and [Yarn 4](https://yarnpkg.com/getting-started/install).
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Start the dev server:
   ```bash
   yarn dev
   ```
   Vite serves the app at `http://localhost:5173` by default.

## Scripts

| Command        | Description                              |
|---------------|------------------------------------------|
| `yarn dev`    | Run the Vite dev server with HMR.        |
| `yarn build`  | Type-check then build the production SPA.|
| `yarn preview`| Preview the production build locally.    |
| `yarn test`   | Execute Vitest unit tests.               |
| `yarn lint`   | Run oxlint with the project config.      |

## Sentry monitoring

Sentry is initialized in `src/main.tsx` with DSN `https://05489173dd52acef4232f82e99d559a2@o4509397199486976.ingest.de.sentry.io/4510476688359504`. Builds automatically include source maps and will upload them when the Sentry env vars are set:

```bash
export SENTRY_AUTH_TOKEN=xxx   # Org-scoped token with project:releases + org:read
export SENTRY_ORG=your-org-slug
export SENTRY_PROJECT=eurorack-panel-designer
export SENTRY_RELEASE=$(git rev-parse HEAD)
export VITE_SENTRY_RELEASE=$SENTRY_RELEASE
yarn build
```

The `VITE_SENTRY_RELEASE` value is injected into the bundle so events are associated with the exact release that received the uploaded source maps. When the env vars are omitted the build succeeds but release creation/map upload are skipped.

### Local release tracking & pre-commit hook

- `.env.sentry` is tracked and contains the authoritative `SENTRY_RELEASE` / `VITE_SENTRY_RELEASE` pair used locally.
- A `simple-git-hooks` pre-commit hook runs `yarn bump:sentry-release`, which increments the value in `.env.sentry` and stages the file automatically so every commit gets a unique release identifier.
- Run `yarn bump:sentry-release` manually if you need a bump outside of the hook or reset the file.
- Vite reads `.env.sentry` as a fallback, so running `yarn dev` or `yarn build` locally automatically picks up the release number even if you don’t export the env vars manually.

## Usage tips

- Adjust panel width through either the mm or HP input; the other unit updates instantly and the canvas resizes.
- Pick an element in the palette, click on the canvas to place it, then drag to reposition. Use the right-hand panel to fine-tune coordinates, rotation, or dimensions.
- Keep `Shift` pressed to temporarily disable snapping, `Esc` to cancel placement, `⌘/Ctrl + Z` and `⌘/Ctrl + Shift + Z` for undo/redo.
- Shift-click elements or drag a marquee on the canvas to build a multi-selection, then drag anywhere on the canvas to move the entire group or press Delete to remove it in one go.
- Save named projects to the browser, export/import JSON for backups, render the canvas as PNG/SVG, export KiCad Edge.Cuts, or export a clean STL: choose STL in the export dropdown, set thickness in mm, and use the live 3D preview to inspect the mesh before downloading.

## KiCad Edge.Cuts export

- Open the export dropdown and pick either **KiCad Edge SVG** (minimal Edge.Cuts-only SVG) or **KiCad PCB** (minimal `.kicad_pcb` with Edge.Cuts lines).
- The SVG is ready for KiCad via `File → Import Graphics → Edge.Cuts`.
- The `.kicad_pcb` contains only Edge.Cuts `gr_line` geometry (outline, circular holes approximated with 32 segments, rectangular cutouts). No copper or silkscreen is added.

## Contributing

Issues, feature ideas, and pull requests are welcome. Please open a discussion before large changes and keep business logic within `src/lib` modules so it remains testable. Keep docs in English.

## License

Distributed under the [MIT License](LICENSE). Feel free to fork, remix, and build on the project.
