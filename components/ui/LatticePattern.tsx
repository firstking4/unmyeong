import Svg, { Path, Rect } from 'react-native-svg';

type Props = {
  color?: string;
  opacity?: number;
};

/** 창살·만(卍) 느낌의 아주 옅은 전통 격자 패턴. */
export function LatticePattern({ color = '#C4A574', opacity = 0.12 }: Props) {
  const cell = 28;
  const d = [
    `M0 14 H28 M14 0 V28`,
    `M4 4 H10 V10 H4 Z`,
    `M18 4 H24 V10 H18 Z`,
    `M4 18 H10 V24 H4 Z`,
    `M18 18 H24 V24 H18 Z`,
  ].join(' ');

  return (
    <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
      <Rect width="100%" height="100%" fill="transparent" />
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 6 }).map((__, col) => (
          <Path
            key={`${row}-${col}`}
            d={d}
            transform={`translate(${col * cell}, ${row * cell})`}
            stroke={color}
            strokeWidth={1}
            fill="none"
            opacity={opacity}
          />
        )),
      )}
    </Svg>
  );
}
