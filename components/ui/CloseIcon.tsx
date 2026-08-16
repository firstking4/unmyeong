import Svg, { Line } from 'react-native-svg';

export function CloseIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Line
        x1="5.5"
        y1="5.5"
        x2="16.5"
        y2="16.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="16.5"
        y1="5.5"
        x2="5.5"
        y2="16.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
