#!/usr/bin/env python3
"""Sample app icons: diagonal 운명 (운 high / 명 low) + seal in the top-right.

Five tight variations of the same composition — seal size, diagonal drop,
and how hard the seal sits in the corner. Writes to docs/design-samples.
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
OUT = ROOT / "docs" / "design-samples" / "app-icon-diagonal"
SHEET = ROOT / "docs" / "design-samples" / "app-icon-diagonal.png"

SIZE = 1024
PAPER = (243, 238, 230)
INK = (26, 23, 20)
SEED = 20260816


def _dry_brush(mask: Image.Image, seed: int) -> Image.Image:
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
        dx, dy = length, int(length * rng.uniform(-0.5, 0.5))
        draw.line([(x, y), (x + dx, y + dy)], fill=255, width=max(1, size // 220))
    cutter = cutter.filter(ImageFilter.GaussianBlur(size * 0.0012))
    return ImageChops.subtract(mask, cutter.point(lambda v: int(v * 0.55)))


def _splatters(size: int, seed: int) -> Image.Image:
    rng = random.Random(seed + 883)
    layer = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(layer)
    for _ in range(18):
        x = rng.randint(int(size * 0.18), int(size * 0.82))
        y = rng.randint(int(size * 0.12), int(size * 0.88))
        r = rng.randint(max(2, size // 400), max(4, size // 130))
        draw.ellipse([x - r, y - r, x + r, y + r], fill=rng.randint(120, 255))
    return layer.filter(ImageFilter.GaussianBlur(size * 0.0008))


def brush_glyph(text: str, canvas: int = 1200, seed: int = SEED) -> Image.Image:
    mask = Image.new("L", (canvas, canvas), 0)
    font = ImageFont.truetype(str(FONT), int(canvas * 0.78))
    ImageDraw.Draw(mask).text(
        (canvas / 2, canvas * 0.52), text, font=font, fill=255, anchor="mm"
    )
    mask = mask.filter(ImageFilter.MaxFilter(max(3, int(canvas * 0.008) | 1)))
    mask = _dry_brush(mask, seed)
    inked = stamp(
        mask, seed,
        void_threshold=108, bites=110,
        bite_radius=canvas * 0.007, octaves=(19, 47, 97),
    )
    inked = ImageChops.lighter(inked, _splatters(canvas, seed).point(lambda v: int(v * 0.6)))
    mark = Image.new("RGBA", (canvas, canvas), (*INK, 0))
    mark.putalpha(inked)
    bbox = mark.getbbox()
    return mark.crop(bbox) if bbox else mark


def paper_ground() -> Image.Image:
    base = Image.new("RGB", (SIZE, SIZE), PAPER)
    grain = grunge_field(SIZE, SEED, octaves=(9, 41, 151)).filter(ImageFilter.GaussianBlur(1.2))
    shade = Image.new("RGB", (SIZE, SIZE), (214, 205, 190))
    return Image.composite(shade, base, grain.point(lambda v: 26 if v > 150 else 0))


def fit(img: Image.Image, *, w: int | None = None, h: int | None = None) -> Image.Image:
    if w is None:
        w = round(h * img.width / img.height)
    if h is None:
        h = round(w * img.height / img.width)
    return img.resize((w, h), Image.LANCZOS)


def seal_at(scale: float, angle: float = -12) -> Image.Image:
    s = Image.open(SEAL).convert("RGBA")
    s = fit(s, w=int(SIZE * scale))
    return s.rotate(angle, resample=Image.BICUBIC, expand=True)


def paste(ground: Image.Image, layer: Image.Image, xy: tuple[int, int]) -> None:
    ground.paste(layer, xy, layer)


UN = brush_glyph("운", seed=SEED)
MYEONG = brush_glyph("명", seed=SEED + 7)


def compose(
    *,
    glyph_h: float,
    gap: float,
    drop: float,
    un_x: float,
    un_y: float,
    seal_scale: float,
    seal_angle: float,
    seal_right: float,
    seal_top: float,
) -> Image.Image:
    """Diagonal 운명 (운 up-left / 명 down-right) + seal anchored top-right.

    drop = how far 명 sits below 운, as a fraction of SIZE.
    seal_right / seal_top = inset from the frame edges (negative = bleed out).
    """
    g = paper_ground()
    gh = int(SIZE * glyph_h)
    un, my = fit(UN, h=gh), fit(MYEONG, h=gh)

    ux = int(SIZE * un_x)
    uy = int(SIZE * un_y)
    mx = ux + un.width + int(SIZE * gap)
    my_y = uy + int(SIZE * drop)

    paste(g, un, (ux, uy))
    paste(g, my, (mx, my_y))

    s = seal_at(seal_scale, angle=seal_angle)
    sx = SIZE - s.width - int(SIZE * seal_right)
    sy = int(SIZE * seal_top)
    paste(g, s, (sx, sy))
    return g


# Same skeleton, five dials: seal size, diagonal drop, corner tightness.
CANDIDATES = {
    "a-soft-drop": (
        lambda: compose(
            glyph_h=0.40, gap=0.02, drop=0.06,
            un_x=0.10, un_y=0.26,
            seal_scale=0.26, seal_angle=-10,
            seal_right=0.055, seal_top=0.055,
        ),
        "A 약한 대각 · 인장 여유",
    ),
    "b-medium": (
        lambda: compose(
            glyph_h=0.42, gap=0.015, drop=0.10,
            un_x=0.08, un_y=0.24,
            seal_scale=0.28, seal_angle=-12,
            seal_right=0.04, seal_top=0.045,
        ),
        "B 중간 대각 · 인장 표준",
    ),
    "c-steep": (
        lambda: compose(
            glyph_h=0.42, gap=0.01, drop=0.14,
            un_x=0.07, un_y=0.20,
            seal_scale=0.28, seal_angle=-12,
            seal_right=0.04, seal_top=0.04,
        ),
        "C 강한 대각 · 인장 표준",
    ),
    "d-big-seal": (
        lambda: compose(
            glyph_h=0.40, gap=0.015, drop=0.10,
            un_x=0.07, un_y=0.26,
            seal_scale=0.34, seal_angle=-14,
            seal_right=0.03, seal_top=0.03,
        ),
        "D 중간 대각 · 큰 인장",
    ),
    "e-seal-bleed": (
        lambda: compose(
            glyph_h=0.40, gap=0.012, drop=0.11,
            un_x=0.06, un_y=0.25,
            seal_scale=0.36, seal_angle=-12,
            seal_right=-0.02, seal_top=-0.015,
        ),
        "E 중간 대각 · 인장 모서리 잘림",
    ),
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    images: dict[str, Image.Image] = {}
    for slug, (fn, _) in CANDIDATES.items():
        img = fn()
        img.save(OUT / f"{slug}.png", optimize=True)
        images[slug] = img
        print(f"Wrote {(OUT / f'{slug}.png').relative_to(ROOT)}")

    pad, big = 26, 280
    label_h = 36
    cols = len(images)
    sheet = Image.new(
        "RGB",
        (cols * (big + pad) + pad, pad + big + label_h + 150),
        (250, 249, 245),
    )
    draw = ImageDraw.Draw(sheet)
    try:
        label_font = ImageFont.truetype(str(FONT), 20)
    except OSError:
        label_font = ImageFont.load_default()

    for index, (slug, img) in enumerate(images.items()):
        x = pad + index * (big + pad)
        sheet.paste(img.resize((big, big), Image.LANCZOS), (x, pad))
        draw.text((x, pad + big + 8), CANDIDATES[slug][1], font=label_font, fill=(40, 36, 32))
        row = pad + big + label_h + 10
        sheet.paste(img.resize((120, 120), Image.LANCZOS), (x, row))
        sheet.paste(img.resize((60, 60), Image.LANCZOS), (x + 132, row))
        sheet.paste(img.resize((40, 40), Image.LANCZOS), (x + 200, row))

    sheet.save(SHEET, optimize=True)
    print(f"Wrote {SHEET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
