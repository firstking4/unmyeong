"""관상 탭 아이콘 후보 50 — 얼굴·이목구비·삼정·관찰 계열."""

from __future__ import annotations

import math

from icon_kit import HAIR, STROKE, Icon

C = 12.0


def face_outline(i: Icon) -> None:
    """얼굴 윤곽"""
    i.face(C, C, 7.2, 9.0, STROKE)


def face_features(i: Icon) -> None:
    """얼굴 + 이목구비"""
    i.face(C, C, 7.2, 9.0, STROKE)
    i.disc(9.6, 11.0, 0.85)
    i.disc(14.4, 11.0, 0.85)
    i.line([(C, 12.6), (C, 15.0)], HAIR)
    i.arc(C, 15.4, 2.6, 2.2, 20, 160, HAIR)


def face_brows(i: Icon) -> None:
    """얼굴 + 눈썹"""
    i.face(C, C, 7.2, 9.0, STROKE)
    i.line([(8.0, 8.8), (11.0, 8.2)], HAIR)
    i.line([(13.0, 8.2), (16.0, 8.8)], HAIR)
    i.disc(9.6, 11.0, 0.9)
    i.disc(14.4, 11.0, 0.9)


def face_three(i: Icon) -> None:
    """삼정 — 세 단"""
    i.face(C, C, 7.2, 9.0, STROKE)
    i.line([(6.6, 8.8), (17.4, 8.8)], HAIR)
    i.line([(6.8, 14.4), (17.2, 14.4)], HAIR)


def face_grid(i: Icon) -> None:
    """측정 격자"""
    i.face(C, C, 7.2, 9.0, STROKE)
    i.line([(C, 3.2), (C, 21.0)], HAIR)
    i.line([(5.6, 9.4), (18.4, 9.4)], HAIR)
    i.line([(5.4, 15.0), (18.6, 15.0)], HAIR)


def face_twelve(i: Icon) -> None:
    """십이궁 — 자리 점"""
    i.face(C, C, 7.0, 8.8, STROKE)
    for x, y in ((C, 6.4), (9.2, 8.6), (14.8, 8.6), (9.4, 11.6), (14.6, 11.6),
                 (C, 13.6), (9.6, 16.2), (14.4, 16.2), (C, 18.2)):
        i.disc(x, y, 0.7)


def face_profile(i: Icon) -> None:
    """옆얼굴 — 선"""
    i.line([(15.0, 3.8), (9.0, 5.6), (6.6, 10.4), (8.2, 12.6), (6.8, 14.2),
            (8.6, 15.4), (8.0, 18.2), (11.0, 20.4), (16.4, 20.4)], STROKE)
    i.disc(10.6, 10.0, 0.85)


def face_profile_solid(i: Icon) -> None:
    """옆얼굴 — 면"""
    i.poly([(15.4, 3.6), (9.2, 5.4), (6.4, 10.6), (8.4, 12.8), (6.8, 14.4),
            (8.8, 15.6), (8.0, 18.4), (11.2, 20.6), (17.0, 20.6), (17.0, 3.6)])
    i.disc(11.0, 10.0, 1.0, ink=False)


def two_profiles(i: Icon) -> None:
    """마주 본 두 얼굴"""
    for sign in (-1, 1):
        i.line([(C + sign * 1.4, 4.6), (C + sign * 5.4, 8.0), (C + sign * 3.4, 12.2),
                (C + sign * 5.8, 15.6), (C + sign * 2.8, 19.6)], STROKE)


def face_scan(i: Icon) -> None:
    """스캔 프레임"""
    for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        x = C + sx * 8.8
        y = C + sy * 8.8
        i.line([(x - sx * 4.0, y), (x, y), (x, y - sy * 4.0)], STROKE)
    i.face(C, 12.4, 4.6, 5.8, HAIR)


def face_scanline(i: Icon) -> None:
    """스캔 라인"""
    i.face(C, C, 7.0, 8.8, STROKE)
    i.line([(3.4, 12.4), (20.6, 12.4)], HAIR)
    i.disc(20.0, 12.4, 1.1)


def face_focus(i: Icon) -> None:
    """조준 — 관찰"""
    i.ring(C, C, 9.4, HAIR)
    i.face(C, 12.4, 4.8, 6.0, STROKE)
    i.line([(C, 1.8), (C, 4.2)], HAIR)
    i.line([(C, 19.8), (C, 22.2)], HAIR)


def eye_solid(i: Icon) -> None:
    """눈 — 면"""
    i.oval(C, C, 8.6, 4.2)
    i.oval(C, C, 6.6, 2.9, ink=False)
    i.disc(C, C, 2.4)


def eye_line(i: Icon) -> None:
    """눈 — 선"""
    i.eye(C, C, 8.6, 4.4, STROKE, pupil=2.2)


