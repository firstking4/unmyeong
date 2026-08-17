import { getTenGod, type HeavenlyStem } from 'manseryeok';

import { computeFourPillars } from './compute';
import { branchAnimal, getManseryeokPeriod } from './period';
import type {
  AnimalRelationKind,
  CompatibilityEngineResult,
  CompatibilityNatal,
  CompatibilityScorePart,
  ElementRelationKind,
  FourPillarsInput,
} from './types';

const ELEMENTS = ['목', '화', '토', '금', '수'] as const;

/** 일지 육합 */
const ANIMAL_HARMONY: Record<string, string> = {
  쥐: '소',
  소: '쥐',
  호랑이: '돼지',
  돼지: '호랑이',
  토끼: '개',
  개: '토끼',
  용: '닭',
  닭: '용',
  뱀: '원숭이',
  원숭이: '뱀',
  말: '양',
  양: '말',
};

/** 일지 육충 */
const ANIMAL_CLASH: Record<string, string> = {
  쥐: '말',
  말: '쥐',
  소: '양',
  양: '소',
  호랑이: '원숭이',
  원숭이: '호랑이',
  토끼: '닭',
  닭: '토끼',
  용: '개',
  개: '용',
  뱀: '돼지',
  돼지: '뱀',
};

const TEN_GOD_SCORE: Record<string, number> = {
  비견: 70,
  겁재: 52,
  식신: 80,
  상관: 58,
  편재: 74,
  정재: 82,
  편관: 54,
  정관: 76,
  편인: 68,
  정인: 78,
};

/** 합산용 — 일지 관계 +/− */
const ANIMAL_DELTA: Record<AnimalRelationKind, number> = {
  육합: 12,
  같음: 6,
  흐름: 0,
  육충: -12,
};

/** 합산용 — 오행 관계 +/− */
const ELEMENT_DELTA: Record<ElementRelationKind, number> = {
  생함: 10,
  생받음: 10,
  같음: 5,
  극함: -8,
  극받음: -10,
};

/** 합산용 — 상대 일간→내 일간 십신 +/− */
const RELATION_TEN_GOD_DELTA: Record<string, number> = {
  정재: 12,
  식신: 10,
  정인: 8,
  정관: 6,
  편재: 4,
  비견: 2,
  편인: -2,
  상관: -6,
  겁재: -8,
  편관: -10,
};

/** 합산용 — 오늘 일진 십신(지인) +/−. 관계 항목과 맞춤(±12). */
const TODAY_OTHER_TEN_GOD_DELTA: Record<string, number> = {
  정재: 12,
  식신: 10,
  정인: 8,
  정관: 6,
  편재: 4,
  비견: 0,
  편인: -4,
  상관: -6,
  겁재: -8,
  편관: -12,
};

/**
 * 합산용 — 오늘 일진 십신(나) +/−.
 * 공통 항목이라 목록 전체를 끌어내리지 않게 지인 대비 약 2/3.
 */
const TODAY_SELF_TEN_GOD_DELTA: Record<string, number> = {
  정재: 8,
  식신: 7,
  정인: 5,
  정관: 4,
  편재: 3,
  비견: 0,
  편인: -3,
  상관: -4,
  겁재: -5,
  편관: -8,
};

const SAME_TODAY_TEN_GOD_BONUS = 3;
/** 기본(시작) 점수 */
const SCORE_ORIGIN = 20;
/** 항목 +/− 만점(육합12+생함10+정재12+나8+지인12+같은십신3). 환산 분모 = 시작 + 이 값 */
const MAX_POSITIVE_SUM = 57;
const SCORE_SCALE_MAX = SCORE_ORIGIN + MAX_POSITIVE_SUM; // 77
const SCORE_FLOOR = 0;
const SCORE_CEILING = 100;

/** 기존 기본 궁합(가중) 이론 범위 → 보정 수치 35…65 → 계수 0.35…0.65 */
const BASE_RAW_MIN = 51;
const BASE_RAW_MAX = 84;
const BASE_MAP_MIN = 35;
const BASE_MAP_MAX = 65;

/**
 * 기본 궁합 → 보정 계수 (0.35…0.65).
 * (100 − 오늘점수) × 계수 를 오늘 점수에 더한다.
 */
export function baseCorrectionFactor(baseScore: number): number {
  const clamped = Math.max(BASE_RAW_MIN, Math.min(BASE_RAW_MAX, baseScore));
  const mapped =
    BASE_MAP_MIN +
    ((clamped - BASE_RAW_MIN) / (BASE_RAW_MAX - BASE_RAW_MIN)) * (BASE_MAP_MAX - BASE_MAP_MIN);
  return mapped / 100;
}

