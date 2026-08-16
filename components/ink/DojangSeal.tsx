import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { display } from '@/constants/Fonts';

const stamp = require('../../assets/images/ink/dojang.png');

type Props = {
  size?: number;
  color?: string;
  glyph?: string;
  /** Degrees — slight stamp tilt. Default 0 (upright). */
  rotate?: number;
};

/** Vermilion dojang — generated stamp, or drawn fallback for other glyphs. */
export function DojangSeal({ size = 22, color = '#B23A2F', glyph = '人', rotate = 0 }: Props) {
  const tilt = rotate !== 0 ? ([{ rotate: `${rotate}deg` }] as const) : undefined;

  if (glyph === '人') {
    return (
      <Image
        source={stamp}
        style={{ width: size, height: size, transform: tilt }}
        resizeMode="contain"
      />
    );
  }

  const inner = size - 5;
  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderColor: color,
          borderRadius: size * 0.09,
          transform: tilt,
        },
      ]}>
      <View
        style={[
          styles.inner,
          { width: inner, height: inner, borderColor: color, borderRadius: inner * 0.07 },
        ]}>
        <Text
          style={{
            fontFamily: display,
            color,
            fontSize: size * 0.52,
            lineHeight: size * 0.58,
            textAlign: 'center',
          }}>
          {glyph}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    borderWidth: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
