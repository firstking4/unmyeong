import {
  getBloodType,
  getMbti,
  getWesternZodiac,
  getZodiacAnimalRecord,
  mbtiAxisHint,
} from '@/lib/data/catalog';
import type { SeedRecord } from '@/lib/data/types';
import { pickDaily } from '@/lib/daily/pick';
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

export type TodaySeonghyang = {
  dateLabel: string;
  headline: string;
  meta: string;
  keywords: string[];
  summary: string;
  hints: { label: string; text: string }[];
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

function pickOne<T>(items: T[], seed: string): T | null {
  if (items.length === 0) return null;
  return items[hashSeed(seed) % items.length] ?? null;
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

function buildTodaySeonghyang(profile: Profile, date: Date): TodaySeonghyang | null {
  const west = getWesternZodiac(profile.birthDate);
  if (!west) return null;

  const theme = pickDaily('seonghyang', west.id, date);
  const keywords = unique([
    theme.keyword,
    ...(west.keywords ?? []),
    west.element,
  ]).slice(0, 4);

  return {
    dateLabel: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
    headline: `${west.label}, ${theme.headline}`,
    meta: `별자리 · ${west.label}${west.element ? ` · ${west.element}` : ''}`,
    keywords,
    summary: `${west.summary} ${theme.focus}`,
    hints: [
      { label: '관계', text: theme.relationship },
      { label: '오늘의 한 가지', text: theme.action },
      { label: '주의', text: theme.caution },
    ],
  };
}

export type PersonalityAssessmentResults = {
  fourAxis?: FourAxisResult;
  bigFive?: BigFiveResult;
};

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
      keywords: unique([...(mbti.keywords ?? []), ...(mbti.strengths ?? [])]).slice(0, 5),
      summary: mbti.summary,
      hints: hintRows(mbti),
      watchouts: mbti.watchouts?.slice(0, 2),
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
    today: buildTodaySeonghyang(profile, date),
    profile: profileFields,
    blocks,
    hasAny: blocks.length > 0,
  };
}
