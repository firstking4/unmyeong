import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FieldEditorModal } from '@/components/id-card/FieldEditorModal';
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
import { useRewardUnlock } from '@/context/RewardUnlockContext';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import type { IDCardFieldKey } from '@/lib/idCardFields';
import { type BigFiveResult, type FourAxisResult } from '@/lib/personalityTest';
import {
  bigFiveBlock,
  buildPersonalityCombo,
  buildSeonghyangReading,
  type PersonalityCombo,
  type TodayMbtiResult,
  type TodaySeonghyang,
  type TraitBlock,
} from '@/lib/seonghyang';
import { useLocalDateKey } from '@/lib/useLocalDateKey';
import { useTabScrollReset } from '@/lib/useTabScrollReset';

const DETAIL_LOCK = {
  title: '상세 풀이',
  description:
    '자세한 풀이를 열 수 있어요. 한 번 열면 오늘 자정까지 유지됩니다.',
  ctaLabel: '내용 보기',
} as const;

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
}: {
  block: TraitBlock | null;
  fourAxis?: FourAxisResult;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  const router = useRouter();

  return (
    <View style={[styles.block, { borderTopColor: hairline }]}>
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
}: {
  result?: BigFiveResult;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  const router = useRouter();
  const block = result ? bigFiveBlock(result) : null;

  return (
    <View style={[styles.block, { borderTopColor: hairline }, !block ? styles.lockedBlock : null]}>
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
  const router = useRouter();
  const { profile } = useProfile();
  const { results } = usePersonalityResults();
  const scrollRef = useTabScrollReset();
  const ready = isFortuneReady(profile);
  const dateKey = useLocalDateKey();
  const reading = useMemo(
    () => (ready ? buildSeonghyangReading(profile, results) : null),
    [profile, ready, results, dateKey],
  );
  const combo = useMemo(
    () => (ready ? buildPersonalityCombo(profile, results) : null),
    [profile, ready, results],
  );
  const [activeField, setActiveField] = useState<IDCardFieldKey | null>(null);

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
                onEditMbti={() => setActiveField('mbti')}
                onOpenTest={() => router.push('/personality-test')}
              />
            ) : null}

            {combo ? (
              <PersonalityComboSection
                combo={combo}
                tint={c.tint}
                text={c.text}
                muted={c.muted}
                hairline={c.hairline}
                onEditMbti={() => setActiveField('mbti')}
                onEditBlood={() => setActiveField('bloodType')}
                onOpenTest={() => router.push('/personality-test')}
              />
            ) : null}

            {blocksBeforeMbti.map((block) => (
              <TraitSection
                key={block.eyebrow}
                block={block}
                tint={c.tint}
                text={c.text}
                muted={c.muted}
                hairline={c.hairline}
              />
            ))}

            <MbtiSection
              block={mbtiBlock}
              fourAxis={results.fourAxis}
              tint={c.tint}
              text={c.text}
              muted={c.muted}
              hairline={c.hairline}
            />

            <BigFiveSection
              result={results.bigFive}
              tint={c.tint}
              text={c.text}
              muted={c.muted}
              hairline={c.hairline}
            />

            {blocksAfterMbti.map((block) => (
              <TraitSection
                key={block.eyebrow}
                block={block}
                tint={c.tint}
                text={c.text}
                muted={c.muted}
                hairline={c.hairline}
              />
            ))}
          </>
        ) : null}

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>

      <FieldEditorModal field={activeField} onClose={() => setActiveField(null)} />
    </View>
  );
}

