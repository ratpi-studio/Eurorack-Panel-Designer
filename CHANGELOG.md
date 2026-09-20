# Changelog

## 0.12.0 - 2026-09-19

- Jacks, knobs, switches, and LEDs can now stand for a real part, picked from the new Part menu in their properties: Thonkiconn jacks, Alpha 9 mm pots, Bourns PEC11R encoders, Dailywell mini and sub-mini toggles, and 3 mm and 5 mm LEDs. The part sets the hole to drill for it, from its datasheet. You can still change the diameter, for instance to leave some play in a 3D print, and "Use Ø… mm" brings back the recommended one.
- Knobs also get the knob that goes on them: Davies 1900H clone, Rogan PT-1PS, PT-2PS, or PT-3PS, or the Thonk Tall Trimmer Topper.
- The canvas outlines the knob, nut, or washer of each part, and turns it red when it runs into another component, such as two knobs too close together or a knob over an LED. The properties of the element say so too, and so does the order dialog. Hide the outlines with "Knobs and nuts" in the Display tab; they are only a guide, and the exports leave them out.
- New elements start as the most common part: Thonkiconn jacks (6 mm hole instead of 8 mm), Alpha 9 mm pots with a Davies knob (7 mm instead of 10 mm), sub-mini toggles (a 5 mm round hole instead of an 8 × 16 mm rectangle), and 3 mm LEDs. Elements already placed keep their size.
- Switches can have a round hole, as toggles need, or a rectangular one: pick "Custom round hole" or "Custom rectangular hole" in their Part menu. The 3D view and every export cut round switches as circles.
- The palette gives each element an icon of its own, so jacks, knobs, switches, and LEDs no longer look alike, and describes it on hover. Buttons, tabs, menus, and dialogs have icons too.

## 0.11.1 - 2026-09-19

- Clicking on the canvas now picks what you see under the pointer, even when it lies under a bigger element. Cut-outs (jacks, knobs, and the other holes) come first, as they show through texts and SVG patterns, then the smallest element. An SVG pattern over the whole panel no longer hides the elements placed before it: click them to select or drag them, and click where nothing else is to select the pattern. Mounting holes can be clicked through patterns and texts too.
- With an element picked in the palette, clicking on a text or an SVG pattern now places the element there instead of selecting the pattern. The element you just placed can still be dragged.

## 0.11.0 - 2026-09-18

- The right panel now has three tabs under the project controls: Display, Properties, and Components. Selecting something on the canvas opens Properties, and the open tab is remembered.
- The new Components tab lists every placed element. Click to select (Shift-click to add), double-click a name to rename it, and hide, lock, or delete elements from the list. Hidden elements stay in the project but are left out of the canvas, the 3D view, the exports, and orders, and the order dialog tells you about them. Locked elements can no longer be picked or moved on the canvas.
- The properties of the selected element now show its name, as in the Components tab, and its type in plain words.

## 0.10.1 - 2026-09-18

- Fixed the app not starting since 0.10.0: the page stayed blank, with the error "t is not a function" in the console.
- Errors that stop the app from starting are now reported, so such a failure no longer goes unnoticed.

## 0.10.0 - 2026-09-18

- Text now prints: it is part of the STL export and of the 3D view, raised like the SVG patterns, at the same height and in the design color. Where text lies over a cut-out, it is cut away like the patterns.
- Pick the font of each text among five bundled fonts chosen to print well at small sizes: Roboto Bold, Barlow Condensed Bold, JetBrains Mono Bold, Michroma, and Orbitron Bold (all under the SIL Open Font License). The canvas, PNG, SVG, and STL all draw the same outlines, and the SVG export turns text into paths, so it no longer depends on the fonts installed where the file is opened.
- Choose what text does over an SVG pattern: clear the pattern around it (the default, with an adjustable clearance, 1 mm by default), or merge into the pattern at the same height.
- The text's color is the design color, now also editable from the text's properties: it applies to every text and SVG pattern, since panels print in two colors.
- The relief thickness and penetration are now set once for the whole panel and shared by every text and SVG pattern, from the properties of either. Designs saved before keep the tallest relief of their SVG artwork.
- A warning appears in the properties of text that is likely too small to print (under 6 pt, or strokes under about 0.4 mm), or that uses characters its font does not have.
- The SVG export now fills SVG patterns and text with the design color, as they print.
- Added ordering your panel 3D printed on Etsy. "Order this panel" shows the print preview in the filament colors you pick (white, black, or sky blue), the price (9 € plus 1 € per HP, up to 42 HP), and anything to check, then gives you a design code. The code's page shows the design, copies the code, and opens the Etsy listing, where you choose the width and paste the code in the personalization field.

## 0.9.0 - 2026-09-18

