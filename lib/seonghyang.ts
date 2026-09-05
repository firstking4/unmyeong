import {
  getBloodType,
  getMbti,
  getWesternZodiac,
  getZodiacAnimalRecord,
  mbtiAxisHint,
} from '@/lib/data/catalog';
import type { SeedRecord } from '@/lib/data/types';
import { pickDaily, pickDailyFrom, pickDailyMany, withSparseCaution } from '@/lib/daily/pick';
import { hasFinalConsonant, withEulReul } from '@/lib/korean/particle';
import { endSentence, joinSentences, splitSentences, stripSentenceEnd } from '@/lib/korean/sentence';
import {
  BIG_FIVE_LABELS,
  type BigFiveKey,
  type BigFiveResult,
  type FourAxisResult,
} from '@/lib/personalityTest';
import { getZodiacAnimal } from '@/lib/saju';
import type { Profile } from '@/lib/types';

export type TraitBlock = {
  eyebrow: string;
  title: string;
  meta?: string;
  keywords: string[];
  summary: string;
  hints: { label: string; text: string }[];
  watchouts?: string[];
};

export type ProfileField = {
  label: string;
  value: string | null;
};

export type TodayMbti = {
  dateLabel: string;
  headline: string;
  meta: string;
  keywords: string[];
  summary: string;
  hints: { label: string; text: string }[];
  watchouts: string[];
};

export type TodayMbtiResult =
  | { status: 'ready'; reading: TodayMbti }
  | { status: 'fourAxis'; code: string }
  | { status: 'missing' };

export type TodaySeonghyang = {
  dateLabel: string;
  headline: string;
  meta: string;
  keywords: string[];
  summary: string;
  hints: { label: string; text: string }[];
  /** 오늘의 성향 카드에 얹는 MBTI 레이어 (별도 섹션이 아님) */
  mbti: TodayMbtiResult;
};

export type PersonalityCombo = {
  headline: string;
  /** 사수자리 · 개 · INTJ 등 — 별자리 날짜줄과 같은 메타 */
  meta: string;
  /** 각 성향에서 모은 키워드 (요약 뱃지) */
  keywords: string[];
  strengths: string[];
  watchouts: string[];
  summary: string;
  missing: string[];
};

export type PersonalityAssessmentResults = {
  fourAxis?: FourAxisResult;
  bigFive?: BigFiveResult;
};

export type SeonghyangReading = {
  today: TodaySeonghyang | null;
  profile: ProfileField[];
  blocks: TraitBlock[];
  hasAny: boolean;
};

function hintRows(record: SeedRecord): { label: string; text: string }[] {
  const rows: { label: string; text: string }[] = [];
  if (record.hints?.love) rows.push({ label: '관계', text: record.hints.love });
  if (record.hints?.work) rows.push({ label: '일·재능', text: record.hints.work });
  if (record.hints?.growth) rows.push({ label: '성장', text: record.hints.growth });
  return rows;
}

function unique(words: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const raw of words) {
    const value = raw?.trim();
    if (!value || out.includes(value)) continue;
    out.push(value);
  }
  return out;
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function mbtiMeta(record: SeedRecord): string | undefined {
  const axis = (record.axis ?? [])
    .map((letter) => mbtiAxisHint(letter))
    .filter(Boolean) as string[];
  if (record.nickname && axis.length) return `${record.nickname} · ${axis.slice(0, 2).join(' · ')}`;
  if (record.nickname) return record.nickname;
  if (axis.length) return axis.slice(0, 3).join(' · ');
  return undefined;
}

function westMeta(record: SeedRecord): string | undefined {
  if (!record.dateRange) return undefined;
  const { start, end } = record.dateRange;
  const [sm, sd] = start.split('-');
  const [em, ed] = end.split('-');
  return `${Number(sm)}/${Number(sd)} – ${Number(em)}/${Number(ed)}`;
}

/**
 * MBTI 주의점(시드 `watchouts`, 「…할 때」 꼴)에 오늘 팩 주의를 잇는다.
 * 「몰입이 깊어질 때면 잠깐 자리에서 일어나 …」. 「때」로 끝나지 않는 값은 신호 표현으로 잇는다.
 */
