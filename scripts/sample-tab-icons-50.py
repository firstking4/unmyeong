#!/usr/bin/env python3
"""Render the 50-candidate research sheets for 성향 / 사주 / 타로 / 관상.

Style follows commercial icon sets rather than the older stamp samples: 24-unit
grid, ~1.8-unit strokes with round caps, outline-first with solid accents. Each
sheet also prints every icon at true tab size so legibility can be judged.

  docs/design-samples/tab-icon-50-{tab}.png
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from icon_candidates import gwansang, saju, seonghyang, tarot  # noqa: E402
from icon_kit import Icon  # noqa: E402

OUT_DIR = ROOT / "docs" / "design-samples"
SEAL = (178, 58, 47)
PAPER = (253, 250, 245)
INK = (40, 34, 28)
MUTED = (140, 130, 118)
RULE = (223, 214, 202)

SHEETS = [
    ("성향", "seonghyang", seonghyang.CANDIDATES),
    ("사주", "saju", saju.CANDIDATES),
    ("타로", "tarot", tarot.CANDIDATES),
    ("관상", "gwansang", gwansang.CANDIDATES),
]

COLS = 10
CELL = 96
GAP = 12
LABEL_H = 22
TAB_PREVIEW = 28


def load_fonts():
    try:
        title = ImageFont.truetype(str(ROOT / "assets/fonts/ChosunGs.ttf"), 26)
        label = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 12)
        note = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 13)
    except OSError:
        title = label = note = ImageFont.load_default()
    return title, label, note


def render_sheet(tab: str, slug: str, candidates: list) -> Path:
    rows = (len(candidates) + COLS - 1) // COLS
    title_h = 52
    strip_h = 58
    width = GAP + COLS * (CELL + GAP) + GAP
    height = title_h + rows * (CELL + LABEL_H + GAP) + strip_h + GAP

    sheet = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(sheet)
    font_title, font_label, font_note = load_fonts()

    draw.text((GAP, 12), f"{tab} · 후보 {len(candidates)}", fill=SEAL, font=font_title)

    for index, (name, fn) in enumerate(candidates):
        row, col = divmod(index, COLS)
        x = GAP + col * (CELL + GAP)
        y = title_h + row * (CELL + LABEL_H + GAP)

        icon = Icon()
        fn(icon)
        art = icon.result(SEAL).resize((CELL, CELL), Image.LANCZOS)
        sheet.paste(art, (x, y), art)
        draw.text((x + 2, y + CELL + 2), f"{index + 1:02d} {name}", fill=INK, font=font_label)

    # True-size strip: the only honest test of a 28pt tab icon.
    strip_y = title_h + rows * (CELL + LABEL_H + GAP) + 6
    draw.line([(GAP, strip_y - 6), (width - GAP, strip_y - 6)], fill=RULE, width=1)
    draw.text((GAP, strip_y + 2), f"실제 탭 크기 {TAB_PREVIEW}pt", fill=MUTED, font=font_note)
    x = GAP + 130
    for name, fn in candidates:
        icon = Icon()
        fn(icon)
        art = icon.result(SEAL).resize((TAB_PREVIEW, TAB_PREVIEW), Image.LANCZOS)
        if x + TAB_PREVIEW > width - GAP:
            break
        sheet.paste(art, (x, strip_y), art)
        x += TAB_PREVIEW + 6

    out = OUT_DIR / f"tab-icon-50-{slug}.png"
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(out, optimize=True)
    return out


def main() -> None:
    for tab, slug, candidates in SHEETS:
        out = render_sheet(tab, slug, candidates)
        print(f"Wrote {out.relative_to(ROOT)} ({len(candidates)} candidates)")


if __name__ == "__main__":
    main()
