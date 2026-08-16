"""성향 탭 아이콘 후보 50 — 기질·오행·MBTI·혈액형·별자리 계열."""

from __future__ import annotations

import math

from icon_kit import HAIR, STROKE, Icon

C = 12.0


def taegeuk(i: Icon) -> None:
    """태극 — 음양"""
    i.taegeuk(C, C, 9)


def taegeuk_ring(i: Icon) -> None:
    """태극 + 테두리"""
    i.ring(C, C, 10, HAIR)
    i.taegeuk(C, C, 7.4)


def taegeuk_line(i: Icon) -> None:
    """태극 선 — 윤곽만"""
    i.ring(C, C, 9)
    i.arc(C, C - 4.5, 4.5, 4.5, 90, 270, STROKE)
    i.arc(C, C + 4.5, 4.5, 4.5, 270, 90, STROKE)
    i.disc(C, C - 4.5, 1.1)
    i.disc(C, C + 4.5, 1.1)


def ohaeng_wheel(i: Icon) -> None:
    """오행 상생 — 다섯 마디 원"""
    i.ring(C, C, 9, HAIR)
    for x, y in i.ngon(C, C, 9, 5):
        i.disc(x, y, 2.0)
        i.disc(x, y, 0.85, ink=False)


def ohaeng_star(i: Icon) -> None:
    """오행 상극 — 오각 별선"""
    pts = i.ngon(C, C, 8.6, 5)
    for k in range(5):
        i.line([pts[k], pts[(k + 2) % 5]], STROKE)
    for x, y in pts:
        i.disc(x, y, 1.5)


def ohaeng_hub(i: Icon) -> None:
    """오행 바퀴 — 중심 연결"""
    for x, y in i.ngon(C, C, 8.4, 5):
        i.line([(C, C), (x, y)], HAIR)
        i.ring(x, y, 1.9, HAIR)
    i.disc(C, C, 2.0)


def pent_line(i: Icon) -> None:
    """오각형 — 다섯 기운"""
    i.poly_ring(i.ngon(C, C, 9, 5), STROKE)
    i.disc(C, C, 1.6)


def star_line(i: Icon) -> None:
    """오각별 선"""
    i.star(C, C, 9.2, 3.8, fill=False, w=STROKE)


def star_solid(i: Icon) -> None:
    """오각별 면"""
    i.star(C, C, 9.2, 3.9)


def five_dots(i: Icon) -> None:
    """다섯 점 — 오행 단순화"""
    i.dots_around(C, C, 7.4, 5, 2.1)
    i.disc(C, C, 1.5)


def petals(i: Icon) -> None:
    """꽃잎 다섯 — 선"""
    for x, y in i.ngon(C, C, 4.9, 5):
        i.ring(x, y, 3.4, HAIR)
    i.disc(C, C, 1.8)


def petals_solid(i: Icon) -> None:
    """꽃잎 다섯 — 면"""
    for x, y in i.ngon(C, C, 4.9, 5):
        i.disc(x, y, 3.4)
    i.disc(C, C, 2.4, ink=False)
    i.disc(C, C, 1.1)


def quad_grid(i: Icon) -> None:
    """MBTI 4분면"""
    i.rect_ring(C, C, 16, 16, radius=1.6, w=STROKE)
    i.line([(C, 4), (C, 20)], HAIR)
    i.line([(4, C), (20, C)], HAIR)


def quad_marked(i: Icon) -> None:
    """4분면 + 내 유형"""
    i.rect_ring(C, C, 16, 16, radius=1.6, w=STROKE)
    i.line([(C, 4), (C, 20)], HAIR)
    i.line([(4, C), (20, C)], HAIR)
    i.rect(15.9, 8.1, 6.2, 6.2, radius=1.0)


def spectrum(i: Icon) -> None:
    """성향 축 — 세 슬라이더"""
    for y, knob in ((7.4, 15.2), (12.0, 8.8), (16.6, 16.8)):
        i.line([(4.2, y), (19.8, y)], HAIR)
        i.disc(knob, y, 2.2)
        i.disc(knob, y, 0.9, ink=False)


def two_axis(i: Icon) -> None:
    """두 축 — 좌표 위 나"""
    i.line([(C, 3.4), (C, 20.6)], HAIR)
    i.line([(3.4, C), (20.6, C)], HAIR)
    i.ring(15.6, 8.6, 3.0, STROKE)
    i.disc(15.6, 8.6, 1.2)


