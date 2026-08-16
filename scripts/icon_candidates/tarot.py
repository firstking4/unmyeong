"""타로 탭 아이콘 후보 50 — 카드·스프레드·수트·천체 계열."""

from __future__ import annotations

import math

from icon_kit import HAIR, STROKE, Icon

C = 12.0


def card_plain(i: Icon) -> None:
    """카드 한 장"""
    i.card(C, C, 12.4, 18.0, STROKE)


def card_keyline(i: Icon) -> None:
    """카드 + 안쪽 테"""
    i.card(C, C, 12.6, 18.2, STROKE, keyline=True)


def card_pip(i: Icon) -> None:
    """카드 + 마름모"""
    i.card(C, C, 12.6, 18.2, STROKE)
    i.line([(C, 8.4), (14.6, C), (C, 15.6), (9.4, C)], HAIR, close=True)


def card_star(i: Icon) -> None:
    """카드 + 별"""
    i.card(C, C, 12.6, 18.2, STROKE)
    i.star(C, 11.6, 3.8, 1.6)


def card_moon(i: Icon) -> None:
    """카드 + 달"""
    i.card(C, C, 12.6, 18.2, STROKE)
    i.crescent(12.6, 11.8, 3.6, 2.6)


def card_eye(i: Icon) -> None:
    """카드 + 눈"""
    i.card(C, C, 12.6, 18.2, STROKE)
    i.eye(C, 11.6, 3.8, 2.2, HAIR, pupil=0.95)


def card_back(i: Icon) -> None:
    """카드 뒷면 — 패턴"""
    i.card(C, C, 12.6, 18.2, STROKE, keyline=True)
    for y in (9.0, 12.0, 15.0):
        i.line([(C - 1.9, y), (C, y - 1.4), (C + 1.9, y), (C, y + 1.4)], HAIR, close=True)


def card_tilt(i: Icon) -> None:
    """기울어진 한 장"""
    i.card(C, 12.6, 11.6, 16.8, STROKE, tilt=-12)


def spread_two(i: Icon) -> None:
    """두 장"""
    i.card(8.6, 12.6, 9.6, 15.4, HAIR, tilt=-14)
    i.card(15.0, 12.2, 9.6, 15.4, STROKE, tilt=8)


def spread_three(i: Icon) -> None:
    """세 장 스프레드"""
    for x in (6.2, C, 17.8):
        i.card(x, C, 6.8, 15.6, STROKE, radius=1.0)


def spread_fan(i: Icon) -> None:
    """부채 펼침"""
    i.card(C, 13.6, 8.8, 14.4, HAIR, tilt=-26)
    i.card(C, 13.2, 8.8, 14.8, STROKE, tilt=0)
    i.card(C, 13.6, 8.8, 14.4, HAIR, tilt=26)


def spread_cross(i: Icon) -> None:
    """십자 스프레드"""
    i.card(C, 8.4, 7.0, 9.6, HAIR, radius=0.9)
    i.card(6.6, 16.0, 7.0, 9.6, HAIR, radius=0.9)
    i.card(17.4, 16.0, 7.0, 9.6, HAIR, radius=0.9)
    i.disc(C, 8.4, 1.2)


def spread_celtic(i: Icon) -> None:
    """켈틱 크로스"""
    i.card(9.4, 11.6, 7.6, 11.0, HAIR, radius=0.9)
    i.card(9.4, 11.6, 11.0, 7.6, STROKE, radius=0.9)
    for y in (6.4, 12.0, 17.6):
        i.card(19.2, y, 4.6, 4.8, HAIR, radius=0.6)


def deck_stack(i: Icon) -> None:
    """카드 더미"""
    i.card(C + 1.6, 10.4, 11.2, 15.6, HAIR)
    i.card(C - 0.4, 12.0, 11.2, 15.6, HAIR)
    i.card(C - 2.2, 13.6, 11.2, 15.6, STROKE)


def deck_box(i: Icon) -> None:
    """덱 상자"""
    i.rect_ring(C, 15.2, 13.6, 10.4, radius=1.6, w=STROKE)
    i.line([(5.2, 12.4), (18.8, 12.4)], HAIR)
    i.card(9.6, 7.8, 6.0, 8.4, HAIR, radius=0.8, tilt=-10)
    i.card(14.8, 7.8, 6.0, 8.4, HAIR, radius=0.8, tilt=10)


