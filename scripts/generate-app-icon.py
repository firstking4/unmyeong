#!/usr/bin/env python3
"""Bake the production app icon from the brand seal only.

Layout: clean paper, vermilion 人 seal centered in the icon (same seal as
`icons:seal`). The brush 운 mark is not used on the launcher icon.

Writes:
  assets/images/icon.png
  assets/images/icon-source.png
  assets/images/favicon.png
  assets/images/android-icon-foreground.png
  assets/images/android-icon-background.png
  assets/images/android-icon-monochrome.png
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ink_texture import grunge_field  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
INK_DIR = ROOT / "assets" / "images" / "ink"
SEAL = INK_DIR / "dojang.png"
OUT_DIR = ROOT / "assets" / "images"

SIZE = 1024
PAPER = (243, 238, 230)  # #F3EEE6 — matches app.json splash / adaptive bg
SEED = 20260814

# Centered seal fill — large enough to read at launcher size, with margin
# inside the rounded mask / Android adaptive safe zone (~66%).
SEAL_ICON = 0.58
SEAL_ANDROID = 0.52
# Upright — stamp texture already reads as handmade without extra rotation.
SEAL_TILT = 0


def paper_ground(size: int = SIZE) -> Image.Image:
    base = Image.new("RGB", (size, size), PAPER)
    grain = grunge_field(size, SEED, octaves=(9, 41, 151)).filter(ImageFilter.GaussianBlur(1.2))
    shade = Image.new("RGB", (size, size), (214, 205, 190))
    return Image.composite(shade, base, grain.point(lambda v: 26 if v > 150 else 0))


def scaled(path: Path, width: int) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    return img.resize((width, round(width * img.height / img.width)), Image.LANCZOS)


def centered_seal(canvas_size: int, scale: float, tilt: float = SEAL_TILT) -> Image.Image:
    seal = scaled(SEAL, int(canvas_size * scale))
    if abs(tilt) > 0.01:
        seal = seal.rotate(tilt, resample=Image.BICUBIC, expand=True)
    return seal


def paste_centered(canvas: Image.Image, layer: Image.Image) -> None:
    x = (canvas.width - layer.width) // 2
    y = (canvas.height - layer.height) // 2
    canvas.paste(layer, (x, y), layer)


def compose_icon() -> Image.Image:
    """Clean paper with the seal centered."""
    ground = paper_ground()
    paste_centered(ground, centered_seal(SIZE, SEAL_ICON))
    return ground


def compose_android_foreground() -> Image.Image:
    """Transparent FG for adaptive icons — seal inside the safe zone."""
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    paste_centered(canvas, centered_seal(SIZE, SEAL_ANDROID))
    return canvas.resize((512, 512), Image.LANCZOS)


def compose_monochrome() -> Image.Image:
    """White silhouette for Android themed icons."""
    fg = compose_android_foreground()
    alpha = fg.getchannel("A")
    out = Image.new("RGBA", fg.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    return out.resize((432, 432), Image.LANCZOS)


def main() -> None:
    if not SEAL.exists():
        raise SystemExit(f"Missing {SEAL.relative_to(ROOT)} — run `npm run icons:seal` first")

    icon = compose_icon()
    icon.save(OUT_DIR / "icon.png", optimize=True)
    icon.save(OUT_DIR / "icon-source.png", optimize=True)
    icon.resize((96, 96), Image.LANCZOS).save(OUT_DIR / "favicon.png", optimize=True)

    bg = Image.new("RGBA", (512, 512), (*PAPER, 255))
    bg.save(OUT_DIR / "android-icon-background.png", optimize=True)

    compose_android_foreground().save(OUT_DIR / "android-icon-foreground.png", optimize=True)
    compose_monochrome().save(OUT_DIR / "android-icon-monochrome.png", optimize=True)

    print(f"Wrote {OUT_DIR.relative_to(ROOT)}/icon.png (1024) — seal only, {SEAL_ICON:.0%} centered")
    print(f"Wrote {OUT_DIR.relative_to(ROOT)}/favicon.png (96)")
    print(f"Wrote android adaptive icons (512 / 432)")


if __name__ == "__main__":
    main()