function cautionWithWatch(watch: string | null | undefined, caution: string): string {
  if (!watch) return endSentence(caution);
  const lead = watch.endsWith('때') ? `${watch}면` : `${watch} 신호를 느끼면`;
  return endSentence(`${lead} ${stripSentenceEnd(caution)}`);
}

function buildTodaySeonghyang(
  profile: Profile,
  assessments: PersonalityAssessmentResults = {},
  date = new Date(),
): TodaySeonghyang | null {
  const west = getWesternZodiac(profile.birthDate);
  if (!west) return null;

  const themes = pickDailyMany('seonghyang', west.id, 3, date);
  const theme = themes[0]!;
  const mbti = buildTodayMbti(profile, assessments, date);
  const mbtiReady = mbti.status === 'ready' ? mbti.reading : null;
  const mbtiSeed = mbtiReady ? getMbti(profile.mbti) : null;
  // 시드에 날짜가 없으면 MBTI 타입당 문장이 영구 고정된다 — 요약·주의가 매일 같아짐
  const strength = mbtiSeed
    ? pickDailyFrom(mbtiSeed.strengths ?? mbtiSeed.keywords ?? [], `${mbtiSeed.id}:str`, date)
    : null;
  const watch = mbtiSeed
    ? pickDailyFrom(mbtiSeed.watchouts ?? [], `${mbtiSeed.id}:watch`, date)
    : null;

  // 칩은 오늘 팩 이웃 변주. 별자리·MBTI 강점은 사람 풀이라 넣지 않는다.
  const signKw = pickDailyFrom(west.keywords ?? [], `${west.id}:sign-kw`, date);
  const keywords = withSparseCaution(
    themes.map((item) => item.keyword),
    `seonghyang-caution:${west.id}`,
    date,
  );

  const labels = [west.label];
  if (mbtiSeed) labels.push(mbtiSeed.label);

  // 별자리 전체 소개(west.summary)는 별자리 섹션의 고정 설명이다.
  // 오늘 카드에 통째로 실으면 매일 같은 문장이 앞에 서므로,
  // 키워드 하나만 골라 오늘 흐름과 엮어 날마다 다른 문장이 되게 한다.
  const signClause = signKw
    ? pickDailyFrom(
        [
          `${west.label}의 ${signKw} 기운이 오늘 흐름과 만납니다.`,
          `${west.label}답게 오늘은 ${signKw} 쪽이 살아납니다.`,
          `${west.element} 기운 위에서 ${signKw} 결이 도드라집니다.`,
          `오늘은 ${west.label}의 ${signKw} 면이 앞에 섭니다.`,
        ],
        `${west.id}:sign-clause`,
        date,
      )
    : null;

  const summaryParts = [theme.focus, signClause];
  if (mbtiSeed && strength) {
    summaryParts.push(`${mbtiSeed.label}의 ${withEulReul(strength)} 오늘의 ‘${theme.keyword}’에 얹어 보세요.`);
  } else if (mbtiReady) {
    summaryParts.push(mbtiReady.summary);
  }

  // MBTI 관계 힌트는 타입 고정 문장이라 매일 통째로 붙이면 어제 문장이 된다.
  // 문장 하나만 날마다 돌리고, 어떤 날은 오늘 테마만 둔다.
  const loveHint = mbtiSeed?.hints?.love
    ? pickDailyFrom(
        [...splitSentences(mbtiSeed.hints.love), null],
        `${mbtiSeed.id}:love`,
        date,
      )
    : null;
  const relationship = loveHint
    ? joinSentences([theme.relationship, loveHint])
    : endSentence(theme.relationship);
  const action = endSentence(theme.action);
  const caution = cautionWithWatch(watch, theme.caution);

  return {
    dateLabel: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
    headline: theme.headline,
    meta: labels.join(' · '),
    keywords,
    summary: joinSentences(summaryParts),
    hints: [
      { label: '관계', text: relationship },
      { label: '오늘의 한 가지', text: action },
      { label: '주의', text: caution },
    ],
    mbti,
  };
}