def eye_wide(i: Icon) -> None:
    """큰 눈"""
    i.eye(C, C, 9.2, 5.6, STROKE, pupil=3.0)


def eye_narrow(i: Icon) -> None:
    """가는 눈"""
    i.arc(C, C, 9.0, 3.0, 200, 340, STROKE)
    i.arc(C, C, 9.0, 3.0, 20, 160, STROKE)
    i.disc(C, C, 1.5)


def eye_brow(i: Icon) -> None:
    """눈썹과 눈"""
    i.arc(C, 12.6, 7.6, 3.6, 200, 340, STROKE)
    i.arc(C, 12.6, 7.6, 3.6, 20, 160, STROKE)
    i.disc(C, 12.6, 2.0)
    i.arc(C, 9.6, 7.4, 4.0, 200, 340, HAIR)


def eyes_pair(i: Icon) -> None:
    """양쪽 눈"""
    for cx in (7.4, 16.6):
        i.eye(cx, C, 4.4, 2.8, HAIR, pupil=1.4)


def eyes_brows(i: Icon) -> None:
    """두 눈과 눈썹"""
    for cx in (7.4, 16.6):
        i.eye(cx, 13.4, 4.4, 2.8, HAIR, pupil=1.4)
        i.arc(cx, 10.6, 4.2, 2.6, 200, 340, HAIR)


def iris(i: Icon) -> None:
    """눈동자 클로즈업"""
    i.ring(C, C, 9.2, STROKE)
    i.ring(C, C, 4.6, HAIR)
    i.disc(C, C, 2.4)
    i.disc(10.4, 10.4, 0.8, ink=False)


def third_eye(i: Icon) -> None:
    """제3의 눈"""
    i.face(C, 13.0, 6.6, 8.0, STROKE)
    i.eye(C, 8.6, 3.4, 2.0, HAIR, pupil=0.9)
    i.disc(9.8, 13.4, 0.75)
    i.disc(14.2, 13.4, 0.75)


def nose(i: Icon) -> None:
    """코 — 재물궁"""
    i.line([(C, 5.6), (C, 12.6)], STROKE)
    i.arc(C, 13.6, 4.4, 4.0, 190, 350, STROKE)
    i.disc(9.2, 16.6, 1.05)
    i.disc(14.8, 16.6, 1.05)


def nose_bridge(i: Icon) -> None:
    """코 중심 얼굴"""
    i.face(C, C, 7.2, 9.0, HAIR)
    i.line([(C, 8.6), (C, 13.2)], STROKE)
    i.arc(C, 14.2, 3.0, 2.8, 200, 340, STROKE)


def mouth(i: Icon) -> None:
    """입 — 언변"""
    i.arc(C, 11.4, 7.6, 4.4, 20, 160, STROKE)
    i.arc(C, 14.0, 7.6, 4.4, 200, 340, STROKE)
    i.line([(4.4, 12.6), (19.6, 12.6)], HAIR)


def smile(i: Icon) -> None:
    """미소 — 복상"""
    i.ring(C, C, 9.2, HAIR)
    i.arc(C, 11.6, 5.0, 4.6, 20, 160, STROKE)
    i.disc(9.0, 9.4, 0.9)
    i.disc(15.0, 9.4, 0.9)


def ear(i: Icon) -> None:
    """귀 — 복덕"""
    i.arc(13.2, 11.6, 5.8, 8.0, 60, 300, STROKE)
    i.arc(13.8, 11.0, 2.8, 4.2, 70, 290, HAIR)
    i.line([(12.6, 19.2), (15.2, 20.0)], STROKE)


def forehead(i: Icon) -> None:
    """이마 — 상정"""
    i.face(C, C, 7.2, 9.0, STROKE)
    i.arc(C, 9.6, 6.2, 5.0, 190, 350, HAIR)
    i.line([(6.6, 8.4), (17.4, 8.4)], HAIR)


def chin(i: Icon) -> None:
    """턱 — 하정"""
    i.face(C, C, 7.2, 9.0, STROKE)
    i.arc(C, 16.4, 4.6, 4.2, 20, 160, STROKE)


def jawline(i: Icon) -> None:
    """턱선"""
    i.line([(5.6, 5.6), (5.6, 11.8), (7.8, 17.0), (C, 19.8), (16.2, 17.0),
            (18.4, 11.8), (18.4, 5.6)], STROKE)
    i.disc(9.4, 10.0, 0.9)
    i.disc(14.6, 10.0, 0.9)


def cheek(i: Icon) -> None:
    """광대 — 권세"""
    i.face(C, C, 7.2, 9.0, STROKE)
    i.arc(8.4, 13.0, 2.4, 2.0, 160, 20, HAIR)
    i.arc(15.6, 13.0, 2.4, 2.0, 160, 20, HAIR)


