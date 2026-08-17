import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/Themed';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { TAROT_SPREADS, type TarotSpreadKind } from '@/lib/tarotSpread';

export default function TarotSpreadScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();

  const openSpread = (kind: TarotSpreadKind) => {
    router.push({ pathname: '/tarot-spread-result', params: { kind } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>TAROT SPREAD</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>질문 스프레드</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          지금 살펴보고 싶은 상황을 고르면 78장 풀덱에서 세 장을 펼칩니다.
        </Text>

        <View style={styles.typeList}>
          {TAROT_SPREADS.map((spread) => (
            <Pressable
              key={spread.id}
              accessibilityRole="button"
              accessibilityLabel={`${spread.title} 질문 스프레드`}
              onPress={() => openSpread(spread.id)}
              style={({ pressed }) => [
                styles.typeCard,
                paperShadow,
                {
                  backgroundColor: c.surface,
                  borderColor: c.hairline,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}>
              <Text style={[styles.typeTitle, { color: c.text, fontFamily: display }]}>{spread.title}</Text>
              <Text style={[styles.typeDescription, { color: c.muted }]}>{spread.description}</Text>
              <Text style={[styles.typePositions, { color: c.muted }]}>
                {spread.positions.join(' · ')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    ...tabSection.content,
  },
  eyebrow: {
    ...tabSection.eyebrow,
  },
  title: {
    ...tabSection.pageTitle,
  },
  lead: {
    ...tabSection.lead,
  },
  typeList: {
    ...tabSection.stack,
  },
  typeCard: {
    ...tabSection.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: tabSection.summaryGap,
  },
  typeTitle: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  typeDescription: {
    ...tabSection.detailHint,
  },
  typePositions: {
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimer: {
    ...tabSection.disclaimer,
  },
});
