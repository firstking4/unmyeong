#!/usr/bin/env python3
"""Sample app icons built from the two-glyph wordmark 운명 + the 人 dojang.

Writes candidates and a comparison sheet to docs/design-samples; nothing in
assets/ is touched. Pick one, then port its compose_* body into
scripts/generate-app-icon.py.
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
OUT = ROOT / "docs" / "design-samples" / "app-icon-unmyeong"

SIZE = 1024
PAPER = (243, 238, 230)
INK = (26, 23, 20)
SEED = 20260816


# ── ink ───────────────────────────────────────────────────────────────────────

def _dry_brush(mask: Image.Image, seed: int) -> Image.Image:
    """Thin gaps along the stroke so the glyph reads as a brush, not as type."""
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


def _splatters(size: int, seed: int, count: int = 18) -> Image.Image:
    rng = random.Random(seed + 883)
    layer = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(layer)
    for _ in range(count):
        x = rng.randint(int(size * 0.18), int(size * 0.82))
        y = rng.randint(int(size * 0.12), int(size * 0.88))
        r = rng.randint(max(2, size // 400), max(4, size // 130))
        draw.ellipse([x - r, y - r, x + r, y + r], fill=rng.randint(120, 255))
    return layer.filter(ImageFilter.GaussianBlur(size * 0.0008))


def brush_glyph(text: str, canvas: int = 1200, seed: int = SEED) -> Image.Image:
    """One brushed glyph, cropped tight, transparent background."""
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


# ── ground / parts ────────────────────────────────────────────────────────────

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


# ── candidates ────────────────────────────────────────────────────────────────

def a_stacked_corner_seal() -> Image.Image:
    """운 위 / 명 아래, 인장 우하단 모서리."""
    g = paper_ground()
    gh = int(SIZE * 0.36)
    un, my = fit(UN, h=gh), fit(MYEONG, h=gh)
    paste(g, un, ((SIZE - un.width) // 2, int(SIZE * 0.10)))
    paste(g, my, ((SIZE - my.width) // 2, int(SIZE * 0.50)))
    s = seal_at(0.26)
    paste(g, s, (SIZE - s.width - int(SIZE * 0.035), SIZE - s.height - int(SIZE * 0.035)))
    return g


def b_side_by_side() -> Image.Image:
    """운명 가로 나란히, 인장 우하단."""
    g = paper_ground()
    gh = int(SIZE * 0.42)
    un, my = fit(UN, h=gh), fit(MYEONG, h=gh)
    gap = int(SIZE * 0.03)
    total = un.width + gap + my.width
    x = (SIZE - total) // 2
    y = int(SIZE * 0.24)
    paste(g, un, (x, y))
    paste(g, my, (x + un.width + gap, y))
    s = seal_at(0.26)
    paste(g, s, (SIZE - s.width - int(SIZE * 0.05), SIZE - s.height - int(SIZE * 0.08)))
    return g


def c_stacked_seal_between() -> Image.Image:
    """운 / 명 사이 오른쪽에 인장 — 낙관처럼 끼워 찍음."""
    g = paper_ground()
    gh = int(SIZE * 0.36)
    un, my = fit(UN, h=gh), fit(MYEONG, h=gh)
    x = int(SIZE * 0.16)
    paste(g, un, (x, int(SIZE * 0.09)))
    paste(g, my, (x, int(SIZE * 0.51)))
    s = seal_at(0.30, angle=-8)
    paste(g, s, (int(SIZE * 0.62), int(SIZE * 0.40)))
    return g


def d_seal_over_overlap() -> Image.Image:
    """운명 가로, 인장을 명 오른쪽 아래에 겹쳐 찍음 (완성작 서명)."""
    g = paper_ground()
    gh = int(SIZE * 0.44)
    un, my = fit(UN, h=gh), fit(MYEONG, h=gh)
    gap = int(SIZE * 0.02)
    total = un.width + gap + my.width
    x = (SIZE - total) // 2 - int(SIZE * 0.03)
    y = int(SIZE * 0.20)
    paste(g, un, (x, y))
    paste(g, my, (x + un.width + gap, y))
    s = seal_at(0.32, angle=-14)
    paste(g, s, (int(SIZE * 0.60), int(SIZE * 0.58)))
    return g


def e_stacked_seal_top_right() -> Image.Image:
    """운명 세로, 인장 우상단 — 위에서 눌러 찍은 낙관."""
    g = paper_ground()
    gh = int(SIZE * 0.35)
    un, my = fit(UN, h=gh), fit(MYEONG, h=gh)
    x = int(SIZE * 0.14)
    paste(g, un, (x, int(SIZE * 0.13)))
    paste(g, my, (x, int(SIZE * 0.53)))
    s = seal_at(0.28, angle=-10)
    paste(g, s, (SIZE - s.width - int(SIZE * 0.06), int(SIZE * 0.06)))
    return g


def f_big_seal_corner_bleed() -> Image.Image:
    """운명 가로, 큰 인장이 우하단 모서리에서 살짝 잘려 나감."""
    g = paper_ground()
    gh = int(SIZE * 0.40)
    un, my = fit(UN, h=gh), fit(MYEONG, h=gh)
    gap = int(SIZE * 0.025)
    total = un.width + gap + my.width
    x = (SIZE - total) // 2
    y = int(SIZE * 0.18)
    paste(g, un, (x, y))
    paste(g, my, (x + un.width + gap, y))
    s = seal_at(0.38, angle=-12)
    paste(g, s, (SIZE - s.width + int(SIZE * 0.04), SIZE - s.height + int(SIZE * 0.03)))
    return g


CANDIDATES = {
    "a-stacked-corner": (a_stacked_corner_seal, "A 세로 2단 · 인장 우하단"),
    "b-side-by-side": (b_side_by_side, "B 가로 나란히 · 인장 우하단"),
    "c-stacked-seal-mid": (c_stacked_seal_between, "C 세로 2단 · 인장 오른쪽 가운데"),
    "d-signed-overlap": (d_seal_over_overlap, "D 가로 · 인장 겹쳐 찍음"),
    "e-seal-top-right": (e_stacked_seal_top_right, "E 세로 2단 · 인장 우상단"),
    "f-big-seal-bleed": (f_big_seal_corner_bleed, "F 가로 · 큰 인장 모서리 잘림"),
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    images: dict[str, Image.Image] = {}
    for slug, (fn, _) in CANDIDATES.items():
        img = fn()
        img.save(OUT / f"{slug}.png", optimize=True)
        images[slug] = img
        print(f"Wrote {(OUT / f'{slug}.png').relative_to(ROOT)}")

    # Sheet: full art on top, launcher sizes beneath (그 크기에서 읽히는지가 관건).
    pad, big = 26, 260
    label_h = 34
    cols = len(images)
    sheet = Image.new(
        "RGB",
        (cols * (big + pad) + pad, pad + big + label_h + 150),
        (250, 249, 245),
    )
    draw = ImageDraw.Draw(sheet)
    try:
        label_font = ImageFont.truetype(str(FONT), 21)
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

    sheet_path = OUT.parent / "app-icon-unmyeong.png"
    sheet.save(sheet_path, optimize=True)
    print(f"Wrote {sheet_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
