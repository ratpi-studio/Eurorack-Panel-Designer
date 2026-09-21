import type { OneUSpec, PanelFormatKey } from "@lib/panelFormat";
import type { KnobId, PartId } from "@lib/parts";
import type { TextFontId } from "@lib/text/textFonts";

interface Translations {
  app: {
    title: string;
    subtitle: string;
    errorFallback: string;
    storageFull: string;
  };
  githubPagesMigration: {
    imported: string;
    failed: string;
    sessionProjectName: string;
    projectNameSuffix: string;
  };
  header: {
    githubLabel: string;
    githubAriaLabel: string;
    supportAriaLabel: string;
    supportImageAlt: string;
    etsyLabel: string;
    etsyAriaLabel: string;
  };
  canvas: {
    hudSuffix: string;
  };
  view3d: {
    modeLabel: string;
    mode2d: string;
    mode3d: string;
    modeSplit: string;
    canvasLabel: string;
    loading: string;
    unavailable: string;
    hud: (thicknessMm: number) => string;
  };
  controls: {
    formatLabel: string;
    rackUnitsLabel: string;
    rackUnitsOption: (rackUnits: number) => string;
    oneUSpecLabel: string;
    oneUSpecOptions: Record<OneUSpec, string>;
    customLabel: string;
    widthHpLabel: string;
    widthMmLabel: string;
    heightMmLabel: string;
    widthHpHint: string;
    tileWidthHpHint: (stepHp: number) => string;
    widthMmHint: string;
    customWidthMmHint: string;
    customHeightMmHint: (minMm: number, maxMm: number) => string;
    heightNote: (heightMm: number, formatName: string) => string;
    derivedHeightNote: string;
    customNote: (widthHp: number) => string;
    formatNames: Record<Exclude<PanelFormatKey, "custom">, string>;
  };
  display: {
    grid: string;
    snap: string;
    holes: string;
    dimensions: string;
    hardware: string;
    gridSpacing: string;
    reset: string;
    panelColor: string;
    designColor: string;
  };
  mountingHoles: {
    title: string;
    description: string;
    diameterLabel: string;
    slotLengthLabel: string;
    shapeLabel: string;
    typeCircle: string;
    typeSlot: string;
    close: string;
  };
  elementHoles: {
    title: string;
    description: string;
    enableLabel: string;
    countLabel: string;
    diameterLabel: string;
    offsetLabel: string;
    rotationLabel: string;
    defaultRotationLabel: string;
  };
  palette: {
    title: string;
    subtitle: string;
    clear: string;
    select: string;
    place: string;
    shapeLabelPrefix: string;
    items: Record<
      string,
      {
        label: string;
        description: string;
        color: string;
      }
    >;
  };
  rightPanel: {
    tabsLabel: string;
    display: string;
    properties: string;
    components: string;
  };
  components: {
    listLabel: string;
    summary: (count: number, hiddenCount: number) => string;
    showAll: string;
    empty: string;
    hint: string;
    rename: (name: string) => string;
    hide: (name: string) => string;
    show: (name: string) => string;
    lock: (name: string) => string;
    unlock: (name: string) => string;
    remove: (name: string) => string;
  };
  properties: {
    title: string;
    subtitle: string;
    delete: string;
    importImage: string;
    empty: string;
    multiSelection: (count: number) => string;
    multiSelectionHint: string;
    posX: string;
    posY: string;
    rotation: string;
    diameter: string;
    width: string;
    height: string;
    text: string;
    fontSize: string;
    color: string;
    font: string;
    fontOptions: Record<TextFontId, string>;
    textColorHint: string;
    patternOverlap: string;
    patternOverlapKnockout: string;
    patternOverlapMerge: string;
    patternOverlapHint: string;
    knockoutPadding: string;
    reliefTitle: string;
    reliefHint: string;
    reliefThickness: string;
    reliefPenetration: string;
    textTooSmall: (minSizePt: number) => string;
    textThinStrokes: (strokeMm: number, minStrokeMm: number) => string;
    textMissingCharacters: (characters: string) => string;
    outerDiameter: string;
    outerDepth: string;
    innerDiameter: string;
    innerDepth: string;
    embedDepth: string;
    part: string;
    partOptions: Record<PartId, string>;
    customHole: string;
    customRoundHole: string;
    customRectangularHole: string;
    partHint: (holeMm: string, hardwareMm: string | null) => string;
    useRecommendedHole: (holeMm: string) => string;
    knob: string;
    noKnob: string;
    knobOptions: Record<KnobId, string>;
    crowdedHardware: string;
  };
  referenceImage: {
    title: string;
    positionX: string;
    positionY: string;
    width: string;
    height: string;
    rotation: string;
    opacity: string;
    replace: string;
    remove: string;
    notKept: string;
  };
  svgArtwork: {
    title: string;
    description: string;
    dropLabel: string;
    libraryTitle: string;
    libraryLoading: string;
    libraryEmpty: string;
    invalidFile: string;
    invalidSvg: string;
    libraryError: string;
    cancel: string;
  };
  projects: {
    title: string;
    subtitle: string;
    nameLabel: string;
    editNameLabel: string;
    newProject: string;
    defaultName: string;
    save: string;
    exportJson: string;
    exportPng: string;
    exportSvg: string;
    exportKicadSvg: string;
    exportKicadPcb: string;
    exportStl: string;
    exportMenuLabel: string;
    orderPrint: string;
    reset: string;
    savedLabel: string;
    load: string;
    delete: string;
    importJson: string;
    refresh: string;
    messages: {
      saveSuccess: (name: string) => string;
      saveError: (name: string) => string;
      loadSuccess: (name: string) => string;
      loadError: (name: string) => string;
      deleteSuccess: (name: string) => string;
      deleteUndoSuccess: (name: string) => string;
      importSuccess: (filename: string) => string;
      importError: string;
      pngError: string;
      pngSuccess: string;
      jsonExport: string;
      svgExport: string;
      svgError: string;
      kicadSvgExport: string;
      kicadPcbExport: string;
      kicadError: string;
      stlExport: string;
      stlExportWithWarnings: (count: number) => string;
      stlError: string;
      reset: string;
      confirmSaveBeforeNew: string;
      confirmDeleteSelected: (name: string) => string;
      confirmReset: string;
      confirmYes: string;
      confirmNo: string;
    };
    stlDialog: {
      title: string;
      description: string;
      fileNameLabel: string;
      fileNameHint: string;
      thicknessLabel: string;
      thicknessHint: string;
      previewLabel: string;
      previewLoading: string;
      cancel: string;
      confirm: string;
    };
  };
  changelog: {
    buttonLabel: string;
    title: string;
    description: string;
    close: string;
    viewFull: string;
  };
  order: {
    dialogTitle: string;
    dialogDescription: string;
    previewLabel: string;
    previewLoading: string;
    panelFilamentLabel: string;
    detailsFilamentLabel: string;
    detailsFilamentHint: string;
    filamentNames: { white: string; black: string; skyBlue: string };
    widthLabel: string;
    widthValue: (widthHp: number) => string;
    priceLabel: string;
    price: (priceEur: number) => string;
    priceHint: string;
    stepsTitle: string;
    steps: (widthHp: number) => string[];
    issueUnsupportedFormat: string;
    issueTooWide: (widthHp: number, maxWidthHp: number) => string;
    issueSameFilament: string;
    issueTextPrint: (count: number) => string;
    issueCrowdedHardware: (count: number) => string;
    issueHiddenElements: (count: number) => string;
    cancel: string;
    submit: string;
    submitting: string;
    errors: {
      unavailable: string;
      tooLarge: string;
      invalid: string;
      server: string;
      network: string;
    };
    pageTitle: string;
    designTitle: string;
    codeLabel: string;
    codeHint: string;
    copyCode: string;
    copied: string;
    howToTitle: string;
    howToSteps: (widthHp: number) => string[];
    buyCta: string;
    buyUnavailable: string;
    filesTitle: string;
    filesHint: (thicknessMm: number) => string;
    downloadStl: string;
    downloadJson: string;
    downloadError: string;
    versionNote: (version: string, commit: string) => string;
    versionChanged: string;
    backToDesigner: string;
    loading: string;
    loadError: string;
    notFound: string;
  };
  shortcuts: {
    shift: string;
    disableSnap: string;
    esc: string;
    cancelPlacement: string;
    deleteKey: string;
    deleteSelection: string;
    undo: string;
    undoShortcut: string;
    redo: string;
    redoShortcut: string;
  };
}

