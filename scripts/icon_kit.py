"""Drawing kit for tab icon candidates.

Built to the convention commercial icon sets use: a 24-unit grid, ~1.8-unit
strokes (the "2px on 24" look), round caps and joins, and outline-first shapes
with a few solid accents. Weights are given in GRID units — not pixels — so an
icon keeps its optical weight whatever the export size is.

Coordinates are grid units with the origin at the top-left of the drawing box;
`ink=False` erases, which is how counters and knockouts are carved.
"""

from __future__ import annotations

import math

from PIL import Image, ImageDraw

GRID = 24
STROKE = 1.8
HAIR = 1.25


class Icon:
    def __init__(self, size: int = 144, pad: int = 8, supersample: int = 4) -> None:
        self.size = size
        self.pad = pad
        self.ss = supersample
        self.canvas = size * supersample
        self.mask = Image.new("L", (self.canvas, self.canvas), 0)
        self.draw = ImageDraw.Draw(self.mask)

    # ── unit conversion ──────────────────────────────────────────────
    def p(self, v: float) -> float:
        """Grid coordinate → canvas pixel."""
        return (self.pad + v / GRID * (self.size - self.pad * 2)) * self.ss

    def l(self, v: float) -> float:  # noqa: E743 - short on purpose, used everywhere
        """Grid length → canvas pixels."""
        return v / GRID * (self.size - self.pad * 2) * self.ss

    def _box(self, cx: float, cy: float, rx: float, ry: float) -> list[float]:
        return [self.p(cx - rx), self.p(cy - ry), self.p(cx + rx), self.p(cy + ry)]

    def _fill(self, ink: bool) -> int:
        return 255 if ink else 0

    # ── solid shapes ─────────────────────────────────────────────────
    def disc(self, cx: float, cy: float, r: float, ink: bool = True) -> None:
        self.draw.ellipse(self._box(cx, cy, r, r), fill=self._fill(ink))

    def oval(self, cx: float, cy: float, rx: float, ry: float, ink: bool = True) -> None:
        self.draw.ellipse(self._box(cx, cy, rx, ry), fill=self._fill(ink))

    def rect(
        self,
        cx: float,
        cy: float,
        w: float,
        h: float,
        radius: float = 0,
        ink: bool = True,
    ) -> None:
        box = self._box(cx, cy, w / 2, h / 2)
        if radius:
            self.draw.rounded_rectangle(box, radius=self.l(radius), fill=self._fill(ink))
        else:
            self.draw.rectangle(box, fill=self._fill(ink))

    def poly(self, pts: list[tuple[float, float]], ink: bool = True) -> None:
        flat = [c for x, y in pts for c in (self.p(x), self.p(y))]
        self.draw.polygon(flat, fill=self._fill(ink))

    # ── strokes ──────────────────────────────────────────────────────
    def line(
        self,
        pts: list[tuple[float, float]],
        w: float = STROKE,
        ink: bool = True,
        cap: bool = True,
        close: bool = False,
    ) -> None:
        path = list(pts) + ([pts[0]] if close else [])
        flat = [c for x, y in path for c in (self.p(x), self.p(y))]
        self.draw.line(flat, fill=self._fill(ink), width=max(1, round(self.l(w))), joint="curve")
        if cap:
            # PIL has no round caps or joins; discs at the vertices supply both.
            for x, y in path:
                self.disc(x, y, w / 2, ink)

    def ring(self, cx: float, cy: float, r: float, w: float = STROKE, ink: bool = True) -> None:
        self.oval_ring(cx, cy, r, r, w, ink)

    def oval_ring(
        self, cx: float, cy: float, rx: float, ry: float, w: float = STROKE, ink: bool = True
    ) -> None:
        self.draw.ellipse(
            self._box(cx, cy, rx, ry), outline=self._fill(ink), width=max(1, round(self.l(w)))
        )

    def rect_ring(
        self,
        cx: float,
        cy: float,
        width: float,
        height: float,
        radius: float = 0,
        w: float = STROKE,
        ink: bool = True,
    ) -> None:
        box = self._box(cx, cy, width / 2, height / 2)
        pen = max(1, round(self.l(w)))
        if radius:
            self.draw.rounded_rectangle(
                box, radius=self.l(radius), outline=self._fill(ink), width=pen
            )
        else:
            self.draw.rectangle(box, outline=self._fill(ink), width=pen)

    def arc(
        self,
        cx: float,
        cy: float,
        rx: float,
        ry: float,
        start: float,
        end: float,
        w: float = STROKE,
        ink: bool = True,
        cap: bool = True,
    ) -> None:
        self.draw.arc(
            self._box(cx, cy, rx, ry),
            start,
            end,
            fill=self._fill(ink),
            width=max(1, round(self.l(w))),
        )
        if cap:
            for a in (start, end):
                rad = math.radians(a)
                self.disc(cx + rx * math.cos(rad), cy + ry * math.sin(rad), w / 2, ink)

    def poly_ring(
        self, pts: list[tuple[float, float]], w: float = STROKE, ink: bool = True
    ) -> None:
        self.line(pts, w=w, ink=ink, close=True)

    # ── composite motifs ─────────────────────────────────────────────
    def ngon(self, cx: float, cy: float, r: float, n: int, rot: float = -90) -> list[tuple[float, float]]:
        return [
            (cx + r * math.cos(math.radians(rot + i * 360 / n)),
             cy + r * math.sin(math.radians(rot + i * 360 / n)))
            for i in range(n)
        ]

    def star_pts(
        self, cx: float, cy: float, r_out: float, r_in: float, n: int = 5, rot: float = -90
    ) -> list[tuple[float, float]]:
        pts = []
        for i in range(n * 2):
            a = math.radians(rot + i * 180 / n)
            r = r_out if i % 2 == 0 else r_in
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        return pts

    def star(
        self,
        cx: float,
        cy: float,
        r_out: float,
        r_in: float,
        n: int = 5,
        rot: float = -90,
        fill: bool = True,
        w: float = STROKE,
        ink: bool = True,
    ) -> None:
        pts = self.star_pts(cx, cy, r_out, r_in, n, rot)
        if fill:
            self.poly(pts, ink)
        else:
            self.poly_ring(pts, w, ink)

    def rays(
        self,
        cx: float,
        cy: float,
        r0: float,
        r1: float,
        n: int,
        w: float = STROKE,
        rot: float = -90,
        ink: bool = True,
    ) -> None:
        for i in range(n):
            a = math.radians(rot + i * 360 / n)
            self.line(
                [(cx + r0 * math.cos(a), cy + r0 * math.sin(a)),
                 (cx + r1 * math.cos(a), cy + r1 * math.sin(a))],
                w=w,
                ink=ink,
            )

    def dots_around(
        self, cx: float, cy: float, r: float, n: int, dot: float, rot: float = -90, ink: bool = True
    ) -> None:
        for x, y in self.ngon(cx, cy, r, n, rot):
            self.disc(x, y, dot, ink)

    def crescent(self, cx: float, cy: float, r: float, shift: float, ink: bool = True) -> None:
        """Solid moon: a disc with a second disc bitten out of its right side."""
        self.disc(cx, cy, r, ink)
        self.disc(cx + shift, cy - shift * 0.25, r, not ink)

    def taegeuk(self, cx: float, cy: float, r: float) -> None:
        self.disc(cx, cy, r)
        self.draw.pieslice(self._box(cx, cy, r, r), 90, 270, fill=0)
        self.disc(cx, cy - r / 2, r / 2)
        self.disc(cx, cy + r / 2, r / 2, ink=False)
        self.disc(cx, cy - r / 2, r / 6, ink=False)
        self.disc(cx, cy + r / 2, r / 6)

    def card(
        self,
        cx: float,
        cy: float,
        w: float,
        h: float,
        weight: float = STROKE,
        radius: float = 1.4,
        tilt: float = 0,
        keyline: bool = False,
    ) -> None:
        """Outlined tarot card; `tilt` fans it around its own bottom centre."""
        corners = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
        if tilt:
            rad = math.radians(tilt)
            pivot_y = h / 2
            rotated = []
            for x, y in corners:
                y -= pivot_y
                rotated.append(
                    (x * math.cos(rad) - y * math.sin(rad),
                     x * math.sin(rad) + y * math.cos(rad) + pivot_y)
                )
            corners = rotated
            self.poly_ring([(cx + x, cy + y) for x, y in corners], weight)
        else:
            self.rect_ring(cx, cy, w, h, radius=radius, w=weight)
        if keyline:
            self.rect_ring(cx, cy, w - 2.4, h - 2.4, radius=max(0.6, radius - 0.7), w=HAIR)

    def eye(self, cx: float, cy: float, rx: float, ry: float, w: float = STROKE, pupil: float = 1.5) -> None:
        """Almond eye from two mirrored arcs plus an iris."""
        self.arc(cx, cy, rx, ry, 200, 340, w)
        self.arc(cx, cy, rx, ry, 20, 160, w)
        self.ring(cx, cy, pupil, w * 0.9)
        self.disc(cx, cy, pupil * 0.42)

    def face(self, cx: float, cy: float, rx: float, ry: float, w: float = STROKE) -> None:
        """Outlined face: rounded skull into a tapered jaw."""
        self.arc(cx, cy - ry * 0.15, rx, ry * 0.85, 180, 360, w, cap=False)
        self.line(
            [(cx - rx, cy - ry * 0.15), (cx - rx * 0.92, cy + ry * 0.35),
             (cx - rx * 0.5, cy + ry * 0.88), (cx, cy + ry),
             (cx + rx * 0.5, cy + ry * 0.88), (cx + rx * 0.92, cy + ry * 0.35),
             (cx + rx, cy - ry * 0.15)],
            w=w,
        )

    def trigram(self, cx: float, cy: float, width: float, gap: float, broken: list[bool], w: float = 2.2) -> None:
        for i, is_broken in enumerate(broken):
            y = cy + (i - (len(broken) - 1) / 2) * gap
            if is_broken:
                self.line([(cx - width / 2, y), (cx - width * 0.12, y)], w=w)
                self.line([(cx + width * 0.12, y), (cx + width / 2, y)], w=w)
            else:
                self.line([(cx - width / 2, y), (cx + width / 2, y)], w=w)

    # ── output ───────────────────────────────────────────────────────
    def result(self, color: tuple[int, int, int]) -> Image.Image:
        image = Image.new("RGBA", (self.canvas, self.canvas), (*color, 0))
        image.putalpha(self.mask)
        return image.resize((self.size, self.size), Image.LANCZOS)
