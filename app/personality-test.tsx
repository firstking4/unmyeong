import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { usePersonalityResults } from '@/context/PersonalityResultsContext';
import {
  BIG_FIVE_LABELS,
  BIG_FIVE_QUESTIONS,
  FOUR_AXIS_QUESTIONS,
  scoreBigFive,
  scoreFourAxis,
  type BigFiveKey,
} from '@/lib/personalityTest';

const LIKERT = ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'];

export default function PersonalityTestScreen() {
  const router = useRouter();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const c = Colors[useColorScheme() ?? 'light'];
  const { setFourAxis, setBigFive } = usePersonalityResults();
  const isFourAxis = kind !== 'big-five';
  const questions = isFourAxis ? FOUR_AXIS_QUESTIONS : BIG_FIVE_QUESTIONS;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | 'left' | 'right'>>({});
  const [saved, setSaved] = useState(false);
  const question = questions[index];
  const answer = question ? answers[question.id] : undefined;
  const isLast = index === questions.length - 1;

  const result = useMemo(() => {
    if (!saved) return null;
    if (isFourAxis) return scoreFourAxis(answers as Record<string, 'left' | 'right'>);
    return scoreBigFive(answers as Record<string, number>);
  }, [answers, isFourAxis, saved]);

  const saveResult = async () => {
    if (isFourAxis) {
      await setFourAxis(scoreFourAxis(answers as Record<string, 'left' | 'right'>));
    } else {
      await setBigFive(scoreBigFive(answers as Record<string, number>));
    }
    setSaved(true);
  };

  if (saved && result) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ title: isFourAxis ? '4축 테스트 결과' : 'Big Five 결과' }} />
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>REFERENCE RESULT</Text>
          <Text style={[styles.title, { color: c.text, fontFamily: display }]}>
            {isFourAxis ? (result as ReturnType<typeof scoreFourAxis>).code : '나의 Big Five'}
          </Text>
          {isFourAxis ? (
            <>
              <Text style={[styles.description, { color: c.muted }]}>
                축별 퍼센트는 모집단 백분위가 아닌, 이 5개 문항에서의 응답 선호 비중입니다.
              </Text>
              {Object.values((result as ReturnType<typeof scoreFourAxis>).axes).map((axis) => (
                <ResultRow
                  key={axis.axis}
                  label={`${axis.left} ↔ ${axis.right}`}
                  value={`${axis.selected} · ${axis.left === axis.selected ? axis.leftPercent : 100 - axis.leftPercent}%`}
                  text={c.text}
                  muted={c.muted}
                  hairline={c.hairline}
                />
              ))}
            </>
          ) : (
            <>
              <Text style={[styles.description, { color: c.muted }]}>
                점수는 IPIP 공개 문항을 20개로 줄인 참고용 응답 점수이며, 표준화 검사 결과가 아닙니다.
              </Text>
              {(Object.entries((result as ReturnType<typeof scoreBigFive>).scores) as [BigFiveKey, number][]).map(
                ([trait, score]) => (
                  <ResultRow
                    key={trait}
                    label={BIG_FIVE_LABELS[trait]}
                    value={`${score}점`}
                    text={c.text}
                    muted={c.muted}
                    hairline={c.hairline}
                  />
                ),
              )}
            </>
          )}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: c.tint, opacity: pressed ? 0.7 : 1 }]}>
            <Text style={styles.primaryButtonText}>성향으로 돌아가기</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (!question) return null;
  const canContinue = answer !== undefined;
  const choose = (value: number | 'left' | 'right') => {
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: isFourAxis ? '4축 테스트' : 'Big Five 테스트' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>
          {isFourAxis ? 'FOUR AXES · 20 QUESTIONS' : 'BIG FIVE · 20 QUESTIONS'}
        </Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>
          {isFourAxis ? '더 가까운 쪽을 골라 주세요' : '평소의 나와 얼마나 가까운가요?'}
        </Text>
        <Text style={[styles.progress, { color: c.muted }]}>
          {index + 1} / {questions.length}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: c.card }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: c.tint, width: `${((index + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>

        {isFourAxis ? (
          <View style={styles.answerStack}>
            {(['left', 'right'] as const).map((side) => (
              <Pressable
                key={side}
                onPress={() => choose(side)}
                style={({ pressed }) => [
                  styles.answerButton,
                  {
                    backgroundColor: answer === side ? c.tint : c.card,
                    borderColor: answer === side ? c.tint : c.hairline,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <Text style={{ color: answer === side ? '#F3EEE6' : c.text, fontSize: 15, fontWeight: '600' }}>
                  {(question as (typeof FOUR_AXIS_QUESTIONS)[number])[side]}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <View style={[styles.questionCard, { backgroundColor: c.surface, borderColor: c.hairline }]}>
              <Text style={[styles.statement, { color: c.text }]}>
                {(question as (typeof BIG_FIVE_QUESTIONS)[number]).text}
              </Text>
            </View>
            <View style={styles.likertRow}>
              {LIKERT.map((label, option) => {
                const value = option + 1;
                const selected = answer === value;
                return (
                  <Pressable
                    key={label}
                    onPress={() => choose(value)}
                    accessibilityLabel={label}
                    style={({ pressed }) => [
                      styles.likertOption,
                      {
                        backgroundColor: selected ? c.tint : c.card,
                        borderColor: selected ? c.tint : c.hairline,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <Text style={{ color: selected ? '#F3EEE6' : c.text, fontWeight: '700' }}>{value}</Text>
                    <Text style={{ color: selected ? '#F3EEE6' : c.muted, fontSize: 10, textAlign: 'center' }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.navigation}>
          <Pressable
            disabled={index === 0}
            onPress={() => setIndex((current) => current - 1)}
            style={({ pressed }) => [
              styles.navButton,
              { backgroundColor: c.card, opacity: pressed || index === 0 ? 0.45 : 1 },
            ]}>
            <Text style={{ color: c.text, fontWeight: '700' }}>이전</Text>
          </Pressable>
          <Pressable
            disabled={!canContinue}
            onPress={() => (isLast ? saveResult() : setIndex((current) => current + 1))}
            style={({ pressed }) => [
              styles.navButton,
              { backgroundColor: c.tint, opacity: pressed || !canContinue ? 0.45 : 1 },
            ]}>
            <Text style={styles.primaryButtonText}>{isLast ? '결과 보기' : '다음'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function ResultRow({
  label,
  value,
  text,
  muted,
  hairline,
}: {
  label: string;
  value: string;
  text: string;
  muted: string;
  hairline: string;
}) {
  return (
    <View style={[styles.resultRow, { borderBottomColor: hairline }]}>
      <Text style={{ color: muted }}>{label}</Text>
      <Text style={{ color: text, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  resultContent: { padding: 20, gap: 16, paddingBottom: 40 },
  eyebrow: { fontSize: 12, letterSpacing: 2 },
  title: { fontSize: 28, lineHeight: 37 },
  description: { fontSize: 14, lineHeight: 21 },
  progress: { fontSize: 13, fontWeight: '600' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  questionCard: {
    minHeight: 190,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 22,
    justifyContent: 'center',
    gap: 14,
  },
  statement: { fontSize: 20, lineHeight: 31, fontWeight: '600', textAlign: 'center' },
  choiceText: { fontSize: 19, lineHeight: 28, fontWeight: '600', textAlign: 'center' },
  or: { fontSize: 13, textAlign: 'center' },
  answerStack: { gap: 10 },
  answerButton: { borderWidth: 1, borderRadius: 12, padding: 16 },
  likertRow: { flexDirection: 'row', gap: 6 },
  likertOption: {
    flex: 1,
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 10,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navigation: { flexDirection: 'row', gap: 10, marginTop: 4 },
  navButton: { flex: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  primaryButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#F3EEE6', fontWeight: '700', fontSize: 15 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
