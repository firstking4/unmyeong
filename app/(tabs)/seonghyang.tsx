import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { FieldEditorModal } from '@/components/id-card/FieldEditorModal';
import { UpcomingFeatures } from '@/components/tabs/UpcomingFeatures';
import { Text } from '@/components/Themed';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { LockedContentCard } from '@/components/ui/LockedContentCard';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { usePersonalityResults } from '@/context/PersonalityResultsContext';
import { isFortuneReady, useProfile } from '@/context/ProfileContext';
import { getWesternZodiac } from '@/lib/data/catalog';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import type { IDCardFieldKey } from '@/lib/idCardFields';
import { type BigFiveResult, type FourAxisResult } from '@/lib/personalityTest';
import {
  bigFiveBlock,
  buildSeonghyangReading,
  type ProfileField,
  type TodaySeonghyang,
  type TraitBlock,
} from '@/lib/seonghyang';
import { zodiacWatermarkSource } from '@/lib/zodiacWatermarks';

const UPCOMING = [
  { title: 'MBTI 오늘', blurb: '유형별 강점·주의점을 오늘의 흐름에 연결' },
  { title: '성향 조합', blurb: '여러 지표를 겹쳐 나만의 성향 지도 만들기' },
];

const DETAIL_LOCK = {
  title: '상세 풀이',
  description:
    '광고를 보면 본문과 힌트를 열 수 있어요. 지금은 광고 준비 중이라 눌러서 바로 확인할 수 있습니다.',
  ctaLabel: '내용 보기',
} as const;

const PROFILE_EDIT_FIELD: Record<string, IDCardFieldKey | undefined> = {
  별자리: 'birthDate',
  '열두 동물': 'birthDate',
  MBTI: 'mbti',
  혈액형: 'bloodType',
};

type KeywordJump = {
  label: string;
  section: string;
};

function collectKeywordJumps(blocks: TraitBlock[]): KeywordJump[] {
  const seen = new Set<string>();
  const out: KeywordJump[] = [];
  for (const block of blocks) {
    for (const label of [...block.keywords, ...(block.watchouts ?? [])]) {
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out.push({ label, section: block.eyebrow });
    }
  }
  return out;
}