def hand_card(i: Icon) -> None:
    """뽑는 손"""
    i.card(C, 8.8, 10.2, 11.6, STROKE, radius=1.0)
    i.arc(C, 17.6, 6.6, 4.4, 180, 360, STROKE)
    for x in (8.2, 10.8, 13.4, 16.0):
        i.line([(x, 17.8), (x, 20.6)], HAIR)


def sun(i: Icon) -> None:
    """태양 — 메이저"""
    i.ring(C, C, 5.0, STROKE)
    i.rays(C, C, 7.2, 9.8, 8, HAIR)


def sun_face(i: Icon) -> None:
    """태양 얼굴"""
    i.ring(C, C, 5.4, STROKE)
    i.rays(C, C, 7.4, 10.0, 12, HAIR)
    i.disc(10.4, 11.0, 0.75)
    i.disc(13.6, 11.0, 0.75)
    i.arc(C, 12.4, 2.2, 2.0, 20, 160, HAIR)


def moon_crescent(i: Icon) -> None:
    """초승달"""
    i.crescent(13.0, C, 8.6, 5.4)


def moon_line(i: Icon) -> None:
    """달 — 선"""
    i.disc(12.6, C, 9.0)
    i.disc(12.6, C, 9.0 - STROKE, ink=False)
    i.disc(18.4, 10.6, 8.6, ink=False)


def moon_phases(i: Icon) -> None:
    """달의 위상"""
    i.ring(5.4, C, 3.0, HAIR)
    i.crescent(C, C, 3.4, 2.2)
    i.disc(18.6, C, 3.0)


def star_eight(i: Icon) -> None:
    """팔각성 — 별"""
    i.star(C, C, 9.6, 3.4, n=8, fill=True)
    i.disc(C, C, 2.0, ink=False)


def star_line(i: Icon) -> None:
    """오각성 선"""
    i.star(C, C, 9.2, 3.8, fill=False, w=STROKE)


def pentacle(i: Icon) -> None:
    """펜타클 — 수트"""
    i.ring(C, C, 9.0, STROKE)
    pts = i.ngon(C, C, 6.4, 5)
    for k in range(5):
        i.line([pts[k], pts[(k + 2) % 5]], HAIR)


def cup(i: Icon) -> None:
    """성배 — 수트"""
    i.arc(C, 7.6, 5.6, 6.2, 0, 180, STROKE)
    i.line([(6.4, 7.6), (17.6, 7.6)], STROKE)
    i.line([(C, 13.8), (C, 17.4)], STROKE)
    i.arc(C, 17.4, 4.6, 2.6, 0, 180, STROKE)


def sword(i: Icon) -> None:
    """검 — 수트"""
    i.poly([(C, 3.0), (13.5, 6.6), (13.5, 14.8), (10.5, 14.8), (10.5, 6.6)])
    i.line([(7.0, 15.8), (17.0, 15.8)], STROKE)
    i.line([(C, 15.8), (C, 19.2)], STROKE)
    i.disc(C, 20.4, 1.3)


def wand(i: Icon) -> None:
    """완드 — 수트"""
    i.line([(6.6, 19.4), (16.2, 6.6)], STROKE)
    i.star(17.4, 5.2, 3.2, 1.3)


def suits_four(i: Icon) -> None:
    """네 수트 모음"""
    i.arc(7.4, 7.0, 3.0, 3.2, 0, 180, HAIR)
    i.line([(4.4, 7.0), (10.4, 7.0)], HAIR)
    i.line([(7.4, 10.2), (7.4, 11.6)], HAIR)
    i.line([(16.6, 4.0), (16.6, 11.6)], HAIR)
    i.line([(14.2, 7.6), (19.0, 7.6)], HAIR)
    i.ring(7.4, 16.8, 3.6, HAIR)
    i.star(7.4, 16.8, 2.6, 1.05, fill=False, w=1.0)
    i.line([(13.4, 20.4), (19.2, 14.2)], HAIR)
    i.disc(19.8, 13.4, 1.0)


def wheel(i: Icon) -> None:
    """운명의 수레바퀴"""
    i.ring(C, C, 9.2, STROKE)
    i.ring(C, C, 2.6, HAIR)
    i.rays(C, C, 2.6, 9.2, 8, HAIR)


def wheel_fortune(i: Icon) -> None:
    """수레바퀴 + 화살"""
    i.ring(C, C, 8.8, STROKE)
    i.rays(C, C, 3.0, 8.8, 6, HAIR)
    i.disc(C, C, 1.6)
    i.line([(17.0, 5.6), (20.4, 5.6), (20.4, 9.0)], HAIR)


