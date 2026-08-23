import { calculateFourPillars } from 'manseryeok';

import { DAY_BOUNDARY, UNKNOWN_TIME } from './policy';
import { parseHm, parseYmd } from './parse';
import { toPillar } from './pillar';
import type { FourPillarsInput, FourPillarsResult, FourPillarsTenGods } from './types';

export function formatFourPillarsHeadline(result: FourPillarsResult): string {
  const hour = result.hour?.korean ?? '—';
  return `${result.year.korean} · ${result.month.korean} · ${result.day.korean} · ${hour}`;
}

/**
 * 양력 생년월일(+선택 시각) → 네 기둥.
 * 시각이 없으면 시주는 null. 진태양시는 적용하지 않는다.
 */
const PILLAR_CACHE = new Map<string, FourPillarsResult | null>();
const PILLAR_CACHE_MAX = 64;

export function computeFourPillars(input: FourPillarsInput): FourPillarsResult | null {
  const ymd = parseYmd(input.birthDate);
  if (!ymd) return null;

  const clock = parseHm(input.birthTime);
  const hasHour = clock !== null;
  const cacheKey = `${input.birthDate}|${input.birthTime ?? ''}`;
  if (PILLAR_CACHE.has(cacheKey)) return PILLAR_CACHE.get(cacheKey) ?? null;

  try {
    const raw = calculateFourPillars({
      year: ymd.year,
      month: ymd.month,
      day: ymd.day,
      hour: hasHour ? clock.hour : UNKNOWN_TIME.hour,
      minute: hasHour ? clock.minute : UNKNOWN_TIME.minute,
      dayBoundary: DAY_BOUNDARY,
    });
    const tenGods: FourPillarsTenGods = {
      year: { stem: raw.tenGods.year.stem, branch: raw.tenGods.year.branch },
      month: { stem: raw.tenGods.month.stem, branch: raw.tenGods.month.branch },
      day: { stem: raw.tenGods.day.stem, branch: raw.tenGods.day.branch },
      hour: { stem: raw.tenGods.hour.stem, branch: raw.tenGods.hour.branch },
    };
    const result: FourPillarsResult = {
      year: toPillar(raw.year, raw.yearString, raw.yearHanja),
      month: toPillar(raw.month, raw.monthString, raw.monthHanja),
      day: toPillar(raw.day, raw.dayString, raw.dayHanja),
      hour: hasHour ? toPillar(raw.hour, raw.hourString, raw.hourHanja) : null,
      dayMasterElement: raw.dayElement.stem,
      tenGods: hasHour ? tenGods : { ...tenGods, hour: { stem: '—', branch: '—' } },
    };
    if (PILLAR_CACHE.size >= PILLAR_CACHE_MAX) {
      const oldest = PILLAR_CACHE.keys().next().value;
      if (oldest) PILLAR_CACHE.delete(oldest);
    }
    PILLAR_CACHE.set(cacheKey, result);
    return result;
  } catch {
    PILLAR_CACHE.set(cacheKey, null);
    return null;
  }
}
