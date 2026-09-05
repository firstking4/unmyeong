import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

export function profileNeededBody(thenWhat: string) {
  return `내 프로필이 필요해요. 지도 탭 신분증에 이름과 생년월일을 입력하면 ${thenWhat}`;
}

/** 빈 프로필일 때 지도 신분증으로 보내는 공통 CTA. */
export function ProfileNeededCta() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/')}
      accessibilityRole="button"
      accessibilityLabel="신분증 채우기"
      hitSlop={8}
      style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.55 : 1 }]}>
      <Text style={[styles.ctaLabel, { color: c.tint }]}>신분증 채우기</Text>
    </Pressable>
  );
}

type CardProps = {
  title: string;
  thenWhat: string;
};

/** 성향·사주·타로 오늘 카드 자리의 빈 상태. */
export function ProfileNeededCard({ title, thenWhat }: CardProps) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <View style={[styles.card, paperShadow, { backgroundColor: c.surface }]}>
      <Text style={[styles.title, { color: c.text, fontFamily: display }]}>{title}</Text>
      <Text style={[styles.body, { color: c.muted }]}>{profileNeededBody(thenWhat)}</Text>
      <ProfileNeededCta />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...tabSection.card,
  },
  title: {
    ...tabSection.cardTitle,
  },
  body: {
    ...tabSection.detailBody,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  ctaLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
