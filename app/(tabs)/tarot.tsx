import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { UpcomingFeatures } from '@/components/tabs/UpcomingFeatures';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { LockedContentCard } from '@/components/ui/LockedContentCard';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { isFortuneReady, useProfile } from '@/context/ProfileContext';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { recordTarotView } from '@/lib/history';
import { buildTarotReading, type TarotReading } from '@/lib/tarot';
import { tarotMajorImage } from '@/lib/tarotMajorImages';

const UPCOMING = [
  { title: '질문 스프레드', blurb: '연애·일·선택 등 상황에 맞는 배치' },
  { title: '메이저 아르카나', blurb: '22장 의미와 나만의 카드 북마크' },
  { title: '기록 모아보기', blurb: '메뉴의 기록에서 날짜별 타로·운세·궁합 확인' },
];

const DETAIL_LOCK = {
  title: '상세 풀이',
  description:
    '광고를 보면 본문과 힌트를 열 수 있어요. 지금은 광고 준비 중이라 눌러서 바로 확인할 수 있습니다.',
  ctaLabel: '내용 보기',
} as const;

// 잘라 둔 그림 비율(279×400)과 같게 맞춰 좌우가 잘리지 않게 한다.
const CARD_ART_W = 96;
const CARD_ART_H = 138;

export default function TarotScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile } = useProfile();
  const ready = isFortuneReady(profile);
  const reading = useMemo(
    () => (ready ? buildTarotReading(profile) : null),
    [profile, ready],
  );

  useEffect(() => {
    if (!reading) return;
    void recordTarotView(reading);
  }, [reading]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>TAROT</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>타로</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          {ready
            ? '메이저 아르카나 22장 가운데 오늘 한 장을 뽑아 참고용 풀이를 보여 줍니다.'
            : '내 프로필이 필요해요. 지도 탭 신분증에 이름과 생년월일을 입력하면 오늘의 타로 카드를 뽑습니다.'}
        </Text>

        {reading ? (
          <TodayTarotCard
            reading={reading}
            tint={c.tint}
            text={c.text}
            muted={c.muted}
            surface={c.surface}
            hairline={c.hairline}
          />
        ) : null}

        <UpcomingFeatures items={UPCOMING} />

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

function TarotDetailBody({
  reading,
  text,
  muted,
}: {
  reading: TarotReading;
  text: string;
  muted: string;
}) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <LockedContentCard
      title={DETAIL_LOCK.title}
      description={DETAIL_LOCK.description}
      ctaLabel={DETAIL_LOCK.ctaLabel}
      onPress={() => setUnlocked(true)}>
      {unlocked ? (
        <>
          <Text style={[styles.blockBody, { color: muted }]}>{reading.blurb}</Text>
          {reading.hints.map((hint, i) => (
            <View key={`hint-${i}-${hint.label}`} style={styles.hintBlock}>
              <Text style={[styles.hintLabel, { color: text }]}>{hint.label}</Text>
              <Text style={[styles.hintText, { color: muted }]}>{hint.text}</Text>
            </View>
          ))}
        </>
      ) : null}
    </LockedContentCard>
  );
}

function TodayTarotCard({
  reading,
  tint,
  text,
  muted,
  surface,
  hairline,
}: {
  reading: TarotReading;
  tint: string;
  text: string;
  muted: string;
  surface: string;
  hairline: string;
}) {
  const art = tarotMajorImage(reading.number);

  return (
    <View style={[styles.todayCard, paperShadow, { backgroundColor: surface }]}>
      <View style={styles.cardSummary}>
        <Text style={[styles.todayTitle, { color: text, fontFamily: display }]}>오늘의 카드</Text>
        <View style={styles.summaryRow}>
          {art ? (
            <View style={[styles.artFrame, { borderColor: hairline, backgroundColor: surface }]}>
              <Image
                source={art}
                style={[styles.art, reading.reversed && styles.artReversed]}
                resizeMode="cover"
                accessibilityLabel={`${reading.title} 메이저 아르카나 카드`}
              />
            </View>
          ) : null}
          <View style={styles.summaryCopy}>
            <Text style={[styles.cardMeta, { color: muted }]}>{reading.dateLabel}</Text>
            <Text style={[styles.cardNumber, { color: tint, fontFamily: display }]}>
              {reading.number === null ? 'MAJOR' : String(reading.number).padStart(2, '0')}
            </Text>
            <Text style={[styles.cardHeadline, { color: text, fontFamily: display }]}>
              {reading.title}
            </Text>
            <Text style={[styles.orientation, { color: tint }]}>{reading.orientation}</Text>
            <Text style={[styles.todayLine, { color: muted }]}>{reading.headline}</Text>
          </View>
        </View>
        {reading.keywords.length > 0 ? (
          <View style={styles.keywordRow}>
            {reading.keywords.map((kw, i) => (
              <KeywordBadge key={`tarot-${i}-${kw}`} label={kw} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        <TarotDetailBody reading={reading} text={text} muted={muted} />
      </View>
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
  todayCard: {
    ...tabSection.card,
    gap: 0,
  },
  cardSummary: {
    gap: tabSection.summaryGap,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryCopy: {
    flex: 1,
    gap: tabSection.summaryGap,
    minWidth: 0,
    justifyContent: 'center',
  },
  artFrame: {
    width: CARD_ART_W,
    height: CARD_ART_H,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  art: {
    width: '100%',
    height: '100%',
    opacity: 0.78,
  },
  artReversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardSplit: {
    ...tabSection.cardSplit,
  },
  todayTitle: {
    ...tabSection.cardTitle,
  },
  cardNumber: {
    fontSize: 14,
    letterSpacing: 2,
  },
  cardHeadline: {
    fontSize: 28,
    lineHeight: 36,
  },
  orientation: {
    fontSize: 14,
    fontWeight: '700',
  },
  todayLine: {
    ...tabSection.detailHint,
  },
  cardMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  blockBody: {
    ...tabSection.detailBody,
  },
  blockMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  hintBlock: {
    ...tabSection.detailHintBlock,
    marginTop: 4,
  },
  hintLabel: {
    ...tabSection.detailLabel,
  },
  hintText: {
    ...tabSection.detailHint,
  },
  disclaimer: {
    ...tabSection.disclaimer,
  },
});
