#!/usr/bin/env python3
"""Line-carved (not filled-face) stamp candidates for 타로 / 관상."""

from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ink_texture import stamp  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "design-samples" / "tab-icon-line-extra.png"
SEED = 20260814
SUPERSAMPLE = 4
SIZE = 144
PAD = 8
SEAL = (178, 58, 47)
# Thick enough that stamp erosion still reads at 32pt.
STROKE = 2.35
HAIR = 1.7
PAPER = (253, 250, 245)
INK = (40, 34, 28)


class Press:
    def __init__(self, ink_seed: int = 0) -> None:
        self.ink_seed = ink_seed
        self.canvas = SIZE * SUPERSAMPLE
        self.mask = Image.new("L", (self.canvas, self.canvas), 0)
        self.draw = ImageDraw.Draw(self.mask)

    def u(self, v: float) -> float:
        span = SIZE - PAD * 2
        return (PAD + v / 24 * span) * SUPERSAMPLE

    def w(self, weight: float) -> int:
        return max(1, round(weight * SUPERSAMPLE))

    def box(self, x0: float, y0: float, x1: float, y1: float) -> list[float]:
        return [self.u(x0), self.u(y0), self.u(x1), self.u(y1)]

    def points(self, pts: list[tuple[float, float]]) -> list[float]:
        return [coord for x, y in pts for coord in (self.u(x), self.u(y))]

    def stroke(self, pts: list[tuple[float, float]], weight: float = STROKE) -> None:
        self.draw.line(
            self.points(pts),
            fill=255,
            width=self.w(weight),
            joint="curve",
        )

    def ring(self, x0: float, y0: float, x1: float, y1: float, weight: float = STROKE) -> None:
        # Outline ellipse via thick stroke on empty fill.
        self.draw.ellipse(self.box(x0, y0, x1, y1), outline=255, width=self.w(weight))

    def arc(self, x0: float, y0: float, x1: float, y1: float, start: float, end: float, weight: float = STROKE) -> None:
        self.draw.arc(self.box(x0, y0, x1, y1), start, end, fill=255, width=self.w(weight))

    def dot(self, cx: float, cy: float, r: float) -> None:
        self.draw.ellipse(self.box(cx - r, cy - r, cx + r, cy + r), fill=255)

    def result(self) -> Image.Image:
        inked = stamp(
            self.mask,
            SEED + self.ink_seed,
            void_threshold=108,
            bites=90,
            bite_radius=self.canvas * 0.007,
            octaves=(25, 57, 113),
        )
        image = Image.new("RGBA", (self.canvas, self.canvas), (*SEAL, 0))
        image.putalpha(inked)
        image = image.rotate(-3, resample=Image.BICUBIC)
        return image.resize((SIZE, SIZE), Image.LANCZOS)


# ── 타로 K–O (선) ───────────────────────────────────────────────────

def tarot_k(s: int) -> Press:
    """선 카드 — 한 장 윤곽 + 달"""
    p = Press(s)
    p.stroke([(7, 3), (17, 3), (17, 21), (7, 21), (7, 3)])
    p.arc(9, 8, 15, 14, 40, 300)
    p.dot(14.5, 7.5, 0.7)
    return p


def tarot_l(s: int) -> Press:
    """선 세장 — 펼친 카드 윤곽"""
    p = Press(s)
    p.stroke([(3.5, 18), (4, 5), (9.5, 4), (9, 17), (3.5, 18)], HAIR)
    p.stroke([(7.5, 18.5), (8.5, 3.5), (15.5, 3.5), (14.5, 18.5), (7.5, 18.5)])
    p.stroke([(14.5, 17), (15.5, 4), (20.5, 5), (19.5, 18), (14.5, 17)], HAIR)
    return p


def tarot_m(s: int) -> Press:
    """선 태양 — 원 + 빛살만"""
    p = Press(s)
    p.ring(7, 7, 17, 17)
    for i in range(8):
        a = math.radians(-90 + i * 45)
        p.stroke(
            [
                (12 + 5.8 * math.cos(a), 12 + 5.8 * math.sin(a)),
                (12 + 10.2 * math.cos(a), 12 + 10.2 * math.sin(a)),
            ],
            HAIR,
        )
    return p


def tarot_n(s: int) -> Press:
    """선 성배 — 컵 윤곽"""
    p = Press(s)
    p.arc(5, 3.5, 19, 12, 200, 340)
    p.stroke([(6.5, 8), (8.5, 14), (15.5, 14), (17.5, 8)])
    p.stroke([(12, 14), (12, 18)])
    p.stroke([(8, 18), (16, 18)])
    p.stroke([(7, 20), (17, 20)])
    return p