def radar(i: Icon) -> None:
    """레이더 — 성향 분포"""
    i.poly_ring(i.ngon(C, C, 9.2, 5), HAIR)
    inner = [
        (C + r * math.cos(math.radians(-90 + k * 72)), C + r * math.sin(math.radians(-90 + k * 72)))
        for k, r in enumerate((7.6, 4.2, 6.6, 3.4, 5.8))
    ]
    i.poly_ring(inner, STROKE)


def bars(i: Icon) -> None:
    """성향 지표 — 막대"""
    for x, h in ((7.0, 7.0), (12.0, 12.0), (17.0, 9.0)):
        i.rect(x, 20.2 - h / 2, 3.4, h, radius=1.7)


def donut(i: Icon) -> None:
    """성향 비율 — 도넛"""
    i.ring(C, C, 8.6, 2.6)
    i.arc(C, C, 8.6, 8.6, -90, 40, 2.6, ink=False)
    i.arc(C, C, 8.6, 8.6, -86, 36, 1.3)


def person_ring(i: Icon) -> None:
    """인물 — 원 안의 나"""
    i.ring(C, C, 9.4, HAIR)
    i.ring(C, 9.4, 2.9, STROKE)
    i.arc(C, 19.4, 6.0, 5.6, 195, 345, STROKE)


def person_aura(i: Icon) -> None:
    """인물 + 기운"""
    i.ring(10.6, 10.0, 3.6, STROKE)
    i.arc(10.6, 20.6, 6.6, 6.2, 200, 340, STROKE)
    i.star(19.0, 6.0, 2.6, 1.05)
    i.disc(19.8, 11.0, 1.0)
    i.disc(4.6, 6.4, 0.85)


def two_people(i: Icon) -> None:
    """두 사람 — 관계 성향"""
    i.ring(8.0, 9.4, 3.0, STROKE)
    i.arc(8.0, 19.0, 5.2, 4.8, 200, 340, STROKE)
    i.ring(16.4, 9.4, 3.0, HAIR)
    i.arc(16.4, 19.0, 5.2, 4.8, 200, 340, HAIR)


def head_elements(i: Icon) -> None:
    """머리 + 오행 점"""
    i.face(C, 12.4, 6.4, 8.2, STROKE)
    for x, y in i.ngon(C, 12.0, 3.4, 5):
        i.disc(x, y, 1.0)


def head_taegeuk(i: Icon) -> None:
    """머리 속 태극"""
    i.face(C, 12.4, 6.6, 8.4, STROKE)
    i.taegeuk(C, 12.2, 3.5)


def fingerprint(i: Icon) -> None:
    """지문 — 고유 기질"""
    for rx, ry in ((2.4, 2.0), (4.6, 4.0), (6.8, 6.0), (9.0, 8.0)):
        i.arc(C, 13.4, rx, ry, 195, 345, HAIR)
    i.arc(C, 12.6, 3.4, 3.0, 20, 160, HAIR)
    i.arc(C, 12.0, 6.0, 5.2, 35, 145, HAIR)


def palm(i: Icon) -> None:
    """손금 — 기질 읽기"""
    i.rect_ring(C, 15.8, 11.6, 9.4, radius=3.4, w=STROKE)
    for x, top in ((8.8, 6.6), (11.6, 5.2), (14.4, 6.0), (16.8, 8.2)):
        i.line([(x, top), (x, 11.4)], STROKE)
    i.line([(6.2, 12.4), (6.2, 15.2)], STROKE)
    i.line([(8.4, 17.2), (14.4, 14.8)], HAIR)


def compass(i: Icon) -> None:
    """나침반 — 성향 방향"""
    i.ring(C, C, 9.2, STROKE)
    i.poly([(C, 4.6), (14.4, C), (C, 19.4), (9.6, C)])
    i.poly([(C, 9.0), (13.0, C), (C, 15.0), (11.0, C)], ink=False)


def balance(i: Icon) -> None:
    """저울 — 균형"""
    i.line([(4.4, 8.2), (19.6, 8.2)], STROKE)
    i.line([(C, 6.0), (C, 20.0)], STROKE)
    i.arc(6.6, 8.6, 3.4, 3.4, 15, 165, STROKE)
    i.arc(17.4, 8.6, 3.4, 3.4, 15, 165, STROKE)


def water(i: Icon) -> None:
    """수 — 물결"""
    for y in (8.6, 12.4, 16.2):
        i.line([(4.2, y), (7.8, y - 1.5), (12.0, y), (16.2, y + 1.5), (19.8, y)], STROKE)


