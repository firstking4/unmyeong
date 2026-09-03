import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

/** 팔괘 순서 (시계방향). 1=양(실선), 0=음(끊긴선). 안쪽→바깥. */
const TRIGRAMS: number[][] = [
  [1, 1, 1], // 乾
  [1, 1, 0], // 兌
  [1, 0, 1], // 離
  [1, 0, 0], // 震
  [0, 1, 1], // 巽
  [0, 1, 0], // 坎
  [0, 0, 1], // 艮
  [0, 0, 0], // 坤
];

type Props = {
  size?: number;
  color?: string;
};

function TrigramMarks({
  cx,
  cy,
  radius,
  color,
}: {
  cx: number;
  cy: number;
  radius: number;
  color: string;
}) {
  const lineW = radius * 0.22;
  const gap = radius * 0.055;
  const stroke = Math.max(2.2, radius * 0.045);

  return (
    <>
      {TRIGRAMS.map((tri, i) => {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return (
          <G key={i}>
            {tri.map((yang, row) => {
              const dist = radius - row * (stroke + gap) - stroke * 0.5;
              const x1 = cx + cos * dist - sin * (lineW / 2);
              const y1 = cy + sin * dist + cos * (lineW / 2);
              const x2 = cx + cos * dist + sin * (lineW / 2);
              const y2 = cy + sin * dist - cos * (lineW / 2);
              if (yang) {
                return (
                  <Line
                    key={row}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                  />
                );
              }
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              const dx = (x2 - x1) * 0.12;
              const dy = (y2 - y1) * 0.12;
              return (
                <G key={row}>
                  <Line
                    x1={x1}
                    y1={y1}
                    x2={mx - dx}
                    y2={my - dy}
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                  />
                  <Line
                    x1={mx + dx}
                    y1={my + dy}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                  />
                </G>
              );
            })}
          </G>
        );
      })}
    </>
  );
}

/** 천천히 도는 팔괘 — 크림 팝업용 (어두운 금빛). */
export function FortuneCastLoader({ size = 148, color = '#8B6914' }: Props) {
  const spin = useSharedValue(0);
  const glow = useSharedValue(0.45);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 7200, easing: Easing.linear }),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(glow);
    };
  }, [glow, spin]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.92 + glow.value * 0.12 }],
  }));

  const vb = 200;
  const cx = 100;
  const cy = 100;
  const r = 78;

  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityLabel="팔괘를 돌리는 중">
      <Animated.View style={[styles.glow, { backgroundColor: color }, glowStyle]} />
      <Animated.View style={spinStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={r + 8}
            stroke={color}
            strokeWidth={1.2}
            fill="none"
            opacity={0.35}
          />
          <Circle cx={cx} cy={cy} r={r - 28} stroke={color} strokeWidth={1} fill="none" opacity={0.4} />
          <TrigramMarks cx={cx} cy={cy} radius={r} color={color} />
          {/* 태극 */}
          <Circle cx={cx} cy={cy} r={18} fill={color} opacity={0.95} />
          <Path
            d={`M ${cx} ${cy - 18} A 18 18 0 0 1 ${cx} ${cy + 18} A 9 9 0 0 1 ${cx} ${cy} A 9 9 0 0 0 ${cx} ${cy - 18}`}
            fill="#F7F1E6"
          />
          <Circle cx={cx} cy={cy - 9} r={3.2} fill="#F7F1E6" />
          <Circle cx={cx} cy={cy + 9} r={3.2} fill={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '72%',
    height: '72%',
    borderRadius: 999,
  },
});
