import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { color: string; size?: number };

/** 기와집 — 처마·용마루 실루엣 */
export function GiwaHomeIcon({ color, size = 26, filled }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 기와 지붕 */}
      <Path
        d="M3.5 11.2C5.2 8.4 8.2 6.2 12 5.2C15.8 6.2 18.8 8.4 20.5 11.2"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.8 12.4C5 10.2 8.2 8.6 12 8C15.8 8.6 19 10.2 21.2 12.4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 용마루 */}
      <Path
        d="M12 4.2V8"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      {/* 몸체 */}
      <Path
        d="M5.2 12.2V19.2H18.8V12.2"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.22 : 0}
      />
      {/* 문 */}
      <Path
        d="M10.2 19.2V15.1C10.2 14.2 10.9 13.5 11.8 13.5H12.2C13.1 13.5 13.8 14.2 13.8 15.1V19.2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 성향 — 사람 + 네 기운(혈액형·MBTI·별자리·띠) */
export function SeonghyangIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.1" stroke={color} strokeWidth={1.7} />
      <Path
        d="M6.2 19.2C6.8 15.8 9 13.8 12 13.8C15 13.8 17.2 15.8 17.8 19.2"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Circle cx="4.6" cy="7.2" r="1.15" fill={color} />
      <Circle cx="19.4" cy="7.2" r="1.15" fill={color} />
      <Circle cx="5.4" cy="14.6" r="1.15" fill={color} />
      <Circle cx="18.6" cy="14.6" r="1.15" fill={color} />
    </Svg>
  );
}

/** 사주 — 사주 팔자 느낌의 사각 격자와 점 */
export function SajuIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4.2" y="4.2" width="15.6" height="15.6" rx="2.2" stroke={color} strokeWidth={1.7} />
      <Path d="M12 4.2V19.8" stroke={color} strokeWidth={1.4} />
      <Path d="M4.2 12H19.8" stroke={color} strokeWidth={1.4} />
      <Circle cx="8.1" cy="8.1" r="1.05" fill={color} />
      <Circle cx="15.9" cy="8.1" r="1.05" fill={color} />
      <Circle cx="8.1" cy="15.9" r="1.05" fill={color} />
      <Circle cx="15.9" cy="15.9" r="1.05" fill={color} />
    </Svg>
  );
}

/** 타로 — 기울어진 카드 두 장 */
export function TarotIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.2 5.4L15.6 3.6C16.5 3.4 17.4 3.9 17.6 4.8L19.4 13.6C19.6 14.5 19.1 15.4 18.2 15.6L10.8 17.4C9.9 17.6 9 17.1 8.8 16.2L7 7.4C6.8 6.5 7.3 5.6 8.2 5.4Z"
        stroke={color}
        strokeWidth={1.55}
        strokeLinejoin="round"
      />
      <Path
        d="M6.4 7.8L5.2 8.6C4.4 9.1 4.1 10.1 4.6 10.9L9.4 18.6C9.9 19.4 10.9 19.7 11.7 19.2L12.6 18.6"
        stroke={color}
        strokeWidth={1.55}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="13.6" cy="10.2" r="1.35" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

/** 관상 — 얼굴 윤곽 실루엣 */
export function GwansangIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4.8C8.8 4.8 6.2 7.1 5.6 10.2C5.1 13.1 6.4 15.8 8.8 17.2C9.8 17.8 10.9 18.2 12 18.2C13.1 18.2 14.2 17.8 15.2 17.2C17.6 15.8 18.9 13.1 18.4 10.2C17.8 7.1 15.2 4.8 12 4.8Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M9.2 11.2C9.5 11.8 10.2 12.2 11 12.2C11.8 12.2 12.5 11.8 12.8 11.2"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M10.8 14.6C11.2 15.1 11.6 15.3 12 15.3C12.4 15.3 12.8 15.1 13.2 14.6"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
