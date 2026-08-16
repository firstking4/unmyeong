#!/usr/bin/env python3
"""Frame the two finished 수묵 portraits into 3:4 증명사진 assets.

Framing plus the baked base warps (`base_ops`): 기본 턱높이는 둥근 턱이고, 목은 원화보다
얇다. 앱은 이 정적 PNG 위에 옵션 레이어를 얹으므로 기본값은 여기서 바꿔야 한다.
원화에서 매번 다시 굽기 때문에 스크립트를 여러 번 돌려도 효과가 누적되지 않는다.

옷은 **원화에 그려져 있어야** 한다. 스크립트로 붓칠하거나 남성 셔츠 픽셀을 이식하는
건 둘 다 얼룩·틈으로 보여서 실패했고, 대신 여성 원화를 옷 입은 것으로 새로 받았다
(랩 프론트 V넥; 맨 어깨 버전은 `female-nude.bak.png`). 여밈은 `bottom=0.760` 아래라
카드에서는 목까지만 보이는데, 그 자리가 어깨로 넓어지는 구간이라 잘린 느낌은 안 난다.

An earlier version squeezed the neck with a strength that varied down the image; that
bends the neck's straight edges and read as a lumpy neck. `base_ops` keeps the scale
constant below the jaw (`fbot=0`), so every column shifts by the same amount and the
neck line stays straight.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "docs" / "design-samples" / "gwansang-source"
OUT_DIR = ROOT / "assets" / "images" / "gwansang" / "static"
WARPS = Path(__file__).resolve().parent / "build-gwansang-warps.py"

SIZES = {"": (104, 136), "@2x": (208, 272), "@3x": (312, 408)}
ASPECT = 3 / 4

# Where the head sits in each source painting, as fractions of the full canvas.
# 증명사진 프레이밍이라 위쪽은 머리를 살짝 자르고 아래는 목·쇄골에서 끊는다.
FRAMES = {
    "female": dict(top=0.030, bottom=0.760, center=0.500),
    # 머리는 자르지 않는다. 머리 위에 여백을 조금 두면 머리가 프레임 안에서 아래로
    # 내려앉아 증명사진처럼 보인다(원화 머리 끝이 0.015이라 0.005면 딱 걸린다).
    "male": dict(top=0.005, bottom=0.775, center=0.500),
    # 아직 아무 부위도 고르지 않은 상태에 쓰는 윤곽 한 획.
    "empty": dict(top=0.060, bottom=0.920, center=0.500),
}


def frame(image: Image.Image, top: float, bottom: float, center: float) -> Image.Image:
    w, h = image.size
    y0, y1 = round(h * top), round(h * bottom)
    height = y1 - y0
    width = round(height * ASPECT)
    cx = round(w * center)
    x0 = max(0, min(w - width, cx - width // 2))
    return image.convert("RGB").crop((x0, y0, x0 + width, y1))


def load_warps():
    """The 상자·워프 정의는 build-gwansang-warps.py 한 곳에만 둔다."""
    spec = importlib.util.spec_from_file_location("gwansang_warps", WARPS)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module  # dataclass 정의가 모듈 등록을 요구한다
    spec.loader.exec_module(module)
    return module


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    warps = load_warps()
    for gender, box in FRAMES.items():
        source = SRC_DIR / f"{gender}.png"
        if not source.exists():
            raise SystemExit(f"missing source art: {source.relative_to(ROOT)}")
        cropped = frame(Image.open(source), **box)
        if gender in warps.GENDER_SHIFT:  # empty 윤곽은 부위 상자가 없다
            cropped = warps.warp_image(cropped, warps.base_ops(gender), gender)
        for suffix, size in SIZES.items():
            cropped.resize(size, Image.LANCZOS).save(
                OUT_DIR / f"{gender}{suffix}.png", optimize=True
            )
        print(f"  {gender}: {cropped.size} -> {OUT_DIR.relative_to(ROOT)}/{gender}*.png")


if __name__ == "__main__":
    main()
