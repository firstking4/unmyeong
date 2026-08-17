import { getSolarTermsOfYear, type SolarTerm } from 'manseryeok';

import { UNKNOWN_TIME } from './policy';
import { formatKstLabel, kstInstant, parseHm, parseYmd } from './parse';
import type { SolarTermInfo, SolarTermWindow } from './types';

function toInfo(term: SolarTerm): SolarTermInfo {
  return {
    name: term.name,
    hanja: term.hanja,
    labelKst: formatKstLabel(term.date),
  };
}

function termsForYears(centerYear: number): SolarTerm[] {
  return [
    ...getSolarTermsOfYear(centerYear - 1),
    ...getSolarTermsOfYear(centerYear),
    ...getSolarTermsOfYear(centerYear + 1),
  ];
}

/** 주어진 순간 기준 이번 절기 · 다음 절입 (24절기 전부). */
export function getSolarTermWindow(at: Date = new Date()): SolarTermWindow | null {
  const year = Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(at),
  );
  if (!Number.isFinite(year)) return null;
  const terms = termsForYears(year);
  let current: SolarTerm | null = null;
  let next: SolarTerm | null = null;
  const ms = at.getTime();
  for (const term of terms) {
    if (term.date.getTime() <= ms) current = term;
    else {
      next = term;
      break;
    }
  }
  if (!current || !next) return null;
  return { current: toInfo(current), next: toInfo(next) };
}

/**
 * 출생 시각의 월주를 연 절(節, 짝수 인덱스) 이름.
 * 시각 없으면 정오 대입 (시주와 동일 정책).
 */
export function getMonthBoundaryTerm(
  birthDate: string,
  birthTime?: string | null,
): SolarTermInfo | null {
  const ymd = parseYmd(birthDate);
  if (!ymd) return null;
  const clock = parseHm(birthTime) ?? UNKNOWN_TIME;
  const at = kstInstant(ymd.year, ymd.month, ymd.day, clock.hour, clock.minute);
  const jie = termsForYears(ymd.year).filter((term) => term.index % 2 === 0);
  let boundary: SolarTerm | null = null;
  const ms = at.getTime();
  for (const term of jie) {
    if (term.date.getTime() <= ms) boundary = term;
    else break;
  }
  return boundary ? toInfo(boundary) : null;
}