/** MBTI 시드 + 일일 팩을 겹친 참고용 오늘 풀이 */
export function buildTodayMbti(
  profile: Profile,
  assessments: PersonalityAssessmentResults = {},
  date = new Date(),
): TodayMbtiResult {
  const mbti = getMbti(profile.mbti);
  if (!mbti) {
    if (assessments.fourAxis?.code) {
      return { status: 'fourAxis', code: assessments.fourAxis.code };
    }
    return { status: 'missing' };
  }

  const theme = pickDaily('seonghyang', mbti.id, date);
  const strength =
    pickDailyFrom(mbti.strengths ?? mbti.keywords ?? [], `${mbti.id}:str`, date) ?? theme.keyword;
  const watch = pickDailyFrom(mbti.watchouts ?? [], `${mbti.id}:watch`, date);
  const dateLabel = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return {
    status: 'ready',
    reading: {
      dateLabel,
      headline: `${mbti.label}, ${theme.headline}`,
      meta: mbtiMeta(mbti) ? `MBTI · ${mbtiMeta(mbti)}` : `MBTI · ${mbti.label}`,
      keywords: unique([theme.keyword, strength]).slice(0, 3),
      // 타입 전체 소개(mbti.summary)는 MBTI 섹션의 고정 설명이다.
      // 오늘 풀이에는 싣지 않고 오늘 테마와 오늘의 강점만 엮는다.
      summary: joinSentences([
        theme.focus,
        `오늘의 ‘${theme.keyword}’에 ${withEulReul(strength)} 얹어 보세요.`,
      ]),
      hints: [
        {
          label: '관계',
          text: (() => {
            const love = mbti.hints?.love
              ? pickDailyFrom(
                  [...splitSentences(mbti.hints.love), null],
                  `${mbti.id}:love`,
                  date,
                )
              : null;
            return love
              ? joinSentences([theme.relationship, love])
              : endSentence(theme.relationship);
          })(),
        },
        {
          label: '일·재능',
          text: (() => {
            const work = mbti.hints?.work
              ? pickDailyFrom(
                  [...splitSentences(mbti.hints.work), null],
                  `${mbti.id}:work`,
                  date,
                )
              : null;
            return work
              ? joinSentences([theme.focus, work])
              : joinSentences([
                  theme.focus,
                  `키워드 ‘${strength}’${hasFinalConsonant(strength) ? '을' : '를'} 업무 한곳에 적용해 보세요.`,
                ]);
          })(),
        },
        { label: '오늘의 한 가지', text: endSentence(theme.action) },
        { label: '주의', text: cautionWithWatch(watch, theme.caution) },
      ],
      watchouts: unique([watch, ...(mbti.watchouts ?? [])]).slice(0, 2),
    },
  };
}

