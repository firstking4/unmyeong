"""사주 탭 아이콘 후보 50 — 네 기둥·명식표·만세력·간지·절기 계열."""

from __future__ import annotations

import math

from icon_kit import HAIR, STROKE, Icon

C = 12.0


def grid4(i: Icon) -> None:
    """2×2칸 — 네 기둥 격자"""
    i.rect_ring(C, C, 17, 17, radius=1.6, w=STROKE)
    i.line([(C, 3.5), (C, 20.5)], STROKE)
    i.line([(3.5, C), (20.5, C)], STROKE)


def grid4_dots(i: Icon) -> None:
    """2×2 + 네 글자 자리"""
    i.rect_ring(C, C, 17, 17, radius=1.6, w=STROKE)
    i.line([(C, 3.5), (C, 20.5)], HAIR)
    i.line([(3.5, C), (20.5, C)], HAIR)
    for x, y in ((7.9, 7.9), (16.1, 7.9), (7.9, 16.1), (16.1, 16.1)):
        i.disc(x, y, 1.5)


def four_pillars(i: Icon) -> None:
    """네 기둥 — 선"""
    for x in (6.0, 10.0, 14.0, 18.0):
        i.line([(x, 5.4), (x, 18.6)], STROKE)
    i.line([(3.6, 20.4), (20.4, 20.4)], STROKE)


def four_pillars_cap(i: Icon) -> None:
    """네 기둥 + 상하 받침"""
    i.line([(3.6, 4.4), (20.4, 4.4)], STROKE)
    i.line([(3.6, 19.6), (20.4, 19.6)], STROKE)
    for x in (6.4, 10.1, 13.9, 17.6):
        i.line([(x, 4.4), (x, 19.6)], HAIR)


def myeongsik_table(i: Icon) -> None:
    """명식표 — 머리행 + 4칸"""
    i.rect_ring(C, C, 18, 15, radius=1.4, w=STROKE)
    i.line([(3.0, 9.0), (21.0, 9.0)], STROKE)
    for x in (7.5, 12.0, 16.5):
        i.line([(x, 9.0), (x, 19.5)], HAIR)


def table_8(i: Icon) -> None:
    """팔자표 — 2행 4열"""
    i.rect_ring(C, C, 18, 12, radius=1.2, w=STROKE)
    i.line([(3.0, C), (21.0, C)], HAIR)
    for x in (7.5, 12.0, 16.5):
        i.line([(x, 6.0), (x, 18.0)], HAIR)


def cheongan_jiji(i: Icon) -> None:
    """천간·지지 — 위아래 짝"""
    for x in (6.4, 10.1, 13.9, 17.6):
        i.ring(x, 8.4, 1.9, HAIR)
        i.disc(x, 15.6, 1.9)


def vertical4(i: Icon) -> None:
    """세로 명식 — 네 칸"""
    i.rect_ring(C, C, 11, 18.4, radius=1.4, w=STROKE)
    for y in (7.4, 12.0, 16.6):
        i.line([(6.5, y), (17.5, y)], HAIR)


def scroll(i: Icon) -> None:
    """두루마리 — 명식 기록"""
    i.rect_ring(C, 5.0, 15.6, 3.4, radius=1.7, w=STROKE)
    i.rect_ring(C, 19.0, 15.6, 3.4, radius=1.7, w=STROKE)
    i.line([(5.8, 6.7), (5.8, 17.3)], HAIR)
    i.line([(18.2, 6.7), (18.2, 17.3)], HAIR)
    for y in (10.0, 14.0):
        i.line([(8.8, y), (15.2, y)], HAIR)


def book(i: Icon) -> None:
    """만세력 — 펼친 책"""
    i.line([(C, 6.4), (C, 19.4)], STROKE)
    i.line([(C, 6.4), (4.0, 8.0), (4.0, 19.0), (C, 17.6)], STROKE)
    i.line([(C, 6.4), (20.0, 8.0), (20.0, 19.0), (C, 17.6)], STROKE)


