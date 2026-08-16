#!/usr/bin/env python3
"""Extra stamp-style candidates for 타로 / 관상 (F–J)."""

from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ink_texture import stamp  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "design-samples" / "tab-icon-tarot-gwansang-extra.png"
SEED = 20260814
SUPERSAMPLE = 4
SIZE = 144
PAD = 8
SEAL = (178, 58, 47)
CUT = 1.5
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

    def rect(self, x0: float, y0: float, x1: float, y1: float, ink: bool = True) -> None:
        self.draw.rectangle(self.box(x0, y0, x1, y1), fill=255 if ink else 0)

    def poly(self, pts: list[tuple[float, float]], ink: bool = True) -> None:
        self.draw.polygon(self.points(pts), fill=255 if ink else 0)

    def ellipse(self, x0: float, y0: float, x1: float, y1: float, ink: bool = True) -> None:
        self.draw.ellipse(self.box(x0, y0, x1, y1), fill=255 if ink else 0)

    def stroke(self, pts: list[tuple[float, float]], weight: float, ink: bool = True) -> None:
        self.draw.line(self.points(pts), fill=255 if ink else 0, width=self.w(weight), joint="curve")

    def dot(self, cx: float, cy: float, r: float, ink: bool = True) -> None:
        self.ellipse(cx - r, cy - r, cx + r, cy + r, ink)

    def result(self) -> Image.Image:
        inked = stamp(
            self.mask,
            SEED + self.ink_seed,
            void_threshold=104,
            bites=120,
            bite_radius=self.canvas * 0.009,
            octaves=(25, 57, 113),
        )
        image = Image.new("RGBA", (self.canvas, self.canvas), (*SEAL, 0))
        image.putalpha(inked)
        image = image.rotate(-3, resample=Image.BICUBIC)
        return image.resize((SIZE, SIZE), Image.LANCZOS)


# ── 타로 F–J ────────────────────────────────────────────────────────

def tarot_f(s: int) -> Press:
    """뒤집힌 카드 — 한 장 뒤집어 놓음"""
    p = Press(s)
    p.poly([(5, 4), (17, 4), (19, 6), (19, 20), (7, 20), (5, 18)])
    # diamond pip
    p.poly([(12, 8), (15, 12), (12, 16), (9, 12)], ink=False)
    return p


def tarot_g(s: int) -> Press:
    """손 + 카드 — 뽑는 손"""
    p = Press(s)
    # card held upright
    p.rect(8, 2.5, 16, 14)
    p.ellipse(10.5, 5.5, 13.5, 8.5, ink=False)
    # palm / fingers below
    p.ellipse(5, 12, 19, 21)
    p.rect(7, 11, 17, 14)
    p.rect(6.5, 14.5, 8.5, 19.5, ink=False)
    p.rect(10, 15, 12, 20, ink=False)
    p.rect(13.5, 15, 15.5, 20, ink=False)
    return p


def tarot_h(s: int) -> Press:
    """태양 — 원 + 빛살"""
    p = Press(s)
    p.dot(12, 12, 5.2)
    p.dot(12, 12, 2.4, ink=False)
    for i in range(8):
        a = math.radians(-90 + i * 45)
        x0 = 12 + 6.2 * math.cos(a)
        y0 = 12 + 6.2 * math.sin(a)
        x1 = 12 + 9.8 * math.cos(a)
        y1 = 12 + 9.8 * math.sin(a)
        p.stroke([(x0, y0), (x1, y1)], 1.8)
    return p


def tarot_i(s: int) -> Press:
    """컵 — 성배"""
    p = Press(s)
    p.ellipse(5, 3.5, 19, 10)
    p.poly([(6.5, 8), (17.5, 8), (15.5, 14), (8.5, 14)])
    p.rect(10.5, 14, 13.5, 18)
    p.rect(7.5, 18, 16.5, 20.5)
    return p


def tarot_j(s: int) -> Press:
    """검 — 세로 칼"""
    p = Press(s)
    p.poly([(10.5, 2.5), (13.5, 2.5), (13.5, 15), (12, 17.5), (10.5, 15)])
    p.rect(7, 15, 17, 17)
    p.rect(11, 17, 13, 21.5)
    p.dot(12, 7, 1.1, ink=False)
    return p


