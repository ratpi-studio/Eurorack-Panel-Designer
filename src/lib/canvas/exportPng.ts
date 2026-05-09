import { computeElementMountingHoles } from "@lib/elementMountingHoles";
import { type MountingHole, type PanelModel } from "@lib/panelTypes";
import { buildSvgArtworkDataUrl, isSvgArtworkElement } from "@lib/svgArtwork";
import { themeValues } from "@styles/theme.css";

import { deriveExportPaletteFromModel } from "./palette";
import { drawPanelScene } from "./renderScene";
import { computeCanvasTransform } from "./transform";

export interface BuildPanelPngOptions {
  scale?: number;
  maxWidthPx?: number;
}

const DEFAULT_SCALE = 4;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = src;
  });
}

export async function buildPanelPngDataUrl(
  model: PanelModel,
  mountingHoles: MountingHole[],
  options: BuildPanelPngOptions = {},
): Promise<string | null> {
  const requestedScale = options.scale ?? DEFAULT_SCALE;
  const baseWidthPx = Math.max(1, Math.round(model.dimensions.widthMm * requestedScale));
  const baseHeightPx = Math.max(1, Math.round(model.dimensions.heightMm * requestedScale));
  const cap = options.maxWidthPx;
  const scaleFactor = cap && baseWidthPx > cap ? cap / baseWidthPx : 1;
  const widthPx = Math.max(1, Math.round(baseWidthPx * scaleFactor));
  const heightPx = Math.max(1, Math.round(baseHeightPx * scaleFactor));

  const offscreen = document.createElement("canvas");
  offscreen.width = widthPx;
  offscreen.height = heightPx;
  const context = offscreen.getContext("2d");
  if (!context) {
    return null;
  }

  const elementMountingHoles = computeElementMountingHoles(model.elements, model.elementHoleConfig);
  const svgArtworkImages = new Map<string, HTMLImageElement>();
  const artworkElements = model.elements.filter(isSvgArtworkElement);
  const loadedArtworkImages = await Promise.all(
    artworkElements.map((element) =>
      loadImage(
        buildSvgArtworkDataUrl({
          ...element.properties,
          color: model.designColor,
        }),
      ).then((image) => [element.id, image] as const),
    ),
  );
  loadedArtworkImages.forEach(([id, image]) => {
    svgArtworkImages.set(id, image);
  });

  const transform = computeCanvasTransform({
    canvasSizePx: { x: widthPx, y: heightPx },
    panelSizeMm: { x: model.dimensions.widthMm, y: model.dimensions.heightMm },
    zoom: 1,
    pan: { x: 0, y: 0 },
    paddingPx: 0,
  });

  const derived = deriveExportPaletteFromModel(model);

  drawPanelScene({
    context,
    transform,
    panelSizeMm: { x: model.dimensions.widthMm, y: model.dimensions.heightMm },
    elements: model.elements,
    mountingHoles,
    elementMountingHoles,
    mountingHolesSelected: false,
    selectedElementIds: [],
    showGrid: model.options.showGrid,
    showMountingHoles: model.options.showMountingHoles,
    gridSizeMm: model.options.gridSizeMm,
    palette: derived.palette,
    elementFillColors: derived.elementFillColors,
    elementStrokeColor: derived.elementStrokeColor,
    fontFamily: themeValues.font.body,
    svgArtworkImages,
  });

  return offscreen.toDataURL("image/png");
}
