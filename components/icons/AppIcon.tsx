import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Svg, { Path } from 'react-native-svg';

/**
 * 앱 공통 아이콘 — Material (Apache-2.0).
 */

export type IconProps = {
  color: string;
  size?: number;
};

/** Material Symbols `share_windows` — 폰트 세트에 없어 path로 넣는다. */
export function ShareIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        fill={color}
        d="M280-360v-240q0-33 23.5-56.5T360-680h326L583-783l57-57 200 200-200 200-57-56 103-104H360v240h-80Zm-80 240q-33 0-56.5-23.5T120-200v-600h80v600h480v-160h80v160q0 33-23.5 56.5T680-120H200Z"
      />
    </Svg>
  );
}

export function CopyIcon({ color, size = 20 }: IconProps) {
  return <MaterialIcons name="content-copy" size={size} color={color} />;
}

export function CloseIcon({ color, size = 26 }: IconProps) {
  return <MaterialIcons name="close" size={size} color={color} />;
}

export function BackIcon({ color, size = 26 }: IconProps) {
  return <MaterialIcons name="arrow-back" size={size} color={color} />;
}

export function ResetIcon({ color, size = 22 }: IconProps) {
  return <MaterialIcons name="refresh" size={size} color={color} />;
}

export function HamburgerIcon({ color, size = 22 }: IconProps) {
  return <MaterialIcons name="menu" size={size} color={color} />;
}

export function ChevronRightIcon({ color, size = 22 }: IconProps) {
  return <MaterialIcons name="chevron-right" size={size} color={color} />;
}

export function LockIcon({ color, size = 22 }: IconProps) {
  return <MaterialIcons name="lock" size={size} color={color} />;
}

export function StarIcon({
  color,
  size = 16,
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <MaterialIcons
      name={filled ? 'star' : 'star-border'}
      size={size}
      color={color}
    />
  );
}

export { MaterialIcons };
