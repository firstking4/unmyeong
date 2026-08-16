#!/usr/bin/env python3
"""Bake brand ink assets: Hangul 운 brush mark + seal-centred splash lockup.

Native splash only accepts an image. Splash matches the launcher icon face:
clean paper with the vermilion 人 seal centred (same stamp as `icons:seal`).
The brush 운 mark is still written for other brand uses.
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ink_texture import grunge_field, stamp  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "assets" / "fonts" / "ChosunGs.ttf"
SEAL = ROOT / "assets" / "images" / "ink" / "dojang.png"

MARK_OUT = ROOT / "assets" / "images" / "ink" / "brush-un.png"
SPLASH_OUT = ROOT / "assets" / "images" / "splash-lockup.png"
SAMPLE_OUT = ROOT / "docs" / "design-samples" / "icon-splash-seal-preview.png"

PAPER = (243, 238, 230)  # #F3EEE6 — matches app.json splash / icon
INK = (26, 23, 20)
GLYPH = "운"
SEED = 20260816

# Match generate-app-icon.py — upright seal, centred.
SEAL_SPLASH = 0.52
SEAL_TILT = 0


def _dry_brush_streaks(mask: Image.Image, seed: int) -> Image.Image:
    """Carve thin gaps along the stroke so the glyph reads as a brush, not type."""
    rng = random.Random(seed + 401)
    size = mask.width
    cutter = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(cutter)
    edge = mask.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
    pts = [(x, y) for y in range(0, size, 3) for x in range(0, size, 3) if edge.getpixel((x, y))]
    if not pts:
        return mask
    for _ in range(max(40, size // 18)):
        x, y = rng.choice(pts)
        length = rng.randint(size // 40, size // 14)
        angle = rng.uniform(-0.5, 0.5)
        dx, dy = length, int(length * angle)
        width = max(1, size // 220)
        draw.line([(x, y), (x + dx, y + dy)], fill=255, width=width)
    cutter = cutter.filter(ImageFilter.GaussianBlur(size * 0.0012))
    return ImageChops.subtract(mask, cutter.point(lambda v: int(v * 0.55)))


def _splatters(size: int, seed: int) -> Image.Image:
    rng = random.Random(seed + 883)
    layer = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(layer)
    for _ in range(22):
        x = rng.randint(int(size * 0.18), int(size * 0.82))
        y = rng.randint(int(size * 0.12), int(size * 0.88))
        r = rng.randint(max(2, size // 400), max(4, size // 120))
        draw.ellipse([x - r, y - r, x + r, y + r], fill=rng.randint(120, 255))
    return layer.filter(ImageFilter.GaussianBlur(size * 0.0008))


def render_brush_un(canvas: int = 1400) -> Image.Image:
    """Transparent ink mark of Hangul 운 in the brand display face."""
    mask = Image.new("L", (canvas, canvas), 0)
    font = ImageFont.truetype(str(FONT), int(canvas * 0.78))
    ImageDraw.Draw(mask).text(
        (canvas / 2, canvas * 0.52), GLYPH, font=font, fill=255, anchor="mm"
    )
    mask = mask.filter(ImageFilter.MaxFilter(max(3, int(canvas * 0.008) | 1)))
    mask = _dry_brush_streaks(mask, SEED)

    inked = stamp(
        mask,
        SEED,
        void_threshold=108,
        bites=110,
        bite_radius=canvas * 0.007,
        octaves=(19, 47, 97),
    )
    inked = ImageChops.lighter(inked, _splatters(canvas, SEED).point(lambda v: int(v * 0.65)))

    mark = Image.new("RGBA", (canvas, canvas), (*INK, 0))
    mark.putalpha(inked)
    bbox = mark.getbbox()
    if bbox:
        mark = mark.crop(bbox)
    return mark


def paper_ground(size: int) -> Image.Image:
    base = Image.new("RGB", (size, size), PAPER)
    grain = grunge_field(size, SEED, octaves=(9, 41, 151)).filter(ImageFilter.GaussianBlur(1.2))
    shade = Image.new("RGB", (size, size), (214, 205, 190))
    return Image.composite(shade, base, grain.point(lambda v: 26 if v > 150 else 0))


def centered_seal(canvas_size: int, scale: float) -> Image.Image:
    seal = Image.open(SEAL).convert("RGBA")
    width = int(canvas_size * scale)
    seal = seal.resize((width, round(width * seal.height / seal.width)), Image.LANCZOS)
    if abs(SEAL_TILT) > 0.01:
        seal = seal.rotate(SEAL_TILT, resample=Image.BICUBIC, expand=True)
    return seal


def render_splash() -> Image.Image:
    """Square native-splash: paper + centred 人 seal (same face as app icon)."""
    size = 1024
    canvas = paper_ground(size)
    seal = centered_seal(size, SEAL_SPLASH)
    canvas.paste(seal, ((size - seal.width) // 2, (size - seal.height) // 2), seal)
    return canvas


def write_preview(icon: Image.Image, splash: Image.Image) -> None:
    """Side-by-side sample for review (icon · splash)."""
    SAMPLE_OUT.parent.mkdir(parents=True, exist_ok=True)
    cell = 512
    pad = 48
    label_h = 56
    w = pad * 3 + cell * 2
    h = pad * 2 + cell + label_h
    board = Image.new("RGB", (w, h), (32, 30, 28))
    icon_s = icon.resize((cell, cell), Image.LANCZOS)
    splash_s = splash.resize((cell, cell), Image.LANCZOS)
    board.paste(icon_s, (pad, pad))
    board.paste(splash_s, (pad * 2 + cell, pad))
    draw = ImageDraw.Draw(board)
    try:
        font = ImageFont.truetype(str(FONT), 28)
    except OSError:
        font = ImageFont.load_default()
    draw.text((pad + cell // 2, pad + cell + 12), "앱 아이콘", font=font, fill=(230, 224, 214), anchor="mt")
    draw.text(
        (pad * 2 + cell + cell // 2, pad + cell + 12),
        "로딩(스플래시)",
        font=font,
        fill=(230, 224, 214),
        anchor="mt",
    )
    board.save(SAMPLE_OUT, optimize=True)


def main() -> None:
    if not SEAL.exists():
        raise SystemExit(f"Missing {SEAL.relative_to(ROOT)} — run `npm run icons:seal` first")

    mark = render_brush_un()
    mark.save(MARK_OUT, optimize=True)
    print(f"Wrote {MARK_OUT.relative_to(ROOT)} ({mark.width}x{mark.height})")

    splash = render_splash()
    splash.save(SPLASH_OUT, optimize=True)
    print(f"Wrote {SPLASH_OUT.relative_to(ROOT)} (1024x1024) — seal only, tilt {SEAL_TILT}°")

    # Preview needs regenerated icon — load after icons:app, or compose here lightly.
    icon_path = ROOT / "assets" / "images" / "icon.png"
    if icon_path.exists():
        write_preview(Image.open(icon_path).convert("RGB"), splash)
        print(f"Wrote {SAMPLE_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
