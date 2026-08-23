import {
  calculateFourPillars,
  getBranchTenGod,
  getHeavenlyStemElement,
  getTenGod,
  type EarthlyBranch,
  type HeavenlyStem,
} from 'manseryeok';

import { DAY_BOUNDARY, UNKNOWN_TIME } from './policy';
import { parseHm, parseYmd } from './parse';
import { pillarFromParts } from './pillar';
import type { FourPillarsInput, ManseryeokPillar } from './types';

export type ManseryeokPeriodKind = 'day' | 'month' | 'year';

export type ManseryeokPeriod = {
  pillar: ManseryeokPillar;
  element: string;
  animal: string;
  stemTenGod: string;
  branchTenGod: string;
};

const BRANCH_ANIMAL: Record<string, string> = {
  자: '쥐',
  축: '소',
  인: '호랑이',
  묘: '토끼',
  진: '용',
  사: '뱀',
  오: '말',
  미: '양',
  신: '원숭이',
  유: '닭',
  술: '개',
  해: '돼지',
};

export function branchAnimal(branch: string): string {
  return BRANCH_ANIMAL[branch] ?? branch;
}

/**
 * 출생 일간을 기준으로 특정 시점의 일·월·세운을 계산한다.
 * 시간대별 카드는 정오로 고정해 일진·절입 기준만 사용한다.
 */
type PeriodClock = {
  natalDayStem: HeavenlyStem;
  current: ReturnType<typeof calculateFourPillars>;
};

const PERIOD_CLOCK_CACHE = new Map<string, PeriodClock>();
const PERIOD_CLOCK_CACHE_MAX = 64;

function dateStamp(at: Date): string {
  return `${at.getFullYear()}-${at.getMonth() + 1}-${at.getDate()}`;
}

function getPeriodClock(input: FourPillarsInput, at: Date): PeriodClock | null {
  const birth = parseYmd(input.birthDate);
  if (!birth) return null;
  const birthClock = parseHm(input.birthTime) ?? UNKNOWN_TIME;
  const key = `${input.birthDate}|${input.birthTime ?? ''}|${dateStamp(at)}`;
  const hit = PERIOD_CLOCK_CACHE.get(key);
  if (hit) return hit;

  try {
    const natal = calculateFourPillars({
      year: birth.year,
      month: birth.month,
      day: birth.day,
      hour: birthClock.hour,
      minute: birthClock.minute,
      dayBoundary: DAY_BOUNDARY,
    });
    const current = calculateFourPillars({
      year: at.getFullYear(),
      month: at.getMonth() + 1,
      day: at.getDate(),
      hour: UNKNOWN_TIME.hour,
      minute: UNKNOWN_TIME.minute,
      dayBoundary: DAY_BOUNDARY,
    });
    const packed: PeriodClock = {
      natalDayStem: natal.day.heavenlyStem as HeavenlyStem,
      current,
    };
    if (PERIOD_CLOCK_CACHE.size >= PERIOD_CLOCK_CACHE_MAX) {
      const oldest = PERIOD_CLOCK_CACHE.keys().next().value;
      if (oldest) PERIOD_CLOCK_CACHE.delete(oldest);
    }
    PERIOD_CLOCK_CACHE.set(key, packed);
    return packed;
  } catch {
    return null;
  }
}

export function getManseryeokPeriod(
  input: FourPillarsInput,
  at: Date,
  kind: ManseryeokPeriodKind,
): ManseryeokPeriod | null {
  const packed = getPeriodClock(input, at);
  if (!packed) return null;

  try {
    const raw = packed.current[kind];
    const stem = raw.heavenlyStem as HeavenlyStem;
    const branch = raw.earthlyBranch as EarthlyBranch;
    return {
      pillar: pillarFromParts(stem, branch, `${stem}${branch}`),
      element: getHeavenlyStemElement(stem),
      animal: branchAnimal(branch),
      stemTenGod: getTenGod(packed.natalDayStem, stem),
      branchTenGod: getBranchTenGod(packed.natalDayStem, branch),
    };
  } catch {
    return null;
  }
}