function PersonalityComboSection({
  combo,
  tint,
  text,
  muted,
  hairline,
  onEditMbti,
  onEditBlood,
  onOpenTest,
}: {
  combo: PersonalityCombo;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
  onEditMbti: () => void;
  onEditBlood: () => void;
  onOpenTest: () => void;
}) {
  return (
    <View style={[styles.block, { borderTopColor: hairline }]}>
      <View style={styles.blockSummary}>
        <Text style={[styles.sectionTitle, { color: text, fontFamily: display }]}>성향 조합</Text>
        <Text style={[styles.flowTitle, { color: tint }]}>{combo.headline}</Text>
        {combo.meta ? <Text style={[styles.blockMeta, { color: muted }]}>{combo.meta}</Text> : null}
        {combo.keywords.length > 0 ? (
          <View style={styles.toneRow}>
            {combo.keywords.map((kw, i) => (
              <KeywordBadge key={`combo-kw-${i}-${kw}`} label={kw} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.cardSplit, styles.comboStack, { borderTopColor: hairline }]}>
        <Text style={[styles.body, { color: muted }]}>{combo.summary}</Text>
        {combo.strengths.length > 0 ? (
          <View style={styles.watchWrap}>
            <Text style={[styles.watchLabel, { color: text }]}>잘 드러나는 결</Text>
            <Text style={[styles.hintText, { color: muted }]}>{combo.strengths.join(' · ')}</Text>
          </View>
        ) : null}
        {combo.watchouts.length > 0 ? (
          <View style={styles.watchWrap}>
            <Text style={[styles.watchLabel, { color: text }]}>짧게 점검할 신호</Text>
            <Text style={[styles.hintText, { color: muted }]}>{combo.watchouts.join(' · ')}</Text>
          </View>
        ) : null}
        {combo.missing.length > 0 ? (
          <View style={styles.watchWrap}>
            <Text style={[styles.watchLabel, { color: muted }]}>더 채우면 좋은 것</Text>
            <Text style={[styles.hintText, { color: muted }]}>{combo.missing.join(' · ')}</Text>
            <View style={styles.ctaRow}>
              {combo.missing.some((item) => item.includes('MBTI')) ? (
                <Pressable
                  onPress={onEditMbti}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}>
                  <Text style={[styles.sectionAction, { color: tint }]}>MBTI</Text>
                </Pressable>
              ) : null}
              {combo.missing.some((item) => item.includes('혈액형')) ? (
                <Pressable
                  onPress={onEditBlood}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}>
                  <Text style={[styles.sectionAction, { color: tint }]}>혈액형</Text>
                </Pressable>
              ) : null}
              {combo.missing.some((item) => item.includes('테스트') || item.includes('Big Five')) ? (
                <Pressable
                  onPress={onOpenTest}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}>
                  <Text style={[styles.sectionAction, { color: tint }]}>성향 테스트</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
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
  const { isUnlocked, grantUnlock } = useRewardUnlock();
  const unlocked = isUnlocked('seonghyang_today');

  return (
    <LockedContentCard
      lockId="seonghyang_today"
      title={DETAIL_LOCK.title}
      description={DETAIL_LOCK.description}
      ctaLabel={DETAIL_LOCK.ctaLabel}
      onPress={() => {
        void grantUnlock('seonghyang_today');
      }}>
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

function MbtiPromptRow({
  mbti,
  tint,
  muted,
  onEditMbti,
  onOpenTest,
}: {
  mbti: TodayMbtiResult;
  tint: string;
  muted: string;
  onEditMbti: () => void;
  onOpenTest: () => void;
}) {
  if (mbti.status === 'ready') return null;

  if (mbti.status === 'fourAxis') {
    return (
      <View style={styles.mbtiPrompt}>
        <Text style={[styles.hintText, { color: muted }]}>
          4축 코드({mbti.code})만 있어요. MBTI를 넣으면 유형 흐름도 오늘 카드에 같이 보여 줍니다.
        </Text>
        <Pressable onPress={onEditMbti} style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[styles.sectionAction, { color: tint }]}>MBTI 입력</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.mbtiPrompt}>
      <Text style={[styles.hintText, { color: muted }]}>
        MBTI를 넣으면 유형 강점·주의점도 오늘의 흐름에 연결해 보여 줍니다.
      </Text>
      <View style={styles.ctaRow}>
        <Pressable onPress={onEditMbti} style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[styles.sectionAction, { color: tint }]}>MBTI 입력</Text>
        </Pressable>
        <Pressable onPress={onOpenTest} style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[styles.sectionAction, { color: tint }]}>성향 테스트</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TodaySeonghyangCard({
  today,
  tint,
  text,
  muted,
  surface,
  hairline,
  onEditMbti,
  onOpenTest,
}: {
  today: TodaySeonghyang;
  tint: string;
  text: string;
  muted: string;
  surface: string;
  hairline: string;
  onEditMbti: () => void;
  onOpenTest: () => void;
}) {
  return (
    <View style={[styles.todayCard, paperShadow, { backgroundColor: surface }]}>
      <View style={styles.cardSummary}>
        <View style={styles.todayTitleRow}>
          <Text style={[styles.todayTitle, { color: text, fontFamily: display }]}>오늘의 성향</Text>
          <Text style={[styles.todayDate, { color: muted }]}>{today.dateLabel}</Text>
        </View>
        <Text style={[styles.flowTitle, { color: tint }]}>{today.headline}</Text>
        <Text style={[styles.blockMeta, { color: muted }]}>{today.meta}</Text>
        {today.keywords.length > 0 ? (
          <View style={styles.toneRow}>
            {today.keywords.map((kw, i) => (
              <KeywordBadge key={`today-kw-${i}-${kw}`} label={kw} />
            ))}
          </View>
        ) : null}
        <MbtiPromptRow
          mbti={today.mbti}
          tint={tint}
          muted={muted}
          onEditMbti={onEditMbti}
          onOpenTest={onOpenTest}
        />
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
}: {
  block: TraitBlock;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  return (
    <View style={[styles.block, { borderTopColor: hairline }]}>
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
    flexShrink: 1,
  },
  todayTitleRow: {
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
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  mbtiPrompt: {
    gap: 8,
    marginTop: 4,
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
  comboStack: {
    ...tabSection.stack,
  },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  body: { ...tabSection.detailBody },
  hintRow: { ...tabSection.detailHintBlock },
  hintLabel: { ...tabSection.detailLabel },
  hintText: { ...tabSection.detailHint },
  watchWrap: { gap: 8 },
  watchLabel: { fontSize: 12, fontWeight: '600' },
  disclaimer: { ...tabSection.disclaimer },
});