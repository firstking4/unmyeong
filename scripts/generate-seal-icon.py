#!/usr/bin/env python3
"""Generate the vermilion dojang (도장) seal icon used across the brand UI.

The glyph is set in the brand display face (조선궁서체) inside a double frame,
then eroded so the seal reads as ink pressed onto paper — ragged outer edge,
broken frame, and dry voids inside the strokes.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ink_texture import stamp  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "assets" / "fonts" / "ChosunGs.ttf"
OUT = ROOT / "assets" / "images" / "ink" / "dojang.png"

# Rendered large, then downsampled — keeps the carved edge crisp at tab/header sizes.
SUPERSAMPLE = 6
SIZE = 128
CANVAS = SIZE * SUPERSAMPLE
SEAL = (178, 58, 47)
GLYPH = "人"
SEED = 20260814


def carved_mask(canvas: int = CANVAS) -> Image.Image:
    """Opaque where ink should print: a double frame plus the glyph."""
    mask = Image.new("L", (canvas, canvas), 0)
    draw = ImageDraw.Draw(mask)

    outer = canvas * 0.035
    draw.rounded_rectangle(
        [outer, outer, canvas - outer, canvas - outer],
        # Just enough to take the razor point off the corners; still a square seal.
        radius=canvas * 0.06,
        outline=255,
        width=int(canvas * 0.055),
    )
    inner = canvas * 0.135
    draw.rounded_rectangle(
        [inner, inner, canvas - inner, canvas - inner],
        radius=canvas * 0.04,
        outline=255,
        width=int(canvas * 0.018),
    )

    font = ImageFont.truetype(str(FONT), int(canvas * 0.66))
    glyph = Image.new("L", (canvas, canvas), 0)
    ImageDraw.Draw(glyph).text(
        (canvas / 2, canvas * 0.52), GLYPH, font=font, fill=255, anchor="mm"
    )
    # Thicken the stroke so it survives erosion at small sizes.
    glyph = glyph.filter(ImageFilter.MaxFilter(max(3, int(canvas * 0.012) | 1)))
    mask.paste(255, (0, 0), glyph)
    return mask


def seal_alpha(size: int) -> Image.Image:
    """Eroded seal alpha at `size` px — shared with the tab icon generator."""
    canvas = size * SUPERSAMPLE
    ink = stamp(
        carved_mask(canvas),
        SEED,
        void_threshold=95,
        bites=140,
        bite_radius=canvas * 0.010,
        octaves=(23, 53, 109),
    )
    return ink.resize((size, size), Image.LANCZOS)


def main() -> None:
    seal = Image.new("RGBA", (SIZE, SIZE), (*SEAL, 0))
    seal.putalpha(seal_alpha(SIZE))
    seal.save(OUT, optimize=True)
    print(f"Wrote {OUT.relative_to(ROOT)} ({SIZE}x{SIZE})")


if __name__ == "__main__":
    main()
