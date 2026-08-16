"""Shared carved-stamp texture used by the seal and tab bar icon generators.

A clean vector shape reads as a printed sticker. Real 도장 ink breaks up: the
edges are eaten away, and the interior keeps small unlinked voids where the
carved surface never touched the paper. These helpers apply that erosion to an
alpha mask so generated art looks pressed rather than plotted.
"""

from __future__ import annotations

import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


def _value_noise(size: int, cells: int, rng: random.Random, blur: float) -> Image.Image:
    """Smooth grayscale noise built by upsampling a coarse random grid."""
    grid = Image.new("L", (cells, cells))
    grid.putdata([rng.randint(0, 255) for _ in range(cells * cells)])
    return grid.resize((size, size), Image.BICUBIC).filter(ImageFilter.GaussianBlur(blur))


def grunge_field(size: int, seed: int, octaves: tuple[int, ...] = (5, 13, 37)) -> Image.Image:
    """Multi-octave noise: broad ink pooling plus fine grain."""
    rng = random.Random(seed)
    field = Image.new("L", (size, size), 0)
    weight_total = 0.0
    for index, cells in enumerate(octaves):
        weight = 1.0 / (index + 1)
        layer = _value_noise(size, cells, rng, blur=size / (cells * 6))
        field = ImageChops.add(field, layer.point(lambda v, w=weight: int(v * w)))
        weight_total += weight
    field = field.point(lambda v: min(255, int(v / weight_total)))
    # Blurring collapses the range, so stretch it back for predictable thresholds.
    return ImageOps.autocontrast(field)


def _nibbled_edges(mask: Image.Image, seed: int, bites: int, radius: float) -> Image.Image:
    """Chew irregular bites out of the shape so no outline stays mechanical."""
    rng = random.Random(seed + 977)
    size = mask.width
    edge = mask.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
    perimeter = [(x, y) for x, y, value in _iter_pixels(edge) if value]
    if not perimeter:
        return mask

    cutter = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(cutter)
    for _ in range(bites):
        cx, cy = rng.choice(perimeter)
        r = rng.uniform(radius * 0.35, radius)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    cutter = cutter.filter(ImageFilter.GaussianBlur(size * 0.002))
    return ImageChops.subtract(mask, cutter)


def _iter_pixels(image: Image.Image):
    width = image.width
    for index, value in enumerate(image.getdata()):
        yield index % width, index // width, value


def stamp(
    mask: Image.Image,
    seed: int,
    *,
    void_threshold: int = 150,
    bites: int = 90,
    bite_radius: float | None = None,
    octaves: tuple[int, ...] = (5, 13, 37),
) -> Image.Image:
    """Erode `mask` into an inked stamp impression.

    `void_threshold` controls how much of the interior drops out — raise it for a
    drier, more worn press. `bites` and `bite_radius` govern the ragged outline.
    Finer `octaves` keep the voids as small cracks instead of chunks.
    """
    size = mask.width
    field = grunge_field(size, seed, octaves)

    inked = Image.new("L", (size, size), 0)
    inked.paste(field, (0, 0), mask)
    # Below the threshold the carved face never inked; above it prints solid.
    inked = inked.point(lambda v: 0 if v < void_threshold else 255)

    radius = bite_radius if bite_radius is not None else size * 0.016
    inked = _nibbled_edges(inked, seed, bites, radius)
    return inked.filter(ImageFilter.GaussianBlur(size * 0.0016))
