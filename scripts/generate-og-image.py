#!/usr/bin/env python3
"""Draws public/images/og.png, the 1200x630 card social networks and chat apps show for a link.

Run by hand after a visual change; the result is committed, so a build never needs Python:

    python3 scripts/generate-og-image.py

The panel on the right is drawn to scale from the same numbers the editor applies: a 12 HP 3U
panel, 60.6 mm wide and 128.5 mm high, with mounting holes 7.5 mm from the left edge and every
10 HP after it, Thonkiconn jacks (6 mm hole, 7.8 mm nut) and Alpha pots under Davies knobs.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" / "og.png"

W, H = 1200, 630
SS = 4  # supersampling, for clean circles

BG = (2, 6, 23)
PANEL = (15, 23, 42)
PANEL_EDGE = (51, 65, 85)
HOLE = (2, 6, 23)
TEXT = (241, 245, 249)
MUTED = (148, 163, 184)
ACCENT = (56, 189, 248)
KNOB = (71, 85, 105)

FONT_DIRS = [
    "/usr/share/fonts/truetype/google-fonts",
    "/usr/share/fonts/truetype/dejavu",
    "/usr/share/fonts/truetype/liberation2",
]


def font(names, size):
    for name in names:
        for directory in FONT_DIRS:
            candidate = Path(directory) / name
            if candidate.exists():
                return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size)


def bold(size):
    return font(["Poppins-Bold.ttf", "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf"], size)


def medium(size):
    return font(["Poppins-Medium.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf"], size)


def mono(size):
    return font(["DejaVuSansMono-Bold.ttf", "LiberationMono-Bold.ttf"], size)


def tracked(draw, xy, text, fill, typeface, tracking):
    """Letter-spaced text: PIL has no tracking, so each glyph is placed by hand."""
    x, y = xy
    for character in text:
        draw.text((x, y), character, font=typeface, fill=fill)
        x += draw.textlength(character, font=typeface) + tracking


def draw_panel(draw, scale):
    """A 12 HP 3U panel, in millimeters scaled to the supersampled canvas."""
    px_per_mm = 3.6 * scale
    width_mm, height_mm = 60.6, 128.5
    left = 828 * scale
    top = (H - height_mm * 3.6) / 2 * scale

    def at(x_mm, y_mm):
        return (left + x_mm * px_per_mm, top + y_mm * px_per_mm)

    def disc(x_mm, y_mm, diameter_mm, fill, outline=None, width=1):
        radius = diameter_mm / 2 * px_per_mm
        cx, cy = at(x_mm, y_mm)
        draw.ellipse(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            fill=fill,
            outline=outline,
            width=int(width * scale),
        )

    body = [*at(0, 0), *at(width_mm, height_mm)]
    draw.rounded_rectangle(body, radius=3 * scale, fill=PANEL, outline=PANEL_EDGE, width=2 * scale)

    # Mounting holes: 7.5 mm from the left edge, then every 10 HP; rows 3 mm from top and bottom.
    for x_mm in (7.5, 7.5 + 10 * 5.08):
        for y_mm in (3.0, height_mm - 3.0):
            disc(x_mm, y_mm, 3.4, HOLE, PANEL_EDGE, 1)

    # Two potentiometers under Davies 1900H knobs, with a label above each.
    for x_mm in (17.0, 43.0):
        disc(x_mm, 30.0, 12.7, KNOB, PANEL_EDGE, 1)
        disc(x_mm, 30.0, 2.6, HOLE)
        cx, cy = at(x_mm, 30.0)
        indicator = 5.2 / 2 * px_per_mm
        draw.line([cx, cy, cx, cy - indicator], fill=ACCENT, width=int(2 * scale))

    # Two LEDs.
    for x_mm in (17.0, 43.0):
        disc(x_mm, 46.0, 3.0, ACCENT)

    # Four Thonkiconn jacks: 6 mm hole under a 7.8 mm knurled nut.
    for y_mm in (74.0, 98.0):
        for x_mm in (17.0, 43.0):
            disc(x_mm, y_mm, 7.8, KNOB, PANEL_EDGE, 1)
            disc(x_mm, y_mm, 6.0, HOLE)

    # Legends, as raised text would sit on a printed panel.
    label = medium(int(7 * scale))
    for text, x_mm, y_mm in (
        ("FREQ", 17.0, 39.0),
        ("RES", 43.0, 39.0),
        ("IN", 17.0, 81.5),
        ("CV", 43.0, 81.5),
        ("OUT", 17.0, 105.5),
        ("SUB", 43.0, 105.5),
    ):
        cx, cy = at(x_mm, y_mm)
        width = draw.textlength(text, font=label)
        draw.text((cx - width / 2, cy), text, font=label, fill=MUTED)

    title = bold(int(9 * scale))
    width = draw.textlength("VCF", font=title)
    cx, cy = at(width_mm / 2, 118.0)
    draw.text((cx - width / 2, cy), "VCF", font=title, fill=TEXT)


def main() -> None:
    image = Image.new("RGB", (W * SS, H * SS), BG)
    draw = ImageDraw.Draw(image)

    # A faint dot grid on the 5.08 mm rail pitch, at the same scale as the panel.
    step = 5.08 * 3.6 * SS
    y = step
    while y < H * SS:
        x = step
        while x < W * SS:
            draw.ellipse([x - SS, y - SS, x + SS, y + SS], fill=(15, 23, 42))
            x += step
        y += step

    tracked(draw, (64 * SS, 96 * SS), "FREE  ·  OPEN SOURCE  ·  IN YOUR BROWSER",
            ACCENT, mono(int(17 * SS)), 1.6 * SS)

    draw.text((64 * SS, 150 * SS), "Eurorack", font=bold(int(76 * SS)), fill=TEXT)
    draw.text((64 * SS, 238 * SS), "Panel Designer", font=bold(int(76 * SS)), fill=TEXT)

    body = medium(int(25 * SS))
    draw.text((64 * SS, 356 * SS),
              "Place real parts at the hole their datasheet", font=body, fill=MUTED)
    draw.text((64 * SS, 392 * SS),
              "calls for. Preview in 3D. Export STL, SVG,", font=body, fill=MUTED)
    draw.text((64 * SS, 428 * SS),
              "PNG or KiCad Edge.Cuts.", font=body, fill=MUTED)

    draw.text((64 * SS, 496 * SS), "eurorackpanel.com", font=bold(int(28 * SS)), fill=ACCENT)

    draw_panel(draw, SS)

    image.resize((W, H), Image.LANCZOS).save(OUT, "PNG", optimize=True)
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
