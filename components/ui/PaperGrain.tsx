import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/** Hanji grain — faint speckle only (no laid lines). */
export function PaperGrain({ color }: { color: string }) {
  const { width, height } = useWindowDimensions();
  const dots = 42;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {Array.from({ length: dots }, (_, i) => (
          <Circle
            key={`d-${i}`}
            cx={((i * 97) % Math.max(width, 1)) + (i % 7) * 3}
            cy={((i * 53) % Math.max(height, 1)) + (i % 5) * 5}
            r={i % 3 === 0 ? 1.1 : 0.7}
            fill={color}
            opacity={0.04}
          />
        ))}
      </Svg>
    </View>
  );
}