- Added a live 3D view of the panel as it will be exported to STL. Switch the render area between 2D, 3D, and 2D + 3D with the buttons above it; the choice is remembered. The model follows every edit and uses the panel and design colors, with the SVG relief on the front and inserts on the back. Drag to rotate, right-drag to pan, and scroll to zoom; "Reset view" reframes both views. The STL export dialog shows the same 3D view, and the 2D canvas now fills the whole render area.
- Overlapping cut-outs, such as two jacks or a screw hole touching a jack, are now merged into a single opening, and cut-outs that cross the panel edge open onto it, in every export and on the canvas. Before, the STL could keep walls inside the opening, KiCad exports had crossing Edge.Cuts lines that KiCad rejects, and the SVG export filled the overlap with the panel color again.
- Rotated cut-outs now come out rotated in the STL, SVG, and KiCad exports, turned the same way as on the canvas; rotated text too in the SVG export.
- Inserts are now built on the back of the panel, opposite the SVG relief, and no longer fill the cut-outs next to them.
- Fixed slots having their rounded ends curved inward in the STL export.
- Fixed STL files having their faces turned inside out.
- SVG artwork relief is built more reliably, stroked lines included. When part of it still cannot be built, the STL export keeps the rest and warns you, instead of silently dropping the whole relief.
- New designs start with a brighter blue panel.
- The app loads less code at startup: the SVG and KiCad export code now loads only when needed.

## 0.8.1 - 2026-09-18

- Fixed the editor breaking and autosave silently stopping once browser storage was full, typically after importing a large reference image. The design keeps being saved (without the image when it does not fit), and a message explains what happened.
- Large reference images are now downscaled on import (2048 px max) so they fit in browser storage.
- Saving a project now shows an error when browser storage is full instead of failing silently.
- The GitHub Pages address now redirects to eurorack-panel-designer-oss8.vercel.app and brings along the designs and projects saved there.
- Error reports no longer include IP addresses. When an error occurs, a replay of the session is attached to help fix it; form inputs stay masked.

## 0.8.0 - 2026-09-18

- Placed elements are now tinted with their palette color (translucent fill, solid outline), so cut-outs are easy to tell apart. Text and SVG artwork keep the design color, and exports still use the panel and design colors.
- Added measurements on the canvas: diameters inside round holes, width × height inside other shapes, and dimension lines along the sides of the selected element. Toggle them with the new "Dimensions" display option.
- Added resize handles on the selected element: round holes grow around their center, other shapes keep the opposite side in place (even when rotated), and text scales its font size. Sizes snap to 0.5 mm steps; hold Shift to resize freely.
- Fixed SVG artwork getting deselected after dragging one of its handles.
- Fixed a crash on the canvas when the browser automatically translated the page. The page is now declared as English, and the error screen is in English too.

## 0.7.0 - 2026-05-08

- Added per-panel color selection: pick a panel substrate color and a separate design color from four presets (white, black, red, sky blue). The whole canvas, PNG export, and SVG export reflect the choices.
- Added an "Order on Etsy" entry to the export menu: serializes the current design + a thumbnail PNG to Vercel Blob, redirects to a recap page at `/order/<id>`, and points to a configurable Etsy listing for checkout. Buyers paste the design ID in the Etsy personalization note.
- New serverless functions under `api/order` (POST upload + GET resolver). Configure `VITE_ETSY_LISTING_URL`, `VITE_PRICE_BASE_EUR`, `VITE_PRICE_PER_HP_EUR`, and enable Vercel Blob to use them.

## 0.6.0 - 2026-05-08

- Added an "SVG artwork" element: drop your own SVG files onto the panel or pick from a built-in library of 10 seamless patterns, with adjustable size, color, and 3D relief depth.
- SVG artwork now renders correctly in the 3D STL export, including `<pattern>` tilings and stroked paths.
- STL export is dramatically faster (~100× on panels with SVG artwork) thanks to a new polygon-clipping pipeline that replaces the previous rasterized height-map.
- Fixed bundled SVG patterns appearing transparent in the editor by preserving local `url(#…)` paint references through the masking step.

## 0.5.1 - 2026-01-24

- STL export dialog now supports a custom file name.
- Fixed the export dialog closing when releasing a text selection outside the modal.

## 0.5.0 - 2025-12-13

- Added insert item for pcb mount

## 0.4.1 - 2025-12-12

- Added live distance guides from the element being placed to its nearest neighbours to help fine-tune spacing.

## 0.4.0 - 2025-12-12

- Added a global “Image” button in Projects to import a reference image layer at any time.
- Reference images now render on the canvas with selection/drag support and dedicated controls.

## 0.3.0 - 2025-12-11

- Added draggable clearance guide lines with live distance labels to top/bottom edges.
- Mounting holes are now enabled per-element instead of globally, keeping other elements untouched.
- PNG export now crops to just the panel area (no surrounding workspace).
- General polish and version bump.

## 0.2.0 - 2024-12-29

- Added automatic “mounting holes” controls inside the element properties panel with snap-aware rotation slider.
- Sidebars now scroll independently while the main canvas stays fixed.
- Introduced optional per-element screw-hole generation plus updated exports/rendering to match.

## 0.1.1 - 2024-12-29

- Added mounting-hole configuration panel in the UI to tweak diameter and switch between round and slotted hardware.
- Fixed mounting holes overflowing at narrow widths by clamping offsets and enforcing a minimum spacing between columns.
- Updated SVG/KiCad/STL exports so slotted mounting holes are represented correctly.
- Introduced this changelog modal content and bumped the package version.

## 0.1.0 - 2024-12-10

- Initial public release.