export function applyBaseCorrection(todayScore: number, baseScore: number): {
  factor: number;
  bonus: number;
  score: number;
} {
  const factor = baseCorrectionFactor(baseScore);
  const gap = SCORE_CEILING - todayScore;
  const bonus = Math.round(gap * factor);
  const score = Math.max(SCORE_FLOOR, Math.min(SCORE_CEILING, todayScore + bonus));
  return { factor, bonus, score };
}

function natalFromPillars(
  pillars: NonNullable<ReturnType<typeof computeFourPillars>>,
): CompatibilityNatal {
  return {
    dayKorean: pillars.day.korean,
    dayStem: pillars.day.stem,
    dayBranch: pillars.day.branch,
    dayMasterElement: pillars.dayMasterElement,
    animal: branchAnimal(pillars.day.branch),
  };
}

function animalRelation(self: string, other: string): {
  kind: AnimalRelationKind;
  label: string;
  score: number;
} {
  if (self === other) {
    return { kind: '같음', label: `같은 ${self} 기운`, score: 72 };
  }
  if (ANIMAL_HARMONY[self] === other) {
    return { kind: '육합', label: `${self}·${other} 육합`, score: 86 };
  }
  if (ANIMAL_CLASH[self] === other) {
    return { kind: '육충', label: `${self}·${other} 육충`, score: 48 };
  }
  return { kind: '흐름', label: `${self}·${other} 흐름`, score: 66 };
}

export function elementRelationKind(self: string, other: string): ElementRelationKind {
  if (self === other) return '같음';
  const a = ELEMENTS.indexOf(self as (typeof ELEMENTS)[number]);
  const b = ELEMENTS.indexOf(other as (typeof ELEMENTS)[number]);
  if (a < 0 || b < 0) return '같음';
  const diff = (b - a + 5) % 5;
  if (diff === 1) return '생함';
  if (diff === 4) return '생받음';
  if (diff === 2) return '극함';
  return '극받음';
}

function elementRelation(self: string, other: string): {
  kind: ElementRelationKind;
  label: string;
  score: number;
} {
  const kind = elementRelationKind(self, other);
  switch (kind) {
    case '같음':
      return { kind, label: '같은 기운', score: 74 };
    case '생함':
      return { kind, label: `${self}생${other}`, score: 82 };
    case '생받음':
      return { kind, label: `${other}생${self}`, score: 82 };
    case '극함':
      return { kind, label: `${self}극${other}`, score: 58 };
    case '극받음':
      return { kind, label: `${other}극${self}`, score: 54 };
  }
}

function tenGodScore(god: string): number {
  return TEN_GOD_SCORE[god] ?? 66;
}

function relationTenGodDelta(god: string): number {
  return RELATION_TEN_GOD_DELTA[god] ?? 0;
}

function todaySelfTenGodDelta(god: string): number {
  return TODAY_SELF_TEN_GOD_DELTA[god] ?? 0;
}

