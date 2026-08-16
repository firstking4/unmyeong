#!/usr/bin/env python3
"""Slice zodiac drawings from the paper-background sheet.

Keeps soft grey washes behind the line art. Paper beige becomes transparent;
strokes + washes become black+alpha so the app can tint them.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "docs" / "design-samples" / "zodiac-sheet.png"
OUT = ROOT / "assets" / "images" / "zodiac"
SIZE = 512

COLS = [(39, 191), (241, 395), (435, 590), (640, 786), (833, 989)]
ROWS = [(24, 170), (199, 352), (376, 525)]

PICKS: dict[str, tuple[int, int]] = {
    "aries": (0, 0),
    "taurus": (0, 1),
    "gemini": (0, 2),
    "cancer": (0, 4),
    "leo": (1, 1),
    "virgo": (1, 2),
    "libra": (1, 3),
    "scorpio": (2, 0),
    "sagittarius": (2, 1),
    "capricorn": (2, 2),
    "aquarius": (2, 3),
    "pisces": (2, 4),
}

# Sheet paper sits ~L 244. Anything below that is wash or ink; the divisor
# decides how quickly the soft wash turns opaque.
PAPER_L = 242.0
WASH_FLOOR = 70.0


def cell_rgba(sheet: Image.Image, row: int, col: int) -> Image.Image:
    x0, x1 = COLS[col]
    y0, y1 = ROWS[row]
    rgb = np.asarray(sheet.crop((x0, y0, x1, y1)).convert("RGB"), dtype=np.float32)
    lum = rgb.mean(axis=2)

    # Distance below paper → alpha. Soft wash keeps a light veil; ink goes solid.
    delta = np.clip(PAPER_L - lum, 0, None)
    # Gentle curve: wash (~10–35 delta) → soft alpha; ink (big delta) → near opaque.
    alpha = np.clip(delta / WASH_FLOOR, 0, 1)
    alpha = (np.power(alpha, 0.85) * 255).astype(np.uint8)

    out = Image.fromarray(alpha)
    box = out.getbbox()
    if box:
        out = out.crop(box)
    return out


def square(alpha: Image.Image) -> Image.Image:
    inner = int(SIZE * 0.9)
    scale = min(inner / alpha.width, inner / alpha.height)
    art = alpha.resize(
        (max(1, round(alpha.width * scale)), max(1, round(alpha.height * scale))),
        Image.LANCZOS,
    )
    canvas = Image.new("L", (SIZE, SIZE), 0)
    canvas.paste(art, ((SIZE - art.width) // 2, (SIZE - art.height) // 2))
    rgba = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    rgba.putalpha(canvas)
    return rgba


def main() -> None:
    if not SHEET.exists():
        raise SystemExit(f"missing sheet: {SHEET}")
    sheet = Image.open(SHEET).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    for sign, (row, col) in PICKS.items():
        image = square(cell_rgba(sheet, row, col))
        path = OUT / f"{sign}.png"
        image.save(path, "PNG")
        print(f"wrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
