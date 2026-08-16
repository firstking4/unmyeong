import Svg, { Line } from 'react-native-svg';

export function HamburgerIcon({ color, size = 22 }: { color: string; size?: number }) {
  const y = [5.5, 11, 16.5];
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      {y.map((v) => (
        <Line
          key={v}
          x1="3"
          y1={v}
          x2="19"
          y2={v}
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}
