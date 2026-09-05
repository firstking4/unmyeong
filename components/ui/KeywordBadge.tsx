import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { keywordPolarity } from '@/lib/keywordPolarity';
import type { KeywordTone } from '@/lib/tarotKeywordTone';

export function KeywordBadge({
  label,
  hits = 1,
  size = 'md',
  onPress,
  tone,
}: {
  label: string;
  hits?: number;
  size?: 'md' | 'lg';
  onPress?: () => void;
  /** 있으면 이 톤을 쓰고, 없으면 기존 긍정/부정 이분. */
  tone?: KeywordTone;
}) {
  const c = Colors[useColorScheme() ?? 'light'];
  const text = label?.trim();
  if (!text) return null;

  const resolved: KeywordTone = tone ?? keywordPolarity(text);
  const fill =
    resolved === 'negative'
      ? c.keywordNegative
      : resolved === 'neutral'
        ? c.keywordNeutral
        : c.keywordPositive;
  const stroke =
    resolved === 'negative'
      ? c.keywordNegativeBorder
      : resolved === 'neutral'
        ? c.keywordNeutralBorder
        : c.keywordPositiveBorder;
  const duplicate = hits > 1;

  const chipStyle = [
    styles.chip,
    {
      backgroundColor: fill,
      borderWidth: duplicate ? 1.5 : 0,
      borderColor: duplicate ? stroke : 'transparent',
    },
  ];
  const labelText = (
    <Text style={[size === 'lg' ? styles.textLg : styles.text, { color: c.text }]}>{text}</Text>
  );

  if (!onPress) return <View style={chipStyle}>{labelText}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text} 키워드 보기`}
      accessibilityHint="이 키워드의 탭으로 이동합니다"
      onPress={onPress}
      style={({ pressed }) => [chipStyle, pressed && styles.pressed]}>
      {labelText}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textLg: {
    fontSize: 13,
    fontWeight: '600',
  },
});
