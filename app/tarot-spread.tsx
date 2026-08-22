import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { LockIcon } from '@/components/icons/AppIcon';
import { Text } from '@/components/Themed';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { logTarotSpreadOpen } from '@/lib/firebase/analytics';
import { TAROT_SPREADS, type TarotSpreadKind } from '@/lib/tarotSpread';
import { clearTarotSpreadTickets, issueTarotSpreadTicket } from '@/lib/tarotSpreadUnlock';

export default function TarotSpreadScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      clearTarotSpreadTickets();
    }, []),
  );

  const openAfterAd = (kind: TarotSpreadKind) => {
    void logTarotSpreadOpen(kind);
    const ticket = issueTarotSpreadTicket(kind);
    router.push({ pathname: '/tarot-spread-result', params: { kind, ticket } });
  };

  const requestUnlock = (kind: TarotSpreadKind, title: string) => {
    Alert.alert(
      `${title} 스프레드`,
      '이 스프레드를 한 번 열 수 있어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '열기',
          onPress: () => openAfterAd(kind),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>TAROT SPREAD</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>질문 스프레드</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          연애·일·선택은 한 번씩 펼칠 수 있어요. 지금 살펴보고 싶은 상황을 고르세요.
        </Text>

        <View style={styles.typeList}>
          {TAROT_SPREADS.map((spread) => (
            <Pressable
              key={spread.id}
              accessibilityRole="button"
              accessibilityLabel={`${spread.title} 질문 스프레드 · 열기`}
              accessibilityHint="한 번 열 수 있습니다"
              onPress={() => requestUnlock(spread.id, spread.title)}
              style={({ pressed }) => [
                styles.typeCard,
                paperShadow,
                {
                  backgroundColor: c.surface,
                  borderColor: c.hairline,
                  opacity: pressed ? 0.72 : 0.88,
                },
              ]}>
              <View style={styles.typeHeader}>
                <Text style={[styles.typeTitle, { color: c.text, fontFamily: display }]}>
                  {spread.title}
                </Text>
                <LockIcon color={c.muted} size={20} />
              </View>
              <Text style={[styles.typeDescription, { color: c.muted }]}>{spread.description}</Text>
              <Text style={[styles.typePositions, { color: c.muted }]}>
                {spread.positions.join(' · ')}
              </Text>
              <Text style={[styles.lockHint, { color: c.tint }]}>1번 열람</Text>
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
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeTitle: {
    flex: 1,
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
  lockHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  disclaimer: {
    ...tabSection.disclaimer,
  },
});
