import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Text } from '@/components/Themed';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { UnlockLockButton } from '@/components/ui/UnlockLockButton';
import { useUnlockFortuneFlow } from '@/components/ui/useUnlockFortuneFlow';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { logTarotSpreadOpen } from '@/lib/firebase/analytics';
import { TAROT_SPREADS, spreadPositionLabels, type TarotSpreadKind } from '@/lib/tarotSpread';
import {
  clearTarotSpreadTickets,
  issueTarotSpreadTicket,
  tarotSpreadFortuneLockId,
} from '@/lib/tarotSpreadUnlock';

export default function TarotSpreadScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { beginUnlock, modal, modalOpen } = useUnlockFortuneFlow({ copyVariant: 'once' });

  useFocusEffect(
    useCallback(() => {
      clearTarotSpreadTickets();
    }, []),
  );

  const openAfterUnlock = (kind: TarotSpreadKind) => {
    void logTarotSpreadOpen(kind);
    const ticket = issueTarotSpreadTicket(kind);
    router.push({ pathname: '/tarot-spread-result', params: { kind, ticket } });
  };

  const requestUnlock = (kind: TarotSpreadKind) => {
    void beginUnlock(tarotSpreadFortuneLockId(kind), () => openAfterUnlock(kind));
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>READING</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>한 점 타로</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          연애·일·선택은 한 점씩 볼 수 있어요. 지금 살펴보고 싶은 상황을 고르세요.
        </Text>

        <View style={styles.typeList}>
          {TAROT_SPREADS.map((spread) => {
            const ctaLabel = `${spread.title} 한 점 보기`;
            return (
              <View
                key={spread.id}
                style={[
                  styles.typeCard,
                  paperShadow,
                  {
                    backgroundColor: c.surface,
                    borderColor: c.hairline,
                  },
                ]}>
                <Text style={[styles.typeTitle, { color: c.text, fontFamily: display }]}>
                  {spread.title}
                </Text>
                <Text style={[styles.typeDescription, { color: c.muted }]}>{spread.description}</Text>
                <Text style={[styles.typePositions, { color: c.muted }]}>
                  {spreadPositionLabels(spread).join(' · ')}
                </Text>
                <UnlockLockButton
                  label={ctaLabel}
                  disabled={modalOpen}
                  onPress={() => requestUnlock(spread.id)}
                />
              </View>
            );
          })}
        </View>

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
      {modal}
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
