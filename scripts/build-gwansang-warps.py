#!/usr/bin/env python3
"""Build 관상 option layers by locally warping the finished portrait art.

The two base paintings (`assets/images/gwansang/static/{gender}.png`) already have
the quality we want, so options must never redraw a feature — they take the base's
own pixels around a feature and push them a little: bigger eyes, thicker brows, a
wider jaw. Each option ships as a full-canvas transparent PNG holding just that
feature, feathered at the edges, so the app can stack any combination on the base.

    python3 scripts/build-gwansang-warps.py            # write assets + TS map
    python3 scripts/build-gwansang-warps.py --preview   # contact sheet only
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass, replace
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "docs" / "design-samples" / "gwansang-source"
STATIC_DIR = ROOT / "assets" / "images" / "gwansang" / "static"
WARP_DIR = ROOT / "assets" / "images" / "gwansang" / "warp"
PREVIEW = ROOT / "docs" / "design-samples" / "gwansang-warp-preview.png"
TS_MAP = ROOT / "lib" / "physiognomyWarpAssets.ts"

SIZES = {"": (104, 136), "@2x": (208, 272), "@3x": (312, 408)}
WORK = (624, 816)  # 2× the @3x asset; warps are sampled here, then downscaled.

# Feature boxes as fractions of the framed portrait, measured off the 여성 원화.
# 좌표는 눈대중이 아니라 프레이밍된 베이스에 격자를 얹어 읽은 값이다. 상자가
# 실제 부위를 벗어나면(예: "목" 상자가 남성 턱을 덮으면) 윤곽이 꺾여 보인다.
BOXES: dict[str, tuple[float, float, float, float]] = {
    "eyeL": (0.255, 0.445, 0.470, 0.535),
    "eyeR": (0.530, 0.445, 0.745, 0.535),
    # 쌍꺼풀 주름만 쓰는 얇은 띠. 눈 상자에서 **속눈썹선 위쪽**(눈 상자 기준 0.02~0.27)
    # 만 잘라 낸 것이다. 눈 상자 전체로 쌍꺼풀을 다루면 홍채·속눈썹까지 눌려 무쌍이
    # 주름 없는 눈이 아니라 **졸린 눈**이 된다 — 실제로 그렇게 실패했다.
    "lidL": (0.255, 0.447, 0.470, 0.469),
    "lidR": (0.530, 0.447, 0.745, 0.469),
    # 눈썹 잉크는 상자 위쪽(≈0.11~0.51)에 앉는다. 위로 여유를 두지 않으면 두껍게
    # 키운 눈썹이 상자 밖으로 나가 잘리고, 감쇠가 남긴 원래 눈썹과 겹쳐 두 줄이 된다.
    "browL": (0.245, 0.372, 0.480, 0.465),
    "browR": (0.520, 0.372, 0.755, 0.465),
    "nose": (0.385, 0.520, 0.615, 0.685),
    "mouth": (0.355, 0.685, 0.645, 0.780),
    "forehead": (0.220, 0.180, 0.780, 0.400),
    # 얼굴형·턱 상자는 **화폭 전체 너비**를 쓴다. 좌우 반쪽 상자(옛 jawL/jawR)로
    # 턱선을 밀면 상자 경계에서 변위가 갑자기 줄어 윤곽선이 계단처럼 꺾였다.
    # 전폭 상자는 좌우 감쇠 구간이 배경·머리 위에 떨어져 윤곽선을 건드리지 않는다.
    # 폭(sx) 상자는 턱에서 끝나지 않고 **목까지 한 실루엣**으로 간다. 목 연결선에서
    # 가로 변위를 0으로 끊으면 턱선이 목선에 단차로 꺾인다. 대신 배율은 목에서
    # 일정해야 곧은 목선이 유지된다(`fbot=0`). 어깨는 화폭 끝이라 상자 y1=1.0.
    "cheek": (0.04, 0.480, 0.96, 1.0),  # 광대 폭 → 목
    "jawline": (0.04, 0.620, 0.96, 1.0),  # 턱선 폭 → 목
    # 높이(sy)만 바꾸는 상자는 목을 지나 화폭 끝까지 내려간다. 세로 변형은 x를 전혀
    # 움직이지 않으므로 목 굵기가 보존된다 — 길이가 모자라거나 넘칠 때는 여기로 맞춘다.
    # `face_height`는 입을 지나므로 긴 상단 감쇠(`ftop` 0.8)로 눌러 쓴다. 짧게 잡으면
    # 입술이 같이 늘어나 얼굴형이 입 모양까지 바꿔 버린다.
    "face_height": (0.04, 0.500, 0.96, 1.0),  # 아래 얼굴 길이
    "chin_height": (0.04, 0.740, 0.96, 1.0),  # 턱끝 길이
    # 목 굵기용 전폭 상자. 위는 턱선을 지나며 감쇠하고 아래는 화폭 끝까지 배율이
    # 일정하다(`fbot=0`) — 세기를 Y로 바꾸면 곧은 목선이 휘어 울퉁불퉁해 보인다.
    "neck": (0.04, 0.700, 0.96, 1.0),
    # 이중 턱 주름(`Crease`)이 앉는 띠. 턱선을 추적해 그 아래로 획을 옮긴다. 좌우는
    # 목 외곽선(`NECK_EDGE_X`) 안쪽까지만 — 넘기면 획이 배경으로 삐져 나간다.
    "under_chin": (0.330, 0.856, 0.670, 0.918),
}

# 성별로 통째로 갈아 끼우는 상자(이동만으로는 안 되는 것). 여성 턱은 남성보다
# 좁고 V에 가까워서, 같은 폭의 상자를 쓰면 `jaw_line`이 읽어 낸 진짜 턱선이 상자
# 끝에서 너무 가파르다고 판정돼 버려지고 평평한 대체 곡선이 찍힌다 — 이중 턱이
# 턱선을 안 따르고 넓적한 얼룩으로 보이던 이유다.
GENDER_BOX: dict[str, dict[str, tuple[float, float, float, float]]] = {
    "female": {"under_chin": (0.370, 0.846, 0.630, 0.906)},
}

# 프레임을 바꾸면 이 값이 전부 어긋난다. 확인은 `--boxes`로 상자를 그려 보는 것이
# 가장 빠르다. 현재 프레임에서 남성은 이목구비가 여성과 거의 같은 높이에 있고
# 턱끝만 조금 위다(여성 0.855, 남성 0.832).
GENDER_SHIFT: dict[str, dict[str, tuple[float, float]]] = {
    "female": {},
    "male": {
        "eyeL": (0.0, 0.010),
        "eyeR": (0.0, 0.010),
        "lidL": (0.0, 0.010),
        "lidR": (0.0, 0.010),
        "forehead": (0.0, 0.030),
        "nose": (0.0, 0.035),
        "mouth": (0.0, 0.010),
        "cheek": (0.0, -0.020),
        "jawline": (0.0, -0.020),
        "face_height": (0.0, -0.020),
        "chin_height": (0.0, -0.026),
        "neck": (0.0, 0.020),
        # 남성 턱끝은 여성보다 **아래**다(0.882 vs 0.851). 다른 상자들과 부호가 반대라
        # 헷갈리기 쉽다 — 상자를 위로 올려 두면 추적 창이 턱선을 놓친다.
        "under_chin": (0.0, 0.027),
    },
}

# Male jaw/chin warps need a light push — the short-hair base already has a firm
# contour. Keep this modest: the fades actually work now, so old factors (1.75)
# overshoot into a caricature.
MALE_BOX_AMP: dict[str, float] = {
    "cheek": 1.20,
    "jawline": 1.25,
    "chin_height": 1.25,
    # 남성은 턱 밑이 목 음영이라, 밝은 턱 살을 끌어내리면 흰 덩어리가 덮인다. 덜 민다.
    "under_chin": 0.60,
    "forehead": 1.30,
}

# 턱선이 목선과 만나는 높이(참고). 폭 상자는 여기서 끊지 않고 목까지 이어 간다.
# 검증은 "이 아래 가로 변위가 0인가"가 아니라 "Y를 따라 일정한가"(곧은 목선)다.
# 이중 턱은 목선 *안쪽* 살집이라, 가운데 열의 Y 변화는 꺾임이 아니다.
NECK_JOIN: dict[str, float] = {"female": 0.810, "male": 0.790}
# 목 외곽선 근처. under_chin(0.330~0.670)과 겹치지 않게 잡는다.
NECK_EDGE_X: dict[str, tuple[float, float, float, float]] = {
    "female": (0.28, 0.325, 0.675, 0.72),
    "male": (0.22, 0.295, 0.705, 0.78),
}

# 얼굴형과 턱은 턱선·턱끝에서 상자가 겹친다. 각 옵션을 원화에서 따로 워프해
# 알파로 얹으면 같은 윤곽이 서로 다른 자리에 두 번 찍혀 깨진다(긴형+이중턱).
# 둘 다 고른 경우에는 연산을 한 버퍼에서 이어서 돌린 콤보 레이어를 쓴다.
FACE_OPTIONS = ("face_round", "face_square", "face_long", "face_heart")
CHIN_OPTIONS = ("chin_square", "chin_double")
LAYER_ORDER = (
    "face_shape",
    "forehead",
    "chin",
    "eyebrows",
    "eyes",
    "nose",
    "mouth",
)


@dataclass(frozen=True)
class Op:
    """One local warp: scale/rotate the art around a point inside `box`.

    The fade fields say over how much of the box the warp ramps up from zero, as a
    fraction of the box's width (`fx`) or height (`ftop`/`fbot`). `0` means no ramp
    on that side — use it only where the box runs off the canvas, because a warp
    that stops mid-painting leaves a visible kink.
    """

    box: str
    sx: float = 1.0
    sy: float = 1.0
    angle: float = 0.0  # degrees, positive = counter-clockwise
    ax: float = 0.5  # scaling anchor inside the box, 0 = left/top edge
    ay: float = 0.5
    fx: float = 0.5
    ftop: float = 0.5
    fbot: float = 0.5
    # Layer opacity = clip(weight * gain). Default 5 keeps other options solid.
    # Double-chin needs ~1.3 so the original jaw line still shows through.
    gain: float = 5.0
    # True: fade is an ellipse inside the box, so the warp cannot leave a flat
    # bottom edge (that reads as a square chin).
    ellipse: bool = False
    # Extra source shift as a fraction of box height. Positive = sample from
    # above, so ink appears lower. Used to copy the chin line into a second fold.
    dy: float = 0.0
    # 획 농도. 양수는 짙게, 음수는 종이색으로 들어 올린다. 수묵 획을 세로로 늘리면
    # 같은 잉크가 넓게 퍼져 **옅어지므로**, 두껍게 만든 눈썹이 오히려 가늘어 보였다.
    # 이미 잉크가 있는 픽셀에만 먹인다 — 상자를 통째로 곱하면 살까지 어두워져
    # 사각 얼룩이 된다(`under_chin`을 통째로 darken 했을 때 그렇게 실패했다).
    ink: float = 0.0


@dataclass(frozen=True)
class Crease:
    """A soft stroke that follows the traced jaw line — 살집 주름. Not a warp.

    이중 턱 주름은 워프로 만들 수 없다. 원화의 턱 밑은 빈 종이라 옮길 잉크가 없고,
    타원을 통째로 어둡게 하면 알약 모양 얼룩이 찍힌다(실제로 그렇게 실패했다).
    임의의 호도 안 된다 — 턱선보다 곡률이 얕아서 옆으로 삐져 나가 번진 자국이 됐다.
    그래서 원화에서 턱선을 실제로 읽어 내(`jaw_line`) 그 곡선을 아래로 평행 이동한다.
    """

    box: str
    # Peak darkening, 1.0 = black. Negative lifts toward the paper tone instead —
    # 남성 베이스는 턱 밑이 통째로 음영이라, 어둡게만 하면 그림자가 두꺼워질 뿐이고
    # 겹살로 안 읽힌다. 빛 받는 살을 밝게 들어 올려야 단이 생긴다.
    amount: float = 0.28
    offset: float = 0.10  # below the traced jaw, fraction of box height
    thickness: float = 0.09  # gaussian sigma, fraction of box height


def mirrored(op: Op, box: str) -> Op:
    """Same warp for the other side of the face: mirror anchor and rotation."""
    return replace(op, box=box, angle=-op.angle, ax=1.0 - op.ax)


def pair(left: str, right: str, op: Op) -> list[Op]:
    return [replace(op, box=left), mirrored(op, right)]


def eyes(sx=1.0, sy=1.0, angle=0.0, ay=0.5) -> list[Op]:
    return pair("eyeL", "eyeR", Op("eyeL", sx, sy, angle, 0.5, ay))


def lids(sy=1.0, ink=0.0) -> list[Op]:
    """쌍꺼풀 축. 눈 개구는 그대로 두고 **주름 띠만** 다룬다.

    앵커는 띠 바닥(`ay=1.0`) = 속눈썹선이다. `sy<1`이면 주름이 속눈썹선으로 내려앉아
    사라지고(무쌍), `sy>1`이면 위로 벌어져 또렷해진다(쌍꺼풀). 홍채·속눈썹은 띠
    밖이라 눈이 감기지 않는다.
    """
    return pair("lidL", "lidR", Op("lidL", 1.0, sy, 0.0, 0.5, 1.0, ftop=0.35, ink=ink))


def brows(sy=1.0, angle=0.0, ay=0.55, ink=0.0) -> list[Op]:
    """앵커는 눈썹 **바로 아래**다(`ay=0.55`).

    상자 바닥(`ay=1.0`)을 앵커로 두면 눈썹이 앵커에서 멀어 배율만큼 위로 크게
    밀려나고, 상자 위 경계에서 잘린다. 제자리에서 두꺼워지려면 앵커가 획에 붙어야 한다.

    위쪽 감쇠는 짧다(`ftop`). 상자 위는 빈 이마라 급하게 끊어도 꺾일 윤곽이 없고,
    길게 주면 두껍게 키운 눈썹의 윗부분만 덜 밀려 원래 획과 겹쳐 두 줄로 보인다.
    """
    return pair(
        "browL", "browR", Op("browL", 1.0, sy, angle, 0.5, ay, ftop=0.22, ink=ink)
    )


# Options whose look the base already is (오벌 얼굴, 쌍꺼풀 눈) ship no layer.
# Amplitude guide (card 104pt): ±0.1–0.2 subtle, ±0.3+ obvious. Chin/jaw sit
# higher so they read on the short-hair male base; eyes/mouth are a light bump.
OPS: dict[str, list[Op | Crease]] = {
    "eyes_large": eyes(sx=1.20, sy=1.24),
    "eyes_small": eyes(sx=0.86, sy=0.80),
    # 쌍꺼풀은 눈 크기 축이 아니다. 눈 상자를 세로로 눌러 무쌍을 만들면 눈꺼풀이
    # 홍채를 덮어 졸린 눈이 됐다(여성 개구 33 → 25px). 주름 띠(`lidL`/`lidR`)만 쓴다.
    "eyes_double": lids(sy=1.22, ink=0.10),
    "eyes_single": lids(sy=0.55, ink=-0.34),
    "eyes_upturned": eyes(angle=7.0),
    "eyes_downturned": eyes(angle=-7.0),
    # 두께는 배율만으로 안 된다. 세로로 늘리면 획이 퍼져 옅어지고 줄이면 진해지므로,
    # 1.48/0.60처럼 크게 밀면 두꺼운 쪽이 오히려 가늘어 보였다. 배율은 줄이고
    # 농도(`ink`)로 두께를 읽히게 한다.
    "brow_thick": brows(sy=1.50, ink=0.20),
    "brow_thin": brows(sy=0.64, ink=-0.30),
    # 일자는 아치를 눌러 펴고, 아치는 두께가 아니라 곡선만. 배율은 1.0 근처로 둬
    # 두께 옵션과 헷갈리지 않게 한다.
    "brow_straight": brows(sy=0.94, angle=5.0, ink=-0.05),
    "brow_arched": brows(sy=1.02, angle=-6.0),
    "nose_high": [Op("nose", sx=0.94, sy=1.12, ay=1.0)],
    "nose_low": [Op("nose", sx=1.06, sy=0.88, ay=1.0)],
    "nose_wide": [Op("nose", sx=1.22)],
    "nose_narrow": [Op("nose", sx=0.82)],
    "mouth_large": [Op("mouth", sx=1.22)],
    "mouth_small": [Op("mouth", sx=0.82)],
    "mouth_full": [Op("mouth", sy=1.36)],
    "mouth_thin": [Op("mouth", sy=0.68)],
    # 얼굴형은 크기를 키우는 게 아니라 **그 형을 규정하는 부위 하나**만 민다.
    # 관상(오행)에서 각 형을 가르는 지점은 이렇다:
    #   둥근형(水) 볼이 통통하고 턱끝이 짧다                 → 광대만 (턱선은 각진형 몫)
    #   각진형(金) 하악각이 각지고 턱끝이 넓고 납작하다        → 턱선 폭만
    #   긴형(木)   이마는 넓고 세로로 길며 아래로 갈수록 좁다  → 턱선 폭 축소 + 길이
    #   하트형(火) 이마·광대가 넓고 턱이 가늘게 모인다         → 이마·광대 + 턱선 폭
    # 폭은 ±0.06 안쪽. 턱선은 목까지 같은 배율로 이어 굴곡이 없게 한다. 형이 덜
    # 살면 폭을 더 밀지 말고 세로 상자(`face_height`/`chin_height`)로 길이를 조절한다.
    # 둥근형 = 볼이 넓고 아래턱이 짧다. 턱선까지 넓히면 하악각이 벌어져
    # 각진형보다 더 각져 보인다(cheek·jawline이 목까지 겹치면 배율이 곱해짐).
    "face_round": [
        Op("cheek", sx=1.04, ftop=0.45, fbot=0.0, fx=0.12),
        # `fbot`을 0으로 두면 화폭 아래에 읽을 원본이 없어 마지막 행이 복사되고, 목
        # 아래가 잘린 자국처럼 드러난다. 세로로 **줄이는** 워프는 아래도 감쇠시킨다.
        Op("face_height", sy=0.96, ay=0.0, ftop=0.80, fbot=0.45, fx=0.12),
    ],
    # 각진형 = 하악각만 벌린다. 광대는 그대로라 턱 모서리가 도드라진다.
    "face_square": [
        Op("jawline", sx=1.06, ftop=0.28, fbot=0.0, fx=0.12),
    ],
    # 긴형 = 아래로 갈수록 좁고 얼굴이 길다. 폭은 턱선만, 길이는 세로 상자.
    "face_long": [
        Op("jawline", sx=0.96, ftop=0.35, fbot=0.0, fx=0.12),
        Op("face_height", sy=1.05, ay=0.0, ftop=0.80, fbot=0.0, fx=0.12),
        Op("forehead", sx=1.04, ay=1.0),
    ],
    # 하트형 = 이마·광대가 넓고 턱선이 모인다. 뾰족함은 폭이지 길이가 아니다.
    "face_heart": [
        Op("forehead", sx=1.04, ay=1.0),
        Op("cheek", sx=1.02, ftop=0.45, fbot=0.0, fx=0.12),
        Op("jawline", sx=0.96, ftop=0.35, fbot=0.0, fx=0.12),
    ],
    # 관상 턱은 길이·폭·턱끝·살집이 다른 축이다.
    # 둥근 턱 = 짧은 턱끝. 각진 턱 = 뒤턱(하악각). 이중 턱 = 턱 아래 살집(긴 턱 아님).
    "chin_square": [Op("jawline", sx=1.04, ftop=0.40, fbot=0.0, fx=0.12)],
    "chin_double": [
        # 턱선 아래를 살짝 채우고(살집), 그 위에 주름 한 획 + 아래로 옅은 음영.
        Op("under_chin", sx=1.03, sy=1.03, ay=0.0, ellipse=True),
        # 턱선을 그대로 따라 내려온 획 + 그 아래 옅은 음영(겹살의 두께).
        Crease("under_chin", amount=-0.40, offset=0.10, thickness=0.115),
        # 아랫선은 원래 턱선보다 **옅게**. 같은 농도로 찍으면 어느 쪽이 턱선인지 흐려진다.
        Crease("under_chin", amount=0.24, offset=0.30, thickness=0.105),
        Crease("under_chin", amount=0.12, offset=0.52, thickness=0.30),
    ],
    "forehead_wide_high": [Op("forehead", sx=1.18, sy=1.16, ay=1.0)],
    "forehead_wide_low": [Op("forehead", sx=1.18, sy=0.82, ay=1.0)],
    "forehead_narrow_high": [Op("forehead", sx=0.80, sy=1.16, ay=1.0)],
    "forehead_narrow_low": [Op("forehead", sx=0.80, sy=0.82, ay=1.0)],
}

# 눈은 크기·쌍꺼풀·눈꼬리가 독립 축이다. 한 카테고리에서 한 가지만 고르게 하면
# “큰 무쌍 처진 눈”처럼 실제로 흔한 조합을 고를 수 없다. 세 워프를 한 `render_layer`
# 버퍼에서 순서대로 적용한 합성 레이어를 쓴다. 개별 PNG 셋을 앱에서 알파로 겹치면
# 같은 눈 윤곽이 서로 다른 위치에 남아 잔상이 생긴다.
EYE_COMPOSITES: dict[str, list[Op | Crease]] = {
    f"eyes_{size}_{lid}_{corner}": [
        *OPS[f"eyes_{size}"],
        *OPS[f"eyes_{lid}"],
        *OPS[f"eyes_{corner}"],
    ]
    for size in ("large", "small")
    for lid in ("double", "single")
    for corner in ("upturned", "downturned")
}

# 입·눈썹·코도 눈과 같이 2축을 한 레이어로 굽는다. 평탄 옵션을 알파로 겹치면
# 같은 상자에 잔상이 남는다.
MOUTH_COMPOSITES: dict[str, list[Op | Crease]] = {
    f"mouth_{size}_{lip}": [
        *OPS[f"mouth_{size}"],
        *OPS[f"mouth_{lip}"],
    ]
    for size in ("large", "small")
    for lip in ("full", "thin")
}

BROW_COMPOSITES: dict[str, list[Op | Crease]] = {
    f"brow_{shape}_{weight}": [
        *OPS[f"brow_{shape}"],
        *OPS[f"brow_{weight}"],
    ]
    for shape in ("straight", "arched")
    for weight in ("thick", "thin")
}

NOSE_COMPOSITES: dict[str, list[Op | Crease]] = {
    f"nose_{height}_{width}": [
        *OPS[f"nose_{height}"],
        *OPS[f"nose_{width}"],
    ]
    for height in ("high", "low")
    for width in ("wide", "narrow")
}

FEATURE_COMPOSITES: dict[str, list[Op | Crease]] = {
    **EYE_COMPOSITES,
    **MOUTH_COMPOSITES,
    **BROW_COMPOSITES,
    **NOSE_COMPOSITES,
}

# 기본 턱높이는 **둥근 턱**이다. `build-gwansang-static-bases.py`가 이 워프를 정적
# 베이스에 미리 굽는다 — 앱은 정적 PNG 위에 레이어를 얹으므로, 워프 스크립트 안에서만
# 줄여 두면 앱에서는 긴 턱이 그대로 보이고 레이어만 어긋난다. 그래서 둥근 턱은
# 계란형·쌍꺼풀처럼 레이어가 없다.
# `fbot`은 0이면 안 된다. 위를 고정하고 세로로 줄이면 화폭 아래쪽은 읽을 원본이 없어
# 마지막 행이 복사되고, 목·옷에 세로 줄무늬가 남는다(행간차 3.98 → 0.49).
BASE_CHIN: list[Op] = [Op("chin_height", sy=0.92, ay=0.0, ftop=0.40, fbot=0.45, fx=0.12)]

# 원화 목이 굵다. 여성이 특히 굵어 더 줄인다(남 굽힌 목폭 ≈0.51에 가깝게).
# 0.76/0.90까지 조였을 때는 여성이 반대로 가늘어 보였다 — 한 단 되돌린 값이다.
BASE_NECK_SX: dict[str, float] = {"female": 0.79, "male": 0.92}


def base_ops(gender: str) -> list[Op]:
    """정적 베이스에 굽는 워프. 옵션 레이어가 아니라 **모든 카드의 기본값**이다."""
    return BASE_CHIN + [
        Op("neck", sx=BASE_NECK_SX[gender], ftop=0.55, fbot=0.0, fx=0.12)
    ]


def combo_key(face_id: str, chin_id: str) -> str:
    return f"{face_id}__{chin_id}"


def combo_ops(face_id: str, chin_id: str) -> list[Op | Crease]:
    """얼굴형 다음에 턱. 턱이 chin_height를 쓰면 얼굴형 쪽 같은 상자는 뺀다."""
    chin = list(OPS[chin_id])
    chin_owns_height = any(op.box == "chin_height" for op in chin)
    face = [
        op
        for op in OPS[face_id]
        if not (chin_owns_height and op.box == "chin_height")
    ]
    return face + chin


def all_combos() -> list[tuple[str, str, list[Op | Crease]]]:
    return [
        (face_id, chin_id, combo_ops(face_id, chin_id))
        for face_id in FACE_OPTIONS
        for chin_id in CHIN_OPTIONS
    ]


def iter_layers(selection: dict[str, str]):
    """App과 같은 순서로, 얼굴형+턱이면 콤보 한 장."""
    face = selection.get("face_shape")
    chin = selection.get("chin")
    use_combo = face in OPS and chin in OPS
    for category in LAYER_ORDER:
        option = selection.get(category)
        if not option:
            continue
        if use_combo and category == "face_shape":
            yield combo_key(face, chin), combo_ops(face, chin)
            continue
        if use_combo and category == "chin":
            continue
        ops = OPS.get(option) or FEATURE_COMPOSITES.get(option)
        if ops:
            yield option, ops


def pixel_box(name: str, gender: str, size: tuple[int, int]) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = GENDER_BOX.get(gender, {}).get(name, BOXES[name])
    dx, dy = GENDER_SHIFT[gender].get(name, (0.0, 0.0))
    w, h = size
    # 화폭 끝까지 가는 상자는 아래를 성별로 밀지 않는다. 밀면 남성 목선이
    # 프레임 밑에서 끊겨 다시 꺾인다.
    y1_out = y1 if y1 >= 1.0 else y1 + dy
    return (
        round((x0 + dx) * w),
        round((y0 + dy) * h),
        round((x1 + dx) * w),
        round(y1_out * h),
    )


def smoothstep(t: np.ndarray) -> np.ndarray:
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def displacement(op: Op, box: tuple[int, int, int, int], shape: tuple[int, int]):
    """Where each output pixel should read from, and how strongly it is warped.

    The scale/rotation is an affine around the anchor, but its effect is multiplied
    by a bump that reaches zero on the box boundary. That taper is the whole trick:
    at the edge every pixel reads its own position, so the patch drops onto the
    painting with no seam and no shifted-skin plaque.

    Each side ramps over its own distance (`Op.fx`/`ftop`/`fbot`), so a warp can run
    off the bottom of the canvas at full strength while still fading in at the top.
    """
    x0, y0, x1, y1 = box
    h, w = shape
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)

    span_x, span_y = max(x1 - x0, 1), max(y1 - y0, 1)

    def ramp(distance: np.ndarray, fade: float, span: float) -> np.ndarray:
        if fade <= 0.0:
            return (distance >= 0).astype(np.float32)
        return smoothstep(distance / (span * fade))

    if op.ellipse:
        ecx, ecy = (x0 + x1) * 0.5, (y0 + y1) * 0.5
        nx = (xs - ecx) / (span_x * 0.5)
        ny = (ys - ecy) / (span_y * 0.5)
        weight = smoothstep(np.clip(1.0 - nx * nx - ny * ny, 0.0, 1.0))
    else:
        weight = (
            np.minimum(ramp(xs - x0, op.fx, span_x), ramp(x1 - xs, op.fx, span_x))
            * ramp(ys - y0, op.ftop, span_y)
            * ramp(y1 - ys, op.fbot, span_y)
        )

    ax, ay = x0 + span_x * op.ax, y0 + span_y * op.ay
    t = math.radians(op.angle)
    cos, sin = math.cos(t), math.sin(t)
    px, py = xs - ax, ys - ay
    # Inverse of "rotate then scale about the anchor": where the source pixel is.
    src_x = ax + (cos * px + sin * py) / op.sx
    src_y = ay + (-sin * px + cos * py) / op.sy - op.dy * span_y
    return (
        xs + (src_x - xs) * weight,
        ys + (src_y - ys) * weight,
        weight,
    )


def jaw_line(pixels: np.ndarray, box: tuple[int, int, int, int]):
    """Read the jaw contour off the painting: darkest row per column, fit a symmetric U.

    Two guards, both learned the hard way on the 남성 베이스: search a narrow band
    around the chin tip — reach up and the (much darker) lip line gets traced instead,
    reach down and the 목 음영 does — and fit `a(x-cx)² + c` rather than a free
    parabola, so stray ink cannot tilt the curve into a diagonal streak.
    """
    x0, y0, x1, _ = box
    h = pixels.shape[0]
    top, bottom = max(0, round(y0 - 0.050 * h)), min(h, round(y0 + 0.030 * h))
    # 가운데 열만 읽고 포물선을 상자 끝까지 늘린다. 상자가 넓어지면 바깥쪽 턱선은
    # 탐색 띠보다 높이 올라가 잘려 나가고, 띠를 넓히면 입술선이 걸린다.
    inset = round(0.20 * (x1 - x0))
    rows = (
        pixels[top:bottom, x0 + inset : x1 - inset].mean(axis=2).argmin(axis=0) + top
    ).astype(np.float32)
    cols = np.arange(x0 + inset, x1 - inset, dtype=np.float32)

    center = (x0 + x1) * 0.5
    basis = np.stack([(cols - center) ** 2, np.ones_like(cols)], axis=1)
    keep = np.ones(len(cols), dtype=bool)
    for _ in range(2):
        a, c = np.linalg.lstsq(basis[keep], rows[keep], rcond=None)[0]
        residual = np.abs(rows - (a * (cols - center) ** 2 + c))
        tight = residual <= max(np.median(residual) * 2.0, 1.0)
        if tight.sum() < len(cols) * 0.4:
            break
        keep = tight

    # 턱은 가운데(턱끝)가 가장 아래다. 행 번호는 아래로 갈수록 커지므로 `a`는 **음수**여야
    # 한다. 부호를 양수로 잡아 두면 멀쩡한 추적을 버리고 반대로 휜 대체 곡선을 쓴다 —
    # 턱과 거꾸로 도는 반원이 찍혔던 이유다.
    edge = a * (0.5 * (x1 - x0)) ** 2  # 상자 끝에서 턱끝보다 얼마나 위인지(음수)
    if abs(c - y0) > 0.03 * h or not -0.09 * h < edge < -0.004 * h:
        a, c = -(0.030 * h) / (0.5 * (x1 - x0)) ** 2, float(y0)
    return lambda x: a * (x - center) ** 2 + c


def crease_weight(c: Crease, box: tuple[int, int, int, int], pixels: np.ndarray):
    """Gaussian band running parallel to the jaw, fading out at the box sides."""
    x0, y0, x1, y1 = box
    h, w = pixels.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    span_x, span_y = max(x1 - x0, 1), max(y1 - y0, 1)

    nx = (xs - (x0 + x1) * 0.5) / (span_x * 0.5)
    inside = np.clip(1.0 - nx * nx, 0.0, 1.0)
    line = jaw_line(pixels, box)(np.clip(xs, x0, x1 - 1)) + span_y * c.offset
    band = np.exp(-(((ys - line) / (span_y * c.thickness)) ** 2))
    # 끝을 제곱으로 죽인다. 완만하게 빼면 획이 턱선 밖 목·배경까지 뻗어 번진 자국이 된다.
    return band * smoothstep(inside) ** 2


def sample(pixels: np.ndarray, sx: np.ndarray, sy: np.ndarray) -> np.ndarray:
    """Bilinear read so the warped ink keeps its soft edges."""
    h, w = pixels.shape[:2]
    sx = np.clip(sx, 0, w - 1)
    sy = np.clip(sy, 0, h - 1)
    x0, y0 = np.floor(sx).astype(np.int32), np.floor(sy).astype(np.int32)
    x1, y1 = np.minimum(x0 + 1, w - 1), np.minimum(y0 + 1, h - 1)
    fx, fy = (sx - x0)[..., None], (sy - y0)[..., None]
    top = pixels[y0, x0] * (1 - fx) + pixels[y0, x1] * fx
    bottom = pixels[y1, x0] * (1 - fx) + pixels[y1, x1] * fx
    return top * (1 - fy) + bottom * fy


def apply_ink(
    out: np.ndarray, paper: np.ndarray, weight: np.ndarray, ink: float
) -> np.ndarray:
    """Darken or lift the existing strokes inside the warped patch.

    Masked by how much ink a pixel already carries, so skin and paper stay put —
    a flat multiply over the box leaves a rectangular grey plaque instead.
    """
    tone = paper.mean()
    density = np.clip((tone - out.mean(axis=2)) / max(tone, 1.0), 0.0, 1.0)
    mask = (weight * density)[..., None]
    if ink > 0.0:
        return out * (1.0 - ink * mask)
    return out + (paper - out) * (-ink * mask)


def amplify_op(op: Op, gender: str) -> Op:
    """Push male jaw/chin warps further from 1.0 so they read at card size."""
    if gender != "male":
        return op
    factor = MALE_BOX_AMP.get(op.box)
    if not factor:
        return op
    return replace(
        op,
        sx=1.0 + (op.sx - 1.0) * factor,
        sy=1.0 + (op.sy - 1.0) * factor,
        dy=op.dy * factor,
    )


def warp_image(image: Image.Image, ops: list[Op], gender: str) -> Image.Image:
    """Warp the whole painting with no alpha — used to bake `BASE_CHIN` into a base."""
    out = np.asarray(image.convert("RGB"), dtype=np.float32)
    for op in ops:
        op = amplify_op(op, gender)
        box = pixel_box(op.box, gender, image.size)
        src_x, src_y, _ = displacement(op, box, out.shape[:2])
        out = sample(out, src_x, src_y)
    return Image.fromarray(np.clip(out, 0.0, 255.0).astype(np.uint8))


def neck_row(gender: str, height: int) -> int:
    """First row that belongs to the neck. No option may change its width."""
    return round(NECK_JOIN[gender] * height)


def render_layer(base: Image.Image, ops: list[Op | Crease], gender: str) -> Image.Image:
    """Warp the base for every op, then keep only the touched pixels as a layer."""
    pixels = np.asarray(base.convert("RGB"), dtype=np.float32)
    out = pixels.copy()
    paper = np.median(pixels[:24, :24].reshape(-1, 3), axis=0)  # 배경 종이색
    strength = np.zeros(pixels.shape[:2], dtype=np.float32)

    # 주름을 먼저 찍는다. 뒤따르는 얼굴형·턱 워프가 턱선과 함께 주름도 끌고 가므로
    # 조합(긴 얼굴 + 이중 턱)에서 주름만 제자리에 남아 어긋나는 일이 없다.
    for op in sorted(ops, key=lambda o: not isinstance(o, Crease)):
        box = pixel_box(op.box, gender, base.size)
        if isinstance(op, Crease):
            weight = crease_weight(op, box, out)
            # 남성은 **밝게 드는 획에만** 배수를 준다. 턱 밑이 이미 목 음영이라 밝은 쪽은
            # 묻히지만, 어두운 쪽은 같은 배수를 먹이면 아랫선이 원래 턱선보다 진해진다.
            amount = op.amount * (1.6 if gender == "male" and op.amount < 0 else 1.0)
            if amount < 0.0:
                out += (paper - out) * (-amount * weight)[..., None]
            else:
                out *= (1.0 - amount * weight)[..., None]
            strength = np.maximum(strength, np.clip(weight * 5.0, 0.0, 1.0))
            continue
        op = amplify_op(op, gender)
        src_x, src_y, weight = displacement(op, box, pixels.shape[:2])
        warped = sample(out, src_x, src_y)
        touched = weight > 1e-4
        out[touched] = warped[touched]
        strength = np.maximum(strength, np.clip(weight * op.gain, 0.0, 1.0))
        if op.ink:
            out = apply_ink(out, paper, weight, op.ink)

    # Alpha follows the taper instead of the box: a hard rectangle printed a faint
    # outline on the painting, because bilinear sampling softens even the pixels the
    # warp barely moves. Default gain 5 keeps the warped core solid; double-chin
    # uses a lower gain so the original jaw line still shows under the fold.
    alpha = strength * 255.0
    return Image.fromarray(np.dstack([out, alpha]).astype(np.uint8))


def framed_base(gender: str) -> Image.Image:
    """The static asset at working resolution — the single source for every warp."""
    return Image.open(STATIC_DIR / f"{gender}@3x.png").convert("RGB").resize(
        WORK, Image.LANCZOS
    )


def composite(gender: str, selection: dict[str, str]) -> Image.Image:
    base = framed_base(gender)
    out = base.copy()
    for _, ops in iter_layers(selection):
        out = Image.alpha_composite(
            out.convert("RGBA"), render_layer(base, ops, gender)
        ).convert("RGB")
    return out


def write_layer(layer: Image.Image, out_dir: Path, name: str) -> None:
    for suffix, size in SIZES.items():
        layer.resize(size, Image.LANCZOS).save(
            out_dir / f"{name}{suffix}.png", optimize=True
        )


def write_assets() -> None:
    combos = all_combos()
    for gender in ("female", "male"):
        base = framed_base(gender)
        out_dir = WARP_DIR / gender
        out_dir.mkdir(parents=True, exist_ok=True)
        for option, ops in OPS.items():
            write_layer(render_layer(base, ops, gender), out_dir, option)
        for option, ops in FEATURE_COMPOSITES.items():
            write_layer(render_layer(base, ops, gender), out_dir, option)
        for face_id, chin_id, ops in combos:
            write_layer(render_layer(base, ops, gender), out_dir, combo_key(face_id, chin_id))
        print(
            f"  {gender}: {len(OPS)} options + {len(FEATURE_COMPOSITES)} composites "
            f"+ {len(combos)} face×chin "
            f"-> {out_dir.relative_to(ROOT)}"
        )


def write_ts_map() -> None:
    lines = [
        "// AUTO-GENERATED by scripts/build-gwansang-warps.py — do not edit by hand.",
        "import type { ImageSourcePropType } from 'react-native';",
        "",
        "import type { Gender } from '@/lib/types';",
        "",
        "/** 관상 옵션 → 원화를 국소 변형한 레이어. 없는 옵션은 원화 그대로가 정답이다. */",
        "export const PHYSIOGNOMY_WARPS: Record<Gender, Record<string, ImageSourcePropType>> = {",
    ]
    combo_names = [combo_key(face_id, chin_id) for face_id, chin_id, _ in all_combos()]
    for gender in ("female", "male"):
        lines.append(f"  {gender}: {{")
        for option in list(OPS) + list(FEATURE_COMPOSITES) + combo_names:
            path = f"@/assets/images/gwansang/warp/{gender}/{option}.png"
            lines.append(f"    {option}: require('{path}'),")
        lines.append("  },")
    lines += ["};", ""]
    TS_MAP.write_text("\n".join(lines), encoding="utf-8")
    print(f"  map -> {TS_MAP.relative_to(ROOT)}")


PREVIEW_CASES = [
    ("원화", {}),
    (
        "큰눈·두꺼운눈썹·넓은코·둥근형",
        {
            "eyes": "eyes_large_double_upturned",
            "eyebrows": "brow_straight_thick",
            "nose": "nose_high_wide",
            "face_shape": "face_round",
            "mouth": "mouth_large_full",
        },
    ),
    (
        "작은눈·가는눈썹·좁은코·하트형",
        {
            "eyes": "eyes_small_single_downturned",
            "eyebrows": "brow_arched_thin",
            "nose": "nose_low_narrow",
            "face_shape": "face_heart",
            "mouth": "mouth_small_thin",
        },
    ),
    (
        "이중턱만",
        {
            "chin": "chin_double",
        },
    ),
    (
        "긴형·이중턱",
        {
            "face_shape": "face_long",
            "chin": "chin_double",
        },
    ),
    (
        "작은 무쌍 처진눈·일자눈썹·각진턱",
        {
            "eyes": "eyes_small_single_downturned",
            "eyebrows": "brow_straight_thick",
            "chin": "chin_square",
            "nose": "nose_low_wide",
            "mouth": "mouth_large_full",
        },
    ),
]


def write_preview() -> None:
    cell_w, cell_h = 312, 408
    gap, top = 16, 34
    sheet = Image.new(
        "RGB",
        (gap + len(PREVIEW_CASES) * (cell_w + gap), top + 2 * (cell_h + top + gap)),
        (250, 248, 243),
    )
    draw = ImageDraw.Draw(sheet)
    for row, gender in enumerate(("female", "male")):
        for col, (label, selection) in enumerate(PREVIEW_CASES):
            x = gap + col * (cell_w + gap)
            y = top + row * (cell_h + top + gap)
            sheet.paste(composite(gender, selection).resize((cell_w, cell_h), Image.LANCZOS), (x, y))
            draw.text((x, y - 14), f"{gender} · {label}", fill=(60, 54, 48))
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(PREVIEW, optimize=True)
    print(f"  preview -> {PREVIEW.relative_to(ROOT)}")


def verify_neck() -> int:
    """Fail if a width warp kinks the neck.

    Face-shape sx continues into the neck so the jaw–neck line stays one stroke.
    Below NECK_JOIN the horizontal displacement may be non-zero (the neck can be
    a little thicker or thinner than 계란형) but it must not change with Y —
    a changing dx is exactly the 꺾임 the cutoff used to cause.
    """
    failures = 0
    for gender in ("female", "male"):
        h, w = WORK[1], WORK[0]
        row = neck_row(gender, h)
        ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
        for name, ops in list(OPS.items()) + list(FEATURE_COMPOSITES.items()) + [
            (combo_key(face_id, chin_id), ops) for face_id, chin_id, ops in all_combos()
        ]:
            for op in ops:
                if isinstance(op, Crease):
                    continue  # shading only, moves nothing
                op = amplify_op(op, gender)
                src_x, src_y, _ = displacement(op, pixel_box(op.box, gender, WORK), (h, w))
                dx = (src_x - xs)[row:]
                l0, l1, r0, r1 = NECK_EDGE_X[gender]
                edge = np.zeros(w, dtype=bool)
                edge[round(l0 * w) : round(l1 * w)] = True
                edge[round(r0 * w) : round(r1 * w)] = True
                dx_edge = dx[:, edge]
                y_var = float(np.ptp(dx_edge, axis=0).max()) if dx_edge.size else 0.0
                if y_var > 0.5:
                    failures += 1
                    print(
                        f"  ✗ {gender}/{name}: {op.box} kinks neck "
                        f"({y_var:.1f}px sideways change along Y)"
                    )
                sideways = float(np.abs(dx_edge).max()) if dx_edge.size else 0.0
                vertical = float(np.abs((src_y - ys)[row:][:, edge]).max()) if dx_edge.size else 0.0
                if sideways > 0.01:
                    print(
                        f"    {gender}/{name}: {op.box} neck width Δ {sideways:.1f}px "
                        f"(straight, ok)"
                    )
                if vertical:
                    print(f"    {gender}/{name}: {op.box} slides neck {vertical:.0f}px vertically")
    if not failures:
        print("  ✓ neck lines stay straight (no Y-kink below join)")
    return failures


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true", help="only write the contact sheet")
    parser.add_argument("--verify", action="store_true", help="check neck lines stay straight")
    args = parser.parse_args()

    if args.verify:
        raise SystemExit(1 if verify_neck() else 0)

    write_preview()
    if not args.preview:
        write_assets()
        write_ts_map()
        (WARP_DIR / "options.json").write_text(
            json.dumps(sorted({*OPS, *FEATURE_COMPOSITES}), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