def crystal_ball(i: Icon) -> None:
    """수정구"""
    i.ring(C, 11.0, 7.4, STROKE)
    i.arc(C, 11.0, 4.4, 4.4, 170, 250, HAIR)
    i.line([(6.6, 19.4), (17.4, 19.4)], STROKE)
    i.line([(8.6, 17.0), (15.4, 17.0)], HAIR)


def crystal(i: Icon) -> None:
    """수정 — 결정"""
    i.line([(C, 3.6), (18.4, 9.4), (15.4, 20.4), (8.6, 20.4), (5.6, 9.4)], STROKE, close=True)
    i.line([(C, 3.6), (C, 20.4)], HAIR)
    i.line([(5.6, 9.4), (C, 12.4), (18.4, 9.4)], HAIR)


def candle(i: Icon) -> None:
    """촛불 — 리딩"""
    i.rect_ring(C, 15.6, 8.4, 10.0, radius=1.2, w=STROKE)
    i.line([(C, 10.6), (C, 8.4)], HAIR)
    i.line([(C, 4.0), (14.0, 7.0), (C, 8.6), (10.0, 7.0)], STROKE, close=True)


def eye_providence(i: Icon) -> None:
    """섭리의 눈"""
    i.line([(C, 4.4), (20.0, 18.4), (4.0, 18.4)], STROKE, close=True)
    i.eye(C, 14.4, 4.4, 2.4, HAIR, pupil=1.0)


def key_arcana(i: Icon) -> None:
    """열쇠 — 비의"""
    i.ring(8.4, 8.6, 4.0, STROKE)
    i.line([(11.2, 11.4), (19.0, 19.2)], STROKE)
    i.line([(15.6, 18.2), (17.2, 19.8)], HAIR)
    i.line([(17.4, 15.6), (19.0, 17.2)], HAIR)


def tower(i: Icon) -> None:
    """탑 — 메이저 XVI"""
    i.rect_ring(C, 15.4, 9.6, 11.6, radius=0.8, w=STROKE)
    i.line([(6.4, 9.6), (C, 4.6), (17.6, 9.6)], STROKE)
    i.disc(C, 14.0, 1.4)


def gate_arch(i: Icon) -> None:
    """아치문 — 입문"""
    i.line([(5.4, 20.6), (5.4, 11.0)], STROKE)
    i.line([(18.6, 20.6), (18.6, 11.0)], STROKE)
    i.arc(C, 11.0, 6.6, 6.4, 180, 360, STROKE)
    i.disc(C, 11.4, 1.3)


def infinity(i: Icon) -> None:
    """무한 — 마법사"""
    i.ring(7.8, C, 4.4, STROKE)
    i.ring(16.2, C, 4.4, STROKE)


def scales(i: Icon) -> None:
    """정의 — 저울"""
    i.line([(C, 5.0), (C, 20.2)], STROKE)
    i.line([(4.6, 8.0), (19.4, 8.0)], STROKE)
    i.arc(6.6, 8.4, 3.2, 3.2, 15, 165, HAIR)
    i.arc(17.4, 8.4, 3.2, 3.2, 15, 165, HAIR)


def lotus(i: Icon) -> None:
    """연꽃 — 직관"""
    i.line([(C, 5.0), (15.2, 12.8), (C, 16.6), (8.8, 12.8)], STROKE, close=True)
    i.arc(6.2, 13.0, 5.2, 5.2, 300, 95, STROKE)
    i.arc(17.8, 13.0, 5.2, 5.2, 85, 240, STROKE)
    i.arc(C, 17.2, 8.4, 4.2, 20, 160, HAIR)


def butterfly(i: Icon) -> None:
    """나비 — 변화"""
    i.ring(8.0, 9.6, 4.2, HAIR)
    i.ring(16.0, 9.6, 4.2, HAIR)
    i.ring(9.0, 16.4, 3.4, HAIR)
    i.ring(15.0, 16.4, 3.4, HAIR)
    i.line([(C, 6.4), (C, 19.4)], STROKE)


def shooting_star(i: Icon) -> None:
    """별똥별 — 운의 신호"""
    i.star(15.4, 8.6, 4.6, 1.9)
    i.line([(4.2, 19.8), (10.4, 13.6)], STROKE)
    i.line([(6.4, 14.2), (9.2, 11.4)], HAIR)


