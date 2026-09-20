import { createLucideIcon } from "lucide-react";

// Panel parts Lucide has no icon for, drawn on its 24 px grid with its 2 px round strokes so they
// sit with the library icons.

/** A jack socket seen from the front: its nut and its hole. */
export const JackIcon = createLucideIcon({
  name: "panel-jack",
  size: 24,
  node: [
    [
      "path",
      {
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
        key: "nut",
      },
    ],
    ["circle", { cx: "12", cy: "12", r: "4.5", key: "socket" }],
    ["circle", { cx: "12", cy: "12", r: "0.5", key: "hole" }],
  ],
});

/** A knob and the scale it turns along. */
export const KnobIcon = createLucideIcon({
  name: "panel-knob",
  size: 24,
  node: [
    ["path", { d: "M5.64 18.36a9 9 0 1 1 12.72 0", key: "scale" }],
    ["circle", { cx: "12", cy: "12", r: "5", key: "cap" }],
    ["path", { d: "m12 12-3.2-3.2", key: "pointer" }],
  ],
});

/** A toggle switch: its lever out of its nut. */
export const ToggleSwitchIcon = createLucideIcon({
  name: "panel-toggle-switch",
  size: 24,
  node: [
    ["path", { d: "M12 11.5 16.33 14v5L12 21.5 7.67 19v-5z", key: "nut" }],
    ["path", { d: "M12 16.5 15.5 5", key: "lever" }],
    ["circle", { cx: "16", cy: "3.5", r: "1.5", key: "tip" }],
  ],
});

/** An LED lighting up: its dome, its legs and its light. */
export const LedIcon = createLucideIcon({
  name: "panel-led",
  size: 24,
  node: [
    ["path", { d: "M8 16v-5a4 4 0 0 1 8 0v5", key: "dome" }],
    ["path", { d: "M6 16h12", key: "rim" }],
    ["path", { d: "M10 16v6", key: "anode" }],
    ["path", { d: "M14 16v4", key: "cathode" }],
    ["path", { d: "m18.5 4.5 2-2", key: "ray-up" }],
    ["path", { d: "M20 8.5h2", key: "ray-side" }],
  ],
});

/** A threaded insert seen from the front. */
export const InsertIcon = createLucideIcon({
  name: "panel-insert",
  size: 24,
  node: [
    ["circle", { cx: "12", cy: "12", r: "10", key: "body" }],
    ["circle", { cx: "12", cy: "12", r: "4", key: "thread" }],
  ],
});

export const OvalIcon = createLucideIcon({
  name: "panel-oval",
  size: 24,
  node: [["ellipse", { cx: "12", cy: "12", rx: "10", ry: "6", key: "outline" }]],
});

/** A slot: a capsule with rounded ends, like the slotted mounting holes. */
export const SlotIcon = createLucideIcon({
  name: "panel-slot",
  size: 24,
  node: [["rect", { x: "2", y: "8", width: "20", height: "8", rx: "4", key: "outline" }]],
});