function NatalSection({
  profile,
  keywordJumps,
  zodiacMark,
  scheme,
  text,
  muted,
  hairline,
  onFieldPress,
  onKeywordPress,
}: {
  profile: ProfileField[];
  keywordJumps: KeywordJump[];
  zodiacMark: ImageSourcePropType | null;
  scheme: 'light' | 'dark';
  text: string;
  muted: string;
  hairline: string;
  onFieldPress: (field: IDCardFieldKey) => void;
  onKeywordPress: (section: string) => void;
}) {
  return (
    <View style={[styles.natal, { borderTopColor: hairline }]}>
      <Text style={[styles.natalTitle, { color: text, fontFamily: display }]}>나의 성향</Text>
      <View style={styles.natalBody}>
        {zodiacMark ? (
          <View pointerEvents="none" style={styles.zodiacWatermark}>
            <Image
              source={zodiacMark}
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={[
                styles.zodiacWatermarkImage,
                {
                  tintColor: muted,
                  opacity: scheme === 'dark' ? 0.2 : 0.16,
                },
              ]}
              resizeMode="contain"
            />
          </View>
        ) : null}
        {keywordJumps.length > 0 ? (
          <View style={styles.keywordRow}>
            {keywordJumps.map((item) => (
              <Pressable
                key={`${item.section}-${item.label}`}
                onPress={() => onKeywordPress(item.section)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} 섹션으로 이동`}>
                <KeywordBadge label={item.label} />
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.profileList}>
          {profile.map((field) => {
            const editField = PROFILE_EDIT_FIELD[field.label];
            const row = (
              <>
                <Text style={[styles.profileLabel, { color: muted }]}>{field.label}</Text>
                <Text style={[styles.profileValue, { color: field.value ? text : muted }]}>
                  {field.value ?? '—'}
                </Text>
              </>
            );

            if (!editField) {
              return (
                <View key={field.label} style={[styles.profileRow, { borderBottomColor: hairline }]}>
                  {row}
                </View>
              );
            }

            return (
              <Pressable
                key={field.label}
                accessibilityRole="button"
                accessibilityLabel={`${field.label} 수정`}
                onPress={() => onFieldPress(editField)}
                style={({ pressed }) => [
                  styles.profileRow,
                  { borderBottomColor: hairline, opacity: pressed ? 0.65 : 1 },
                ]}>
                {row}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  tint,
  text,
  onAction,
}: {
  title: string;
  actionLabel: string;
  tint: string;
  text: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: text, fontFamily: display, flex: 1 }]}>{title}</Text>
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        style={({ pressed }) => [{ opacity: pressed ? 0.55 : 1, paddingVertical: 4, paddingLeft: 8 }]}>
        <Text style={[styles.sectionAction, { color: tint }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function MbtiSection({
  block,
  fourAxis,
  tint,
  text,
  muted,
  hairline,
  onLayoutY,
}: {
  block: TraitBlock | null;
  fourAxis?: FourAxisResult;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
  onLayoutY: (y: number) => void;
}) {
  const router = useRouter();

  return (
    <View
      style={[styles.block, { borderTopColor: hairline }]}
      onLayout={(e) => onLayoutY(e.nativeEvent.layout.y)}>
      <View style={styles.blockSummary}>
        <SectionHeader
          title="MBTI"
          actionLabel="4축 테스트"
          tint={tint}
          text={text}
          onAction={() => router.push('/personality-test?kind=four-axis')}
        />
        <View style={styles.titleRow}>
          <Text style={[styles.flowTitle, { color: block || fourAxis ? tint : muted, flexShrink: 0 }]}>
            {fourAxis?.code ?? block?.title ?? '—'}
          </Text>
          {fourAxis ? (
            <Text style={[styles.axisPercents, { color: text, flex: 1 }]} numberOfLines={2}>
              {Object.values(fourAxis.axes)
                .map((axis) => {
                  const percent =
                    axis.selected === axis.left ? axis.leftPercent : 100 - axis.leftPercent;
                  return `${axis.selected} ${percent}%`;
                })
                .join('  ·  ')}
            </Text>
          ) : null}
        </View>
        {block?.meta ? <Text style={[styles.blockMeta, { color: muted }]}>{block.meta}</Text> : null}
        {block && block.keywords.length > 0 ? (
          <View style={styles.toneRow}>
            {block.keywords.map((kw, i) => (
              <KeywordBadge key={`kw-mbti-${i}-${kw}`} label={kw} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        {block ? (
          <>
            {block.summary ? <Text style={[styles.body, { color: text }]}>{block.summary}</Text> : null}
            {block.hints.map((hint, i) => (
              <View key={`mbti-h-${i}`} style={styles.hintRow}>
                <Text style={[styles.hintLabel, { color: tint }]}>{hint.label}</Text>
                <Text style={[styles.hintText, { color: muted }]}>{hint.text}</Text>
              </View>
            ))}
            {block.watchouts && block.watchouts.length > 0 ? (
              <View style={styles.watchWrap}>
                <Text style={[styles.watchLabel, { color: muted }]}>참고</Text>
                <View style={styles.toneRow}>
                  {block.watchouts.map((w, i) => (
                    <KeywordBadge key={`w-mbti-${i}-${w}`} label={w} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={[styles.body, { color: muted }]}>
            프로필에 MBTI를 넣거나, 우측 4축 테스트로 참고용 축별 비중을 확인할 수 있어요.
          </Text>
        )}
      </View>
    </View>
  );
}

function BigFiveSection({
  result,
  tint,
  text,
  muted,
  hairline,
  onLayoutY,
}: {
  result?: BigFiveResult;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
  onLayoutY: (y: number) => void;
}) {
  const router = useRouter();
  const block = result ? bigFiveBlock(result) : null;

  return (
    <View
      style={[styles.block, { borderTopColor: hairline }, !block ? styles.lockedBlock : null]}
      onLayout={(e) => onLayoutY(e.nativeEvent.layout.y)}>
      <View style={styles.blockSummary}>
        <SectionHeader
          title="Big Five"
          actionLabel={block ? '다시하기' : '테스트'}
          tint={tint}
          text={text}
          onAction={() => router.push('/personality-test?kind=big-five')}
        />
        {block ? (
          <>
            <Text style={[styles.flowTitle, { color: tint }]}>{block.title}</Text>
            {block.meta ? <Text style={[styles.blockMeta, { color: muted }]}>{block.meta}</Text> : null}
            {block.keywords.length > 0 ? (
              <View style={styles.toneRow}>
                {block.keywords.map((kw, i) => (
                  <KeywordBadge key={`kw-bf-${i}-${kw}`} label={kw} />
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={[styles.flowTitle, { color: muted }]}>테스트 후 열려요</Text>
        )}
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        {block ? (
          <>
            <Text style={[styles.body, { color: text }]}>{block.summary}</Text>
            {block.hints.map((hint, i) => (
              <View key={`bf-h-${i}`} style={styles.hintRow}>
                <Text style={[styles.hintLabel, { color: tint }]}>{hint.label}</Text>
                <Text style={[styles.hintText, { color: muted }]}>{hint.text}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={[styles.body, { color: muted }]}>
            20문항을 풀면 외향성·원만성·성실성·정서 안정성·개방성 참고 점수가 이 자리에 표시됩니다.
          </Text>
        )}
      </View>
    </View>
  );
}

export default function SeonghyangScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile } = useProfile();
  const { results } = usePersonalityResults();
  const ready = isFortuneReady(profile);
  const reading = useMemo(
    () => (ready ? buildSeonghyangReading(profile, results) : null),
    [profile, ready, results],
  );
  const zodiacMark = useMemo(() => {
    const west = getWesternZodiac(profile.birthDate);
    return west ? zodiacWatermarkSource(west.id) : null;
  }, [profile.birthDate]);
  const keywordJumps = useMemo(
    () => (reading ? collectKeywordJumps(reading.blocks) : []),
    [reading],
  );
  const [activeField, setActiveField] = useState<IDCardFieldKey | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});

  const scrollToSection = (section: string) => {
    const y = sectionY.current[section];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  };

  const mbtiBlock = reading?.blocks.find((block) => block.eyebrow === 'MBTI') ?? null;
  const blocksBeforeMbti =
    reading?.blocks.filter(
      (block) => block.eyebrow === '별자리' || block.eyebrow === '열두 동물',
    ) ?? [];
  const blocksAfterMbti =
    reading?.blocks.filter(
      (block) =>
        block.eyebrow !== 'MBTI' &&
        block.eyebrow !== '별자리' &&
        block.eyebrow !== '열두 동물',
    ) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>SEONGHYANG</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>성향</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          {ready
            ? '신분증에 담긴 별자리·열두 동물·MBTI·혈액형과 성향 테스트 결과를 바탕으로 참고용 풀이를 보여 줍니다.'
            : '내 프로필이 필요해요. 지도 탭 신분증에 이름과 생년월일을 입력하면 성향 풀이가 열립니다.'}
        </Text>

        {reading ? (
          <>
            {reading.today ? (
              <TodaySeonghyangCard
                today={reading.today}
                tint={c.tint}
                text={c.text}
                muted={c.muted}
                surface={c.surface}
                hairline={c.hairline}
              />
            ) : null}

            <NatalSection
              profile={reading.profile}
              keywordJumps={keywordJumps}
              zodiacMark={zodiacMark}
              scheme={scheme}
              text={c.text}
              muted={c.muted}
              hairline={c.hairline}
              onFieldPress={setActiveField}
              onKeywordPress={scrollToSection}
            />

            {blocksBeforeMbti.map((block) => (
              <TraitSection
                key={block.eyebrow}
                block={block}
                tint={c.tint}
                text={c.text}
                muted={c.muted}
                hairline={c.hairline}
                onLayoutY={(y) => {
                  sectionY.current[block.eyebrow] = y;
                }}
              />
            ))}

            <MbtiSection
              block={mbtiBlock}
              fourAxis={results.fourAxis}
              tint={c.tint}
              text={c.text}
              muted={c.muted}
              hairline={c.hairline}
              onLayoutY={(y) => {
                sectionY.current.MBTI = y;
              }}
            />

            <BigFiveSection
              result={results.bigFive}
              tint={c.tint}
              text={c.text}
              muted={c.muted}
              hairline={c.hairline}
              onLayoutY={(y) => {
                sectionY.current['Big Five'] = y;
              }}
            />

            {blocksAfterMbti.map((block) => (
              <TraitSection
                key={block.eyebrow}
                block={block}
                tint={c.tint}
                text={c.text}
                muted={c.muted}
                hairline={c.hairline}
                onLayoutY={(y) => {
                  sectionY.current[block.eyebrow] = y;
                }}
              />
            ))}
          </>
        ) : null}

        <UpcomingFeatures items={UPCOMING} />

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>

      <FieldEditorModal field={activeField} onClose={() => setActiveField(null)} />
    </View>
  );
}

function TodayDetailBody({
  today,
  text,
  muted,
}: {
  today: TodaySeonghyang;
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
          <Text style={[styles.body, { color: muted }]}>{today.summary}</Text>
          {today.hints.map((hint, i) => (
            <View key={`today-h-${i}`} style={styles.hintRow}>
              <Text style={[styles.hintLabel, { color: text }]}>{hint.label}</Text>
              <Text style={[styles.hintText, { color: muted }]}>{hint.text}</Text>
            </View>
          ))}
        </>
      ) : null}
    </LockedContentCard>
  );
}

function TodaySeonghyangCard({
  today,
  tint,
  text,
  muted,
  surface,
  hairline,
}: {
  today: TodaySeonghyang;
  tint: string;
  text: string;
  muted: string;
  surface: string;
  hairline: string;
}) {
  return (
    <View style={[styles.todayCard, paperShadow, { backgroundColor: surface }]}>
      <View style={styles.cardSummary}>
        <Text style={[styles.todayTitle, { color: text, fontFamily: display }]}>오늘의 성향</Text>
        <Text style={[styles.todayDate, { color: muted }]}>{today.dateLabel}</Text>
        <Text style={[styles.flowTitle, { color: tint }]}>{today.headline}</Text>
        <Text style={[styles.blockMeta, { color: muted }]}>{today.meta}</Text>
        {today.keywords.length > 0 ? (
          <View style={styles.toneRow}>
            {today.keywords.map((kw, i) => (
              <KeywordBadge key={`today-kw-${i}-${kw}`} label={kw} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        <TodayDetailBody today={today} text={text} muted={muted} />
      </View>
    </View>
  );
}

function TraitSection({
  block,
  tint,
  text,
  muted,
  hairline,
  onLayoutY,
}: {
  block: TraitBlock;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
  onLayoutY: (y: number) => void;
}) {
  return (
    <View
      style={[styles.block, { borderTopColor: hairline }]}
      onLayout={(e) => onLayoutY(e.nativeEvent.layout.y)}>
      <View style={styles.blockSummary}>
        <Text style={[styles.sectionTitle, { color: text, fontFamily: display }]}>
          {block.eyebrow}
        </Text>
        <Text style={[styles.flowTitle, { color: tint }]}>{block.title}</Text>
        {block.meta ? <Text style={[styles.blockMeta, { color: muted }]}>{block.meta}</Text> : null}
        {block.keywords.length > 0 ? (
          <View style={styles.toneRow}>
            {block.keywords.map((kw, i) => (
              <KeywordBadge key={`kw-${block.eyebrow}-${i}-${kw}`} label={kw} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
        {block.summary ? <Text style={[styles.body, { color: text }]}>{block.summary}</Text> : null}
        {block.hints.map((hint, i) => (
          <View key={`${block.eyebrow}-h-${i}`} style={styles.hintRow}>
            <Text style={[styles.hintLabel, { color: tint }]}>{hint.label}</Text>
            <Text style={[styles.hintText, { color: muted }]}>{hint.text}</Text>
          </View>
        ))}
        {block.watchouts && block.watchouts.length > 0 ? (
          <View style={styles.watchWrap}>
            <Text style={[styles.watchLabel, { color: muted }]}>참고</Text>
            <View style={styles.toneRow}>
              {block.watchouts.map((w, i) => (
                <KeywordBadge key={`w-${block.eyebrow}-${i}-${w}`} label={w} />
              ))}
            </View>
          </View>
        ) : null}
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
  todayTitle: {
    ...tabSection.cardTitle,
  },
  todayDate: { alignSelf: 'flex-start', fontSize: 12 },
  natal: {
    ...tabSection.rule,
    gap: tabSection.summaryGap,
  },
  natalTitle: {
    ...tabSection.title,
  },
  natalBody: {
    position: 'relative',
    overflow: 'hidden',
    gap: tabSection.summaryGap,
  },
  zodiacWatermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zodiacWatermarkImage: {
    width: 220,
    height: 220,
  },
  profileList: { gap: 0 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  profileLabel: { fontSize: 13 },
  profileValue: { fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  block: {
    ...tabSection.rule,
    gap: 0,
  },
  lockedBlock: {
    opacity: 0.72,
  },
  blockSummary: {
    gap: tabSection.summaryGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  axisPercents: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  cardSplit: {
    ...tabSection.cardSplit,
  },
  sectionTitle: { ...tabSection.title },
  flowTitle: { ...tabSection.flowTitle },
  blockMeta: { fontSize: 13, lineHeight: 18 },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  body: { ...tabSection.detailBody },
  hintRow: { ...tabSection.detailHintBlock },
  hintLabel: { ...tabSection.detailLabel },
  hintText: { ...tabSection.detailHint },
  watchWrap: { gap: 8, marginTop: 4 },
  watchLabel: { fontSize: 12, fontWeight: '600' },
  disclaimer: { ...tabSection.disclaimer },
});