def books_stack(i: Icon) -> None:
    """겹책 — 세 권"""
    for k, y in enumerate((17.8, 13.8, 9.8)):
        i.rect_ring(C - k * 0.4, y, 15.4 - k * 0.8, 3.4, radius=1.0, w=HAIR)
    i.disc(7.0, 9.8, 0.8)


def calendar(i: Icon) -> None:
    """만세력 달력"""
    i.rect_ring(C, 13.0, 17.0, 15.0, radius=1.6, w=STROKE)
    i.line([(3.5, 9.2), (20.5, 9.2)], STROKE)
    i.line([(8.0, 3.6), (8.0, 6.4)], STROKE)
    i.line([(16.0, 3.6), (16.0, 6.4)], STROKE)
    for x in (8.0, 12.0, 16.0):
        i.line([(x, 9.2), (x, 20.5)], HAIR)
    i.line([(3.5, 15.0), (20.5, 15.0)], HAIR)


def calendar_mark(i: Icon) -> None:
    """생일 표시 달력"""
    i.rect_ring(C, 13.0, 17.0, 15.0, radius=1.6, w=STROKE)
    i.line([(3.5, 9.2), (20.5, 9.2)], STROKE)
    i.line([(8.0, 3.6), (8.0, 6.4)], STROKE)
    i.line([(16.0, 3.6), (16.0, 6.4)], STROKE)
    i.disc(9.4, 13.2, 1.6)
    i.disc(15.0, 17.0, 1.1)


def ganji_wheel(i: Icon) -> None:
    """간지 바퀴 — 열둘"""
    i.ring(C, C, 9.6, STROKE)
    i.ring(C, C, 5.4, HAIR)
    for x, y in i.ngon(C, C, 7.5, 12):
        i.disc(x, y, 0.85)


def ganji_wheel_ticks(i: Icon) -> None:
    """간지 눈금 휠"""
    i.ring(C, C, 9.6, HAIR)
    i.rays(C, C, 7.4, 9.6, 12, HAIR)
    i.ring(C, C, 3.4, STROKE)
    i.disc(C, C, 1.1)


def sexagenary(i: Icon) -> None:
    """육십갑자 — 두 겹 톱니"""
    i.ring(C, C, 9.4, HAIR)
    i.rays(C, C, 9.4, 10.8, 10, HAIR)
    i.ring(C, C, 5.2, HAIR)
    i.rays(C, C, 3.8, 5.2, 6, HAIR, rot=-60)


def eight_dots(i: Icon) -> None:
    """팔자 — 여덟 점"""
    i.ring(C, C, 4.0, HAIR)
    i.dots_around(C, C, 8.4, 8, 1.6)


def trigram(i: Icon) -> None:
    """삼효 — 괘"""
    i.trigram(C, C, 15.0, 5.4, [False, True, False])


def hexagram(i: Icon) -> None:
    """육효 — 주역 괘"""
    i.trigram(C, C, 14.0, 3.4, [False, True, False, True, True, False], w=1.9)


def yinyang_bars(i: Icon) -> None:
    """음양 막대 넷"""
    i.trigram(C, C, 15.0, 4.4, [False, True, True, False])


def cross_branch(i: Icon) -> None:
    """십자 사방 — 방위"""
    i.line([(C, 3.6), (C, 20.4)], STROKE)
    i.line([(3.6, C), (20.4, C)], STROKE)
    for x, y in ((C, 6.4), (C, 17.6), (6.4, C), (17.6, C)):
        i.disc(x, y, 1.4)


def compass_12(i: Icon) -> None:
    """십이방위"""
    i.ring(C, C, 9.4, HAIR)
    i.rays(C, C, 8.0, 9.4, 12, HAIR)
    i.poly([(C, 4.8), (14.2, C), (C, 19.2), (9.8, C)])
    i.poly([(C, 8.8), (13.0, C), (C, 15.2), (11.0, C)], ink=False)


