#!/usr/bin/env python3
"""Generate Google Play listing graphics from brand assets.

Writes:
  docs/store/play-icon-512.png          — Play Console high-res icon (512)
  docs/store/feature-graphic-1024x500.png — Play feature graphic
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ink_texture import grunge_field  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
ICON = ROOT / "assets" / "images" / "icon.png"
SEAL = ROOT / "assets" / "images" / "ink" / "dojang.png"
FONT_DISPLAY = ROOT / "assets" / "fonts" / "ChosunGs.ttf"
OUT_DIR = ROOT / "docs" / "store"

PAPER = (243, 238, 230)  # #F3EEE6
INK = (26, 23, 20)
SEAL_RED = (196, 58, 42)
MUTED = (107, 101, 96)
SEED = 20260822


def paper_ground(size: tuple[int, int]) -> Image.Image:
    base = Image.new("RGB", size, PAPER)
    grain = grunge_field(max(size), SEED, octaves=(9, 41, 151)).filter(ImageFilter.GaussianBlur(1.2))
    grain = grain.crop((0, 0, size[0], size[1]))
    shade = Image.new("RGB", size, (214, 205, 190))
    return Image.composite(shade, base, grain.point(lambda v: 22 if v > 150 else 0))


def scaled_rgba(path: Path, width: int) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    height = round(width * img.height / img.width)
    return img.resize((width, height), Image.LANCZOS)


def write_play_icon() -> None:
    if not ICON.exists():
        raise SystemExit(f"Missing {ICON.relative_to(ROOT)} — run `npm run icons:app` first")
    icon = Image.open(ICON).convert("RGB")
    icon.resize((512, 512), Image.LANCZOS).save(OUT_DIR / "play-icon-512.png", optimize=True)


def write_feature_graphic() -> None:
    if not SEAL.exists():
        raise SystemExit(f"Missing {SEAL.relative_to(ROOT)} — run `npm run icons:seal` first")

    width, height = 1024, 500
    canvas = paper_ground((width, height))
    draw = ImageDraw.Draw(canvas)

    seal = scaled_rgba(SEAL, 220)
    seal_y = (height - seal.height) // 2
    canvas.paste(seal, (88, seal_y), seal)

    title_font = ImageFont.truetype(str(FONT_DISPLAY), 92)
    sub_font = ImageFont.truetype(str(FONT_DISPLAY), 34)
    title = "운명人지도"
    subtitle = "성향 · 사주 · 타로 · 지인 궁합"

    text_x = 360
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_h = title_bbox[3] - title_bbox[1]
    sub_bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
    sub_h = sub_bbox[3] - sub_bbox[1]
    gap = 18
    block_h = title_h + gap + sub_h
    title_y = (height - block_h) // 2

    draw.text((text_x, title_y), title, font=title_font, fill=SEAL_RED)
    draw.text((text_x, title_y + title_h + gap), subtitle, font=sub_font, fill=MUTED)

    # Hairline accent under title block
    rule_y = title_y + block_h + 28
    draw.line([(text_x, rule_y), (width - 72, rule_y)], fill=(210, 200, 188), width=2)

    canvas.save(OUT_DIR / "feature-graphic-1024x500.png", optimize=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_play_icon()
    write_feature_graphic()
    print(f"Wrote {OUT_DIR.relative_to(ROOT)}/play-icon-512.png")
    print(f"Wrote {OUT_DIR.relative_to(ROOT)}/feature-graphic-1024x500.png")


if __name__ == "__main__":
    main()
