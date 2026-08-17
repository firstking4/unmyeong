import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { UpcomingFeatures } from '@/components/tabs/UpcomingFeatures';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { LockedContentCard } from '@/components/ui/LockedContentCard';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { isFortuneReady, useProfile } from '@/context/ProfileContext';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { birthCalendarLabel, resolveBirthParts } from '@/lib/lunar';
import {
  buildSajuReading,
  formatSajuHourLabel,
  type PeriodReading,
  type SajuReading,
} from '@/lib/saju';
import { useTabScrollReset } from '@/lib/useTabScrollReset';

const UPCOMING = [
  { title: '사주팔자', blurb: '년·월·일·시 네 기둥' },
  { title: '대운', blurb: '10년 단위 흐름' },
  { title: '시주', blurb: '출생 시각 기준 시주' },
  { title: '절기 만세력', blurb: '절기 보정 만세력' },
];

const DETAIL_LOCK = {
  title: '상세 풀이',
  description:
    '광고를 보면 본문과 힌트를 열 수 있어요. 지금은 광고 준비 중이라 눌러서 바로 확인할 수 있습니다.',
  ctaLabel: '내용 보기',
} as const;

export default function SajuScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile } = useProfile();
  const scrollRef = useTabScrollReset();
  const ready = isFortuneReady(profile);
  const reading = useMemo(
    () => (ready && profile.birthDate ? buildSajuReading(profile.birthDate) : null),
    [ready, profile.birthDate],
  );
  const natalBirthLabel = useMemo(() => {
    if (!profile.birthDate) return null;
    const parts = resolveBirthParts(profile);
    const calendar = birthCalendarLabel(parts.calendar) ?? '양력';
    const leap = parts.calendar === 'lunar' && parts.leap ? '윤' : '';
    const datePart = `${calendar} ${parts.year}년 ${leap}${parts.month}월 ${parts.day}일`;
    const hourLabel = formatSajuHourLabel(profile.birthTime);
    return hourLabel ? `${datePart} · ${hourLabel}` : datePart;
  }, [profile]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>SAJU</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>사주</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          {ready
            ? '나의 띠·오행 위에 오늘·이번 주·이달·올해의 기운을 겹쳐 참고용 풀이를 보여 줍니다.'
            : '내 프로필이 필요해요. 지도 탭 신분증에 이름과 생년월일을 입력하면 띠·오행과 오늘·이번 주·이달·올해 풀이가 열립니다.'}
        </Text>

        {reading ? (
          <>
            <TodaySajuCard
              period={reading.today}
              tint={c.tint}
              text={c.text}
              muted={c.muted}
              surface={c.surface}
              hairline={c.hairline}
            />
            <NatalSajuBlock
              reading={reading}
              birthLabel={natalBirthLabel}
              tint={c.tint}
              text={c.text}
              muted={c.muted}
              hairline={c.hairline}
            />
            <PeriodBlock
              period={reading.week}
              tint={c.tint}
              text={c.text}
              muted={c.muted}
              hairline={c.hairline}
            />
            <PeriodBlock period={reading.month} tint={c.tint} text={c.text} muted={c.muted} hairline={c.hairline} />
            <PeriodBlock period={reading.year} tint={c.tint} text={c.text} muted={c.muted} hairline={c.hairline} />
          </>
        ) : null}

        <UpcomingFeatures items={UPCOMING} />

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

function PeriodDetailBody({
  period,
  text,
  muted,
}: {
  period: PeriodReading;
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
          <Text style={[styles.blockBody, { color: muted }]}>{period.summary}</Text>
          {(period.hints ?? []).map((hint, i) => (
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

function TodaySajuCard({
  period,
  tint,
  text,
  muted,
  surface,
  hairline,
}: {
  period: PeriodReading;
  tint: string;
  text: string;
  muted: string;
  surface: string;
  hairline: string;
}) {
  return (
    <View style={[styles.todayCard, paperShadow, { backgroundColor: surface }]}>
      <View style={styles.cardSummary}>
        <View style={styles.titleRow}>
          <Text style={[styles.todayTitle, { color: text, fontFamily: display }]}>오늘의 사주</Text>
          <Text style={[styles.todayDate, { color: muted }]}>{period.dateLabel}</Text>
        </View>
        <Text style={[styles.flowTitle, { color: tint }]}>{period.headline}</Text>
        <Text style={[styles.blockMeta, { color: muted }]}>
          {period.flowLabel} · {period.relation.title}
        </Text>
        <View style={styles.toneRow}>
          {(period.keywords ?? []).map((kw, i) => (
            <KeywordBadge key={`today-kw-${i}-${kw}`} label={kw} />
          ))}
          {(period.tones ?? []).map((tone, i) => (
            <KeywordBadge key={`today-tone-${i}-${tone}`} label={tone} />
          ))}
        </View>
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        <PeriodDetailBody period={period} text={text} muted={muted} />
      </View>
    </View>
  );
}

function PeriodOpenBody({
  period,
  text,
  muted,
}: {
  period: PeriodReading;
  text: string;
  muted: string;
}) {
  return (
    <>
      <Text style={[styles.blockBody, { color: muted }]}>{period.summary}</Text>
      {(period.hints ?? []).map((hint, i) => (
        <View key={`hint-${i}-${hint.label}`} style={styles.hintBlock}>
          <Text style={[styles.hintLabel, { color: text }]}>{hint.label}</Text>
          <Text style={[styles.hintText, { color: muted }]}>{hint.text}</Text>
        </View>
      ))}
    </>
  );
}

function NatalSajuBlock({
  reading,
  birthLabel,
  tint,
  text,
  muted,
  hairline,
}: {
  reading: SajuReading;
  birthLabel: string | null;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  return (
    <View style={[styles.block, { borderTopColor: hairline }]}>
      <View style={styles.blockSummary}>
        <Text style={[styles.sectionTitle, { color: text, fontFamily: display }]}>나의 사주</Text>
        {birthLabel ? <Text style={[styles.blockMeta, { color: muted }]}>{birthLabel}</Text> : null}
        <Text style={[styles.flowTitle, { color: tint }]}>{reading.headline}</Text>
        {reading.element.mood ? (
          <Text style={[styles.blockMeta, { color: muted }]}>{reading.element.mood}</Text>
        ) : null}
        {(reading.keywords ?? []).length > 0 ? (
          <View style={styles.toneRow}>
            {reading.keywords.map((kw, i) => (
              <KeywordBadge key={`natal-kw-${i}-${kw}`} label={kw} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        {reading.summary ? (
          <Text style={[styles.blockBody, { color: muted }]}>{reading.summary}</Text>
        ) : null}
        {(reading.hints ?? []).map((hint, i) => (
          <View key={`natal-hint-${i}-${hint.label}`} style={styles.hintBlock}>
            <Text style={[styles.hintLabel, { color: text }]}>{hint.label}</Text>
            <Text style={[styles.hintText, { color: muted }]}>{hint.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PeriodBlock({
  period,
  tint,
  text,
  muted,
  hairline,
}: {
  period: PeriodReading;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  return (
    <View style={[styles.block, { borderTopColor: hairline }]}>
      <View style={styles.blockSummary}>
        <Text style={[styles.sectionTitle, { color: text, fontFamily: display }]}>
          {period.eyebrow}
        </Text>
        <Text style={[styles.blockMeta, { color: muted }]}>{period.dateLabel}</Text>
        <Text style={[styles.flowTitle, { color: tint }]}>{period.headline}</Text>
        <Text style={[styles.blockMeta, { color: muted }]}>
          {period.flowLabel} · {period.relation.title}
        </Text>
        <View style={styles.toneRow}>
          {(period.keywords ?? []).map((kw, i) => (
            <KeywordBadge key={`kw-${i}-${kw}`} label={kw} />
          ))}
          {(period.tones ?? []).map((tone, i) => (
            <KeywordBadge key={`tone-${i}-${tone}`} label={tone} />
          ))}
        </View>
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        <PeriodOpenBody period={period} text={text} muted={muted} />
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
  cardSplit: {
    ...tabSection.cardSplit,
  },
  todayTitle: {
    ...tabSection.cardTitle,
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  todayDate: {
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 0,
    textAlign: 'right',
  },
  toneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  block: {
    ...tabSection.rule,
    gap: 0,
  },
  blockSummary: {
    gap: tabSection.summaryGap,
  },
  sectionTitle: {
    ...tabSection.title,
  },
  flowTitle: {
    ...tabSection.flowTitle,
  },
  blockMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  blockBody: {
    ...tabSection.detailBody,
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
