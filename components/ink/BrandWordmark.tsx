import { StyleSheet, Text, View } from 'react-native';

import { DojangSeal } from '@/components/ink/DojangSeal';
import { display } from '@/constants/Fonts';

type Props = {
  tint: string;
  text: string;
  /** Matches header (~22) or a slightly smaller share-card mark. */
  size?: 'header' | 'card';
};

/** 운명 + 人 인장 + 지도 — 헤더·공유 카드 공통 워드마크. */
export function BrandWordmark({ tint, text, size = 'header' }: Props) {
  const fontSize = size === 'header' ? 22 : 18;
  const lineHeight = size === 'header' ? 30 : 24;
  const seal = size === 'header' ? 22 : 18;

  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="운명人지도">
      <Text
        maxFontSizeMultiplier={1.2}
        style={[styles.glyph, { fontSize, lineHeight, color: text }]}>
        운명
      </Text>
      <DojangSeal size={seal} color={tint} rotate={-8} />
      <Text
        maxFontSizeMultiplier={1.2}
        style={[styles.glyph, { fontSize, lineHeight, color: text }]}>
        지도
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  glyph: {
    fontFamily: display,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
});
