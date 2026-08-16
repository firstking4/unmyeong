#!/usr/bin/env python3
"""Generate tab bar icons (default mist + active seal).

Clean silhouettes — no stamp erosion. Current selection (50-후보 원안):

  지도  인장 — brand dojang (人), shared with scripts/generate-seal-icon.py
  성향  21 인물기운 — person + sparkles
  사주  30 오행링 — five-element ring
  타로  05 카드달 — card with crescent
  궁합  46 두원 — overlapping circles (from seonghyang sheet)

Candidates live under scripts/icon_candidates/; swap the PICKS below then run
`npm run icons:tabs`. See .cursor/rules/tab-icons.mdc.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images" / "tabs"
SCRIPTS = Path(__file__).resolve().parent

sys.path.insert(0, str(SCRIPTS))

from PIL import Image  # noqa: E402

from icon_candidates import saju, seonghyang, tarot  # noqa: E402
from icon_kit import Icon  # noqa: E402

SIZE = 144
# 인장은 캔버스를 거의 채우므로, 나머지 도형도 비슷한 광학 크기로 맞춘다.
CONTENT_FILL = 0.90
MIST = (138, 130, 120)
SEAL = (178, 58, 47)

# 1-based indices into each tab's 50-candidate sheet (원안).
PICKS = {
    "seonghyang": (seonghyang, 21),
    "saju": (saju, 30),
    "tarot": (tarot, 5),
    "gunghap": (seonghyang, 46),  # 두원 — 겹친 원
}


def _load_seal_module():
    path = SCRIPTS / "generate-seal-icon.py"
    spec = importlib.util.spec_from_file_location("seal_icon", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def render_home(color: tuple[int, int, int]) -> Image.Image:
    """인장 — the brand seal itself, tinted for the tab state (slight stamp tilt)."""
    alpha = _load_seal_module().seal_alpha(SIZE)
    # Match in-app DojangSeal title/card tilt (~−8°).
    alpha = alpha.rotate(-8, resample=Image.BICUBIC, expand=False, fillcolor=0)
    image = Image.new("RGBA", (SIZE, SIZE), (*color, 0))
    image.putalpha(alpha)
    return image


def fit_to_canvas(image: Image.Image, fill: float = CONTENT_FILL) -> Image.Image:
    """Crop to ink and scale so the longest side fills `fill` of the canvas."""
    bbox = image.split()[-1].getbbox()
    if not bbox:
        return image
    cropped = image.crop(bbox)
    cw, ch = cropped.size
    target = max(1, int(SIZE * fill))
    scale = target / max(cw, ch)
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    resized = cropped.resize((nw, nh), Image.LANCZOS)
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(resized, ((SIZE - nw) // 2, (SIZE - nh) // 2), resized)
    return out


def render_pick(module, number: int, color: tuple[int, int, int]) -> tuple[str, Image.Image]:
    name, fn = module.CANDIDATES[number - 1]
    icon = Icon(size=SIZE)
    fn(icon)
    return name, fit_to_canvas(icon.result(color))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    render_home(MIST).save(OUT / "home.png", optimize=True)
    render_home(SEAL).save(OUT / "home-active.png", optimize=True)

    labels = []
    for slug, (module, number) in PICKS.items():
        name, mist = render_pick(module, number, MIST)
        _, seal = render_pick(module, number, SEAL)
        mist.save(OUT / f"{slug}.png", optimize=True)
        seal.save(OUT / f"{slug}-active.png", optimize=True)
        labels.append(f"{slug}={number:02d} {name}")

    print(f"Wrote {2 + len(PICKS) * 2} icons to {OUT.relative_to(ROOT)}")
    print("  " + " · ".join(labels))


if __name__ == "__main__":
    main()