# ── 관상 F–J ────────────────────────────────────────────────────────

def gwan_f(s: int) -> Press:
    """반쪽 얼굴 — 좌우 대칭 깨진 관상"""
    p = Press(s)
    p.ellipse(5.5, 3, 18.5, 21)
    # knock out right half softly with vertical cut, leave left features
    p.rect(12.2, 3, 18.5, 21, ink=False)
    p.dot(9.2, 10.5, 1.2, ink=False)
    p.stroke([(8.5, 14), (11.2, 14)], CUT, ink=False)
    p.stroke([(8, 17), (11.5, 17)], CUT, ink=False)
    return p


def gwan_g(s: int) -> Press:
    """이마 강조 — 넓은 이마 실루엣"""
    p = Press(s)
    p.ellipse(4.5, 2.5, 19.5, 18)
    p.rect(6, 16.5, 18, 21.5)
    p.dot(9.2, 11, 1.1, ink=False)
    p.dot(14.8, 11, 1.1, ink=False)
    p.stroke([(10.5, 14.5), (13.5, 14.5)], CUT, ink=False)
    return p


def gwan_h(s: int) -> Press:
    """코 중심 — 코가 도드라진 옆얼굴"""
    p = Press(s)
    p.poly(
        [
            (8, 3.5),
            (13, 4),
            (15.5, 7),
            (16, 10),
            (19.5, 12),
            (16.2, 13.2),
            (16.5, 15.5),
            (14.5, 17.5),
            (14, 20.5),
            (15.5, 21.5),
            (6.5, 21.5),
            (6, 17),
            (5, 12),
            (5.5, 7),
        ]
    )
    p.dot(12, 9, 0.85, ink=False)
    return p


def gwan_i(s: int) -> Press:
    """쌍안경 — 두 눈 원"""
    p = Press(s)
    p.ellipse(2.5, 7, 11.5, 17)
    p.ellipse(12.5, 7, 21.5, 17)
    p.rect(10.5, 10.5, 13.5, 13.5)
    p.ellipse(4.5, 9, 9.5, 15, ink=False)
    p.ellipse(14.5, 9, 19.5, 15, ink=False)
    p.dot(7, 12, 1.5)
    p.dot(17, 12, 1.5)
    return p


def gwan_j(s: int) -> Press:
    """원형 인각 — 人 얼굴 대신 人자"""
    p = Press(s)
    p.ellipse(2.5, 2.5, 21.5, 21.5)
    p.ellipse(4.5, 4.5, 19.5, 19.5, ink=False)
    # simplified brows + eyes as short bars inside ring
    p.stroke([(7.5, 9), (10.5, 8.2)], 1.6)
    p.stroke([(13.5, 8.2), (16.5, 9)], 1.6)
    p.dot(9, 11.5, 1.1)
    p.dot(15, 11.5, 1.1)
    p.stroke([(10, 16), (14, 16)], 1.6)
    return p


ROWS = [
    ("타로", [
        ("F 뒤집힌카드", tarot_f),
        ("G 손+카드", tarot_g),
        ("H 태양", tarot_h),
        ("I 성배", tarot_i),
        ("J 검", tarot_j),
    ]),
    ("관상", [
        ("F 반쪽얼굴", gwan_f),
        ("G 넓은이마", gwan_g),
        ("H 코옆얼굴", gwan_h),
        ("I 쌍안경", gwan_i),
        ("J 인각눈", gwan_j),
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

    seed = 400
    for r, (tab, cands) in enumerate(ROWS):
        y0 = gap + r * (cell + label_h + gap + 8)
        draw.text((gap, y0 + cell // 2 - 8), tab, fill=INK, font=font)
        for c, (label, fn) in enumerate(cands):
            x = row_label_w + gap + c * (cell + gap)
            icon = fn(seed).result().resize((cell, cell), Image.LANCZOS)
            sheet.paste(icon, (x, y0), icon)
            draw.text((x + 4, y0 + cell + 4), label, fill=INK, font=font_sm)
            seed += 19

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    # also copy for quick preview
    sheet.save("/tmp/tab-tarot-gwansang-extra.png", optimize=True)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
