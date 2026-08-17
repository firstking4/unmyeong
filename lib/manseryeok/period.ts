import {
  calculateFourPillars,
  getBranchTenGod,
  getEarthlyBranchElement,
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
export function getManseryeokPeriod(
  input: FourPillarsInput,
  at: Date,
  kind: ManseryeokPeriodKind,
): ManseryeokPeriod | null {
  const birth = parseYmd(input.birthDate);
  if (!birth) return null;
  const birthClock = parseHm(input.birthTime) ?? UNKNOWN_TIME;

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
    const raw = current[kind];
    const stem = raw.heavenlyStem as HeavenlyStem;
    const branch = raw.earthlyBranch as EarthlyBranch;
    return {
      pillar: pillarFromParts(stem, branch, `${stem}${branch}`),
      element: getHeavenlyStemElement(stem),
      animal: branchAnimal(branch),
      stemTenGod: getTenGod(natal.day.heavenlyStem, stem),
      branchTenGod: getBranchTenGod(natal.day.heavenlyStem, branch),
    };
  } catch {
    return null;
  }
}
