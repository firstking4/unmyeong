#!/usr/bin/env python3
"""Generate the fortune score ring — 붓으로 한 획에 돌린 먹 원 한 장.

리서치 시안(`docs/design-samples/ui-concept-editorial-home.png`)의 링은 **획이 두 개가
아니다.** 12시에서 시계 방향으로 한 번 돌린 원 하나이고, 점수는 그 획의 **색이 12시부터
시계 방향으로 검정 → 주홍으로 바뀌는** 것이다. 주홍 획을 먹 위에 따로 얹으면 겹친
자리가 탁해지고 두 줄로 보인다 — 그렇게 만들어 봤고 시안과 달랐다.

그래서 이 스크립트는 획 한 장만 굽는다. 색 경계는 앱에서 나눈다(`BrushScoreRing`이
이 그림을 SVG 마스크로 쓰고 부채꼴로 두 색을 칠한다). 덕분에 점수 단계도 필요 없고
(옛 21장 방식), 색이 코드에 있으니 다크 모드에서도 원이 살아 있다.

그림은 **알파만 담은 흰 PNG**다. 색을 구워 넣으면 마스크로 쓸 수 없다.

획은 **극좌표(각도×반지름)에서** 그린다. 원을 따라 원판을 찍어 만들면 테두리가
조약돌처럼 되고 갈필 결이 획을 가로질러 밧줄처럼 보인다. 극좌표에서는 획이 가로 띠라
두께를 각도에 따라 매끄럽게 흔들 수 있고, 결을 각도 방향으로 길게 늘일 수 있다.
다 그린 뒤 원형으로 되돌린다.
"""

from __future__ import annotations

import json
import math
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "images" / "ink"

# 표시 크기는 118pt. @1x/@2x/@3x로 굽는다.
SIZE = 118
SIZES = {"": SIZE, "@2x": SIZE * 2, "@3x": SIZE * 3}
CANVAS = SIZE * 6

# 시안 실측(바깥 반지름 113px 기준, 색 보정 후). 12시에서 시계 방향으로 한 바퀴 도는
# 동안의 두께/알파 — 바깥 반지름은 0.99~1.00으로 거의 고정이다.
#
#   회전  0.00  0.10  0.20  0.25  0.35  0.45  0.55  0.70  0.85  0.95
#   두께   21%   11%    8%    7%   15%   10%   19%   23%   24%   26%
#   알파  0.94  0.75  0.67  0.64  0.72  0.90  0.94  0.94  0.97  0.99
#
# 대고(0.94) → 힘이 빠지고(0.64, 2~4시) → 다시 실려 가장 세게 마무리(0.99)한다.
# 알파가 0.45에서 이미 0.90인데 두께는 0.55부터 붙는다 — 힘이 먼저, 살이 나중이다.
# 예전 값(두께 43% 고정)은 획이 아니라 두꺼운 도넛으로 보였다.
#
# 다만 **두께 차이는 실측보다 줄여 쓴다.** 7% ↔ 26%까지 벌리면 굵은 도넛에 실을 붙인 꼴이
# 되고 획의 흐름이 두께에 먹힌다. 강약은 농도에 맡기고 두께는 거드는 정도만 변한다.
INK_OUTER = 0.452
THICK_START = INK_OUTER * 0.145
THICK_WAIST = INK_OUTER * 0.115
THICK_END = INK_OUTER * 0.180

# 극좌표 격자에서 다루는 반지름 범위. 0.5가 캔버스 끝이다.
R_LO, R_HI = 0.22, 0.50

ANGULAR = 2880  # 0.125°
RADIAL = 520

SEED = 20260815


@dataclass(frozen=True)
class Brush:
    """한 획의 성격.

    두께는 **바깥 윤곽에서 안쪽으로** 자란다. 시안을 재 보면 바깥 반지름은 110~115px로
    거의 일정한데 안쪽 경계가 84~102px로 출렁인다 — 붓을 눌러 획이 굵어질 때 종이 위
    궤적(바깥)은 그대로고 살이 안으로 붙는 것이다. 중심선을 고정하고 양쪽으로 키우면
    두꺼운 구간이 원 밖으로 튀어나와 궤도가 흔들려 보인다.
    """

    outer: float  # 획의 바깥 윤곽 반지름
    # 힘의 세 지점: 대는 자리 · 힘이 빠진 허리 · 눌러 마무리하는 끝.
    thick_start: float
    thick_waist: float
    thick_end: float
    dens_start: float
    dens_waist: float
    dens_end: float
    waist: float  # 힘이 가장 빠지는 진행도(0~1)
    seed: int
    start: float  # 붓을 대는 자리(12시부터 시계 방향 비율)
    dryness: float  # 갈필이 얼마나 많이 비는지
    dry_weak: float  # 힘이 빠진 구간의 갈필 배수 — 먹이 마르면서 결이 굵어진다
    ccw: bool = False  # 반시계 방향으로 도는지
    slant: float = 0.0  # 획 끝면의 기울기(회전 비율 단위)
    cap: float = 1.0  # 둥근 마무리의 반지름(끝 두께의 절반 기준)


