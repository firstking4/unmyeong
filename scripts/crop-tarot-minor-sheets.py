#!/usr/bin/env python3
"""마이너 아르카나 시트에서 카드별 그림을 메이저 규격(279×400)으로 잘라 낸다.

입력 시트:
  assets/images/tarot/sheets/{wands,cups,swords,pentacles}.png
크기 기준: assets/images/tarot/major-sample-size.png
출력:
  assets/images/tarot/{suit}/{01..10,page,knight,queen,king}.png
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / 'assets/images/tarot/sheets'
SAMPLE = ROOT / 'assets/images/tarot/major-sample-size.png'
OUT_ROOT = ROOT / 'assets/images/tarot'

CARD_NAMES = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    'page',
    'knight',
    'queen',
    'king',
]


def bands_from_gap(vals: np.ndarray, thr: float = 210, min_w: int = 40) -> list[tuple[int, int]]:
    gap = vals >= thr
    out: list[tuple[int, int]] = []
    start: int | None = None
    for i, g in enumerate(gap):
        if not g and start is None:
            start = i
        if g and start is not None:
            if i - 1 - start + 1 >= min_w:
                out.append((start, i - 1))
            start = None
    if start is not None and len(vals) - 1 - start + 1 >= min_w:
        out.append((start, len(vals) - 1))
    return out


def sheet_cells(im: Image.Image) -> list[tuple[int, int, int, int]]:
    mean = np.array(im.convert('RGB')).astype(float).mean(axis=2)
    vb = bands_from_gap(mean.mean(axis=0))
    hb = bands_from_gap(mean.mean(axis=1), min_w=80)
    if len(vb) != 7 or len(hb) != 2:
        raise SystemExit(f'expected 7×2 grid, got v={len(vb)} h={len(hb)}')
    return [(L, T, R, B) for T, B in hb for L, R in vb]


def cell_art(cell: Image.Image, ratio: float) -> Image.Image:
    """흰 여백·하단 라벨 제외. 좌우는 카드 외곽, 하단은 메이저 비율."""
    a = np.array(cell.convert('RGB')).astype(float)
    mean = a.mean(axis=2)
    paper = mean >= 220
    dark = mean < 115
    h, w = mean.shape
    content = ~paper
    cols = content.mean(axis=0)
    rows = content.mean(axis=1)

    def first(f: np.ndarray, forward: bool, lim: float = 0.12) -> int:
        it = range(len(f)) if forward else range(len(f) - 1, -1, -1)
        for i in it:
            if f[i] > lim:
                return i
        return 0 if forward else len(f) - 1

    left0 = first(cols, True)
    top0 = first(rows, True)
    right0 = first(cols, False)
    bottom0 = first(rows, False)

    left, right = left0, right0
    band = max(8, int(h * 0.12))
    x0 = left0 + int((right0 - left0) * 0.2)
    x1 = left0 + int((right0 - left0) * 0.8)
    top = top0
    for y in range(max(0, top0 - 1), min(h, top0 + band)):
        if dark[y, x0:x1].mean() > 0.18:
            top = y
            break

    width = right - left + 1
    bottom = min(bottom0 - 1, top + int(round(width / ratio)))
    l2, t2 = left + 2, top + 2
    r2, b2 = right - 2, bottom - 1
    l2 = max(0, l2)
    t2 = max(0, t2)
    r2 = min(w - 1, r2)
    b2 = min(h - 1, b2)
    return cell.crop((l2, t2, r2 + 1, b2 + 1))


def fit_cover(art: Image.Image, tw: int, th: int) -> Image.Image:
    cw, ch = art.size
    scale = max(tw / cw, th / ch)
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    resized = art.resize((nw, nh), Image.Resampling.LANCZOS)
    ox, oy = (nw - tw) // 2, (nh - th) // 2
    return resized.crop((ox, oy, ox + tw, oy + th))


def process_suit(suit: str, sheet_path: Path, tw: int, th: int) -> None:
    im = Image.open(sheet_path).convert('RGB')
    out_dir = OUT_ROOT / suit
    out_dir.mkdir(parents=True, exist_ok=True)
    ratio = tw / th
    cells = sheet_cells(im)
    if len(cells) != 14:
        raise SystemExit(f'{suit}: expected 14 cells, got {len(cells)}')
    for name, (L, T, R, B) in zip(CARD_NAMES, cells):
        cell = im.crop((L, T, R + 1, B + 1))
        art = cell_art(cell, ratio)
        fit_cover(art, tw, th).save(out_dir / f'{name}.png', optimize=True)
        print(f'{suit}/{name} art={art.size[0]}x{art.size[1]} -> {tw}x{th}')


def main() -> None:
    tw, th = Image.open(SAMPLE).size if SAMPLE.exists() else (279, 400)
    suits = ('wands', 'cups', 'swords', 'pentacles')
    for suit in suits:
        path = SHEETS / f'{suit}.png'
        if not path.exists():
            raise SystemExit(f'missing sheet: {path}')
        process_suit(suit, path, tw, th)
    print(f'done → {OUT_ROOT}/{{{",".join(suits)}}}/')


if __name__ == '__main__':
    main()
