import { calculateFourPillars } from 'manseryeok';

import { DAY_BOUNDARY, UNKNOWN_TIME } from './policy';
import { parseHm, parseYmd } from './parse';
import { pillarFromParts } from './pillar';
import type { FourPillarsInput, LuckPillarItem, LuckPillarsResult } from './types';

export type LuckPillarsInput = FourPillarsInput & {
  gender: 'male' | 'female';
};

/**
 * 성별이 있을 때만 대운. 시각 없으면 정오로 년·월·일주 기준만 씀.
 */
export function computeLuckPillars(input: LuckPillarsInput): LuckPillarsResult | null {
  const ymd = parseYmd(input.birthDate);
  if (!ymd) return null;
  const clock = parseHm(input.birthTime) ?? UNKNOWN_TIME;

  try {
    const raw = calculateFourPillars({
      year: ymd.year,
      month: ymd.month,
      day: ymd.day,
      hour: clock.hour,
      minute: clock.minute,
      dayBoundary: DAY_BOUNDARY,
      gender: input.gender,
    });
    if (!raw.luckPillars) return null;
    const pillars: LuckPillarItem[] = raw.luckPillars.pillars.map((item) => ({
      age: item.age,
      ...pillarFromParts(item.pillar.heavenlyStem, item.pillar.earthlyBranch, item.korean),
    }));
    return {
      forward: raw.luckPillars.forward,
      startAge: raw.luckPillars.startAge,
      pillars,
    };
  } catch {
    return null;
  }
}