def clock_sijin(i: Icon) -> None:
    """시진 — 태어난 시"""
    i.ring(C, C, 9.2, STROKE)
    i.line([(C, C), (C, 6.6)], STROKE)
    i.line([(C, C), (16.4, 14.0)], HAIR)
    i.disc(C, C, 1.1)


def sun_moon(i: Icon) -> None:
    """양력·음력"""
    i.disc(8.6, 11.0, 4.2)
    i.rays(8.6, 11.0, 5.4, 7.4, 6, HAIR)
    i.crescent(16.4, 14.4, 5.0, 3.4)


def solar_terms(i: Icon) -> None:
    """절기 — 스물넷 눈금"""
    i.ring(C, C, 9.6, HAIR)
    for k, (x, y) in enumerate(i.ngon(C, C, 9.6, 24)):
        i.disc(x, y, 0.9 if k % 6 == 0 else 0.5)
    i.disc(C, C, 2.2)


def daeun_steps(i: Icon) -> None:
    """대운 — 십년 계단"""
    for k, x in enumerate((6.2, 10.0, 13.8, 17.6)):
        h = 5.0 + k * 3.4
        i.rect(x, 20.2 - h / 2, 3.0, h, radius=1.5)


def daeun_flow(i: Icon) -> None:
    """운의 흐름 — 곡선"""
    i.line([(3.8, 16.6), (8.2, 10.4), (12.6, 14.2), (16.4, 7.4), (20.2, 11.0)], STROKE)
    i.disc(16.4, 7.4, 1.5)


def timeline(i: Icon) -> None:
    """세운 — 연표"""
    i.line([(3.6, 16.4), (20.4, 16.4)], STROKE)
    for x in (6.6, 12.0, 17.4):
        i.line([(x, 16.4), (x, 13.6)], HAIR)
    i.ring(6.6, 11.6, 1.9, HAIR)
    i.disc(12.0, 11.6, 2.1)
    i.ring(17.4, 11.6, 1.9, HAIR)


def five_elements_bar(i: Icon) -> None:
    """오행 분포 막대"""
    for k, (x, h) in enumerate(((5.6, 6.0), (9.0, 10.0), (12.4, 7.4), (15.8, 12.4), (19.2, 8.6))):
        i.rect(x, 20.0 - h / 2, 2.4, h, radius=1.2)


def five_elements_ring(i: Icon) -> None:
    """오행 비율 — 링"""
    i.ring(C, C, 8.6, 2.4)
    i.arc(C, C, 8.6, 8.6, 200, 320, 2.4, ink=False)
    i.arc(C, C, 8.6, 8.6, 205, 315, 1.2)
    i.disc(C, C, 1.6)


def seal_grid(i: Icon) -> None:
    """인장 격자 — 사주 도장"""
    i.rect_ring(C, C, 18.4, 18.4, radius=1.4, w=2.2)
    i.rect_ring(C, C, 12.6, 12.6, radius=0.9, w=HAIR)
    i.line([(C, 5.7), (C, 18.3)], HAIR)
    i.line([(5.7, C), (18.3, C)], HAIR)


def baduk_grid(i: Icon) -> None:
    """격국 — 바둑판"""
    i.rect_ring(C, C, 17.0, 17.0, radius=1.0, w=HAIR)
    for v in (7.75, 12.0, 16.25):
        i.line([(v, 3.5), (v, 20.5)], HAIR)
        i.line([(3.5, v), (20.5, v)], HAIR)
    i.disc(7.75, 7.75, 1.5)
    i.disc(16.25, 16.25, 1.5)


def brush_table(i: Icon) -> None:
    """붓 + 명식"""
    i.rect_ring(10.2, 14.8, 13.2, 11.6, radius=1.2, w=STROKE)
    i.line([(10.2, 9.0), (10.2, 20.6)], HAIR)
    i.line([(3.6, 14.8), (16.8, 14.8)], HAIR)
    i.line([(15.4, 10.0), (20.4, 4.6)], STROKE)
    i.poly([(13.2, 12.4), (16.0, 9.4), (17.2, 10.6), (14.4, 13.6)])


