#!/usr/bin/env python3
"""숏리스트 비교 시트 — 후보 50종에서 고른 것들의 원안 vs 고도화안.

  docs/design-samples/tab-icon-shortlist.png
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from icon_candidates import gwansang, saju, seonghyang, shortlist, tarot  # noqa: E402
from icon_kit import Icon  # noqa: E402

OUT_DIR = ROOT / "docs" / "design-samples"
SEAL = (178, 58, 47)
PAPER = (253, 250, 245)
INK = (40, 34, 28)
MUTED = (150, 141, 130)
RULE = (223, 214, 202)

PICK_USER = "고름"
PICK_AGENT = "제안"

SECTIONS = [
    ("성향", seonghyang.CANDIDATES, [
        (20, PICK_USER, shortlist.person_ring),
        (21, PICK_USER, shortlist.person_aura),
        (2, PICK_AGENT, shortlist.taegeuk_ring),
        (17, PICK_AGENT, shortlist.radar),
    ]),
    ("사주", saju.CANDIDATES, [
        (30, PICK_USER, shortlist.ohaeng_ring),
        (5, PICK_AGENT, shortlist.myeongsik_table),
        (2, PICK_AGENT, shortlist.grid4_dots),
    ]),
    ("타로", tarot.CANDIDATES, [
        (5, PICK_USER, shortlist.card_moon),
        (6, PICK_USER, shortlist.card_eye),
        (9, PICK_AGENT, shortlist.spread_two),
        (11, PICK_AGENT, shortlist.spread_fan),
    ]),
    ("관상", gwansang.CANDIDATES, [
        (4, PICK_USER, shortlist.face_three),
        (40, PICK_USER, shortlist.portrait_frame),
        (14, PICK_AGENT, shortlist.eye_line),
        (3, PICK_AGENT, shortlist.face_brows),
    ]),
]

COLS = 4
ART = 108
COL_W = 168
GAP = 16
TAB_PREVIEW = 28
SECTION_HEAD = 40
ENTRY_H = ART * 2 + 26 + TAB_PREVIEW + 30


def load_fonts():
    try:
        title = ImageFont.truetype(str(ROOT / "assets/fonts/ChosunGs.ttf"), 26)
        head = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 17)
        label = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 13)
        tiny = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 11)
    except OSError:
        title = head = label = tiny = ImageFont.load_default()
    return title, head, label, tiny


def art_of(fn, color, size) -> Image.Image:
    icon = Icon()
    fn(icon)
    return icon.result(color).resize((size, size), Image.LANCZOS)


def main() -> None:
    font_title, font_head, font_label, font_tiny = load_fonts()

    width = GAP + COLS * COL_W + GAP
    height = 58 + len(SECTIONS) * (SECTION_HEAD + ENTRY_H + GAP) + GAP
    sheet = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(sheet)

    draw.text((GAP, 14), "숏리스트 · 원안 → 고도화", fill=SEAL, font=font_title)
    y = 58

    for tab, candidates, picks in SECTIONS:
        draw.line([(GAP, y), (width - GAP, y)], fill=RULE, width=1)
        draw.text((GAP, y + 8), tab, fill=INK, font=font_head)
        top = y + SECTION_HEAD

        for col, (number, who, refined) in enumerate(picks):
            name, original = candidates[number - 1]
            x = GAP + col * COL_W

            sheet.paste(a := art_of(original, SEAL, ART), (x, top), a)
            draw.text((x + ART + 4, top + ART / 2 - 8), "원안", fill=MUTED, font=font_tiny)

            sheet.paste(b := art_of(refined, SEAL, ART), (x, top + ART), b)
            draw.text(
                (x + ART + 4, top + ART * 1.5 - 8), "고도화", fill=SEAL, font=font_tiny
            )

            strip_y = top + ART * 2 + 8
            sheet.paste(c := art_of(original, SEAL, TAB_PREVIEW), (x + 6, strip_y), c)
            sheet.paste(d := art_of(refined, SEAL, TAB_PREVIEW), (x + 44, strip_y), d)
            draw.text(
                (x + 82, strip_y + 8), f"{TAB_PREVIEW}pt", fill=MUTED, font=font_tiny
            )

            draw.text(
                (x + 4, strip_y + TAB_PREVIEW + 8),
                f"{tab} {number:02d} {name} · {who}",
                fill=INK,
                font=font_label,
            )

        y = top + ENTRY_H + GAP

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / "tab-icon-shortlist.png"
    sheet.save(out, optimize=True)
    print(f"Wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