def pendulum(i: Icon) -> None:
    """펜듈럼 — 점의 추"""
    i.line([(7.6, 4.2), (16.4, 4.2)], STROKE)
    i.line([(C, 4.2), (C, 12.4)], HAIR)
    i.line([(C, 12.4), (14.8, 15.8), (C, 20.6), (9.2, 15.8)], STROKE, close=True)


def rune_card(i: Icon) -> None:
    """룬 카드 — 상징"""
    i.card(C, C, 12.4, 18.0, STROKE)
    i.line([(9.6, 8.0), (9.6, 16.0)], HAIR)
    i.line([(9.6, 12.0), (14.4, 8.0)], HAIR)
    i.line([(9.6, 12.0), (14.4, 16.0)], HAIR)


def question_card(i: Icon) -> None:
    """질문 카드"""
    i.card(C, C, 12.4, 18.0, STROKE)
    i.arc(C, 10.4, 2.4, 2.4, 150, 380, HAIR)
    i.line([(C, 12.8), (C, 14.0)], HAIR)
    i.disc(C, 16.0, 0.9)


def flip_card(i: Icon) -> None:
    """뒤집는 카드"""
    i.card(8.8, 13.0, 8.4, 13.2, HAIR, tilt=-16)
    i.card(15.4, 12.2, 8.4, 13.2, STROKE, tilt=12)
    i.arc(C, 5.6, 5.0, 3.0, 200, 340, HAIR)
    i.disc(16.8, 5.0, 0.9)


def clock_daily(i: Icon) -> None:
    """오늘의 카드 — 하루"""
    i.card(9.6, 12.4, 10.6, 15.4, STROKE)
    i.ring(17.0, 17.2, 4.2, HAIR)
    i.line([(17.0, 17.2), (17.0, 14.8)], HAIR)
    i.line([(17.0, 17.2), (19.0, 18.2)], HAIR)


def zodiac_card(i: Icon) -> None:
    """별자리 카드"""
    i.card(C, C, 12.6, 18.2, STROKE)
    nodes = [(9.0, 8.6), (12.4, 10.8), (10.6, 14.2), (14.6, 16.0)]
    i.line(nodes, HAIR, cap=False)
    for x, y in nodes:
        i.disc(x, y, 0.85)


def sacred_geometry(i: Icon) -> None:
    """신성기하 — 원과 삼각"""
    i.ring(C, C, 9.2, HAIR)
    i.poly_ring(i.ngon(C, C, 8.0, 3), STROKE)
    i.poly_ring(i.ngon(C, C, 8.0, 3, rot=90), HAIR)


def all_seeing_card(i: Icon) -> None:
    """카드 속 눈 — 통찰"""
    i.card(C, C, 13.0, 18.4, STROKE, keyline=True)
    i.eye(C, C, 3.6, 2.2, HAIR, pupil=0.9)


CANDIDATES = [
    ("카드", card_plain),
    ("카드테", card_keyline),
    ("카드마름모", card_pip),
    ("카드별", card_star),
    ("카드달", card_moon),
    ("카드눈", card_eye),
    ("카드뒷면", card_back),
    ("기운카드", card_tilt),
    ("두장", spread_two),
    ("세장", spread_three),
    ("부채펼침", spread_fan),
    ("십자스프레드", spread_cross),
    ("켈틱크로스", spread_celtic),
    ("카드더미", deck_stack),
    ("덱상자", deck_box),
    ("뽑는손", hand_card),
    ("태양", sun),
    ("태양얼굴", sun_face),
    ("초승달", moon_crescent),
    ("달선", moon_line),
    ("달위상", moon_phases),
    ("팔각성", star_eight),
    ("오각성선", star_line),
    ("펜타클", pentacle),
    ("성배", cup),
    ("검", sword),
    ("완드", wand),
    ("네수트", suits_four),
    ("수레바퀴", wheel),
    ("운명바퀴", wheel_fortune),
    ("수정구", crystal_ball),
    ("수정", crystal),
    ("촛불", candle),
    ("섭리의눈", eye_providence),
    ("열쇠", key_arcana),
    ("탑", tower),
    ("아치문", gate_arch),
    ("무한", infinity),
    ("저울", scales),
    ("연꽃", lotus),
    ("나비", butterfly),
    ("별똥별", shooting_star),
    ("펜듈럼", pendulum),
    ("룬카드", rune_card),
    ("질문카드", question_card),
    ("뒤집는카드", flip_card),
    ("오늘의카드", clock_daily),
    ("별자리카드", zodiac_card),
    ("신성기하", sacred_geometry),
    ("카드속눈", all_seeing_card),
]