def fire(i: Icon) -> None:
    """화 — 불꽃"""
    i.line([(C, 3.6), (15.6, 8.6), (14.2, 12.2), (17.0, 15.4), (C, 20.6),
            (7.0, 15.4), (9.8, 12.2), (8.4, 8.6)], STROKE, close=True)
    i.line([(C, 12.4), (14.0, 15.8), (C, 18.6), (10.0, 15.8)], HAIR, close=True)


def wood(i: Icon) -> None:
    """목 — 새싹"""
    i.line([(C, 20.4), (C, 10.4)], STROKE)
    i.arc(8.0, 10.6, 4.0, 4.0, 0, 130, STROKE)
    i.arc(16.0, 8.6, 4.0, 4.0, 50, 180, STROKE)


def earth(i: Icon) -> None:
    """토 — 산"""
    i.line([(3.6, 18.4), (9.4, 8.4), (13.6, 14.6), (16.2, 10.8), (20.4, 18.4)], STROKE, close=True)
    i.disc(9.4, 12.4, 1.0, ink=False)


def metal(i: Icon) -> None:
    """금 — 종"""
    i.arc(C, 13.4, 6.2, 7.4, 180, 360, STROKE, cap=False)
    i.line([(5.8, 13.4), (5.8, 16.8)], STROKE)
    i.line([(18.2, 13.4), (18.2, 16.8)], STROKE)
    i.line([(4.4, 16.8), (19.6, 16.8)], STROKE)
    i.disc(C, 19.2, 1.4)


def five_cluster(i: Icon) -> None:
    """오행 묶음"""
    i.ring(C, C, 9.6, HAIR)
    i.line([(6.6, 9.4), (8.6, 8.0), (10.6, 9.4)], HAIR)
    i.disc(15.6, 8.6, 1.5)
    i.line([(7.4, 15.4), (9.4, 14.2), (11.4, 15.4)], HAIR)
    i.ring(15.4, 15.0, 2.0, HAIR)
    i.disc(C, 12.0, 1.1)


def constellation(i: Icon) -> None:
    """별자리 — 기질 지도"""
    nodes = [(5.4, 8.0), (10.4, 5.4), (14.8, 9.6), (18.4, 6.6), (12.6, 15.2), (7.0, 18.0)]
    i.line(nodes, HAIR, cap=False)
    for x, y in nodes:
        i.disc(x, y, 1.35)


def orbit(i: Icon) -> None:
    """궤도 — 기운의 순환"""
    i.oval_ring(C, C, 9.6, 4.4, HAIR)
    i.oval_ring(C, C, 4.4, 9.6, HAIR)
    i.disc(C, C, 2.4)
    i.disc(19.4, 10.4, 1.3)


def zodiac_dial(i: Icon) -> None:
    """십이지 — 열두 기질"""
    i.ring(C, C, 9.6, HAIR)
    i.rays(C, C, 7.6, 9.6, 12, HAIR)
    i.ring(C, C, 3.2, STROKE)


def blood_drop(i: Icon) -> None:
    """혈액형 — 방울"""
    i.line([(C, 3.6), (17.0, 12.4)], STROKE)
    i.line([(C, 3.6), (7.0, 12.4)], STROKE)
    i.arc(C, 13.6, 5.4, 5.4, -35, 215, STROKE)
    i.arc(C, 14.6, 2.6, 2.6, 30, 150, HAIR)


def heart_mind(i: Icon) -> None:
    """마음 — 심장"""
    i.arc(8.8, 9.6, 4.2, 4.2, 180, 360, STROKE, cap=False)
    i.arc(15.2, 9.6, 4.2, 4.2, 180, 360, STROKE, cap=False)
    i.line([(4.6, 9.6), (C, 20.2), (19.4, 9.6)], STROKE)


def puzzle(i: Icon) -> None:
    """퍼즐 — 조합"""
    i.rect_ring(9.0, 9.0, 9.2, 9.2, radius=1.2, w=STROKE)
    i.rect_ring(15.6, 15.6, 9.2, 9.2, radius=1.2, w=STROKE)
    i.disc(13.6, 9.0, 1.9)
    i.disc(13.6, 9.0, 1.9, ink=False)
    i.ring(13.6, 9.0, 1.9, HAIR)


def mirror(i: Icon) -> None:
    """거울 — 자기이해"""
    i.ring(C, 10.0, 7.4, STROKE)
    i.arc(C, 10.0, 4.6, 4.6, 120, 240, HAIR)
    i.line([(C, 17.6), (C, 20.8)], STROKE)
    i.line([(9.4, 20.8), (14.6, 20.8)], STROKE)


