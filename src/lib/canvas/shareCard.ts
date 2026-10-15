import { type MountingHole, type PanelModel } from "@lib/panelTypes";
import { themeValues } from "@styles/theme.css";

import { buildPanelPngDataUrl } from "./exportPng";

/** The card chats and forums show for a shared link, at the size Open Graph asks for. */
export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;

/** Where the panel sits: the right part of the card, its texts on the left. */
const PANEL_BOX = { x: 640, y: 50, width: 500, height: 530 };
const TEXT_X = 64;
const TEXT_WIDTH = 520;
const NAME_LINE_HEIGHT = 72;
const MAX_NAME_LINES = 2;

export interface ShareCardText {
  name: string;
  size: string;
  /** A line above the name, saying where the panel was made. */
  tagline: string;
  /** The site's address, at the bottom of the card. */
  site: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the panel image."));
    image.src = src;
  });
}

/** `text` cut to `maxWidth`, with an ellipsis when it had to be cut. */
function ellipsize(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }
  let cut = text;
  while (cut.length > 1 && context.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

/** `text` wrapped on words to `maxWidth`, in at most `maxLines` lines, the last one cut short. */
export function fitLines(
  context: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1);
    if (last !== undefined && context.measureText(`${last} ${word}`).width <= maxWidth) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  const kept = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    kept[maxLines - 1] = [kept[maxLines - 1], ...lines.slice(maxLines)].join(" ");
  }
  return kept.map((line) => ellipsize(context as CanvasRenderingContext2D, line, maxWidth));
}

/** A faint dot grid behind everything, like the site's own card. */
function drawDotGrid(context: CanvasRenderingContext2D): void {
  const step = 18;
  context.fillStyle = themeValues.color.surface;
  for (let y = step; y < SHARE_CARD_HEIGHT; y += step) {
    for (let x = step; x < SHARE_CARD_WIDTH; x += step) {
      context.fillRect(x - 1, y - 1, 2, 2);
    }
  }
}

/**
 * The card a shared design's link shows: the panel as the PNG export draws it, without the
 * editing grid, next to its name and size. Returns a PNG data URL, or null without a canvas.
 */
export async function buildShareCardPng(
  model: PanelModel,
  mountingHoles: MountingHole[],
  text: ShareCardText,
): Promise<string | null> {
  const { widthMm, heightMm } = model.dimensions;
  const fit = Math.min(PANEL_BOX.width / widthMm, PANEL_BOX.height / heightMm);
  // Drawn at twice the size it takes on the card, then scaled down, so holes and texts stay sharp.
  const panelUrl = await buildPanelPngDataUrl(
    { ...model, options: { ...model.options, showGrid: false } },
    mountingHoles,
    { scale: fit * 2 },
  );
  if (!panelUrl) {
    return null;
  }
  const panel = await loadImage(panelUrl);

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }
  const { color, font } = themeValues;

  context.fillStyle = color.background;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  drawDotGrid(context);

  const panelWidth = widthMm * fit;
  const panelHeight = heightMm * fit;
  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.55)";
  context.shadowBlur = 40;
  context.shadowOffsetY = 12;
  context.drawImage(
    panel,
    PANEL_BOX.x + (PANEL_BOX.width - panelWidth) / 2,
    PANEL_BOX.y + (PANEL_BOX.height - panelHeight) / 2,
    panelWidth,
    panelHeight,
  );
  context.restore();

  context.textBaseline = "alphabetic";
  context.fillStyle = color.accent;
  context.font = `600 20px ${font.body}`;
  context.fillText(ellipsize(context, text.tagline, TEXT_WIDTH), TEXT_X, 150);

  context.fillStyle = color.textPrimary;
  context.font = `700 60px ${font.body}`;
  const nameLines = fitLines(context, text.name, TEXT_WIDTH, MAX_NAME_LINES);
  nameLines.forEach((line, index) => {
    context.fillText(line, TEXT_X, 236 + index * NAME_LINE_HEIGHT);
  });

  if (text.size) {
    context.fillStyle = color.textSecondary;
    context.font = `500 30px ${font.body}`;
    const sizeY = 236 + (nameLines.length - 1) * NAME_LINE_HEIGHT + 62;
    context.fillText(ellipsize(context, text.size, TEXT_WIDTH), TEXT_X, sizeY);
  }

  context.fillStyle = color.accent;
  context.font = `700 28px ${font.body}`;
  context.fillText(text.site, TEXT_X, 560);

  return canvas.toDataURL("image/png");
}
