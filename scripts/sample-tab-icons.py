#!/usr/bin/env python3
"""Render 5 stamp-style icon candidates per tab for design review."""

from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ink_texture import stamp  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "design-samples" / "tab-icon-candidates.png"
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

    def pie(self, box: list[float], start: float, end: float, ink: bool = True) -> None:
        self.draw.pieslice(box, start, end, fill=255 if ink else 0)

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


# ── 홈 ──────────────────────────────────────────────────────────────

def home_a(s: int) -> Press:
    """기와집 — 처마 + 문"""
    p = Press(s)
    p.poly([(1, 11.2), (2.6, 8.2), (7.4, 5), (16.6, 5), (21.4, 8.2), (23, 11.2),
            (20.2, 11.2), (19, 9), (5, 9), (3.8, 11.2)])
    p.rect(2.4, 9, 21.6, 11.4)
    p.poly([(1, 11.2), (0.2, 8.6), (3, 9.6)])
    p.poly([(23, 11.2), (23.8, 8.6), (21, 9.6)])
    p.rect(11.3, 2.6, 12.7, 5.4)
    p.rect(4.8, 11.4, 19.2, 20.8)
    p.rect(9.9, 14.2, 14.1, 19.4, ink=False)
    p.rect(11.6, 14.2, 12.4, 19.4)
    return p


def home_b(s: int) -> Press:
    """원형 인각 — 人 한자"""
    p = Press(s)
    p.ellipse(2.5, 2.5, 21.5, 21.5)
    p.ellipse(4.2, 4.2, 19.8, 19.8, ink=False)
    # 人 brush silhouette
    p.poly([(8.2, 7), (11.6, 17.8), (9.4, 17.8), (7.2, 11.2)])
    p.poly([(11.2, 9.4), (16.6, 17.8), (14.4, 17.8), (10.6, 11.6)])
    return p


def home_c(s: int) -> Press:
    """문짝 — 두 짝 문"""
    p = Press(s)
    p.rect(4, 3.5, 20, 21)
    p.rect(5.6, 5, 11.2, 19.4, ink=False)
    p.rect(12.8, 5, 18.4, 19.4, ink=False)
    p.rect(11.2, 3.5, 12.8, 21)
    p.dot(10.2, 12, 0.7)
    p.dot(13.8, 12, 0.7)
    return p


def home_d(s: int) -> Press:
    """산수 — 산 + 해"""
    p = Press(s)
    p.poly([(2, 18), (7, 8), (12, 14), (17, 6), (22, 18)])
    p.dot(18.5, 5.5, 2.4)
    p.dot(18.5, 5.5, 1.2, ink=False)
    p.rect(2, 18, 22, 20.5)
    return p


def home_e(s: int) -> Press:
    """팔각정 — 누각 실루엣"""
    p = Press(s)
    p.poly([(12, 2.5), (20.5, 8), (17.5, 8), (12, 4.2), (6.5, 8), (3.5, 8)])
    p.rect(5.5, 8, 18.5, 10)
    p.rect(7.5, 10, 16.5, 19.5)
    p.rect(10.5, 13, 13.5, 19.5, ink=False)
    p.rect(4, 19.5, 20, 21.5)
    return p


# ── 성향 ────────────────────────────────────────────────────────────

def seong_a(s: int) -> Press:
    """오행 바퀴"""
    p = Press(s)
    cx = cy = 12.0
    ring = 7.0
    p.ellipse(cx - ring, cy - ring, cx + ring, cy + ring)
    p.ellipse(cx - ring + 2.1, cy - ring + 2.1, cx + ring - 2.1, cy + ring - 2.1, ink=False)
    for i in range(5):
        angle = math.radians(-90 + i * 72)
        x, y = cx + ring * math.cos(angle), cy + ring * math.sin(angle)
        p.stroke([(cx, cy), (x, y)], 1.7)
        p.dot(x, y, 2.05)
        p.dot(x, y, 0.85, ink=False)
    p.dot(cx, cy, 1.9)
    return p


def seong_b(s: int) -> Press:
    """오각별 — 별 실루엣"""
    p = Press(s)
    pts = []
    for i in range(5):
        a = math.radians(-90 + i * 72)
        pts.append((12 + 9.2 * math.cos(a), 12 + 9.2 * math.sin(a)))
        a2 = math.radians(-90 + i * 72 + 36)
        pts.append((12 + 3.6 * math.cos(a2), 12 + 3.6 * math.sin(a2)))
    p.poly(pts)
    p.dot(12, 12, 2.2, ink=False)
    return p


def seong_c(s: int) -> Press:
    """태극 — 음양"""
    p = Press(s)
    p.ellipse(3, 3, 21, 21)
    # left half black via pieslice, then yin/yang dots
    p.pie(p.box(3, 3, 21, 21), 90, 270, ink=False)
    p.ellipse(7.5, 3, 16.5, 12)
    p.ellipse(7.5, 12, 16.5, 21, ink=False)
    p.dot(12, 7.5, 1.3, ink=False)
    p.dot(12, 16.5, 1.3)
    return p


