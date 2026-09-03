import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { LockedContentCard } from '@/components/ui/LockedContentCard';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { isFortuneReady, useProfile } from '@/context/ProfileContext';
import { useRewardUnlock } from '@/context/RewardUnlockContext';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { birthCalendarLabel, resolveBirthParts } from '@/lib/lunar';
import {
  buildFourPillarsDetail,
  buildLuckPillarsDetail,
  buildSolarTermDetail,
  computeFourPillars,
  computeLuckPillars,
  formatFourPillarsHeadline,
  getMonthBoundaryTerm,
  getSolarTermWindow,
  type DetailHint,
  type FourPillarsResult,
  type LuckPillarsResult,
  type ManseryeokPillar,
  type SolarTermInfo,
  type SolarTermWindow,
} from '@/lib/manseryeok';
import {
  buildSajuReading,
  formatSajuHourLabel,
  type PeriodReading,
  type SajuReading,
} from '@/lib/saju';
import { useLocalDateKey } from '@/lib/useLocalDateKey';
import { useTabScrollReset } from '@/lib/useTabScrollReset';

const PILLAR_SLOTS = [
  { key: 'year', label: '년' },
  { key: 'month', label: '월' },
  { key: 'day', label: '일' },
  { key: 'hour', label: '시' },
] as const;

const LUCK_PILLAR_LIMIT = 8;

const DETAIL_LOCK = {
  title: '상세 풀이',
  description:
    '자세한 풀이를 열 수 있어요. 한 번 열면 오늘 자정까지 유지됩니다.',
  ctaLabel: '내용 보기',
} as const;