/** 여러 지표를 나열·교차해 보여주는 참고용 성향 지도 */
export function buildPersonalityCombo(
  profile: Profile,
  assessments: PersonalityAssessmentResults = {},
): PersonalityCombo {
  const west = getWesternZodiac(profile.birthDate);
  const animalLabel = getZodiacAnimal(profile.birthDate);
  const animal = getZodiacAnimalRecord(animalLabel);
  const mbti = getMbti(profile.mbti);
  const blood = getBloodType(profile.bloodType);
  const fourAxis = assessments.fourAxis;
  const bigFive = assessments.bigFive;

  /** 메타줄 — 실제 성향 값 */
  const labels: string[] = [];
  /** 요약 뱃지 — 각 성향 키워드 모음 */
  const keywords: string[] = [];
  const strengths: string[] = [];
  const watchouts: string[] = [];
  const missing: string[] = [];

  if (west) {
    labels.push(west.label);
    keywords.push(...(west.keywords ?? []).slice(0, 3));
    strengths.push(...(west.keywords ?? []).slice(0, 2));
  } else {
    missing.push('생년월일(별자리)');
  }

  if (animal) {
    labels.push(animal.label);
    keywords.push(...(animal.keywords ?? []).slice(0, 3));
    strengths.push(...(animal.keywords ?? []).slice(0, 2));
  } else if (!profile.birthDate) {
    missing.push('열두 동물');
  }

  if (mbti) {
    labels.push(mbti.label);
    keywords.push(...(mbti.keywords ?? []).slice(0, 3));
    strengths.push(...(mbti.strengths ?? mbti.keywords ?? []).slice(0, 2));
    watchouts.push(...(mbti.watchouts ?? []).slice(0, 2));
  } else if (fourAxis) {
    labels.push(fourAxis.code);
    for (const axis of Object.values(fourAxis.axes)) {
      keywords.push(axis.selected);
      strengths.push(axis.selected);
    }
  } else {
    missing.push('MBTI 또는 4축 테스트');
  }

  if (blood) {
    labels.push(`${blood.label}형`);
    keywords.push(...(blood.keywords ?? []).slice(0, 2));
    strengths.push(...(blood.keywords ?? []).slice(0, 1));
  } else {
    missing.push('혈액형');
  }

  if (bigFive) {
    const sorted = (Object.entries(bigFive.scores) as [BigFiveKey, number][]).sort(
      ([, left], [, right]) => right - left,
    );
    const top = sorted[0];
    if (top) labels.push(BIG_FIVE_LABELS[top[0]]);
    keywords.push(...sorted.slice(0, 2).map(([key]) => BIG_FIVE_LABELS[key]));
    strengths.push(...sorted.slice(0, 2).map(([key]) => BIG_FIVE_LABELS[key]));
    const lowest = sorted[sorted.length - 1];
    if (lowest) watchouts.push(`${BIG_FIVE_LABELS[lowest[0]]} 과부하`);
  } else {
    missing.push('Big Five 테스트');
  }

  const uniqueLabels = unique(labels);
  const uniqueKeywords = unique(keywords).slice(0, 8);
  const uniqueStrengths = unique(strengths).slice(0, 5);
  const uniqueWatchouts = unique(watchouts).slice(0, 4);
  const headline =
    uniqueLabels.length >= 2
      ? `${uniqueLabels.length}가지를 겹친 성향 지도`
      : uniqueLabels.length === 1
        ? `${uniqueLabels[0]} 중심의 성향 지도`
        : '아직 모을 지표가 부족해요';

  const summaryParts: string[] = [];
  if (uniqueLabels.length > 0) {
    summaryParts.push(
      '프로필과 테스트에서 모은 성향을 한 장에 겹쳐 본 참고용 지도입니다. 어느 한쪽을 정답처럼 단정하지 말고, 겹치는 결·어긋나는 신호만 가볍게 읽어 보세요.',
    );
  }
  if (missing.length > 0 && uniqueLabels.length === 0) {
    summaryParts.push(`더 촘촘히 보려면 ${withEulReul(missing.join(' · '))} 채워 보세요.`);
  }
  if (summaryParts.length === 0) {
    summaryParts.push(
      '생년월일·MBTI·혈액형 또는 성향 테스트를 입력하면, 여러 지표를 겹친 참고용 지도를 만들 수 있어요.',
    );
  }

  return {
    headline,
    meta: uniqueLabels.length > 0 ? uniqueLabels.join(' · ') : '입력된 성향 없음',
    keywords: uniqueKeywords,
    strengths: uniqueStrengths,
    watchouts: uniqueWatchouts,
    summary: summaryParts.join(' '),
    missing,
  };
}

export function fourAxisBlock(result: FourAxisResult): TraitBlock {
  const axes = Object.values(result.axes);
  return {
    eyebrow: '4축 테스트',
    title: result.code,
    meta: '각 축 5문항의 응답 선호 비중',
    keywords: axes.map((axis) => {
      const percent = axis.selected === axis.left ? axis.leftPercent : 100 - axis.leftPercent;
      return `${axis.selected} ${percent}%`;
    }),
    summary:
      '네 축에서 고른 응답을 바탕으로 만든 참고용 성향 코드입니다. 진단이나 표준화 검사 결과가 아니며, 상황에 따라 달라질 수 있어요.',
    hints: axes.map((axis) => {
      const percent = axis.selected === axis.left ? axis.leftPercent : 100 - axis.leftPercent;
      return {
        label: `${axis.left} ↔ ${axis.right}`,
        text: `${axis.selected} 쪽 응답 ${percent}%`,
      };
    }),
  };
}

