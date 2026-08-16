#!/usr/bin/env python3
"""Compose app icon candidates from the real brand parts.

Everything is assembled from `brush-in.png` and `dojang.png` so the seal on the
icon is the same 人 stamp the app uses, at a size we control. Writes candidates
plus a comparison sheet to /tmp for review; nothing in assets/ is touched.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ink_texture import stamp  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
INK_DIR = ROOT / "assets" / "images" / "ink"
MARK = INK_DIR / "brush-un.png"
SEAL = INK_DIR / "dojang.png"
MOUNTAINS = INK_DIR / "mountains-wash.png"
OUT = Path("/tmp/icon-candidates")

SIZE = 1024
PAPER = (241, 234, 221)
SEAL_RGB = (178, 58, 47)
SEED = 20260814


def paper_ground() -> Image.Image:
    """Hanji base: flat warm tone with a faint fibre grain."""
    from ink_texture import grunge_field

    base = Image.new("RGB", (SIZE, SIZE), PAPER)
    grain = grunge_field(SIZE, SEED, octaves=(9, 41, 151)).filter(ImageFilter.GaussianBlur(1.2))
    # Very light multiply keeps the texture perceptible but never dirty.
    shade = Image.new("RGB", (SIZE, SIZE), (214, 205, 190))
    return Image.composite(shade, base, grain.point(lambda v: 26 if v > 150 else 0))


def with_mountains(ground: Image.Image, opacity: int) -> Image.Image:
    wash = Image.open(MOUNTAINS).convert("RGBA")
    wash = wash.resize((SIZE, int(SIZE * wash.height / wash.width)), Image.LANCZOS)
    alpha = wash.getchannel("A").point(lambda v: int(v * opacity / 255))
    wash.putalpha(alpha)
    out = ground.copy()
    out.paste(wash, (0, SIZE - wash.height), wash)
    return out


def scaled(path: Path, width: int) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    return img.resize((width, round(width * img.height / img.width)), Image.LANCZOS)


def place(ground: Image.Image, layer: Image.Image, box: tuple[int, int]) -> None:
    ground.paste(layer, box, layer)


def candidate_a() -> Image.Image:
    """Clean paper, large seal tilted in the lower right (chosen brand mark)."""
    ground = paper_ground()
    mark = scaled(MARK, int(SIZE * 0.72))
    place(ground, mark, ((SIZE - mark.width) // 2, int(SIZE * 0.16)))
    seal = scaled(SEAL, int(SIZE * 0.24))
    seal = seal.rotate(-12, resample=Image.BICUBIC, expand=True)
    x = min(int(SIZE * 0.67), SIZE - seal.width - 16)
    y = min(int(SIZE * 0.67), SIZE - seal.height - 16)
    place(ground, seal, (x, y))
    return ground


def candidate_b() -> Image.Image:
    """Faint mountains, seal centred beneath the mark."""
    ground = with_mountains(paper_ground(), 70)
    mark = scaled(MARK, int(SIZE * 0.66))
    place(ground, mark, ((SIZE - mark.width) // 2, int(SIZE * 0.13)))
    seal = scaled(SEAL, int(SIZE * 0.19))
    place(ground, seal, ((SIZE - seal.width) // 2, int(SIZE * 0.70)))
    return ground


def candidate_c() -> Image.Image:
    """The icon itself is a pressed seal: carved frame with the mark inside."""
    canvas = SIZE * 2
    frame_mask = Image.new("L", (canvas, canvas), 0)
    draw = ImageDraw.Draw(frame_mask)
    outer = canvas * 0.055
    draw.rectangle(
        [outer, outer, canvas - outer, canvas - outer],
        outline=255,
        width=int(canvas * 0.075),
    )
    inner = canvas * 0.175
    draw.rectangle(
        [inner, inner, canvas - inner, canvas - inner],
        outline=255,
        width=int(canvas * 0.016),
    )
    inked = stamp(
        frame_mask,
        SEED,
        void_threshold=95,
        bites=220,
        bite_radius=canvas * 0.008,
        octaves=(23, 53, 109),
    )
    frame = Image.new("RGBA", (canvas, canvas), (*SEAL_RGB, 0))
    frame.putalpha(inked)
    frame = frame.resize((SIZE, SIZE), Image.LANCZOS)

    ground = paper_ground()
    mark = scaled(MARK, int(SIZE * 0.56))
    place(ground, mark, ((SIZE - mark.width) // 2, int(SIZE * 0.26)))
    ground.paste(frame, (0, 0), frame)
    return ground


def candidate_d() -> Image.Image:
    """Seal pressed partly over the ink, the way a finished piece is signed."""
    ground = paper_ground()
    mark = scaled(MARK, int(SIZE * 0.76))
    place(ground, mark, (int(SIZE * 0.06), int(SIZE * 0.14)))
    seal = scaled(SEAL, int(SIZE * 0.26))
    place(ground, seal, (int(SIZE * 0.63), int(SIZE * 0.60)))
    return ground


CANDIDATES = {
    "a-corner-seal": candidate_a,
    "b-center-seal": candidate_b,
    "c-seal-frame": candidate_c,
    "d-signed-overlap": candidate_d,
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    images = {}
    for name, fn in CANDIDATES.items():
        image = fn()
        image.save(OUT / f"{name}.png", optimize=True)
        images[name] = image
        print(f"Wrote {OUT / f'{name}.png'}")

    # Comparison sheet: full art on top, launcher and home-screen sizes below.
    pad, big = 28, 300
    sheet = Image.new("RGB", (len(images) * (big + pad) + pad, big + 200), (255, 255, 255))
    for index, image in enumerate(images.values()):
        x = pad + index * (big + pad)
        sheet.paste(image.resize((big, big), Image.LANCZOS), (x, pad))
        sheet.paste(image.resize((120, 120), Image.LANCZOS), (x, big + pad * 2))
        sheet.paste(image.resize((60, 60), Image.LANCZOS), (x + 140, big + pad * 2))
    sheet.save("/tmp/icon-candidates-sheet.png")
    print("Wrote /tmp/icon-candidates-sheet.png")


if __name__ == "__main__":
    main()