def dice_four(i: Icon) -> None:
    """사각 인 — 네 점"""
    i.rect_ring(C, C, 17.0, 17.0, radius=2.4, w=STROKE)
    for x, y in ((8.6, 8.6), (15.4, 8.6), (8.6, 15.4), (15.4, 15.4)):
        i.disc(x, y, 1.6)


def four_seasons(i: Icon) -> None:
    """사계 — 네 마디 원"""
    for k in range(4):
        i.arc(C, C, 9.0, 9.0, -84 + k * 90, -6 + k * 90, STROKE)
    i.disc(C, C, 2.0)


def mountain_water(i: Icon) -> None:
    """산수 — 터와 흐름"""
    i.line([(3.6, 14.4), (8.6, 7.2), (12.4, 12.2), (15.4, 8.6), (20.4, 14.4)], STROKE)
    i.line([(4.0, 18.2), (8.0, 16.8), (12.0, 18.2), (16.0, 16.8), (20.0, 18.2)], HAIR)


def pillar_house(i: Icon) -> None:
    """기둥과 지붕 — 사주 집"""
    i.line([(3.4, 9.4), (C, 4.0), (20.6, 9.4)], STROKE)
    for x in (6.6, 10.2, 13.8, 17.4):
        i.line([(x, 10.4), (x, 19.6)], HAIR)
    i.line([(4.6, 20.4), (19.4, 20.4)], STROKE)


def gate(i: Icon) -> None:
    """운의 문 — 관문"""
    i.line([(5.0, 20.4), (5.0, 9.0)], STROKE)
    i.line([(19.0, 20.4), (19.0, 9.0)], STROKE)
    i.arc(C, 9.0, 7.0, 6.0, 180, 360, STROKE)
    i.line([(C, 6.0), (C, 20.4)], HAIR)


def knot(i: Icon) -> None:
    """매듭 — 합충"""
    i.ring(9.0, 9.6, 4.4, STROKE)
    i.ring(15.0, 9.6, 4.4, STROKE)
    i.ring(C, 15.4, 4.4, STROKE)


def link_chain(i: Icon) -> None:
    """합 — 연결 고리"""
    i.rect_ring(8.6, C, 9.0, 6.6, radius=3.3, w=STROKE)
    i.rect_ring(15.4, C, 9.0, 6.6, radius=3.3, w=STROKE)


def clash(i: Icon) -> None:
    """충 — 부딪힘"""
    i.line([(3.4, C), (9.4, C)], STROKE)
    i.line([(7.0, 9.4), (9.6, C), (7.0, 14.6)], STROKE)
    i.line([(20.6, C), (14.6, C)], STROKE)
    i.line([(17.0, 9.4), (14.4, C), (17.0, 14.6)], STROKE)
    i.disc(C, C, 1.4)


def yin_yang_split(i: Icon) -> None:
    """음양 반반"""
    i.ring(C, C, 9.2, STROKE)
    i.draw.pieslice(i._box(C, C, 9.2 - 0.9, 9.2 - 0.9), -90, 90, fill=255)


def ten_gods(i: Icon) -> None:
    """십신 — 열 갈래"""
    i.ring(C, C, 3.4, STROKE)
    i.ring(C, C, 9.2, HAIR)
    i.dots_around(C, C, 9.2, 10, 1.15)


def twelve_stages(i: Icon) -> None:
    """십이운성 — 원형 단계"""
    i.ring(C, C, 9.2, HAIR)
    for k, (x, y) in enumerate(i.ngon(C, C, 9.2, 12)):
        i.disc(x, y, 1.5 if k in (0, 3, 6, 9) else 0.85)


def hourglass(i: Icon) -> None:
    """모래시계 — 시주"""
    i.line([(6.4, 4.2), (17.6, 4.2)], STROKE)
    i.line([(6.4, 19.8), (17.6, 19.8)], STROKE)
    i.line([(7.6, 4.2), (16.4, 4.2), (12.6, C), (16.4, 19.8), (7.6, 19.8), (11.4, C)], HAIR, close=True)


