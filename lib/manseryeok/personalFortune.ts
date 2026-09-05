/**
 * 지도 오늘의 운세 — 나 단인 일진·월주·세운 점수 + (시각 있을 때) 시주×오늘 일진.
 * 지인 궁합과 같은 오늘:이달:올해 만점 비중(46:23:12) · ORIGIN/SCALE · 등급 컷을 쓴다.
 */
import { computeFourPillars } from './compute';
import { getManseryeokPeriod } from './period';
import { getPillarAlignVerdict, type PillarAlignVerdict } from './pillarAlign';
import type { FourPillarsInput } from './types';

/**
 * 오늘 만점 46을 일간(32) · 일지(14)로 나눠 쓴다.
 *
 * 일간만 쓰면 십신이 10종·10일 주기라 출생시각 없는 사용자는 점수가 열흘마다
 * 똑같이 반복된다. 일지를 더하면 간지 한 바퀴(60일)를 따라간다.
 */
const TODAY_STEM_DELTA: Record<string, number> = {
  정재: 32,
  식신: 28,
  정인: 20,
  정관: 16,
  편재: 12,
  비견: 0,
  편인: -12,
  상관: -16,
  겁재: -20,
  편관: -32,
};

const TODAY_BRANCH_DELTA: Record<string, number> = {
  정재: 14,
  식신: 12,
  정인: 9,
  정관: 7,
  편재: 5,
  비견: 0,
  편인: -5,
  상관: -7,
  겁재: -9,
  편관: -14,
};

/** 지인 궁합 MONTH_SELF × (23/8) — 이달 만점 23 */
const MONTH_DELTA: Record<string, number> = {
  정재: 23,
  식신: 20,
  정인: 14,
  정관: 12,
  편재: 9,
  비견: 0,
  편인: -9,
  상관: -12,
  겁재: -14,
  편관: -23,
};

/** 지인 궁합 YEAR_SELF × (12/4) — 올해 만점 12 */
const YEAR_DELTA: Record<string, number> = {
  정재: 12,
  식신: 12,
  정인: 9,
  정관: 6,
  편재: 6,
  비견: 0,
  편인: -6,
  상관: -6,
  겁재: -9,
  편관: -12,
};

/** 지인 궁합과 동일 */
const SCORE_ORIGIN = 44;
const SCORE_SCALE_MAX = 94;

/**
 * 쌍인 보정 대신 고정 계수·진폭으로 등급 비율을 지인 궁합 표본에 맞춤.
 * 오늘:이달:올해 만점 비중(46:23:12)은 유지.
 *
 * 오늘 몫을 일간·일지로 쪼개면 두 값이 서로 상쇄돼 분포가 가운데로 몰린다.
 * 0.65 → 0.80은 쪼개기 전 등급 비율(주의 ~5% · 최고 ~12%)을 되돌리는 값이다.
 */
const RAW_AMPLITUDE = 0.8;
const SOLO_CORRECTION_FACTOR = 0.42;

/** 오늘 46 만점 대비 ~13% — 시주×일진 맞음/어긋남 (RAW_AMPLITUDE 적용 전) */
const HOUR_TODAY_ALIGN_DELTA: Record<PillarAlignVerdict, number> = {
  맞음: 6,
  흐름: 0,
  어긋남: -6,
};

export type PersonalFortuneScore = {
  score: number;
  todayScore: number;
  rawTotal: number;
  selfTodayTenGod: string;
  selfMonthTenGod: string;
  selfYearTenGod: string;
  todayBranchTenGod: string;
  hourAlignVerdict: PillarAlignVerdict | null;
  hourAlignDelta: number;
  /** 오늘(일간+일지) 몫 — 진폭 적용 전 원점수. 지도 「점수 근거」 한 줄용 */
  todayDelta: number;
  /** 이달 몫 (진폭 적용 전) */
  monthDelta: number;
  /** 올해 몫 (진폭 적용 전) */
  yearDelta: number;
};

export function computePersonalFortuneScore(
  input: FourPillarsInput,
  at = new Date(),
): PersonalFortuneScore | null {
  const day = getManseryeokPeriod(input, at, 'day');
  const month = getManseryeokPeriod(input, at, 'month');
  const year = getManseryeokPeriod(input, at, 'year');
  if (!day || !month || !year) return null;

  let hourAlignVerdict: PillarAlignVerdict | null = null;
  let hourAlignDelta = 0;
  if (input.birthTime?.trim()) {
    const natal = computeFourPillars(input);
    if (natal?.hour) {
      hourAlignVerdict = getPillarAlignVerdict(natal.hour, day.pillar);
      hourAlignDelta = HOUR_TODAY_ALIGN_DELTA[hourAlignVerdict];
    }
  }

  const todayDelta =
    (TODAY_STEM_DELTA[day.stemTenGod] ?? 0) + (TODAY_BRANCH_DELTA[day.branchTenGod] ?? 0);
  const monthDelta = MONTH_DELTA[month.stemTenGod] ?? 0;
  const yearDelta = YEAR_DELTA[year.stemTenGod] ?? 0;
  const rawTotal = Math.round(
    (todayDelta + monthDelta + yearDelta + hourAlignDelta) * RAW_AMPLITUDE,
  );

  const todayScore = Math.max(
    0,
    Math.min(100, Math.round(((SCORE_ORIGIN + rawTotal) / SCORE_SCALE_MAX) * 100)),
  );
  const bonus = Math.round((100 - todayScore) * SOLO_CORRECTION_FACTOR);
  const score = Math.max(0, Math.min(100, todayScore + bonus));

  return {
    score,
    todayScore,
    rawTotal,
    selfTodayTenGod: day.stemTenGod,
    selfMonthTenGod: month.stemTenGod,
    selfYearTenGod: year.stemTenGod,
    todayBranchTenGod: day.branchTenGod,
    hourAlignVerdict,
    hourAlignDelta,
    todayDelta,
    monthDelta,
    yearDelta,
  };
}
