#!/usr/bin/env python3
"""메이저 카드 원본에서 바깥 흰 여백·하단 라벨을 제외한 그림만 잘라 낸다.

입력: `assets/images/tarot/major-src/00.png` … `21.png`
크기 기준: `assets/images/tarot/major-sample-size.png`
출력: `assets/images/tarot/major/00.png` … `21.png`
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets/images/tarot/major-src'
OUT = ROOT / 'assets/images/tarot/major'
SAMPLE = ROOT / 'assets/images/tarot/major-sample-size.png'


def _profiles(im: Image.Image):
    a = np.array(im).astype(float)
    mean = a.mean(axis=2)
    spread = a.max(axis=2) - a.min(axis=2)
    paper = (mean >= 192) & (spread <= 30)
    dark = mean < 105
    label_like = (mean > 145) & (spread < 50)
    return paper, dark, label_like


def _paper_box(paper: np.ndarray, lim: float = 0.7) -> tuple[int, int, int, int]:
    cf, rf = paper.mean(axis=0), paper.mean(axis=1)

    def first(f: np.ndarray, forward: bool) -> int:
        it = range(len(f)) if forward else range(len(f) - 1, -1, -1)
        for i in it:
            if f[i] < lim:
                return i
        return 0 if forward else len(f) - 1

    return first(cf, True), first(rf, True), first(cf, False), first(rf, False)


def art_box(im: Image.Image, ratio: float) -> tuple[int, int, int, int]:
    """그림 영역. 좌·우·상은 검은 테두리선, 하단은 덱 고유 비율로 정한다."""
    paper, dark, _ = _profiles(im)
    h, w = dark.shape
    l0, t0, r0, b0 = _paper_box(paper)
    band = max(24, int(min(w, h) * 0.09))
    y0, y1 = t0 + int((b0 - t0) * 0.2), t0 + int((b0 - t0) * 0.8)
    x0, x1 = l0 + int((r0 - l0) * 0.2), l0 + int((r0 - l0) * 0.8)

    def scan_v(start: int, stop: int, step: int) -> int | None:
        for x in range(start, stop, step):
            if 0 <= x < w and dark[y0:y1, x].mean() > 0.22:
                return x
        return None

    def scan_h(start: int, stop: int, step: int) -> int | None:
        for y in range(start, stop, step):
            if 0 <= y < h and dark[y, x0:x1].mean() > 0.22:
                return y
        return None

    left = scan_v(max(0, l0 - 3), min(w, l0 + band), 1)
    right = scan_v(min(w - 1, r0 + 3), max(-1, r0 - band), -1)
    top = scan_h(max(0, t0 - 3), min(h, t0 + band), 1)
    left = l0 + 1 if left is None else left
    right = r0 - 1 if right is None else right
    top = t0 + 1 if top is None else top

    bottom = min(h - 1, top + int(round((right - left + 1) / ratio)))
    return left, top, right, bottom


def trim_label_remnant(art: Image.Image) -> Image.Image:
    """비율로 자른 뒤 남은 라벨 흔적(구분선·회색 띠·글자 윗부분)을 걷어낸다."""
    _, dark, label_like = _profiles(art)
    w, h = art.size
    x0, x1 = int(w * 0.1), int(w * 0.9)
    label_rows = label_like[:, x0:x1].mean(axis=1)
    dark_rows = dark[:, x0:x1].mean(axis=1)
    cut = h
    limit = int(h * 0.90)

    # 회색 라벨 띠가 그림 아래에 남아 있으면 그 위쪽까지만 남긴다.
    y = h - 1
    while y >= limit and label_rows[y] > 0.6:
        cut = y
        y -= 1

    # 라벨 구분선만 남은 경우: 선 아래가 라벨(밝은 띠)일 때만 자른다.
    for y in range(limit, cut - 3):
        if dark_rows[y] > 0.45 and label_rows[y + 1:cut].mean() > 0.5:
            cut = y
            break

    return art if cut == h else art.crop((0, 0, w, cut))


def fit_cover(art: Image.Image, tw: int, th: int) -> Image.Image:
    cw, ch = art.size
    scale = max(tw / cw, th / ch)
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    resized = art.resize((nw, nh), Image.Resampling.LANCZOS)
    ox, oy = (nw - tw) // 2, (nh - th) // 2
    return resized.crop((ox, oy, ox + tw, oy + th))


def main() -> None:
    tw, th = Image.open(SAMPLE).size if SAMPLE.exists() else (279, 400)
    ratio = tw / th
    sources = sorted(SRC.glob('[0-9][0-9].png'))
    if len(sources) != 22:
        raise SystemExit(f'expected 22 sources in {SRC}, found {len(sources)}')

    OUT.mkdir(parents=True, exist_ok=True)
    for path in sources:
        im = Image.open(path).convert('RGB')
        left, top, right, bottom = art_box(im, ratio)
        art = trim_label_remnant(im.crop((left + 2, top + 2, right - 1, bottom - 1)))
        fit_cover(art, tw, th).save(OUT / path.name, optimize=True)
        print(f'{path.stem} art={art.size[0]}x{art.size[1]} -> {tw}x{th}')
    print(f'wrote {len(sources)} cards → {OUT}')


if __name__ == '__main__':
    main()
