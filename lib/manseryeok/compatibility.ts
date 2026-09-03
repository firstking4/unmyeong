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

/** 일지 삼합 (같은 조 두 글자면 성립) */
const ANIMAL_TRINE_GROUPS: readonly (readonly string[])[] = [
  ['돼지', '토끼', '양'], // 해묘미 · 목
  ['호랑이', '말', '개'], // 인오술 · 화
  ['뱀', '닭', '소'], // 사유축 · 금
  ['원숭이', '쥐', '용'], // 신자진 · 수
];

/** 일지 방합 (같은 방위 두 글자면 성립) */
const ANIMAL_DIRECTION_GROUPS: readonly (readonly string[])[] = [
  ['호랑이', '토끼', '용'], // 인묘진 · 동
  ['뱀', '말', '양'], // 사오미 · 남
  ['원숭이', '닭', '개'], // 신유술 · 서
  ['돼지', '쥐', '소'], // 해자축 · 북
];

function sameGroup(groups: readonly (readonly string[])[], self: string, other: string): boolean {
  return groups.some((group) => group.includes(self) && group.includes(other));
}

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

/**
 * 원점수 = 오늘 일진 십신(×2) + 이달 월주(약 1/2) + 올해 세운(약 1/4).
 * 일지·오행·관계 고정은 기본 궁합 보정에만 쓴다.
 */
const TODAY_OTHER_TEN_GOD_DELTA: Record<string, number> = {
  정재: 24,
  식신: 20,
  정인: 16,
  정관: 12,
  편재: 8,
  비견: 0,
  편인: -8,
  상관: -12,
  겁재: -16,
  편관: -24,
};

/** 오늘(나) — 지인 대비 약 2/3, ×2 */
const TODAY_SELF_TEN_GOD_DELTA: Record<string, number> = {
  정재: 16,
  식신: 14,
  정인: 10,
  정관: 8,
  편재: 6,
  비견: 0,
  편인: -6,
  상관: -8,
  겁재: -10,
  편관: -16,
};

const SAME_TODAY_TEN_GOD_BONUS = 6;

/**
 * 이달 월주 십신 — 오늘(×2)의 약 1/2.
 * 절기 월주가 해·달마다 바뀌어 연간 톤을 조금 흔든다.
 */
