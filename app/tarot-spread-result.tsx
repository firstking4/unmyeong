import { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/Themed';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { pagePad, paperShadow, radius, space, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { tarotCardImage } from '@/lib/tarotDeckImages';
import { tarotEnglishName } from '@/lib/tarotEnglishNames';
import {
  drawTarotSpread,
  getTarotSpread,
  isTarotSpreadKind,
  type TarotSpreadCard,
  type TarotSpreadKind,
} from '@/lib/tarotSpread';
import { tarotSpreadTicketAllows } from '@/lib/tarotSpreadUnlock';

function parseKind(value: string | string[] | undefined): TarotSpreadKind | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return isTarotSpreadKind(raw) ? raw : null;
}

function parseTicket(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : null;
}

export default function TarotSpreadResultScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { width } = useWindowDimensions();
  const { kind: kindParam, ticket: ticketParam } = useLocalSearchParams<{
    kind?: string;
    ticket?: string;
  }>();
  const kind = parseKind(kindParam);
  const ticket = parseTicket(ticketParam);
  const allowed = Boolean(kind && ticket && tarotSpreadTicketAllows(ticket, kind));

  const reading = useMemo(() => (kind && allowed ? drawTarotSpread(kind) : null), [kind, allowed]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!kind || !allowed || !reading) {
    return <Redirect href="/tarot-spread" />;
  }

  const definition = getTarotSpread(kind);
  const selected = selectedIndex === null ? null : reading.cards[selectedIndex];
  const gap = 10;
  const sidePad = pagePad;
  const cardWidth = Math.floor((width - sidePad * 2 - gap * 2) / 3);
  const artHeight = Math.round(cardWidth * (400 / 279));

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ title: definition.title }} />
      <PaperGrain color={c.grain} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lead, { color: c.muted }]}>{definition.description}</Text>
        <Text style={[styles.hint, { color: c.muted }]}>카드를 누르면 풀이를 볼 수 있어요.</Text>

        <View style={[styles.row, { gap }]}>
          {reading.cards.map((spreadCard, index) => {
            const active = selectedIndex === index;
            const art = tarotCardImage(spreadCard.card);
            const englishName = tarotEnglishName(spreadCard.card);
            const title = spreadCard.card.title ?? spreadCard.card.label;

            return (
              <Pressable
                key={`${spreadCard.card.id}-${index}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${spreadCard.position} · ${title} ${spreadCard.reversed ? '역방향' : '정방향'}`}
                onPress={() => setSelectedIndex(index)}
                style={({ pressed }) => [
                  styles.thumb,
                  {
                    width: cardWidth,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}>
                <Text
                  style={[styles.positionLabel, { color: active ? c.tint : c.muted }]}
                  numberOfLines={2}>
                  {spreadCard.position}
                </Text>
                <View
                  style={[
                    styles.artShadow,
                    active ? styles.artShadowActive : null,
                    {
                      width: cardWidth,
                      height: artHeight,
                      backgroundColor: c.surface,
                    },
                  ]}>
                  <View
                    style={[
                      styles.artFrame,
                      {
                        width: cardWidth,
                        height: artHeight,
                        borderColor: active ? c.tint : c.hairline,
                        borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                        backgroundColor: c.surface,
                      },
                    ]}>
                    {art ? (
                      <Image
                        source={art}
                        style={[styles.art, spreadCard.reversed && styles.artReversed]}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                </View>
                <Text style={[styles.englishName, { color: active ? c.tint : c.muted }]} numberOfLines={2}>
                  {englishName ?? title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.synthesis, { color: c.text }]}>{reading.synthesis}</Text>

        <DetailCard
          reading={selected}
          tint={c.tint}
          text={c.text}
          muted={c.muted}
          surface={c.surface}
          hairline={c.hairline}
        />

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

function DetailCard({
  reading,
  tint,
  text,
  muted,
  surface,
  hairline,
}: {
  reading: TarotSpreadCard | null;
  tint: string;
  text: string;
  muted: string;
  surface: string;
  hairline: string;
}) {
  const title = reading?.card.title ?? reading?.card.label;
  const englishName = reading ? tarotEnglishName(reading.card) : null;

  return (
    <View style={[styles.detail, paperShadow, { backgroundColor: surface, borderColor: hairline }]}>
      {reading ? (
        <>
          <Text style={[styles.position, { color: tint }]}>{reading.position}</Text>
          <Text style={[styles.detailTitle, { color: text, fontFamily: display }]}>{title}</Text>
          {englishName ? <Text style={[styles.detailEnglish, { color: muted }]}>{englishName}</Text> : null}
          <Text style={[styles.orientation, { color: tint }]}>
            {reading.reversed ? '역방향' : '정방향'}
          </Text>
          {reading.card.keywords.length > 0 ? (
            <View style={styles.keywordRow}>
              {reading.card.keywords.map((keyword) => (
                <KeywordBadge key={keyword} label={keyword} />
              ))}
            </View>
          ) : null}
          <View style={[styles.interpretation, { borderTopColor: hairline }]}>
            <Text style={[styles.interpretationBody, { color: muted }]}>{reading.interpretation}</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.position, { color: tint }]}>카드 풀이</Text>
          <Text style={[styles.detailTitle, { color: text, fontFamily: display }]}>카드를 골라 주세요</Text>
          <View style={[styles.interpretation, { borderTopColor: hairline }]}>
            <Text style={[styles.interpretationBody, { color: muted }]}>
              세 장 가운데 보고 싶은 카드를 누르면 포지션에 맞는 풀이가 이 카드 안에 표시됩니다.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    ...tabSection.content,
  },
  lead: {
    ...tabSection.lead,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  thumb: {
    alignItems: 'center',
    gap: 8,
  },
  positionLabel: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  artShadow: Platform.select({
    ios: {
      borderRadius: radius.sm,
      shadowColor: '#1A1714',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
    },
    default: {
      borderRadius: radius.sm,
      elevation: 5,
    },
  }),
  artShadowActive: Platform.select({
    ios: {
      shadowOpacity: 0.26,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
    default: {
      elevation: 8,
    },
  }),
  artFrame: {
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  art: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  artReversed: {
    transform: [{ rotate: '180deg' }],
  },
  englishName: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  synthesis: {
    ...tabSection.detailBody,
    marginTop: space.sm,
  },
  detail: {
    ...tabSection.card,
    marginTop: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    gap: tabSection.summaryGap,
  },
  position: {
    ...tabSection.flowTitle,
  },
  detailTitle: {
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 0.3,
  },
  detailEnglish: {
    fontSize: 13,
    lineHeight: 18,
  },
  orientation: {
    fontSize: 14,
    fontWeight: '700',
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interpretation: {
    ...tabSection.cardSplit,
  },
  interpretationBody: {
    ...tabSection.detailBody,
  },
  disclaimer: {
    ...tabSection.disclaimer,
  },
});
