import Svg, { Path } from 'react-native-svg';

/** 목록 즐겨찾기(고정) — filled=활성 */
export function StarIcon({
  color,
  size = 16,
  filled = false,
}: {
  color: string;
  size?: number;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.2l2.35 5.55 6.05.55-4.55 4.05 1.4 5.85L12 16.2l-5.25 3 1.4-5.85-4.55-4.05 6.05-.55L12 3.2z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}
