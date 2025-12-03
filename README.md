![Vercel Deploy](https://deploy-badge.vercel.app/vercel/eurorack-panel-designer-oss8)

[Online version](https://eurorack-panel-designer-oss8.vercel.app/)

# Eurorack Panel Designer

Single-page web app to sketch Eurorack front panels. The canvas mirrors a real 3U panel: convert cm/mm/HP on the fly, drop elements (jacks, pots, switches, LEDs, labels), tweak their properties, and export or save layouts locally.

![Interactive editor demo](./public/images/demo.gif)

## Features

- Canvas-driven editor with zoom, pan, snapping, and optional grid.
- Automatic conversion between centimeters, millimeters, and HP.
- Library of panel elements with editable geometry, rotation, and labels.
- Generated mounting holes that update with the panel width.
- Local projects (save/load/delete) plus JSON, PNG, and SVG exports.

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

## Usage tips

- Adjust panel width through either the mm or HP input; the other unit updates instantly and the canvas resizes.
- Pick an element in the palette, click on the canvas to place it, then drag to reposition. Use the right-hand panel to fine-tune coordinates, rotation, or dimensions.
- Keep `Shift` pressed to temporarily disable snapping, `Esc` to cancel placement, `⌘/Ctrl + Z` and `⌘/Ctrl + Shift + Z` for undo/redo.
- Save named projects to the browser, export/import JSON for backups, or render the canvas as PNG/SVG for sharing.

## Contributing

Issues, feature ideas, and pull requests are welcome. Please open a discussion before large changes and keep business logic within `src/lib` modules so it remains testable. Keep docs in English.

## License

Distributed under the [MIT License](LICENSE). Feel free to fork, remix, and build on the project.