def face_round(i: Icon) -> None:
    """둥근 얼굴형"""
    i.ring(C, C, 8.6, STROKE)
    i.disc(9.2, 10.6, 0.85)
    i.disc(14.8, 10.6, 0.85)
    i.arc(C, 14.0, 3.4, 2.8, 20, 160, HAIR)


def face_square(i: Icon) -> None:
    """각진 얼굴형"""
    i.rect_ring(C, C, 15.0, 17.0, radius=3.4, w=STROKE)
    i.disc(9.4, 10.6, 0.85)
    i.disc(14.6, 10.6, 0.85)
    i.line([(9.6, 15.4), (14.4, 15.4)], HAIR)


def face_heart(i: Icon) -> None:
    """하트형 얼굴"""
    i.arc(9.2, 9.2, 4.6, 4.6, 180, 360, STROKE, cap=False)
    i.arc(14.8, 9.2, 4.6, 4.6, 180, 360, STROKE, cap=False)
    i.line([(4.6, 9.2), (6.2, 14.6), (C, 20.2), (17.8, 14.6), (19.4, 9.2)], STROKE)


def face_long(i: Icon) -> None:
    """긴 얼굴형"""
    i.face(C, C, 5.8, 9.6, STROKE)
    i.disc(10.0, 10.6, 0.8)
    i.disc(14.0, 10.6, 0.8)


def five_features(i: Icon) -> None:
    """오관 — 눈·코·입"""
    i.face(C, C, 7.2, 9.0, HAIR)
    i.eye(9.4, 10.8, 2.3, 1.5, 1.1, pupil=0.62)
    i.eye(14.6, 10.8, 2.3, 1.5, 1.1, pupil=0.62)
    i.line([(C, 12.4), (C, 14.6)], HAIR)
    i.arc(C, 15.6, 2.6, 2.2, 20, 160, HAIR)


def mirror_face(i: Icon) -> None:
    """거울 속 얼굴"""
    i.ring(C, 10.4, 7.6, STROKE)
    i.face(C, 10.8, 4.0, 5.0, HAIR)
    i.line([(C, 18.0), (C, 20.8)], STROKE)
    i.line([(9.0, 20.8), (15.0, 20.8)], STROKE)


def magnifier_face(i: Icon) -> None:
    """돋보기 — 살핌"""
    i.ring(10.4, 10.4, 7.0, STROKE)
    i.face(10.4, 10.6, 3.6, 4.6, HAIR)
    i.line([(15.6, 15.6), (20.6, 20.6)], STROKE)


def magnifier_eye(i: Icon) -> None:
    """돋보기 + 눈"""
    i.ring(10.4, 10.4, 7.0, STROKE)
    i.eye(10.4, 10.4, 4.4, 2.6, HAIR, pupil=1.2)
    i.line([(15.6, 15.6), (20.6, 20.6)], STROKE)


def face_seal(i: Icon) -> None:
    """관상 도장 — 사각 테"""
    i.rect_ring(C, C, 18.4, 18.4, radius=1.6, w=2.0)
    i.face(C, 12.4, 4.6, 5.8, HAIR)


def portrait_frame(i: Icon) -> None:
    """증명사진 틀"""
    i.rect_ring(C, C, 15.4, 18.0, radius=1.6, w=STROKE)
    i.ring(C, 10.0, 3.0, HAIR)
    i.arc(C, 19.6, 5.4, 5.0, 200, 340, HAIR)


def portrait_card(i: Icon) -> None:
    """인물 카드"""
    i.rect_ring(C, C, 18.0, 14.0, radius=1.6, w=STROKE)
    i.ring(8.4, 10.6, 2.6, HAIR)
    i.arc(8.4, 17.4, 4.2, 4.0, 200, 340, HAIR)
    i.line([(14.0, 10.4), (19.0, 10.4)], HAIR)
    i.line([(14.0, 13.6), (19.0, 13.6)], HAIR)


def face_dots(i: Icon) -> None:
    """특징점 — 랜드마크"""
    i.face(C, C, 7.0, 8.8, HAIR)
    for x, y in ((9.2, 9.8), (14.8, 9.8), (C, 13.2), (9.6, 16.4), (14.4, 16.4), (C, 18.4)):
        i.disc(x, y, 1.0)
    i.line([(9.2, 9.8), (C, 13.2), (14.8, 9.8)], HAIR, cap=False)


def face_mesh(i: Icon) -> None:
    """얼굴 메시"""
    i.face(C, C, 7.0, 8.8, STROKE)
    i.line([(6.4, 10.6), (17.6, 10.6)], HAIR)
    i.line([(7.0, 14.6), (17.0, 14.6)], HAIR)
    i.line([(9.6, 4.6), (9.6, 19.4)], HAIR)
    i.line([(14.4, 4.6), (14.4, 19.4)], HAIR)