const MONTH_OTHER_TEN_GOD_DELTA: Record<string, number> = {
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

const MONTH_SELF_TEN_GOD_DELTA: Record<string, number> = {
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

const SAME_MONTH_TEN_GOD_BONUS = 3;

/** 올해 세운(년주) 십신 — 월주의 약 1/2. 해 전체 톤을 흔들되 평균을 과도하게 누르지 않음. */
const YEAR_OTHER_TEN_GOD_DELTA: Record<string, number> = {
  정재: 6,
  식신: 5,
  정인: 4,
  정관: 3,
  편재: 2,
  비견: 0,
  편인: -2,
  상관: -3,
  겁재: -4,
  편관: -6,
};

const YEAR_SELF_TEN_GOD_DELTA: Record<string, number> = {
  정재: 4,
  식신: 4,
  정인: 3,
  정관: 2,
  편재: 2,
  비견: 0,
  편인: -2,
  상관: -2,
  겁재: -3,
  편관: -4,
};

const SAME_YEAR_TEN_GOD_BONUS = 2;

/**
 * 기본(시작) 점수·환산 분모.
 *
 * 등급 컷은 `gradeFromScore`(lib/gunghap.ts) 기준 5단계다.
 * 주의 <50 · 조심 50~59 · 무난 60~74 · 좋음 75~89 · 최고 ≥90.
 * 이 값에서 나오는 실측 비율은 대략 7 / 15 / 35 / 31 / 13 (%).
 * 확인: `npm run check:gunghap-distribution`
 */
const SCORE_ORIGIN = 44;
/** 항목만점: 오늘(46) + 이달(23) + 올해(4+6+2=12) */
const MAX_POSITIVE_SUM = 46 + 23 + 12; // 81
/** 환산 분모 — 만점 비율보다 타이트하게 잡아 상단(80·90대)을 연다 */
const SCORE_SCALE_MAX = 94;
const SCORE_FLOOR = 0;
const SCORE_CEILING = 100;

/** 기본 궁합 → 보정 수치 26…46 → 계수 0.26…0.46 */
const BASE_RAW_MIN = 45;
const BASE_RAW_MAX = 84;
const BASE_MAP_MIN = 26;
const BASE_MAP_MAX = 46;

/** 양쪽 출생 시각이 있을 때만 시지(10%)를 넣고 일지·오행 비중을 조정한다 */
const BASE_WEIGHT_DAY = 0.35;
const BASE_WEIGHT_HOUR = 0.1;
const BASE_WEIGHT_ELEMENT_WITH_HOUR = 0.3;
const BASE_WEIGHT_TEN_GOD = 0.25;
const BASE_WEIGHT_DAY_NO_HOUR = 0.4;
const BASE_WEIGHT_ELEMENT_NO_HOUR = 0.35;

/**
 * 기본 궁합 → 보정 계수 (0.26…0.46).
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

export function branchAnimalRelation(self: string, other: string): {
  kind: AnimalRelationKind;
  label: string;
} {
  if (self === other) {
    return { kind: '같음', label: `같은 ${self} 기운` };
  }
  if (ANIMAL_HARMONY[self] === other) {
    return { kind: '육합', label: `${self}·${other} 육합` };
  }
  if (ANIMAL_CLASH[self] === other) {
    return { kind: '육충', label: `${self}·${other} 육충` };
  }
  if (sameGroup(ANIMAL_TRINE_GROUPS, self, other)) {
    return { kind: '삼합', label: `${self}·${other} 삼합` };
  }
  if (sameGroup(ANIMAL_DIRECTION_GROUPS, self, other)) {
    return { kind: '방합', label: `${self}·${other} 방합` };
  }
  return { kind: '흐름', label: `${self}·${other} 흐름` };
}

function animalRelation(self: string, other: string): {
  kind: AnimalRelationKind;
  label: string;
  score: number;
} {
  const relation = branchAnimalRelation(self, other);
  const scoreByKind: Record<AnimalRelationKind, number> = {
    같음: 72,
    육합: 86,
    육충: 48,
    삼합: 78,
    방합: 70,
    흐름: 66,
  };
  return { ...relation, score: scoreByKind[relation.kind] };
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

/**
 * 기본 궁합(일지·시지·오행·십신). 양쪽 시주가 있을 때만 시지 10%를 반영한다.
 */
export function computeBaseCompatibilityScore(input: {
  dayAnimalScore: number;
  hourAnimalScore: number | null;
  elementScore: number;
  tenGodScore: number;
}): number {
  if (input.hourAnimalScore !== null) {
    return Math.round(
      input.dayAnimalScore * BASE_WEIGHT_DAY +
        input.hourAnimalScore * BASE_WEIGHT_HOUR +
        input.elementScore * BASE_WEIGHT_ELEMENT_WITH_HOUR +
        input.tenGodScore * BASE_WEIGHT_TEN_GOD,
    );
  }
  return Math.round(
    input.dayAnimalScore * BASE_WEIGHT_DAY_NO_HOUR +
      input.elementScore * BASE_WEIGHT_ELEMENT_NO_HOUR +
      input.tenGodScore * BASE_WEIGHT_TEN_GOD,
  );
}

function todaySelfTenGodDelta(god: string): number {
  return TODAY_SELF_TEN_GOD_DELTA[god] ?? 0;
}

function todayOtherTenGodDelta(god: string): number {
  return TODAY_OTHER_TEN_GOD_DELTA[god] ?? 0;
}

function monthSelfTenGodDelta(god: string): number {
  return MONTH_SELF_TEN_GOD_DELTA[god] ?? 0;
}

function monthOtherTenGodDelta(god: string): number {
  return MONTH_OTHER_TEN_GOD_DELTA[god] ?? 0;
}

function yearSelfTenGodDelta(god: string): number {
  return YEAR_SELF_TEN_GOD_DELTA[god] ?? 0;
}

function yearOtherTenGodDelta(god: string): number {
  return YEAR_OTHER_TEN_GOD_DELTA[god] ?? 0;
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

/**
 * 원점수 = (시작점 + 오늘·이달·올해 십신 합산) ÷ 분모 × 100.
 * 고정 궁합(일지·오행·관계)은 넣지 않는다.
 */
export function buildCompatibilityScoreParts(input: {
  selfTodayTenGod: string;
  otherTodayTenGod: string;
  selfMonthTenGod: string;
  otherMonthTenGod: string;
  selfYearTenGod: string;
  otherYearTenGod: string;
}): { parts: CompatibilityScorePart[]; rawTotal: number; score: number } {
  const parts: CompatibilityScorePart[] = [
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

  parts.push(
    {
      key: 'monthSelf',
      label: `이달(나) ${input.selfMonthTenGod}`,
      delta: monthSelfTenGodDelta(input.selfMonthTenGod),
    },
    {
      key: 'monthOther',
      label: `이달(지인) ${input.otherMonthTenGod}`,
      delta: monthOtherTenGodDelta(input.otherMonthTenGod),
    },
  );

  if (input.selfMonthTenGod === input.otherMonthTenGod) {
    parts.push({
      key: 'monthSame',
      label: '이달 같은 십신',
      delta: SAME_MONTH_TEN_GOD_BONUS,
    });
  }

  parts.push(
    {
      key: 'yearSelf',
      label: `올해(나) ${input.selfYearTenGod}`,
      delta: yearSelfTenGodDelta(input.selfYearTenGod),
    },
    {
      key: 'yearOther',
      label: `올해(지인) ${input.otherYearTenGod}`,
      delta: yearOtherTenGodDelta(input.otherYearTenGod),
    },
  );

  if (input.selfYearTenGod === input.otherYearTenGod) {
    parts.push({
      key: 'yearSame',
      label: '올해 같은 십신',
      delta: SAME_YEAR_TEN_GOD_BONUS,
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
 * 기본 궁합(일지·시지·오행·십신)으로 보정하고, 원점수는 일진·월주·세운 십신을 합산.
 * 출생 시각이 없으면 정오로 계산하고 시주는 비교하지 않는다.
 * 양쪽 모두 시각이 있을 때만 시지(10%)를 기본 궁합에 넣는다.
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
  const selfMonth = getManseryeokPeriod(self, at, 'month');
  const otherMonth = getManseryeokPeriod(other, at, 'month');
  const selfYear = getManseryeokPeriod(self, at, 'year');
  const otherYear = getManseryeokPeriod(other, at, 'year');
  if (!selfToday || !otherToday || !selfMonth || !otherMonth || !selfYear || !otherYear) {
    return null;
  }

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
  const hourAnimal =
    selfPillars.hour && otherPillars.hour
      ? animalRelation(
          branchAnimal(selfPillars.hour.branch),
          branchAnimal(otherPillars.hour.branch),
        )
      : null;
  /** 참고용 관계 점수 + 보정 계수 입력. 원점수와는 별개 */
  const baseScore = computeBaseCompatibilityScore({
    dayAnimalScore: animal.score,
    hourAnimalScore: hourAnimal?.score ?? null,
    elementScore: element.score,
    tenGodScore: godScore,
  });

  const { parts, rawTotal, score: todayRawScore } = buildCompatibilityScoreParts({
    selfTodayTenGod: selfToday.stemTenGod,
    otherTodayTenGod: otherToday.stemTenGod,
    selfMonthTenGod: selfMonth.stemTenGod,
    otherMonthTenGod: otherMonth.stemTenGod,
    selfYearTenGod: selfYear.stemTenGod,
    otherYearTenGod: otherYear.stemTenGod,
  });
  const { factor, bonus, score } = applyBaseCorrection(todayRawScore, baseScore);

  return {
    self: selfNatal,
    other: otherNatal,
    animalKind: animal.kind,
    animalLabel: animal.label,
    animalScore: animal.score,
    hourAnimalKind: hourAnimal?.kind ?? null,
    hourAnimalLabel: hourAnimal?.label ?? null,
    hourAnimalScore: hourAnimal?.score ?? null,
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
    monthPillarKorean: selfMonth.pillar.korean,
    selfMonthTenGod: selfMonth.stemTenGod,
    otherMonthTenGod: otherMonth.stemTenGod,
    yearPillarKorean: selfYear.pillar.korean,
    selfYearTenGod: selfYear.stemTenGod,
    otherYearTenGod: otherYear.stemTenGod,
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