def seong_d(s: int) -> Press:
    """오행 점 — 다섯 점만"""
    p = Press(s)
    cx = cy = 12.0
    for i in range(5):
        a = math.radians(-90 + i * 72)
        x, y = cx + 6.5 * math.cos(a), cy + 6.5 * math.sin(a)
        p.dot(x, y, 2.8)
    p.dot(cx, cy, 2.2)
    return p


def seong_e(s: int) -> Press:
    """꽃잎 — 다섯 꽃잎"""
    p = Press(s)
    for i in range(5):
        a = math.radians(-90 + i * 72)
        cx = 12 + 5.2 * math.cos(a)
        cy = 12 + 5.2 * math.sin(a)
        p.ellipse(cx - 3.4, cy - 3.4, cx + 3.4, cy + 3.4)
    p.dot(12, 12, 2.6)
    p.dot(12, 12, 1.1, ink=False)
    return p


# ── 사주 ────────────────────────────────────────────────────────────

def saju_a(s: int) -> Press:
    """네 기둥 + 받침"""
    p = Press(s)
    for x in [5.4, 9.8, 14.2, 18.6]:
        p.rect(x - 1.6, 4.2, x + 1.6, 19.8)
        p.rect(x - 1.6, 11.3, x + 1.6, 11.3 + CUT, ink=False)
    p.rect(3.2, 20.4, 20.8, 21.9)
    return p


def saju_b(s: int) -> Press:
    """사각판 — 2×2 칸"""
    p = Press(s)
    p.rect(3.5, 3.5, 20.5, 20.5)
    p.rect(5, 5, 11, 11, ink=False)
    p.rect(13, 5, 19, 11, ink=False)
    p.rect(5, 13, 11, 19, ink=False)
    p.rect(13, 13, 19, 19, ink=False)
    return p


def saju_c(s: int) -> Press:
    """책갈피 — 네 장 겹침"""
    p = Press(s)
    for i, x0 in enumerate([3.5, 6.5, 9.5, 12.5]):
        y0 = 3.5 + i * 0.6
        p.rect(x0, y0, x0 + 8, y0 + 16.5)
        p.rect(x0 + 1.4, y0 + 2, x0 + 6.6, y0 + 14.5, ink=False)
    return p


def saju_d(s: int) -> Press:
    """십간지지 — 십자 + 사방"""
    p = Press(s)
    p.rect(10.2, 3, 13.8, 21)
    p.rect(3, 10.2, 21, 13.8)
    p.dot(12, 5.5, 1.5, ink=False)
    p.dot(12, 18.5, 1.5, ink=False)
    p.dot(5.5, 12, 1.5, ink=False)
    p.dot(18.5, 12, 1.5, ink=False)
    return p


def saju_e(s: int) -> Press:
    """연표 — 가로 막대 네 줄"""
    p = Press(s)
    for i, y in enumerate([5, 9, 13, 17]):
        p.rect(3.5, y, 20.5, y + 2.6)
        p.dot(6 + i * 3.5, y + 1.3, 0.75, ink=False)
    return p


# ── 타로 ────────────────────────────────────────────────────────────

def tarot_a(s: int) -> Press:
    """카드 + 달·별"""
    p = Press(s)
    p.poly([(3.4, 8.8), (9.8, 4.6), (12.6, 8.8), (6.2, 13)])
    p.poly([(8.6, 4.4), (18.4, 6.8), (15.6, 20), (5.8, 17.6)])
    p.ellipse(8.4, 10, 13.6, 15.2, ink=False)
    p.ellipse(9.9, 10.4, 15.1, 15.6)
    sx, sy, long, short = 14.0, 8.4, 1.75, 0.58
    p.poly([
        (sx, sy - long), (sx + short, sy - short), (sx + long, sy),
        (sx + short, sy + short), (sx, sy + long), (sx - short, sy + short),
        (sx - long, sy), (sx - short, sy - short),
    ], ink=False)
    return p


def tarot_b(s: int) -> Press:
    """단장 카드 — 한 장 + 눈"""
    p = Press(s)
    p.poly([(6, 3), (18, 3), (18, 21), (6, 21)])
    p.ellipse(9, 8, 15, 14, ink=False)
    p.dot(12, 11, 1.4)
    p.stroke([(9, 17), (15, 17)], CUT, ink=False)
    return p


def tarot_c(s: int) -> Press:
    """부채꼴 — 세 장 펼침"""
    p = Press(s)
    p.poly([(4, 18), (3, 5), (9, 4), (10, 17)])
    p.poly([(8, 18), (9, 3.5), (15, 3.5), (16, 18)])
    p.poly([(14, 17), (15, 4), (21, 5), (20, 18)])
    return p