def face_compass(i: Icon) -> None:
    """관상 방위"""
    i.ring(C, C, 9.4, HAIR)
    i.face(C, 12.4, 4.4, 5.6, STROKE)
    i.rays(C, C, 9.4, 10.8, 4, HAIR, rot=-90)


def face_balance(i: Icon) -> None:
    """좌우 균형"""
    i.face(C, C, 7.2, 9.0, STROKE)
    i.line([(C, 3.0), (C, 21.0)], HAIR)
    i.disc(9.2, 11.0, 0.9)
    i.ring(14.8, 11.0, 1.1, HAIR)


def face_half(i: Icon) -> None:
    """반쪽 얼굴"""
    i.arc(C, C - 1.4, 7.2, 7.6, 180, 270, STROKE)
    i.line([(4.8, 10.6), (5.6, 15.0), (C, 20.6)], STROKE)
    i.line([(C, 3.0), (C, 20.6)], HAIR)
    i.disc(8.8, 11.4, 0.9)


def hair_top(i: Icon) -> None:
    """머리결 — 발제"""
    i.face(C, 12.6, 7.0, 8.6, STROKE)
    i.arc(C, 9.4, 6.6, 5.2, 190, 350, STROKE)
    i.line([(7.6, 7.2), (9.0, 5.0)], HAIR)
    i.line([(C, 6.4), (C, 4.2)], HAIR)
    i.line([(16.4, 7.2), (15.0, 5.0)], HAIR)


def wrinkle(i: Icon) -> None:
    """주름 — 세월"""
    i.face(C, C, 7.2, 9.0, STROKE)
    for y in (7.6, 9.2):
        i.arc(C, y + 2.2, 4.6, 2.6, 200, 340, HAIR)
    i.disc(9.6, 13.4, 0.8)
    i.disc(14.4, 13.4, 0.8)


def face_stamp(i: Icon) -> None:
    """얼굴 + 인장 — 관상 기록"""
    i.face(10.2, 11.6, 6.0, 7.8, STROKE)
    i.rect_ring(17.8, 18.0, 7.2, 7.2, radius=0.8, w=HAIR)
    i.disc(17.8, 18.0, 1.5)


def face_check(i: Icon) -> None:
    """관상 판독 완료"""
    i.face(10.4, 11.2, 6.2, 7.8, STROKE)
    i.ring(17.2, 17.4, 4.4, HAIR)
    i.line([(15.2, 17.4), (16.8, 19.2), (19.4, 15.4)], STROKE)


def face_question(i: Icon) -> None:
    """관상 풀이"""
    i.face(10.4, 12.0, 6.2, 8.0, STROKE)
    i.arc(18.2, 7.6, 2.4, 2.4, 150, 380, HAIR)
    i.line([(18.2, 10.0), (18.2, 11.4)], HAIR)
    i.disc(18.2, 13.4, 0.85)


CANDIDATES = [
    ("얼굴윤곽", face_outline),
    ("이목구비", face_features),
    ("얼굴눈썹", face_brows),
    ("삼정", face_three),
    ("측정격자", face_grid),
    ("십이궁", face_twelve),
    ("옆얼굴선", face_profile),
    ("옆얼굴면", face_profile_solid),
    ("두얼굴", two_profiles),
    ("스캔틀", face_scan),
    ("스캔라인", face_scanline),
    ("관찰조준", face_focus),
    ("눈·면", eye_solid),
    ("눈·선", eye_line),
    ("큰눈", eye_wide),
    ("가는눈", eye_narrow),
    ("눈썹눈", eye_brow),
    ("두눈", eyes_pair),
    ("두눈썹눈", eyes_brows),
    ("눈동자", iris),
    ("제3의눈", third_eye),
    ("코", nose),
    ("코중심얼굴", nose_bridge),
    ("입", mouth),
    ("미소", smile),
    ("귀", ear),
    ("이마", forehead),
    ("턱", chin),
    ("턱선", jawline),
    ("광대", cheek),
    ("둥근형", face_round),
    ("각진형", face_square),
    ("하트형", face_heart),
    ("긴형", face_long),
    ("오관", five_features),
    ("거울얼굴", mirror_face),
    ("돋보기얼굴", magnifier_face),
    ("돋보기눈", magnifier_eye),
    ("관상도장", face_seal),
    ("증명틀", portrait_frame),
    ("인물카드", portrait_card),
    ("특징점", face_dots),
    ("얼굴메시", face_mesh),
    ("관상방위", face_compass),
    ("좌우균형", face_balance),
    ("반쪽", face_half),
    ("발제", hair_top),
    ("주름", wrinkle),
    ("인장기록", face_stamp),
    ("판독완료", face_check),
]