export function bigFiveBlock(result: BigFiveResult): TraitBlock {
  const scoreEntries = Object.entries(result.scores) as [BigFiveKey, number][];
  const sorted = [...scoreEntries].sort(([, left], [, right]) => right - left);
  return {
    eyebrow: 'Big Five',
    title: '나의 기질 흐름',
    meta: 'IPIP 공개 문항을 20개로 줄인 참고용 점수',
    keywords: sorted.slice(0, 3).map(([trait, score]) => `${BIG_FIVE_LABELS[trait]} ${score}`),
    summary:
      '다섯 기질의 응답 경향을 간단히 정리한 결과입니다. 점수는 다른 사람과의 비교가 아니라, 이번 20개 문항에 대한 내 응답을 0–100으로 환산한 값이에요.',
    hints: scoreEntries.map(([trait, score]) => ({
      label: BIG_FIVE_LABELS[trait],
      text: `${score}점`,
    })),
  };
}

/** 프로필에 채워진 성향 지표만 모아 참고용 풀이 */
export function buildSeonghyangReading(
  profile: Profile,
  assessments: PersonalityAssessmentResults = {},
  date = new Date(),
): SeonghyangReading {
  const west = getWesternZodiac(profile.birthDate);
  const animalLabel = getZodiacAnimal(profile.birthDate);
  const animal = getZodiacAnimalRecord(animalLabel);
  const mbti = getMbti(profile.mbti);
  const blood = getBloodType(profile.bloodType);

  const profileFields: ProfileField[] = [
    { label: '별자리', value: west?.label ?? null },
    { label: '열두 동물', value: animal?.label ?? null },
    { label: 'MBTI', value: mbti?.label ?? null },
    { label: '혈액형', value: blood ? `${blood.label}형` : null },
  ];

  const blocks: TraitBlock[] = [];

  if (west) {
    blocks.push({
      eyebrow: '별자리',
      title: west.label,
      meta: westMeta(west),
      keywords: unique(west.keywords ?? []).slice(0, 4),
      summary: west.summary,
      hints: hintRows(west),
    });
  }

  if (animal) {
    blocks.push({
      eyebrow: '열두 동물',
      title: animal.label,
      meta: animal.elementAffinity ? `${animal.elementAffinity} 기운과 가까운 해` : undefined,
      keywords: unique(animal.keywords ?? []).slice(0, 4),
      summary: animal.summary,
      hints: hintRows(animal),
    });
  }

  if (mbti) {
    blocks.push({
      eyebrow: 'MBTI',
      title: mbti.label,
      meta: mbtiMeta(mbti),
      keywords: unique([
        ...(mbti.keywords ?? []),
        ...(mbti.strengths ?? []),
        ...(mbti.watchouts ?? []),
      ]).slice(0, 6),
      summary: mbti.summary,
      hints: hintRows(mbti),
    });
  } else if (assessments.fourAxis) {
    blocks.push({
      eyebrow: 'MBTI',
      title: assessments.fourAxis.code,
      meta: '4축 테스트 참고 코드',
      keywords: [],
      summary:
        '4축 테스트에서 나온 참고용 성향 코드입니다. 프로필 MBTI와는 별개이며, 표준화 검사 결과가 아닙니다.',
      hints: [],
    });
  }

  if (blood) {
    blocks.push({
      eyebrow: '혈액형',
      title: `${blood.label}형`,
      meta: blood.dailyHints?.[0],
      keywords: unique(blood.keywords ?? []).slice(0, 4),
      summary: blood.summary,
      hints: hintRows(blood),
    });
  }

  return {
    today: buildTodaySeonghyang(profile, assessments, date),
    profile: profileFields,
    blocks,
    hasAny: blocks.length > 0,
  };
}
