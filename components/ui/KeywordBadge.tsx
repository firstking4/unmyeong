import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { keywordPolarity } from '@/lib/keywordPolarity';

export function KeywordBadge({
  label,
  hits = 1,
  size = 'md',
  onPress,
}: {
  label: string;
  hits?: number;
  size?: 'md' | 'lg';
  onPress?: () => void;
}) {
  const c = Colors[useColorScheme() ?? 'light'];
  const text = label?.trim();
  if (!text) return null;

  const negative = keywordPolarity(text) === 'negative';
  const duplicate = hits > 1;

  const chipStyle = [
    styles.chip,
    {
      backgroundColor: negative ? c.keywordNegative : c.keywordPositive,
      borderWidth: duplicate ? 1.5 : 0,
      borderColor: duplicate
        ? negative
          ? c.keywordNegativeBorder
          : c.keywordPositiveBorder
        : 'transparent',
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