export const enUS: Translations = {
  app: {
    title: "Eurorack Panel Designer",
    subtitle: "Interactive canvas, zoom, pan, selection",
    errorFallback: "An unexpected error occurred. Please reload the page.",
    storageFull:
      "Browser storage is full: recent changes will not survive a reload. Delete saved projects you no longer need or remove the reference image.",
  },
  githubPagesMigration: {
    imported: "Your designs from the previous address (GitHub Pages) were moved to this site.",
    failed:
      "Some of your designs from the previous address could not be moved. Please report it on GitHub.",
    sessionProjectName: "Last session on GitHub Pages",
    projectNameSuffix: "(GitHub Pages)",
  },
  header: {
    githubLabel: "GitHub",
    githubAriaLabel: "Open GitHub repository",
    supportAriaLabel: "Support the project on Ko-fi",
    supportImageAlt: "Buy me a coffee on Ko-fi",
    etsyLabel: "Etsy",
    etsyAriaLabel: "Open the RatpiSynth Etsy shop",
  },
  canvas: {
    hudSuffix: "Static render",
  },
  view3d: {
    modeLabel: "View",
    mode2d: "2D",
    mode3d: "3D",
    modeSplit: "2D + 3D",
    canvasLabel: "3D view of the panel",
    loading: "Loading 3D view…",
    unavailable: "The 3D view needs WebGL, which this browser does not provide.",
    hud: (thicknessMm: number) => `${Number(thicknessMm.toFixed(2))} mm thick · Drag to rotate`,
  },
  controls: {
    formatLabel: "Format",
    rackUnitsLabel: "Rack units",
    rackUnitsOption: (rackUnits) => `${rackUnits}U`,
    oneUSpecLabel: "1U standard",
    oneUSpecOptions: {
      intellijel: "Intellijel",
      pulpLogic: "Pulp Logic",
    },
    customLabel: "Custom size",
    widthHpLabel: "Width (HP)",
    widthMmLabel: "Width (mm)",
    heightMmLabel: "Height (mm)",
    widthHpHint: "Eurorack units (1 HP = 5.08 mm)",
    tileWidthHpHint: (stepHp) => `Tiles come in multiples of ${stepHp} HP`,
    widthMmHint: "Width to cut, a bit under the HP grid (Doepfer)",
    customWidthMmHint: "Any width, in millimeters",
    customHeightMmHint: (minMm, maxMm) => `Any height from ${minMm} to ${maxMm} mm`,
    heightNote: (heightMm, formatName) => `Height ${Number(heightMm.toFixed(2))} mm, ${formatName}`,
    derivedHeightNote:
      "No brand publishes this height: it is the rack unit less the rail lips, as on 3U.",
    customNote: (widthHp) => `Takes ${widthHp} HP on the rails`,
    formatNames: {
      intellijel1u: "Intellijel 1U",
      pulpLogic1u: "Pulp Logic 1U tile",
      rack2u: "2U rails",
      eurorack3u: "Eurorack 3U",
      rack4u: "4U rails",
    },
  },
  display: {
    grid: "Grid",
    snap: "Snap to grid",
    holes: "Mounting holes",
    dimensions: "Dimensions",
    hardware: "Knobs and nuts",
    gridSpacing: "Grid spacing (mm)",
    reset: "Reset view",
    panelColor: "Panel color",
    designColor: "Design color",
  },
  mountingHoles: {
    title: "Mounting holes",
    description: "Adjust rail hardware size and shape.",
    diameterLabel: "Diameter (mm)",
    slotLengthLabel: "Slot length (mm)",
    shapeLabel: "Shape",
    typeCircle: "Round",
    typeSlot: "Slot",
    close: "Close",
  },
  elementHoles: {
    title: "Element screw holes",
    description: "Automatically add screw holes around the selected element.",
    enableLabel: "Mounting holes",
    countLabel: "Hole count",
    diameterLabel: "Hole diameter (mm)",
    offsetLabel: "Distance from edge (mm)",
    defaultRotationLabel: "Default rotation (°)",
    rotationLabel: "Element rotation",
  },
  referenceImage: {
    title: "Reference image",
    positionX: "Position X (mm)",
    positionY: "Position Y (mm)",
    width: "Width (mm)",
    height: "Height (mm)",
    rotation: "Rotation (°)",
    opacity: "Opacity",
    replace: "Replace",
    remove: "Remove",
    notKept:
      "This reference image is too large to be kept after a reload. The rest of your design is still saved.",
  },
  palette: {
    title: "Palette",
    subtitle: "Pick an element to place",
    clear: "Clear",
    select: "Select",
    place: "Place…",
    shapeLabelPrefix: "Shape",
    items: {
      jack: {
        label: "Jack",
        description: "3.5 mm input/output",
        color: "#38bdf8",
      },
      potentiometer: {
        label: "Knob",
        description: "Rotary potentiometer",
        color: "#f472b6",
      },
      switch: {
        label: "Switch",
        description: "Toggle switch",
        color: "#facc15",
      },
      led: {
        label: "LED",
        description: "Indicator LED",
        color: "#f87171",
      },
      label: {
        label: "Text",
        description: "Raised text in the design color",
        color: "#f8fafc",
      },
      rectangle: {
        label: "Rectangle",
        description: "Generic rectangular cutout",
        color: "#4ade80",
      },
      oval: {
        label: "Oval",
        description: "Ellipse cutout",
        color: "#c084fc",
      },
      slot: {
        label: "Slot",
        description: "Capsule / slotted cutout",
        color: "#fb923c",
      },
      triangle: {
        label: "Triangle",
        description: "Triangular cutout",
        color: "#22d3ee",
      },
      insert: {
        label: "Insert",
        description: "Press-fit insert with inner hole",
        color: "#f59e0b",
      },
      svgArtwork: {
        label: "SVG",
        description: "Decorative vector artwork",
        color: "#f8fafc",
      },
    },
  },
  rightPanel: {
    tabsLabel: "Panel settings",
    display: "Display",
    properties: "Properties",
    components: "Components",
  },
  components: {
    listLabel: "Placed components",
    summary: (count, hiddenCount) =>
      `${count} component${count === 1 ? "" : "s"}${hiddenCount ? ` · ${hiddenCount} hidden` : ""}`,
    showAll: "Show all",
    empty: "No components yet. Pick one in the palette, then click on the panel to place it.",
    hint: "Shift-click to select several. Double-click a name to rename it. Hidden components are left out of the 3D view, exports and orders; locked ones cannot be moved on the canvas.",
    rename: (name) => `Rename ${name}`,
    hide: (name) => `Hide ${name}`,
    show: (name) => `Show ${name}`,
    lock: (name) => `Lock ${name}`,
    unlock: (name) => `Unlock ${name}`,
    remove: (name) => `Delete ${name}`,
  },
  properties: {
    title: "Properties",
    subtitle: "Selection",
    delete: "Delete",
    importImage: "Image",
    empty: "Select an element to view its properties.",
    multiSelection: (count: number) => `${count} elements selected`,
    multiSelectionHint:
      "Multi-selection is active. Drag elements on the canvas to move the group or press Delete to remove it.",
    posX: "Position X (mm)",
    posY: "Position Y (mm)",
    rotation: "Rotation (°)",
    diameter: "Diameter (mm)",
    width: "Width (mm)",
    height: "Height (mm)",
    text: "Text",
    fontSize: "Size (pt)",
    color: "Color",
    font: "Font",
    fontOptions: {
      roboto: "Roboto Bold · clean sans",
      barlowCondensed: "Barlow Condensed Bold · condensed",
      jetbrainsMono: "JetBrains Mono Bold · monospace",
      michroma: "Michroma · wide, technical",
      orbitron: "Orbitron Bold · geometric display",
    },
    textColorHint:
      "The design color, the panel's second print color: it also applies to every SVG pattern.",
    patternOverlap: "Over SVG patterns",
    patternOverlapKnockout: "Clear the pattern around the text",
    patternOverlapMerge: "Merge into the pattern",
    patternOverlapHint:
      "Clearing keeps the text readable. Merged text joins the pattern at the same height, even where that makes it harder to read.",
    knockoutPadding: "Clearance (mm)",
    reliefTitle: "Relief",
    reliefHint: "Shared by every text and SVG pattern, which print at the same height.",
    reliefThickness: "Thickness (mm)",
    reliefPenetration: "Sunk into panel (mm)",
    textTooSmall: (minSizePt: number) => `Text under ${minSizePt} pt is hard to print.`,
    textThinStrokes: (strokeMm: number, minStrokeMm: number) =>
      `Strokes are about ${strokeMm.toFixed(2)} mm wide and may not print under ${minStrokeMm} mm: use a larger size or a bolder font.`,
    textMissingCharacters: (characters: string) => `Not in this font, so left out: ${characters}`,
    outerDiameter: "Outer diameter (mm)",
    outerDepth: "Outer depth (mm)",
    innerDiameter: "Inner diameter (mm)",
    innerDepth: "Inner depth (mm)",
    embedDepth: "Embed depth (mm)",
    part: "Part",
    partOptions: {
      thonkiconn: "Thonkiconn · PJ398SM, WQP518MA",
      alpha9mm: "Alpha 9 mm pot · RD901F",
      bournsPec11r: "Bourns PEC11R encoder",
      dailywellSubMiniToggle: "Dailywell sub-mini toggle · 2MS",
      dailywellMiniToggle: "Dailywell mini toggle · 1MS",
      led3mm: "3 mm LED",
      led5mm: "5 mm LED",
    },
    customHole: "Custom hole",
    customRoundHole: "Custom round hole",
    customRectangularHole: "Custom rectangular hole",
    partHint: (holeMm: string, hardwareMm: string | null) =>
      hardwareMm
        ? `Recommended hole Ø${holeMm} mm, nut or washer Ø${hardwareMm} mm.`
        : `Recommended hole Ø${holeMm} mm.`,
    useRecommendedHole: (holeMm: string) => `Use Ø${holeMm} mm`,
    knob: "Knob",
    noKnob: "No knob",
    knobOptions: {
      thonkTallTrimmerTopper: "Thonk Tall Trimmer Topper",
      davies1900h: "Davies 1900H clone",
      roganPt1ps: "Rogan PT-1PS, small",
      roganPt2ps: "Rogan PT-2PS, medium",
      roganPt3ps: "Rogan PT-3PS, large",
    },
    crowdedHardware:
      "Too close to another component: a knob, nut or washer overlaps. Move them apart.",
  },
  svgArtwork: {
    title: "Add SVG",
    description: "Load a monochrome vector mark for the panel surface.",
    dropLabel: "Drop SVG here or choose a file",
    libraryTitle: "Library",
    libraryLoading: "Loading library…",
    libraryEmpty: "No SVG assets in the library yet.",
    invalidFile: "Choose an SVG file.",
    invalidSvg: "Unable to read this SVG.",
    libraryError: "Unable to load this library SVG.",
    cancel: "Cancel",
  },
  projects: {
    title: "Projects",
    subtitle: "Local save + export",
    nameLabel: "Project name",
    editNameLabel: "Edit project name",
    newProject: "New",
    defaultName: "Untitled Project",
    save: "Save",
    exportJson: "Export JSON",
    exportPng: "Export PNG",
    exportSvg: "Export SVG",
    exportKicadSvg: "Export KiCad Edge SVG",
    exportKicadPcb: "Export KiCad PCB",
    exportStl: "Export STL",
    exportMenuLabel: "Choose export format",
    orderPrint: "Order this panel",
    reset: "Reset design",
    savedLabel: "Saved projects",
    load: "Load",
    delete: "Delete",
    importJson: "Import JSON",
    refresh: "Refresh",
    messages: {
      saveSuccess: (name: string) => `Project "${name}" saved.`,
      saveError: (name: string) =>
        `Unable to save "${name}": browser storage is full. Delete projects you no longer need and try again.`,
      loadSuccess: (name: string) => `Project "${name}" loaded.`,
      loadError: (name: string) => `Unable to load "${name}".`,
      deleteSuccess: (name: string) => `Project "${name}" deleted.`,
      deleteUndoSuccess: (name: string) => `Project "${name}" restored.`,
      importSuccess: (filename: string) => `Imported from "${filename}".`,
      importError: "Invalid JSON import.",
      pngError: "Canvas not available for PNG export.",
      pngSuccess: "PNG export created.",
      jsonExport: "JSON export created.",
      svgExport: "SVG export created.",
      svgError: "Failed to generate SVG export.",
      kicadSvgExport: "KiCad Edge.Cuts SVG created.",
      kicadPcbExport: "KiCad PCB export created.",
      kicadError: "Failed to generate KiCad export.",
      stlExport: "STL export created.",
      stlExportWithWarnings: (count: number) =>
        `STL export created. ${count} SVG pattern${count === 1 ? " or text is" : "s or texts are"} missing or incomplete in the model.`,
      stlError: "Failed to generate STL export.",
      reset: "Design reset.",
      confirmSaveBeforeNew: "Save current project before creating a new one?",
      confirmDeleteSelected: (name: string) => `Delete saved project "${name}"?`,
      confirmReset: "Reset the current design?",
      confirmYes: "Yes",
      confirmNo: "No",
    },
    stlDialog: {
      title: "Export STL",
      description: "Set the panel thickness in millimeters for the 3D model.",
      fileNameLabel: "File name",
      fileNameHint: "The .stl extension is added automatically.",
      thicknessLabel: "Panel thickness (mm)",
      thicknessHint: "Default is 2 mm.",
      previewLabel: "Preview",
      previewLoading: "Loading preview…",
      cancel: "Cancel",
      confirm: "Export STL",
    },
  },
  changelog: {
    buttonLabel: "Changelog",
    title: "Changelog",
    description: "Here is what changed recently in Eurorack Panel Designer.",
    close: "Close",
    viewFull: "Open full changelog",
  },
  order: {
    dialogTitle: "Order this panel",
    dialogDescription:
      "We 3D print your panel in two colors and ship it to you. Pick the colors, get a design code, then buy the panel on Etsy with that code.",
    previewLabel: "Print preview",
    previewLoading: "Loading the 3D preview…",
    panelFilamentLabel: "Panel color",
    detailsFilamentLabel: "Text and pattern color",
    detailsFilamentHint: "Text and SVG patterns are printed in relief, in this color.",
    filamentNames: { white: "White", black: "Black", skyBlue: "Sky blue" },
    widthLabel: "Width",
    widthValue: (widthHp) => `${widthHp} HP`,
    priceLabel: "Price on Etsy",
    price: (priceEur) =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: "EUR",
        trailingZeroDisplay: "stripIfInteger",
      }).format(priceEur),
    priceHint: "Shipping is added on Etsy.",
    stepsTitle: "How ordering works",
    steps: (widthHp) => [
      "Get your design code here.",
      `On Etsy, choose the width ${widthHp} HP.`,
      "Paste the code in the personalization field and complete the purchase.",
    ],
    issueUnsupportedFormat:
      "Only 3U Eurorack panels can be ordered for now. Set the format back to 3U in the width box to order this design.",
    issueTooWide: (widthHp, maxWidthHp) =>
      `Panels up to ${maxWidthHp} HP can be ordered. This one is ${widthHp} HP.`,
    issueSameFilament:
      "The panel, text and patterns share one color: text and patterns will not stand out.",
    issueTextPrint: (count) =>
      count === 1
        ? "A text may not print well: see the warning in its properties."
        : `${count} texts may not print well: see the warnings in their properties.`,
    issueCrowdedHardware: (count) =>
      `${count} components are too close together: their knobs, nuts or washers overlap (in red on the panel).`,
    issueHiddenElements: (count) =>
      count === 1
        ? "A hidden component will not be printed. Show it in the Components tab to include it."
        : `${count} hidden components will not be printed. Show them in the Components tab to include them.`,
    cancel: "Cancel",
    submit: "Get my design code",
    submitting: "Saving your design…",
    errors: {
      unavailable: "Ordering is not available on this site right now.",
      tooLarge: "This design is too large to send. Try smaller SVG artwork.",
      invalid: "This design could not be sent. Reload the page and try again.",
      server: "Your design could not be saved. Try again in a moment.",
      network: "Could not reach the server. Check your connection and try again.",
    },
    pageTitle: "Your panel is ready to order",
    designTitle: "Your panel design",
    codeLabel: "Design code",
    codeHint:
      "This code links your Etsy order to this design. You can come back to this page later.",
    copyCode: "Copy",
    copied: "Copied",
    howToTitle: "Order on Etsy",
    howToSteps: (widthHp) => [
      "Open the Etsy listing with the button below: it copies the code for you.",
      `Choose the width ${widthHp} HP.`,
      "Paste the code in the personalization field, then complete the purchase.",
    ],
    buyCta: "Buy on Etsy",
    buyUnavailable: "Ordering is not available on this site right now.",
    filesTitle: "Print files",
    filesHint: (thicknessMm) =>
      `The STL is built at ${thicknessMm} mm, as the panel is printed. The JSON opens in the designer with "Import JSON".`,
    downloadStl: "Download STL",
    downloadJson: "Download design (JSON)",
    downloadError: "The file could not be built.",
    versionNote: (version, commit) =>
      `Designed with version ${version || "unknown"}${commit ? ` (${commit.slice(0, 7)})` : ""}.`,
    versionChanged: "The designer has changed since: the STL is built with the current version.",
    backToDesigner: "Back to the designer",
    loading: "Loading the design…",
    loadError: "This design could not be loaded. Try again in a moment.",
    notFound: "No design matches this code. Check the code and try again.",
  },
  shortcuts: {
    shift: "Shift",
    disableSnap: "Hold to disable snap",
    esc: "Esc",
    cancelPlacement: "Cancel placement",
    deleteKey: "Delete",
    deleteSelection: "Delete selection",
    undo: "Undo",
    undoShortcut: "Ctrl/Cmd + Z",
    redo: "Redo",
    redoShortcut: "Ctrl/Cmd + Shift + Z",
  },
};