def smoothstep(x: np.ndarray | float) -> np.ndarray:
    t = np.clip(x, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def noise(shape: tuple[int, int], cells: tuple[int, int], seed: int) -> np.ndarray:
    """주기 노이즈. 각도 축은 순환하므로 양 끝이 이어져야 한다(안 그러면 이음매가 보인다)."""
    rng = np.random.default_rng(seed)
    cy, cx = cells
    grid = rng.random((cy, cx + 1))
    grid[:, -1] = grid[:, 0]
    src = Image.fromarray((grid * 255).astype(np.uint8)).resize(
        (shape[1], shape[0]), Image.BICUBIC
    )
    return np.asarray(src, dtype=np.float32) / 255.0


BRISTLES = 72  # 붓털 좌표계의 해상도


def bristles(seed: int, frac: np.ndarray) -> np.ndarray:
    """획 두께를 가로지르는 위치 `frac`(0~1)에서 붓털 결 값을 읽는다.

    털 방향(각도)으로만 이어지고 털을 가로지르는 방향으로는 보간하지 않는다 —
    반지름 방향까지 부드럽게 이으면 결이 뭉개져 회색 얼룩이 된다.
    """
    # 털 개수는 열 남짓이다. 행마다 독립으로 두면 골판지 같은 규칙적인 줄무늬가 된다.
    field = noise((BRISTLES, ANGULAR), (14, 30), seed)
    rows = np.clip((frac * (BRISTLES - 1) + 0.5).astype(np.int32), 0, BRISTLES - 1)
    cols = np.broadcast_to(np.arange(ANGULAR, dtype=np.int32), rows.shape)
    return field[rows, cols]


def stroke(brush: Brush, sweep: float) -> np.ndarray:
    """붓이 `sweep` 바퀴만큼 지나간 자국. 반환값은 0~1 알파.

    **마무리가 시작을 덮는다** — 두 끝을 이어 붙이는 디자인이 아니다. 딱 한 바퀴를 돌면
    붓을 뗀 자리가 댄 자리로 되돌아오고, 둥근 마무리가 시작의 단면을 제 원 안에 품는다.
    """
    if sweep <= 0.0:
        return np.zeros((RADIAL, ANGULAR), dtype=np.float32)

    # 붓이 대어진 자리를 0으로 놓고 도는 진행도. 그림은 나중에 회전시키지 않고
    # 여기서 각도를 밀어 둔다(회전 리샘플이 획을 흐린다).
    span = np.linspace(0.0, 1.0, ANGULAR, endpoint=False, dtype=np.float32)
    direction = -1.0 if brush.ccw else 1.0
    r = np.linspace(R_LO, R_HI, RADIAL, dtype=np.float32)[:, None]
    # 붓을 대는 면은 획과 직각이 아니라 조금 기울어져 있다.
    across = (brush.outer - r) / max(brush.thick_end, 1e-6) - 0.5
    t = ((span[None, :] - brush.start) * direction + across * brush.slant) % 1.0

    laid = _trace(brush, sweep, t, r)
    # 한 바퀴를 넘어간 부분. 여기가 둥근 마무리다 — 어디서 끊을지는 `_trace`의 원이
    # 정하므로 각도로 잘라 두지 않는다. 겹치는 자리는 먹이 더 얹히니 진한 쪽을 남긴다.
    over = _trace(brush, sweep, t + 1.0, r)
    return np.maximum(laid, over).astype(np.float32)


def _trace(brush: Brush, sweep: float, t: np.ndarray, r: np.ndarray) -> np.ndarray:
    """진행도 `t`(바퀴 단위)에서의 획 알파. 끝을 지난 자리는 둥근 마무리가 된다."""
    u = np.clip(t / max(sweep, 1e-6), 0.0, 1.0)
    past = t - sweep  # 붓을 뗀 자리를 지난 거리(회전 단위). 여기가 둥근 마무리다.

    # 획의 강약. 대고 나서 힘이 빠지다가(허리) 다시 실려 가장 세게 마무리한다.
    #
    # **강약의 주인공은 두께가 아니라 농도다.** 두께로만 강약을 주면 굵은 도넛과 얇은 실이
    # 붙은 모양이 되고, 반대로 농도만 주면 힘없이 흐린 원이 된다. 시안을 재 보면 농도가
    # 0.62 → 1.00으로 크게 변하는데(두께는 8% → 26%) 눈에 먼저 들어오는 건 농도다.
    # 게다가 **농도가 두께보다 먼저 회복된다** — 붓에 힘이 실리는 게 먼저고 획이 퍼지는 건
    # 그다음이다. 같은 곡선을 쓰면 이 시차가 사라져 획이 기계처럼 균질해진다.
    to_waist = smoothstep(u / brush.waist)
    after = np.clip((u - brush.waist) / (1.0 - brush.waist), 0.0, 1.0)
    thick = np.where(
        u < brush.waist,
        brush.thick_start + (brush.thick_waist - brush.thick_start) * to_waist,
        brush.thick_waist + (brush.thick_end - brush.thick_waist) * smoothstep(after),
    )
    press = np.where(
        u < brush.waist,
        brush.dens_start + (brush.dens_waist - brush.dens_start) * to_waist,
        brush.dens_waist + (brush.dens_end - brush.dens_waist) * (1.0 - (1.0 - after) ** 3),
    )
    # 갈필·농도에 쓰는 정규화된 세기. 허리에서 0, 가장 센 자리에서 1.
    top = max(brush.dens_start, brush.dens_end)
    strength = np.clip((press - brush.dens_waist) / max(top - brush.dens_waist, 1e-6), 0.0, 1.0)

    thick = thick * (0.92 + 0.16 * noise((1, ANGULAR), (1, 19), brush.seed + 23))
    # 누르는 힘이 국소로 변한다 — 매끄러운 한 옥타브만 쓰면 기계로 그린 테이퍼가 된다.
    thick = thick * (0.96 + 0.08 * noise((1, ANGULAR), (1, 61), brush.seed + 29))

    # 바깥 윤곽만 아주 살짝 떤다. 손으로 그은 궤도라 완벽한 원은 아니지만, 크게 흔들면
    # 획이 원에서 벗어나 지렁이가 된다.
    outer = brush.outer + (noise((1, ANGULAR), (1, 5), brush.seed + 11) - 0.5) * 0.008
    # 윤곽의 잔결. 저주파로만 흔들면 매끈한 곡선이라 마커로 보인다 — 종이 결에 걸린
    # 2~3px 단위의 톱니가 있어야 붓으로 읽힌다.
    outer = outer + (noise((1, ANGULAR), (1, 130), brush.seed + 13) - 0.5) * thick * 0.05
    # 대는 자리만 바깥 윤곽에서 살짝 들여놓는다. 나머지 구간처럼 바깥에 딱 붙이면 시작이
    # 둥근 마무리와 바깥 선을 공유해서, 마무리의 둥근 윤곽이 시작 획에 메워져 안 보인다.
    # 안으로 밀어 두면 시작이 마무리 원의 **가운데**에서 빠져나온다.
    tuck = (brush.thick_end - brush.thick_start) * 0.5
    outer = outer - tuck * np.exp(-((u / 0.035) ** 2))
    inner = outer - thick
    # 안쪽 경계는 먹이 번져 나간 자리라 바깥보다 완만하다. 여기에 잔주름을 많이 주면
    # 두꺼운 구간의 안쪽이 물결처럼 출렁여 획이 아니라 골판지로 보인다.
    inner = inner + (noise((1, ANGULAR), (1, 55), brush.seed + 17) - 0.5) * thick * 0.05

    # 몸통. 바깥은 종이에 닿은 궤적이라 또렷하고, 안쪽은 먹이 번져 조금 부드럽다.
    # 감쇠를 넓게 주면 솜뭉치가 된다 — 시안은 경계가 날카롭고 결로만 갈라진다.
    body = smoothstep((outer - r) / (thick * 0.05)) * smoothstep((r - inner) / (thick * 0.13))

    frac = np.clip((r - inner) / np.maximum(thick, 1e-6), 0.0, 1.0)

    # 갈필 — **붓털 좌표계**에서 만든다. 화면 반지름을 기준으로 노이즈를 깔면 획이
    # 굵어질 때 결이 같이 늘어나지 않아 얼룩처럼 보인다. 붓털은 개수가 정해져 있고
    # 획이 넓어지면 그 사이가 벌어질 뿐이라, 두께로 정규화한 좌표에서 결을 그어야
    # 시안처럼 획을 여러 갈래로 가르는 흰 줄이 나온다.
    dry = np.clip((bristles(brush.seed + 31, frac) - 0.40) / 0.12, 0.0, 1.0)
    # 힘이 빠진 구간이 마른다. 기준은 진행도가 아니라 **세기**다 — 눌러 먹이 실린 구간은
    # 촘촘하고, 힘이 빠진 허리에서 결이 벌어진다.
    dryness = brush.dryness * (1.0 + (brush.dry_weak - 1.0) * (1.0 - strength))
    # 붓에 남은 먹의 기복. 이걸 안 곱하면 결이 획 전체를 한 줄로 관통해 빗살처럼 보인다.
    supply = noise((1, ANGULAR), (1, 13), brush.seed + 41)
    dryness = dryness * (0.40 + 1.2 * (1.0 - supply))
    # 결은 **획의 심을 비켜 간다.** 심까지 갈라 놓으면 먹이 마른 리본 다발이 되어
    # 시안의 묵직한 검정이 사라진다(농도가 회색으로 주저앉는다).
    dryness = dryness * np.clip(np.abs(frac - 0.42) / 0.34, 0.18, 1.0)

    # 붓털은 **바깥으로** 갈라진다. 안쪽까지 같이 갈라 놓으면 획이 여러 줄로 보인다.
    # 세게 눌린 구간은 먹이 넉넉해 윤곽이 또렷하다 — 여기까지 갉으면 획 전체가 부스스해져
    # 시안의 단단한 검정이 사라진다. 그래서 갉는 양을 세기에 반비례로 준다.
    fringe = noise((RADIAL, ANGULAR), (30, 150), brush.seed + 37)
    rim = smoothstep((frac - 0.84) / 0.16) * (0.30 + 0.70 * (1.0 - strength))
    body = body * np.clip(1.0 - rim * (1.0 - fringe) * 1.1, 0.0, 1.0)

    pool = 0.975 + 0.025 * noise((RADIAL, ANGULAR), (6, 8), brush.seed + 47)
    grain = 0.93 + 0.07 * noise((RADIAL, ANGULAR), (200, 430), brush.seed + 59)

    # 갈필의 **폭**도 세기에 따라 달라야 한다. 깊이만 줄이면 세게 눌린 구간까지 결이 온
    # 폭으로 남아 회색 골판지가 된다 — 시안의 마무리는 흰 틈 몇 줄만 남은 통 검정이다.
    # 지수를 세기로 키우면 가장 깊은 틈만 살아남는다.
    gap = (1.0 - dry) ** (1.0 + 2.6 * strength)
    alpha = body * (1.0 - dryness * gap) * pool * grain
    alpha = alpha * press

    # 붓을 뗀 면은 칼로 자른 듯 곧지 않다. 끝을 결로 조금 갉는다. 많이 갉으면 갈라진
    # 빗자루가 되어 힘이 빠진다. 대는 면은 둥근 마무리에 덮여 안 보이니 더 살짝만.
    face = np.maximum(smoothstep((0.03 - u) / 0.03) * 0.4, smoothstep((u - 0.97) / 0.03) * 0.5)
    bite = noise((RADIAL, ANGULAR), (30, 200), brush.seed + 83)
    alpha = alpha * (1.0 - face * 0.30 * np.clip(1.0 - (bite - 0.28) / 0.34, 0.0, 1.0))

    # 획 바깥으로 삐져나온 붓털 몇 올. 시안에서 획을 가볍게 보이게 하는 요소다.
    hair_seed = noise((RADIAL, ANGULAR), (46, 26), brush.seed + 71)
    hair_band = smoothstep((r - outer) / (thick * 0.06)) * smoothstep(
        (outer + thick * 0.28 - r) / (thick * 0.22)
    )
    along = np.clip(np.sin(np.pi * u), 0.0, 1.0) ** 0.7
    hairs = hair_band * np.clip((hair_seed - 0.72) / 0.12, 0.0, 1.0) * (0.10 + 0.28 * along)
    alpha = np.maximum(alpha, hairs * press)
    # 중간 농도를 살짝 밀어 준다. 시안의 먹은 굵은 구간이 거의 완전 불투명이다.
    alpha = np.clip(alpha, 0.0, 1.0) ** 0.88

    # 붓을 뗀 자리를 지난 곳은 **둥근 마무리**다. 진행 방향으로 칼같이 끊으면 마무리가
    # 각진 토막이 되고, 그 단면이 색 경계와 겹쳐 잘려 보인다. 획의 중심선 위 끝점을
    # 중심으로 하는 원 안쪽만 남기면 붓을 세워 떼는 둥근 끝이 된다.
    mid = (inner + outer) * 0.5
    reach = brush.cap * thick * 0.5
    # 지난 거리를 호 길이로 환산해 반지름 방향 거리와 같은 자로 잰다.
    arc = past * 2.0 * math.pi * r
    away = np.sqrt(arc * arc + (r - mid) ** 2)
    round_end = smoothstep((reach - away) / np.maximum(reach * 0.10, 1e-6))
    alpha = np.where(past > 0.0, alpha * round_end, alpha)
    return alpha.astype(np.float32)


def to_circle(polar: np.ndarray) -> np.ndarray:
    """극좌표 격자를 정사각 캔버스로 되돌린다(이중선형)."""
    axis = (np.arange(CANVAS, dtype=np.float32) + 0.5) / CANVAS - 0.5
    x = axis[None, :]
    y = axis[:, None]
    radius = np.sqrt(x * x + y * y)
    angle = (np.arctan2(x, -y) / (2.0 * math.pi)) % 1.0  # 12시에서 시계 방향

    ry = (radius - R_LO) / (R_HI - R_LO) * (RADIAL - 1)
    inside = (ry >= 0) & (ry <= RADIAL - 1)
    ry = np.clip(ry, 0, RADIAL - 1)
    ax = angle * ANGULAR

    y0 = np.floor(ry).astype(np.int32)
    y1 = np.minimum(y0 + 1, RADIAL - 1)
    fy = ry - y0
    x0 = np.floor(ax).astype(np.int32) % ANGULAR
    x1 = (x0 + 1) % ANGULAR
    fx = ax - np.floor(ax)

    top = polar[y0, x0] * (1 - fx) + polar[y0, x1] * fx
    bottom = polar[y1, x0] * (1 - fx) + polar[y1, x1] * fx
    return np.where(inside, top * (1 - fy) + bottom * fy, 0.0).astype(np.float32)


_ENSO = dict(
    outer=INK_OUTER,
    thick_start=THICK_START,
    thick_waist=THICK_WAIST,
    thick_end=THICK_END,
    dens_start=0.90,
    dens_waist=0.66,
    dens_end=1.0,
    # 힘이 가장 빠지는 자리 — 시계로 3시 반쯤.
    waist=0.34,
    seed=SEED,
    ccw=False,
    dryness=0.20,
    dry_weak=3.4,
    # 끝을 조금만 기울인다. 크게 주면 바깥쪽만 길게 삐져나와 둥근 마무리가 찌그러진다.
    slant=0.004,
    # 마무리 원은 획 두께보다 조금 크다 — 붓을 세워 떼면 그 자리에 먹이 눌려 퍼진다.
    # 딱 두께의 절반으로 두면 원이 획 안에 잠겨 둥근 맛이 보이지 않는다.
    cap=1.3,
)

# 딱 한 바퀴. 붓을 뗀 자리가 댄 자리로 되돌아오고, 둥근 마무리가 시작의 단면을 제 원
# **가운데**에 품는다. 그래서 대는 자리도 떼는 자리도 12시다.
ENSO_SWEEP = 1.0
ENSO = Brush(start=0.0, **_ENSO)


def write(alpha: np.ndarray, name: str) -> None:
    """알파만 담은 흰 그림으로 저장 — 색은 앱이 마스크로 칠한다."""
    out = np.full((CANVAS, CANVAS, 4), 255, dtype=np.uint8)
    out[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    art = Image.fromarray(out)
    for suffix, size in SIZES.items():
        art.resize((size, size), Image.LANCZOS).save(
            OUT_DIR / f"{name}{suffix}.png", optimize=True
        )


def write_geometry(brush: Brush, name: str) -> None:
    """앱이 알아야 하는 치수. 표시 한 변을 1로 본 비율이다.

    둥근 마무리는 12시에서 **시계 방향으로** 부풀어 있고, 색 경계도 12시다. 그대로 칠하면
    검은 마무리에 주홍이 덮여 둥근 맛이 사라지니, 앱이 그 원만 먹으로 되돌린다. 그래서
    원의 자리를 그림과 나눠 가져야 한다 — 눈대중으로 적어 두면 두께를 손볼 때마다 어긋난다.
    """
    mid = brush.outer - brush.thick_end * 0.5
    cap = brush.cap * brush.thick_end * 0.5
    (OUT_DIR / f"{name}.json").write_text(
        json.dumps({"mid": round(mid, 5), "cap": round(cap, 5)}, indent=2) + "\n"
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write(to_circle(stroke(ENSO, ENSO_SWEEP)), "brush-ring")
    write_geometry(ENSO, "brush-ring")
    print(f"  brush-ring -> {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