export default function SajuScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile } = useProfile();
  const scrollRef = useTabScrollReset();
  const ready = isFortuneReady(profile);
  const dateKey = useLocalDateKey();
  const reading = useMemo(
    () =>
      ready && profile.birthDate
        ? buildSajuReading(profile.birthDate, undefined, profile.birthTime, profile.gender)
        : null,
    [ready, profile.birthDate, profile.birthTime, profile.gender, dateKey],
  );
  const pillars = useMemo(
    () =>
      ready && profile.birthDate
        ? computeFourPillars({ birthDate: profile.birthDate, birthTime: profile.birthTime })
        : null,
    [ready, profile.birthDate, profile.birthTime],
  );
  const monthBoundary = useMemo(
    () =>
      ready && profile.birthDate
        ? getMonthBoundaryTerm(profile.birthDate, profile.birthTime)
        : null,
    [ready, profile.birthDate, profile.birthTime],
  );
  const termWindow = useMemo(() => (ready ? getSolarTermWindow() : null), [ready, dateKey]);
  const luck = useMemo(() => {
    if (!ready || !profile.birthDate) return null;
    if (profile.gender !== 'male' && profile.gender !== 'female') return null;
    return computeLuckPillars({
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      gender: profile.gender,
    });
  }, [ready, profile.birthDate, profile.birthTime, profile.gender]);
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
            ? '생년월일로 네 기둥을 세우고, 띠·오행 위에 오늘·이번 주·이달·올해의 참고용 풀이를 겹칩니다.'
            : '내 프로필이 필요해요. 지도 탭 신분증에 이름과 생년월일을 입력하면 사주팔자와 오늘·이번 주·이달·올해 풀이가 열립니다.'}
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
        {pillars ? (
          <FourPillarsBlock
            pillars={pillars}
            birthLabel={natalBirthLabel}
            monthBoundary={monthBoundary}
            tint={c.tint}
            text={c.text}
            muted={c.muted}
            hairline={c.hairline}
          />
        ) : null}
        {termWindow ? (
          <SolarTermBlock
            window={termWindow}
            tint={c.tint}
            text={c.text}
            muted={c.muted}
            hairline={c.hairline}
          />
        ) : null}
        {ready ? (
          <LuckPillarsBlock
            luck={luck}
            birthDate={profile.birthDate}
            hasGender={profile.gender === 'male' || profile.gender === 'female'}
            tint={c.tint}
            text={c.text}
            muted={c.muted}
            hairline={c.hairline}
          />
        ) : null}

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
  const { isUnlocked, grantUnlock } = useRewardUnlock();
  const unlocked = isUnlocked('saju_today');

  return (
    <LockedContentCard
      lockId="saju_today"
      title={DETAIL_LOCK.title}
      description={DETAIL_LOCK.description}
      ctaLabel={DETAIL_LOCK.ctaLabel}
      onPress={() => {
        void grantUnlock('saju_today');
      }}>
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
        {(period.contextLines ?? []).map((line, i) => (
          <Text key={`today-ctx-${i}`} style={[styles.blockMeta, { color: muted }]}>
            {line.text}
          </Text>
        ))}
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

function DetailBody({
  summary,
  hints,
  text,
  muted,
}: {
  summary: string;
  hints: DetailHint[];
  text: string;
  muted: string;
}) {
  return (
    <>
      <Text style={[styles.blockBody, { color: muted }]}>{summary}</Text>
      {hints.map((hint, i) => (
        <View key={`detail-${i}-${hint.label}`} style={styles.hintBlock}>
          <Text style={[styles.hintLabel, { color: text }]}>{hint.label}</Text>
          <Text style={[styles.hintText, { color: muted }]}>{hint.text}</Text>
        </View>
      ))}
    </>
  );
}

function pillarForSlot(
  pillars: FourPillarsResult,
  key: (typeof PILLAR_SLOTS)[number]['key'],
): ManseryeokPillar | null {
  return pillars[key];
}

function FourPillarsBlock({
  pillars,
  birthLabel,
  monthBoundary,
  tint,
  text,
  muted,
  hairline,
}: {
  pillars: FourPillarsResult;
  birthLabel: string | null;
  monthBoundary: SolarTermInfo | null;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  const hourMissing = pillars.hour === null;
  const detail = buildFourPillarsDetail(pillars, monthBoundary);
  const metaParts = [
    monthBoundary ? `월주 기준 · ${monthBoundary.name} 절입` : '절입 기준 네 기둥',
    hourMissing ? '출생 시각을 넣으면 시주가 열립니다' : null,
  ].filter(Boolean);
  return (
    <View style={[styles.block, { borderTopColor: hairline }]}>
      <View style={styles.blockSummary}>
        <Text style={[styles.sectionTitle, { color: text, fontFamily: display }]}>사주팔자</Text>
        {birthLabel ? <Text style={[styles.blockMeta, { color: muted }]}>{birthLabel}</Text> : null}
        <Text style={[styles.flowTitle, { color: tint }]}>{formatFourPillarsHeadline(pillars)}</Text>
        <Text style={[styles.blockMeta, { color: muted }]}>{metaParts.join(' · ')}</Text>
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        <View style={styles.pillarRow}>
          {PILLAR_SLOTS.map((slot) => {
            const pillar = pillarForSlot(pillars, slot.key);
            return (
              <View key={slot.key} style={styles.pillarCol}>
                <Text style={[styles.pillarSlot, { color: muted }]}>{slot.label}</Text>
                <Text style={[styles.pillarKorean, { color: text, fontFamily: display }]}>
                  {pillar?.korean ?? '—'}
                </Text>
                <Text style={[styles.pillarHanja, { color: muted }]}>{pillar?.hanja ?? '—'}</Text>
              </View>
            );
          })}
        </View>
        <DetailBody summary={detail.summary} hints={detail.hints} text={text} muted={muted} />
      </View>
    </View>
  );
}

function SolarTermBlock({
  window,
  tint,
  text,
  muted,
  hairline,
}: {
  window: SolarTermWindow;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  const detail = buildSolarTermDetail(window);
  return (
    <View style={[styles.block, { borderTopColor: hairline }]}>
      <View style={styles.blockSummary}>
        <Text style={[styles.sectionTitle, { color: text, fontFamily: display }]}>절기</Text>
        <Text style={[styles.blockMeta, { color: muted }]}>오늘 기준 · KST</Text>
        <Text style={[styles.flowTitle, { color: tint }]}>
          {window.current.name} · 다음 {window.next.name}
        </Text>
        <Text style={[styles.blockMeta, { color: muted }]}>
          {window.current.name} {window.current.labelKst} · {window.next.name}{' '}
          {window.next.labelKst}
        </Text>
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        <DetailBody summary={detail.summary} hints={detail.hints} text={text} muted={muted} />
      </View>
    </View>
  );
}

function LuckPillarsBlock({
  luck,
  birthDate,
  hasGender,
  tint,
  text,
  muted,
  hairline,
}: {
  luck: LuckPillarsResult | null;
  birthDate?: string;
  hasGender: boolean;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  if (!hasGender) {
    return (
      <View style={[styles.block, { borderTopColor: hairline }]}>
        <View style={styles.blockSummary}>
          <Text style={[styles.sectionTitle, { color: text, fontFamily: display }]}>대운</Text>
          <Text style={[styles.blockMeta, { color: muted }]}>
            신분증에 성별을 넣으면 10년 단위 대운이 열립니다.
          </Text>
        </View>
      </View>
    );
  }
  if (!luck || !birthDate) return null;
  const shown = luck.pillars.slice(0, LUCK_PILLAR_LIMIT);
  const detail = buildLuckPillarsDetail(luck, birthDate);
  return (
    <View style={[styles.block, { borderTopColor: hairline }]}>
      <View style={styles.blockSummary}>
        <Text style={[styles.sectionTitle, { color: text, fontFamily: display }]}>대운</Text>
        <Text style={[styles.blockMeta, { color: muted }]}>
          {luck.forward ? '순행' : '역행'} · {luck.startAge}세부터
        </Text>
        <Text style={[styles.flowTitle, { color: tint }]}>
          {shown
            .slice(0, 3)
            .map((item) => `${item.age}세 ${item.korean}`)
            .join(' · ')}
        </Text>
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        <View style={styles.luckRow}>
          {shown.map((item) => (
            <View key={`luck-${item.age}-${item.korean}`} style={styles.luckCol}>
              <Text style={[styles.pillarSlot, { color: muted }]}>{item.age}세</Text>
              <Text style={[styles.luckKorean, { color: text, fontFamily: display }]}>
                {item.korean}
              </Text>
              <Text style={[styles.pillarHanja, { color: muted }]}>{item.hanja}</Text>
            </View>
          ))}
        </View>
        <DetailBody summary={detail.summary} hints={detail.hints} text={text} muted={muted} />
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
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pillarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  pillarSlot: {
    fontSize: 13,
    lineHeight: 18,
  },
  pillarKorean: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.4,
  },
  pillarHanja: {
    fontSize: 13,
    lineHeight: 18,
  },
  luckRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  luckCol: {
    width: '22%',
    minWidth: 64,
    alignItems: 'center',
    gap: 2,
  },
  luckKorean: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.3,
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
