import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { radius, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  title: string;
  description?: string;
  ctaLabel?: string;
  onPress?: () => void;
  /** 해금 후 본문. 있으면 같은 박스 안에 타이틀+본문만 보여 준다. */
  children?: ReactNode;
};

/**
 * 보상형 광고 연동 전·후 공통으로 쓰는 상세 잠금 UI.
 * 잠금 중에는 본문·힌트 미리보기를 넣지 않는다.
 * 해금 후에도 같은 박스 셸을 유지하고 children으로 풀이를 넣는다.
 * 광고 미연동 구간에서는 onPress로 바로 해금하는 스탠드인을 쓸 수 있다.
 */
export function LockedContentCard({ title, description, ctaLabel, onPress, children }: Props) {
  const c = Colors[useColorScheme() ?? 'light'];
  const unlocked = Boolean(children);

  return (
    <View style={[styles.card, { borderColor: c.hairline, backgroundColor: c.card }]}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        {!unlocked && description ? (
          <Text style={[styles.description, { color: c.muted }]}>{description}</Text>
        ) : null}
      </View>
      {unlocked ? <View style={styles.body}>{children}</View> : null}
      {!unlocked && ctaLabel ? (
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={({ pressed }) => [
            styles.cta,
            { borderColor: c.tint, opacity: !onPress ? 0.5 : pressed ? 0.7 : 1 },
          ]}>
          <Text style={[styles.ctaText, { color: c.tint }]}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: 14,
    gap: 10,
  },
  copy: { gap: 3 },
  title: { ...tabSection.detailLabel, fontSize: 14, lineHeight: 20 },
  description: { ...tabSection.detailHint, fontSize: 13, lineHeight: 19 },
  body: { ...tabSection.detailStack },
  cta: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaText: { fontSize: 13, fontWeight: '700' },
});
