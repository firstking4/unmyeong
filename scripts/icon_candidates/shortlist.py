"""숏리스트 고도화안 — 후보 시트에서 고른 15개를 한 단계 더 다듬은 버전.

원안 대비 바뀐 점: 획 위계(주선/보조선)를 분명히 하고, 키라인·눈금·핍 같은
디테일을 얹되 28pt에서 뭉개질 요소는 뺐다. 원안은 각 탭 모듈에 그대로 남아 있다.
"""

from __future__ import annotations

import math

from icon_kit import Icon

C = 12.0
MAIN = 1.9
SUB = 1.15
FINE = 0.85


# ── 성향 ────────────────────────────────────────────────────────────

def _halo(i: Icon, draw, weight: float) -> None:
    """같은 획을 굵게 지운 뒤 다시 그려, 겹치는 곳에 여백을 만든다."""
    draw(weight + 1.7, False)
    draw(weight, True)


def person_ring(i: Icon) -> None:
    """원 안의 나 — 어깨가 테를 끊고 나옴"""
    i.arc(C, 23.6, 8.8, 8.6, 200, 340, MAIN)
    # 테 밖으로 나간 어깨를 잘라 내면 원 안에 딱 담긴 인물이 된다.
    i.ring(C, C, 24.0, 15.5, ink=False)
    i.ring(C, C, 9.7, SUB * 1.4)
    i.ring(C, 9.5, 3.2, MAIN)


def person_aura(i: Icon) -> None:
    """인물 + 기운 — 반짝임 세 점"""
    i.ring(10.2, 10.4, 3.4, MAIN)
    i.arc(10.2, 20.8, 6.4, 6.0, 203, 337, MAIN)
    i.star(18.6, 6.4, 3.2, 0.95, n=4, rot=-90)
    i.star(20.4, 11.8, 1.9, 0.55, n=4, rot=-90)
    i.star(15.4, 3.4, 1.5, 0.45, n=4, rot=-90)


def taegeuk_ring(i: Icon) -> None:
    """태극 인장테 — 겹테"""
    i.ring(C, C, 10.1, SUB * 1.5)
    i.ring(C, C, 8.1, FINE)
    i.taegeuk(C, C, 6.3)


def radar(i: Icon) -> None:
    """레이더 — 눈금 + 분포"""
    i.poly_ring(i.ngon(C, C, 9.6, 5), SUB)
    for x, y in i.ngon(C, C, 9.6, 5):
        i.line([(C, C), (x, y)], FINE)
    plot = [
        (C + r * math.cos(math.radians(-90 + k * 72)), C + r * math.sin(math.radians(-90 + k * 72)))
        for k, r in enumerate((7.8, 4.2, 6.6, 3.6, 5.8))
    ]
    i.poly_ring(plot, MAIN)
    for x, y in plot:
        i.disc(x, y, 1.05)


# ── 사주 ────────────────────────────────────────────────────────────

def ohaeng_ring(i: Icon) -> None:
    """오행 링 — 다섯 마디"""
    for k in range(5):
        start = -80 + k * 72
        i.arc(C, C, 8.6, 8.6, start, start + 56, 2.2, cap=False)
    i.disc(C, C, 1.9)


def myeongsik_table(i: Icon) -> None:
    """명식표 — 머리행 + 네 기둥"""
    i.rect_ring(C, C, 18.0, 15.4, radius=1.6, w=MAIN)
    i.line([(3.0, 8.6), (21.0, 8.6)], SUB)
    for x in (7.5, 12.0, 16.5):
        i.line([(x, 8.6), (x, 19.7)], FINE)
    for x in (5.25, 9.75, 14.25, 18.75):
        i.disc(x, 12.4, 1.0)


def grid4_dots(i: Icon) -> None:
    """2×2 — 천간은 채우고 지지는 비움"""
    i.rect_ring(C, C, 17.6, 17.6, radius=2.0, w=MAIN)
    i.line([(C, 3.2), (C, 20.8)], SUB)
    i.line([(3.2, C), (20.8, C)], SUB)
    i.disc(7.8, 7.8, 1.6)
    i.disc(16.2, 7.8, 1.6)
    i.ring(7.8, 16.2, 1.6, SUB)
    i.ring(16.2, 16.2, 1.6, SUB)


# ── 타로 ────────────────────────────────────────────────────────────