def tarot_d(s: int) -> Press:
    """별 — 팔각별"""
    p = Press(s)
    pts = []
    for i in range(8):
        a = math.radians(-90 + i * 45)
        r = 9.5 if i % 2 == 0 else 4.2
        pts.append((12 + r * math.cos(a), 12 + r * math.sin(a)))
    p.poly(pts)
    p.dot(12, 12, 2.0, ink=False)
    return p


def tarot_e(s: int) -> Press:
    """달 — 초승달만"""
    p = Press(s)
    p.ellipse(4, 4, 20, 20)
    p.ellipse(8, 3.5, 22, 17.5, ink=False)
    p.dot(16.5, 6.5, 1.1)
    return p


# ── 관상 ────────────────────────────────────────────────────────────

def gwan_a(s: int) -> Press:
    """옆얼굴"""
    p = Press(s)
    p.poly([
        (9.6, 3.2), (13.4, 4), (15.6, 6.6), (16.4, 9.6), (18.6, 11.8),
        (16, 12.8), (16.8, 14.4), (15, 16.2), (14.6, 18.4), (16.2, 20.8),
        (7.2, 20.8), (6.6, 17), (5.4, 13.6), (5.6, 8.4), (7.2, 4.8),
    ])
    p.dot(12.6, 9.2, 0.9, ink=False)
    p.stroke([(9, 8), (12.4, 7.2)], CUT, ink=False)
    p.stroke([(7.6, 19.2), (14.4, 19.2)], CUT, ink=False)
    return p


def gwan_b(s: int) -> Press:
    """정면 — 눈·코·입 음각"""
    p = Press(s)
    p.ellipse(5.5, 3, 18.5, 21)
    p.dot(9.5, 10.5, 1.3, ink=False)
    p.dot(14.5, 10.5, 1.3, ink=False)
    p.stroke([(12, 12.5), (12, 15)], CUT, ink=False)
    p.stroke([(10, 17), (14, 17)], CUT, ink=False)
    return p


def gwan_c(s: int) -> Press:
    """눈만 — 한쪽 눈"""
    p = Press(s)
    p.ellipse(3.5, 8, 20.5, 16)
    p.ellipse(5.5, 9.2, 18.5, 14.8, ink=False)
    p.dot(12, 12, 2.4)
    p.dot(12, 12, 1.0, ink=False)
    return p


def gwan_d(s: int) -> Press:
    """거울 — 원형 거울 + 얼굴"""
    p = Press(s)
    p.ellipse(2.5, 2.5, 21.5, 21.5)
    p.ellipse(4.5, 4.5, 19.5, 19.5, ink=False)
    p.ellipse(8, 7, 16, 17)
    p.dot(10.2, 11, 0.7, ink=False)
    p.dot(13.8, 11, 0.7, ink=False)
    p.stroke([(10.5, 14.5), (13.5, 14.5)], CUT, ink=False)
    return p


def gwan_e(s: int) -> Press:
    """삼정 — 이마·코·턱 세 단"""
    p = Press(s)
    p.ellipse(5.5, 3, 18.5, 21)
    p.rect(6.5, 8.5, 17.5, 8.5 + CUT, ink=False)
    p.rect(6.5, 13.5, 17.5, 13.5 + CUT, ink=False)
    p.dot(12, 6, 0.8, ink=False)
    p.dot(12, 11, 0.8, ink=False)
    p.dot(12, 17, 0.8, ink=False)
    return p


ROWS = [
    ("홈", [
        ("A 기와집", home_a),
        ("B 人인각", home_b),
        ("C 문짝", home_c),
        ("D 산수", home_d),
        ("E 팔각정", home_e),
    ]),
    ("성향", [
        ("A 오행바퀴", seong_a),
        ("B 오각별", seong_b),
        ("C 태극", seong_c),
        ("D 꽃잎", seong_e),
        ("E 다섯점", seong_d),
    ]),
    ("사주", [
        ("A 네기둥", saju_a),
        ("B 2×2칸", saju_b),
        ("C 겹책", saju_c),
        ("D 십자", saju_d),
        ("E 네줄", saju_e),
    ]),
    ("타로", [
        ("A 카드·달", tarot_a),
        ("B 단장카드", tarot_b),
        ("C 세장펼침", tarot_c),
        ("D 팔각별", tarot_d),
        ("E 초승달", tarot_e),
    ]),
    ("관상", [
        ("A 옆얼굴", gwan_a),
        ("B 정면", gwan_b),
        ("C 눈", gwan_c),
        ("D 거울", gwan_d),
        ("E 삼정", gwan_e),
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

    seed = 0
    for r, (tab, cands) in enumerate(ROWS):
        y0 = gap + r * (cell + label_h + gap + 8)
        draw.text((gap, y0 + cell // 2 - 8), tab, fill=INK, font=font)
        for c, (label, fn) in enumerate(cands):
            x = row_label_w + gap + c * (cell + gap)
            icon = fn(seed).result().resize((cell, cell), Image.LANCZOS)
            sheet.paste(icon, (x, y0), icon)
            draw.text((x + 4, y0 + cell + 4), label, fill=INK, font=font_sm)
            seed += 17

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
