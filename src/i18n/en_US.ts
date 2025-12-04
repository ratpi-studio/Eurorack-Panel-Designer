interface Translations {
  app: {
    title: string;
    subtitle: string;
  };
  canvas: {
    hudSuffix: string;
  };
  controls: {
    widthHpLabel: string;
    widthMmLabel: string;
    widthHpHint: string;
    widthMmHint: string;
  };
  display: {
    title: string;
    grid: string;
    snap: string;
    holes: string;
    gridSpacing: string;
    reset: string;
  };
  palette: {
    title: string;
    subtitle: string;
    clear: string;
    select: string;
    place: string;
    items: Record<
      string,
      {
        label: string;
        description: string;
        color: string;
      }
    >;
  };
  properties: {
    title: string;
    subtitle: string;
    delete: string;
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
  };
  projects: {
    title: string;
    subtitle: string;
    nameLabel: string;
    defaultName: string;
    save: string;
    exportJson: string;
    exportPng: string;
    exportSvg: string;
    exportKicadSvg: string;
    exportKicadPcb: string;
    exportStl: string;
    exportMenuLabel: string;
    reset: string;
    savedLabel: string;
    load: string;
    delete: string;
    importJson: string;
    refresh: string;
    messages: {
      saveSuccess: (name: string) => string;
      loadSuccess: (name: string) => string;
      loadError: (name: string) => string;
      deleteSuccess: (name: string) => string;
      importSuccess: (filename: string) => string;
      importError: string;
      pngError: string;
      pngSuccess: string;
      jsonExport: string;
      svgExport: string;
      kicadSvgExport: string;
      kicadPcbExport: string;
      stlExport: string;
      reset: string;
    };
    stlDialog: {
      title: string;
      description: string;
      thicknessLabel: string;
      thicknessHint: string;
      previewLabel: string;
      cancel: string;
      confirm: string;
    };
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
    title: 'Eurorack Panel Designer',
    subtitle: 'Interactive canvas, zoom, pan, selection'
  },
  canvas: {
    hudSuffix: 'Static render'
  },
  controls: {
    widthHpLabel: 'Width (HP)',
    widthMmLabel: 'Width (mm)',
    widthHpHint: 'Eurorack units (1 HP = 5.08 mm)',
    widthMmHint: 'Total panel width in millimeters'
  },
  display: {
    title: 'Display',
    grid: 'Grid',
    snap: 'Snap to grid',
    holes: 'Mounting holes',
    gridSpacing: 'Grid spacing (mm)',
    reset: 'Reset view'
  },
  palette: {
    title: 'Palette',
    subtitle: 'Pick an element to place',
    clear: 'Clear',
    select: 'Select',
    place: 'Place…',
    items: {
      jack: {
        label: 'Jack',
        description: '3.5 mm input/output',
        color: '#38bdf8'
      },
      potentiometer: {
        label: 'Knob',
        description: 'Rotary potentiometer',
        color: '#f472b6'
      },
      switch: {
        label: 'Switch',
        description: 'Toggle switch',
        color: '#facc15'
      },
      led: {
        label: 'LED',
        description: 'Indicator LED',
        color: '#f87171'
      },
      label: {
        label: 'Text',
        description: 'Add a label',
        color: '#f8fafc'
      }
    }
  },
  properties: {
    title: 'Properties',
    subtitle: 'Selection',
    delete: 'Delete',
    empty: 'Select an element to view its properties.',
    multiSelection: (count: number) => `${count} elements selected`,
    multiSelectionHint:
      'Multi-selection is active. Drag elements on the canvas to move the group or press Delete to remove it.',
    posX: 'Position X (mm)',
    posY: 'Position Y (mm)',
    rotation: 'Rotation (°)',
    diameter: 'Diameter (mm)',
    width: 'Width (mm)',
    height: 'Height (mm)',
    text: 'Text',
    fontSize: 'Size (pt)'
  },
  projects: {
    title: 'Projects',
    subtitle: 'Local save + export',
    nameLabel: 'Project name',
    defaultName: 'Untitled panel',
    save: 'Save',
    exportJson: 'Export JSON',
    exportPng: 'Export PNG',
    exportSvg: 'Export SVG',
    exportKicadSvg: 'Export KiCad Edge SVG',
    exportKicadPcb: 'Export KiCad PCB',
    exportStl: 'Export STL',
    exportMenuLabel: 'Choose export format',
    reset: 'Reset design',
    savedLabel: 'Saved projects',
    load: 'Load',
    delete: 'Delete',
    importJson: 'Import JSON',
    refresh: 'Refresh',
    messages: {
      saveSuccess: (name: string) => `Project "${name}" saved.`,
      loadSuccess: (name: string) => `Project "${name}" loaded.`,
      loadError: (name: string) => `Unable to load "${name}".`,
      deleteSuccess: (name: string) => `Project "${name}" deleted.`,
      importSuccess: (filename: string) => `Imported from "${filename}".`,
      importError: 'Invalid JSON import.',
      pngError: 'Canvas not available for PNG export.',
      pngSuccess: 'PNG export created.',
      jsonExport: 'JSON export created.',
      svgExport: 'SVG export created.',
      kicadSvgExport: 'KiCad Edge.Cuts SVG created.',
      kicadPcbExport: 'KiCad PCB export created.',
      stlExport: 'STL export created.',
      reset: 'Design reset.'
    },
    stlDialog: {
      title: 'Export STL',
      description: 'Set the panel thickness in millimeters for the 3D model.',
      thicknessLabel: 'Panel thickness (mm)',
      thicknessHint: 'Default is 2 mm.',
      previewLabel: 'Preview',
      cancel: 'Cancel',
      confirm: 'Export STL'
    }
  },
  shortcuts: {
    shift: 'Shift',
    disableSnap: 'Hold to disable snap',
    esc: 'Esc',
    cancelPlacement: 'Cancel placement',
    deleteKey: 'Delete',
    deleteSelection: 'Delete selection',
    undo: 'Undo',
    undoShortcut: 'Ctrl/Cmd + Z',
    redo: 'Redo',
    redoShortcut: 'Ctrl/Cmd + Shift + Z'
  }
};

type Locale = 'en_US';