def tarot_o(s: int) -> Press:
    """선 검 — 칼 윤곽"""
    p = Press(s)
    p.stroke([(12, 2.5), (12, 16)])
    p.stroke([(10.5, 4), (12, 2.5), (13.5, 4)])
    p.stroke([(7.5, 16), (16.5, 16)])
    p.stroke([(12, 16), (12, 21)])
    p.ring(10.5, 8, 13.5, 11, HAIR)
    return p


# ── 관상 K–O (선) ───────────────────────────────────────────────────

def gwan_k(s: int) -> Press:
    """선 정면 — 얼굴 윤곽 + 이목구비"""
    p = Press(s)
    p.ring(5.5, 3, 18.5, 21)
    p.stroke([(8, 9.5), (10.5, 9.5)], HAIR)
    p.stroke([(13.5, 9.5), (16, 9.5)], HAIR)
    p.dot(9.2, 11.2, 0.7)
    p.dot(14.8, 11.2, 0.7)
    p.stroke([(12, 12.5), (12, 15)], HAIR)
    p.arc(10, 15.5, 14, 18.5, 20, 160)
    return p


def gwan_l(s: int) -> Press:
    """선 옆얼굴 — 프로파일 윤곽"""
    p = Press(s)
    p.stroke(
        [
            (8, 3.5),
            (13, 4),
            (15.5, 7),
            (16, 10),
            (19, 12),
            (16, 13),
            (16.5, 15.5),
            (14.5, 17.5),
            (14, 20),
            (16, 21.5),
            (7, 21.5),
            (6.5, 17),
            (5.5, 12),
            (6, 7),
            (8, 3.5),
        ]
    )
    p.dot(12.2, 9.2, 0.65)
    return p


def gwan_m(s: int) -> Press:
    """선 눈 — 눈매만"""
    p = Press(s)
    p.arc(3.5, 8, 20.5, 16, 200, 340)
    p.arc(3.5, 8, 20.5, 16, 20, 160)
    p.ring(9.5, 10, 14.5, 14.5, HAIR)
    p.dot(12, 12.2, 0.85)
    return p


def gwan_n(s: int) -> Press:
    """선 삼정 — 얼굴 윤곽 + 세 단"""
    p = Press(s)
    p.ring(5.5, 3, 18.5, 21)
    p.stroke([(7, 9), (17, 9)], HAIR)
    p.stroke([(7, 14), (17, 14)], HAIR)
    p.dot(12, 6, 0.65)
    p.dot(12, 11.5, 0.65)
    p.dot(12, 17.5, 0.65)
    return p


def gwan_o(s: int) -> Press:
    """선 인각 — 원 테 + 눈·입"""
    p = Press(s)
    p.ring(3, 3, 21, 21)
    p.ring(5.2, 5.2, 18.8, 18.8, HAIR)
    p.stroke([(7.5, 9), (10.5, 8.2)], HAIR)
    p.stroke([(13.5, 8.2), (16.5, 9)], HAIR)
    p.dot(9, 11.5, 0.75)
    p.dot(15, 11.5, 0.75)
    p.stroke([(10, 16), (14, 16)], HAIR)
    return p


ROWS = [
    ("타로", [
        ("K 선카드", tarot_k),
        ("L 선세장", tarot_l),
        ("M 선태양", tarot_m),
        ("N 선성배", tarot_n),
        ("O 선검", tarot_o),
    ]),
    ("관상", [
        ("K 선정면", gwan_k),
        ("L 선옆얼굴", gwan_l),
        ("M 선눈", gwan_m),
        ("N 선삼정", gwan_n),
        ("O 선인각", gwan_o),
    ]),
]


def main() -> None:
    cell, gap, label_h, row_label_w = 120, 18, 28, 72
    cols = 5
    rows = len(ROWS)
    w = row_label_w + gap + cols * (cell + gap) + gap
    h = gap + rows * (cell + label_h + gap + 8) + gap
    sheet = Image.new("RGB", (w, h), PAPER)
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(str(ROOT / "assets/fonts/ChosunGs.ttf"), 18)
        font_sm = ImageFont.truetype(str(ROOT / "assets/fonts/ChosunGs.ttf"), 14)
    except OSError:
        font = font_sm = ImageFont.load_default()

    seed = 700
    for r, (tab, cands) in enumerate(ROWS):
        y0 = gap + r * (cell + label_h + gap + 8)
        draw.text((gap, y0 + cell // 2 - 8), tab, fill=INK, font=font)
        for c, (label, fn) in enumerate(cands):
            x = row_label_w + gap + c * (cell + gap)
            icon = fn(seed).result().resize((cell, cell), Image.LANCZOS)
            sheet.paste(icon, (x, y0), icon)
            draw.text((x + 4, y0 + cell + 4), label, fill=INK, font=font_sm)
            seed += 23

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    sheet.save("/tmp/tab-line-extra.png", optimize=True)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