function todayOtherTenGodDelta(god: string): number {
  return TODAY_OTHER_TEN_GOD_DELTA[god] ?? 0;
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

/**
 * 오늘의 궁합 = (기본 20 + 항목합산) ÷ (20 + 항목만점) × 100.
 * 항목만점 = 전부 최고 플러스(현재 57). 그때 정확히 100.
 */
export function buildCompatibilityScoreParts(input: {
  animalKind: AnimalRelationKind;
  animalLabel: string;
  elementKind: ElementRelationKind;
  elementLabel: string;
  otherToSelfTenGod: string;
  selfTodayTenGod: string;
  otherTodayTenGod: string;
}): { parts: CompatibilityScorePart[]; rawTotal: number; score: number } {
  const parts: CompatibilityScorePart[] = [
    {
      key: 'animal',
      label: `일지 ${input.animalLabel}`,
      delta: ANIMAL_DELTA[input.animalKind],
    },
    {
      key: 'element',
      label: `오행 ${input.elementLabel}`,
      delta: ELEMENT_DELTA[input.elementKind],
    },
    {
      key: 'relation',
      label: `관계 ${input.otherToSelfTenGod}`,
      delta: relationTenGodDelta(input.otherToSelfTenGod),
    },
    {
      key: 'todaySelf',
      label: `오늘(나) ${input.selfTodayTenGod}`,
      delta: todaySelfTenGodDelta(input.selfTodayTenGod),
    },
    {
      key: 'todayOther',
      label: `오늘(지인) ${input.otherTodayTenGod}`,
      delta: todayOtherTenGodDelta(input.otherTodayTenGod),
    },
  ];

  if (input.selfTodayTenGod === input.otherTodayTenGod) {
    parts.push({
      key: 'todaySame',
      label: '오늘 같은 십신',
      delta: SAME_TODAY_TEN_GOD_BONUS,
    });
  }

  const rawTotal = parts.reduce((sum, part) => sum + part.delta, 0);
  const scaled = ((SCORE_ORIGIN + rawTotal) / SCORE_SCALE_MAX) * SCORE_CEILING;
  const score = Math.max(SCORE_FLOOR, Math.min(SCORE_CEILING, Math.round(scaled)));
  return { parts, rawTotal, score };
}

export function formatScorePartLine(part: CompatibilityScorePart): string {
  return `${part.label} ${formatDelta(part.delta)}`;
}

/** @deprecated 합산 모델에서는 쓰이지 않음. 호환용 0 반환 */
export function amplitudeUpForBase(baseScore: number): number {
  return Math.max(0, SCORE_CEILING - baseScore);
}

/** @deprecated */
export function amplitudeDownForBase(baseScore: number): number {
  return Math.max(0, baseScore - SCORE_FLOOR);
}

/** @deprecated */
export function amplitudeForBase(baseScore: number): number {
  return amplitudeUpForBase(baseScore);
}

/** @deprecated */
export function dailyDeltaFromTenGods(
  _selfGod: string,
  _otherGod: string,
  _baseScore = 65,
): number {
  return 0;
}

/**
 * 일간·일지 관계 항목 + 오늘 일진 십신 항목을 +/−로 합산.
 * 출생 시각이 없으면 정오로 계산하고 시주는 비교하지 않는다.
 */
export function computeCompatibility(
  self: FourPillarsInput,
  other: FourPillarsInput,
  at: Date = new Date(),
): CompatibilityEngineResult | null {
  const selfPillars = computeFourPillars(self);
  const otherPillars = computeFourPillars(other);
  if (!selfPillars || !otherPillars) return null;

  const selfToday = getManseryeokPeriod(self, at, 'day');
  const otherToday = getManseryeokPeriod(other, at, 'day');
  if (!selfToday || !otherToday) return null;

  const selfNatal = natalFromPillars(selfPillars);
  const otherNatal = natalFromPillars(otherPillars);
  const animal = animalRelation(selfNatal.animal, otherNatal.animal);
  const element = elementRelation(selfNatal.dayMasterElement, otherNatal.dayMasterElement);

  const otherToSelfTenGod = getTenGod(
    selfNatal.dayStem as HeavenlyStem,
    otherNatal.dayStem as HeavenlyStem,
  );
  const selfToOtherTenGod = getTenGod(
    otherNatal.dayStem as HeavenlyStem,
    selfNatal.dayStem as HeavenlyStem,
  );
  const godScore = Math.round(
    (tenGodScore(otherToSelfTenGod) + tenGodScore(selfToOtherTenGod)) / 2,
  );
  /** 참고용 관계 점수(목록·카피). 오늘 합산 점수와는 별개 */
  const baseScore = Math.round(animal.score * 0.4 + element.score * 0.35 + godScore * 0.25);

  const { parts, rawTotal, score: todayRawScore } = buildCompatibilityScoreParts({
    animalKind: animal.kind,
    animalLabel: animal.label,
    elementKind: element.kind,
    elementLabel: element.label,
    otherToSelfTenGod,
    selfTodayTenGod: selfToday.stemTenGod,
    otherTodayTenGod: otherToday.stemTenGod,
  });
  const { factor, bonus, score } = applyBaseCorrection(todayRawScore, baseScore);

  return {
    self: selfNatal,
    other: otherNatal,
    animalKind: animal.kind,
    animalLabel: animal.label,
    animalScore: animal.score,
    elementKind: element.kind,
    elementLabel: element.label,
    elementScore: element.score,
    otherToSelfTenGod,
    selfToOtherTenGod,
    tenGodScore: godScore,
    baseScore,
    baseCorrectionFactor: factor,
    baseCorrectionBonus: bonus,
    todayPillarKorean: selfToday.pillar.korean,
    selfTodayTenGod: selfToday.stemTenGod,
    otherTodayTenGod: otherToday.stemTenGod,
    scoreParts: parts,
    scoreOrigin: SCORE_ORIGIN,
    scoreScaleMax: SCORE_SCALE_MAX,
    maxPositiveSum: MAX_POSITIVE_SUM,
    rawTotal,
    todayScore: todayRawScore,
    dailyAmplitudeUp: amplitudeUpForBase(baseScore),
    dailyAmplitudeDown: amplitudeDownForBase(baseScore),
    dailyDelta: rawTotal,
    score,
  };
}