def prism(i: Icon) -> None:
    """프리즘 — 성향 분광"""
    i.line([(C, 5.2), (19.0, 18.0), (5.0, 18.0)], STROKE, close=True)
    i.line([(2.6, 11.6), (10.2, 11.6)], HAIR)
    for y in (9.8, 12.4, 15.0):
        i.line([(15.4, y), (21.4, y)], HAIR)


def rainbow(i: Icon) -> None:
    """세 겹 아크 — 결"""
    for r in (4.4, 6.6, 8.8):
        i.arc(C, 16.0, r, r, 180, 360, STROKE)


def spiral(i: Icon) -> None:
    """나선 — 기질의 흐름"""
    pts = []
    for step in range(46):
        a = math.radians(step * 22)
        r = 1.2 + step * 0.19
        pts.append((C + r * math.cos(a), C + r * math.sin(a)))
    i.line(pts, HAIR, cap=False)
    i.disc(*pts[-1], 1.2)


def hexagon(i: Icon) -> None:
    """육각 — 안정된 기질"""
    i.poly_ring(i.ngon(C, C, 9.2, 6, rot=-90), STROKE)
    i.poly_ring(i.ngon(C, C, 4.6, 6, rot=-90), HAIR)


def venn2(i: Icon) -> None:
    """두 원 — 관계 성향"""
    i.ring(9.0, C, 6.6, STROKE)
    i.ring(15.0, C, 6.6, STROKE)


def venn3(i: Icon) -> None:
    """세 원 — 삼중 기질"""
    i.ring(C, 9.0, 5.6, HAIR)
    i.ring(8.8, 15.0, 5.6, HAIR)
    i.ring(15.2, 15.0, 5.6, HAIR)


def matrix_dots(i: Icon) -> None:
    """도트 매트릭스 — 유형 분포"""
    for row in range(4):
        for col in range(4):
            x = 6.0 + col * 4.0
            y = 6.0 + row * 4.0
            solid = (row + col) % 3 == 0
            i.disc(x, y, 1.5) if solid else i.ring(x, y, 1.4, HAIR)


def seal_taegeuk(i: Icon) -> None:
    """인장 속 태극"""
    i.rect_ring(C, C, 18.4, 18.4, radius=1.6, w=STROKE)
    i.taegeuk(C, C, 5.8)


def sun_moon(i: Icon) -> None:
    """해와 달 — 양면"""
    i.arc(C, C, 8.6, 8.6, 100, 260, STROKE)
    i.disc(14.2, C, 4.4)
    i.rays(14.2, C, 5.8, 8.4, 5, HAIR, rot=-60)


CANDIDATES = [
    ("태극", taegeuk),
    ("태극테", taegeuk_ring),
    ("태극선", taegeuk_line),
    ("오행환", ohaeng_wheel),
    ("오행상극", ohaeng_star),
    ("오행바퀴", ohaeng_hub),
    ("오각형", pent_line),
    ("오각별선", star_line),
    ("오각별면", star_solid),
    ("다섯점", five_dots),
    ("꽃잎선", petals),
    ("꽃잎면", petals_solid),
    ("4분면", quad_grid),
    ("유형표시", quad_marked),
    ("스펙트럼", spectrum),
    ("두축", two_axis),
    ("레이더", radar),
    ("지표막대", bars),
    ("도넛", donut),
    ("원안의나", person_ring),
    ("인물기운", person_aura),
    ("두사람", two_people),
    ("머리오행", head_elements),
    ("머리태극", head_taegeuk),
    ("지문", fingerprint),
    ("손금", palm),
    ("나침반", compass),
    ("저울", balance),
    ("수·물결", water),
    ("화·불꽃", fire),
    ("목·새싹", wood),
    ("토·산", earth),
    ("금·종", metal),
    ("오행묶음", five_cluster),
    ("별자리", constellation),
    ("궤도", orbit),
    ("십이지", zodiac_dial),
    ("혈액방울", blood_drop),
    ("마음", heart_mind),
    ("퍼즐", puzzle),
    ("거울", mirror),
    ("프리즘", prism),
    ("세겹아크", rainbow),
    ("나선", spiral),
    ("육각", hexagon),
    ("두원", venn2),
    ("세원", venn3),
    ("도트매트릭스", matrix_dots),
    ("인장태극", seal_taegeuk),
    ("해와달", sun_moon),
]