def _card_over(
    i: Icon,
    cx: float,
    cy: float,
    w: float,
    h: float,
    tilt: float,
    weight: float = MAIN,
    pad: float = 1.4,
) -> None:
    """앞장을 그리기 전에 제 실루엣만큼 지워, 뒷장 위로 겹쳐 보이게 한다."""
    rad = math.radians(tilt)
    pivot = h / 2
    corners = []
    for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        x, y = dx * (w / 2 + pad), dy * (h / 2 + pad) - pivot
        corners.append(
            (cx + x * math.cos(rad) - y * math.sin(rad),
             cy + x * math.sin(rad) + y * math.cos(rad) + pivot)
        )
    i.poly(corners, ink=False)
    i.card(cx, cy, w, h, weight, tilt=tilt)


def card_moon(i: Icon) -> None:
    """카드 + 달·별"""
    i.card(C, C, 13.0, 18.4, MAIN, radius=1.8)
    i.crescent(11.6, 13.0, 3.1, 2.1)
    i.star(15.2, 9.0, 1.8, 0.55, n=4, rot=-90)


def card_eye(i: Icon) -> None:
    """카드 + 눈 — 통찰"""
    i.card(C, C, 13.0, 18.4, MAIN, radius=1.8)
    i.eye(C, 13.0, 4.0, 2.4, SUB, pupil=1.05)
    i.arc(C, 9.9, 3.4, 2.0, 200, 340, FINE)


def spread_two(i: Icon) -> None:
    """두 장 — 앞장에 마름모 핍"""
    i.card(9.6, 13.4, 9.4, 14.4, SUB, tilt=-18)
    _card_over(i, 14.6, 12.6, 9.6, 15.2, 9)
    i.line([(15.3, 9.9), (17.3, 12.4), (15.0, 15.0), (13.0, 12.5)], FINE, close=True)


def spread_fan(i: Icon) -> None:
    """부채 펼침 — 세 장"""
    i.card(7.8, 13.4, 7.8, 12.4, SUB, tilt=-22)
    _card_over(i, 16.2, 13.4, 7.8, 12.4, 22, SUB, pad=0.9)
    _card_over(i, C, 12.8, 8.4, 13.6, 0, MAIN, pad=0.9)
    i.disc(C, 9.8, 1.05)


# ── 관상 ────────────────────────────────────────────────────────────

def face_three(i: Icon) -> None:
    """삼정 — 눈금 있는 세 단"""
    i.face(C, C, 7.3, 9.2, MAIN)
    i.line([(5.6, 8.9), (18.4, 8.9)], SUB)
    i.line([(7.0, 14.6), (17.0, 14.6)], SUB)
    for y in (8.9, 14.6):
        i.line([(2.8, y), (3.9, y)], FINE)
        i.line([(20.1, y), (21.2, y)], FINE)


def portrait_frame(i: Icon) -> None:
    """증명 틀 — 인물 + 바닥선"""
    i.rect_ring(C, C, 15.8, 18.4, radius=1.8, w=MAIN)
    i.ring(C, 10.0, 3.1, SUB)
    i.arc(C, 20.4, 5.4, 5.2, 205, 335, SUB)
    i.line([(7.0, 17.2), (17.0, 17.2)], FINE)


def eye_line(i: Icon) -> None:
    """눈 — 윗꺼풀을 무겁게"""
    i.arc(C, 12.4, 8.8, 5.0, 200, 340, MAIN * 1.15)
    i.arc(C, 11.6, 8.8, 4.6, 20, 160, SUB)
    i.ring(C, 12.0, 2.7, SUB)
    i.disc(C, 12.0, 1.15)


def face_brows(i: Icon) -> None:
    """얼굴 + 눈썹 — 눈매까지"""
    i.face(C, C, 7.3, 9.2, MAIN)
    i.arc(9.4, 9.2, 2.5, 1.6, 200, 340, SUB)
    i.arc(14.6, 9.2, 2.5, 1.6, 200, 340, SUB)
    i.arc(9.4, 12.6, 2.2, 1.5, 200, 340, SUB)
    i.arc(14.6, 12.6, 2.2, 1.5, 200, 340, SUB)
    i.disc(9.4, 12.7, 0.8)
    i.disc(14.6, 12.7, 0.8)
    i.arc(C, 15.4, 2.7, 2.2, 25, 155, FINE)