def seed_sprout(i: Icon) -> None:
    """뿌리와 싹 — 근묘화실"""
    i.line([(C, 4.4), (C, 17.0)], STROKE)
    i.arc(8.6, 8.6, 3.6, 3.6, 0, 120, STROKE)
    i.arc(15.4, 11.2, 3.6, 3.6, 60, 180, STROKE)
    i.line([(C, 17.0), (7.6, 20.6)], HAIR)
    i.line([(C, 17.0), (16.4, 20.6)], HAIR)
    i.line([(C, 17.0), (C, 21.0)], HAIR)


def four_dots_ring(i: Icon) -> None:
    """원 안 네 점 — 사주"""
    i.ring(C, C, 9.4, STROKE)
    for x, y in i.ngon(C, C, 5.0, 4, rot=-45):
        i.disc(x, y, 1.7)


def chart_stack(i: Icon) -> None:
    """명식 카드 — 겹친 표"""
    i.rect_ring(13.6, 10.6, 13.0, 13.6, radius=1.4, w=HAIR)
    i.rect_ring(10.4, 13.4, 13.0, 13.6, radius=1.4, w=STROKE)
    i.line([(5.4, 11.0), (15.4, 11.0)], HAIR)
    i.line([(10.4, 11.0), (10.4, 20.2)], HAIR)


def numerology(i: Icon) -> None:
    """수리 — 점괘 배열"""
    for row in range(3):
        for col in range(3):
            x = 6.6 + col * 5.4
            y = 6.6 + row * 5.4
            if (row, col) == (1, 1):
                i.disc(x, y, 1.9)
            else:
                i.ring(x, y, 1.7, HAIR)


def lantern(i: Icon) -> None:
    """등불 — 운의 밝기"""
    i.line([(C, 3.4), (C, 5.6)], HAIR)
    i.line([(7.2, 5.6), (16.8, 5.6)], STROKE)
    i.oval_ring(C, 12.6, 5.8, 6.6, STROKE)
    i.line([(7.4, 19.2), (16.6, 19.2)], STROKE)
    i.line([(C, 19.2), (C, 21.2)], HAIR)


CANDIDATES = [
    ("2×2칸", grid4),
    ("2×2점", grid4_dots),
    ("네기둥", four_pillars),
    ("기둥받침", four_pillars_cap),
    ("명식표", myeongsik_table),
    ("팔자표", table_8),
    ("천간지지", cheongan_jiji),
    ("세로명식", vertical4),
    ("두루마리", scroll),
    ("펼친책", book),
    ("겹책", books_stack),
    ("달력", calendar),
    ("생일달력", calendar_mark),
    ("간지바퀴", ganji_wheel),
    ("간지눈금", ganji_wheel_ticks),
    ("육십갑자", sexagenary),
    ("팔자8점", eight_dots),
    ("삼효", trigram),
    ("육효", hexagram),
    ("음양막대", yinyang_bars),
    ("십자방위", cross_branch),
    ("십이방위", compass_12),
    ("시진", clock_sijin),
    ("양력음력", sun_moon),
    ("절기", solar_terms),
    ("대운계단", daeun_steps),
    ("운흐름", daeun_flow),
    ("세운연표", timeline),
    ("오행막대", five_elements_bar),
    ("오행링", five_elements_ring),
    ("인장격자", seal_grid),
    ("격국판", baduk_grid),
    ("붓+명식", brush_table),
    ("사각네점", dice_four),
    ("사계", four_seasons),
    ("산수", mountain_water),
    ("기둥집", pillar_house),
    ("관문", gate),
    ("매듭", knot),
    ("합·고리", link_chain),
    ("충", clash),
    ("음양반반", yin_yang_split),
    ("십신", ten_gods),
    ("십이운성", twelve_stages),
    ("모래시계", hourglass),
    ("근묘화실", seed_sprout),
    ("원네점", four_dots_ring),
    ("명식카드", chart_stack),
    ("수리배열", numerology),
    ("등불", lantern),
]
