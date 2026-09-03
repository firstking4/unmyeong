/**
 * 양력 ↔ 음력 변환. `kor-lunar`(KASI)를 감싼다.
 *
 * 사주·운세 계산은 양력(`birthDate`)만 쓰고, 음력은 표시·입력용이다.
 * 지원 범위는 라이브러리와 같다(대략 1890–2050). UI 연도는 그보다 좁게 잡는다.
 */
import { LunarCalendar, LunarTable, toLunar, toSolar } from 'kor-lunar';

import type { BirthCalendar, Profile } from './types';

export type Ymd = { year: number; month: number; day: number };

export type LunarYmd = Ymd & { leap: boolean };

/** UI에서 고를 수 있는 출생 연도 (라이브러리 범위 안). */
export const BIRTH_YEAR_MIN = 1926;
export const BIRTH_YEAR_MAX = new Date().getFullYear();

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseYmd(iso?: string | null): Ymd | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function solarToLunar(year: number, month: number, day: number): LunarYmd | null {
  try {
    const r = toLunar(year, month, day);
    return { year: r.year, month: r.month, day: r.day, leap: !!r.isLeapMonth };
  } catch {
    return null;
  }
}

export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  leap = false,
): Ymd | null {
  try {
    if (!LunarCalendar.isValid(year, month, day, leap)) return null;
    const r = toSolar(year, month, day, leap);
    return { year: r.year, month: r.month, day: r.day };
  } catch {
    return null;
  }
}

/** 해당 음력 연도에 윤달이 있으면 그 월(1–12), 없으면 0. */
export function leapMonthOf(year: number): number {
  try {
    return LunarTable.getLeapMonth(year) || 0;
  } catch {
    return 0;
  }
}

export function hasLeapMonth(year: number, month: number): boolean {
  return leapMonthOf(year) === month;
}

export function daysInSolarMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function daysInLunarMonth(year: number, month: number, leap: boolean): number {
  try {
    return LunarCalendar.of(year, month, 1, leap).daysInMonth;
  } catch {
    return leap ? 0 : 30;
  }
}

export function clampDay(year: number, month: number, day: number, leap: boolean, calendar: BirthCalendar): number {
  const max =
    calendar === 'lunar' ? daysInLunarMonth(year, month, leap) : daysInSolarMonth(year, month);
  return Math.max(1, Math.min(day, max || 1));
}

/** 신분증·에디터에 보여줄 생년월일 문자열 (설정 달력 기준). */
export function formatBirthDateDisplay(profile: Pick<Profile, 'birthCalendar' | 'birthDate' | 'birthLunarDate' | 'birthLeapMonth'>): string | null {
  const calendar = profile.birthCalendar ?? 'solar';
  if (calendar === 'lunar') {
    const lunar = parseYmd(profile.birthLunarDate);
    if (!lunar) return null;
    const leapMark = profile.birthLeapMonth ? '윤' : '';
    return `${lunar.year}. ${leapMark}${pad2(lunar.month)}. ${pad2(lunar.day)}`;
  }
  const solar = parseYmd(profile.birthDate);
  if (!solar) return null;
  return `${solar.year}. ${pad2(solar.month)}. ${pad2(solar.day)}`;
}

/** 메인 신분증 — 월/일만 `12/01` 형식으로 표시. */
export function formatBirthDateMainDisplay(
  profile: Pick<Profile, 'birthCalendar' | 'birthDate' | 'birthLunarDate' | 'birthLeapMonth'>,
): string | null {
  const calendar = profile.birthCalendar ?? 'solar';
  if (calendar === 'lunar') {
    const lunar = parseYmd(profile.birthLunarDate);
    if (!lunar) return null;
    const leapMark = profile.birthLeapMonth ? '윤' : '';
    return `${leapMark}${pad2(lunar.month)}/${pad2(lunar.day)}`;
  }
  const solar = parseYmd(profile.birthDate);
  if (!solar) return null;
  return `${pad2(solar.month)}/${pad2(solar.day)}`;
}

/**
 * 지인 상세용 — 양력·음력 병기.
 * 예: `양력 1982. 12. 11. · 음력 1982. 11. 07.` / 윤달 `음력 1982. 윤11. 07.`
 * `birthLunarDate`가 없으면 양력 정본에서 표시 시점에 변환한다.
 */
export function formatDualBirthDateLabel(
  profile: Pick<Profile, 'birthDate' | 'birthLunarDate' | 'birthLeapMonth'>,
): string | null {
  const solar = parseYmd(profile.birthDate);
  if (!solar) return null;

  let lunarYear: number | null = null;
  let lunarMonth: number | null = null;
  let lunarDay: number | null = null;
  let leap = false;

  const stored = parseYmd(profile.birthLunarDate);
  if (stored) {
    lunarYear = stored.year;
    lunarMonth = stored.month;
    lunarDay = stored.day;
    leap = !!profile.birthLeapMonth;
  } else {
    const converted = solarToLunar(solar.year, solar.month, solar.day);
    if (converted) {
      lunarYear = converted.year;
      lunarMonth = converted.month;
      lunarDay = converted.day;
      leap = converted.leap;
    }
  }

  const solarPart = `양력 ${solar.year}. ${pad2(solar.month)}. ${pad2(solar.day)}.`;
  if (lunarYear == null || lunarMonth == null || lunarDay == null) return solarPart;
  const leapMark = leap ? '윤' : '';
  const lunarPart = `음력 ${lunarYear}. ${leapMark}${pad2(lunarMonth)}. ${pad2(lunarDay)}.`;
  return `${solarPart} · ${lunarPart}`;
}

export function birthCalendarLabel(calendar?: BirthCalendar | null): string | null {
  if (calendar === 'lunar') return '음력';
  if (calendar === 'solar') return '양력';
  return null;
}

/**
 * 저장용 패치. 입력 달력 기준으로 반대쪽을 채워 양력·음력을 둘 다 남긴다.
 * 양력 `birthDate`가 사주 계산의 정본이다.
 */
export function buildBirthDatePatch(input: {
  calendar: BirthCalendar;
  year: number;
  month: number;
  day: number;
  leap: boolean;
  time?: string | null;
}): Partial<Profile> | null {
  const { calendar, year, month, day, leap, time } = input;
  if (calendar === 'solar') {
    const lunar = solarToLunar(year, month, day);
    if (!lunar) return null;
    return {
      birthCalendar: 'solar',
      birthDate: formatYmd(year, month, day),
      birthLunarDate: formatYmd(lunar.year, lunar.month, lunar.day),
      birthLeapMonth: lunar.leap,
      birthTime: time?.trim() || undefined,
    };
  }
  const solar = lunarToSolar(year, month, day, leap);
  if (!solar) return null;
  return {
    birthCalendar: 'lunar',
    birthDate: formatYmd(solar.year, solar.month, solar.day),
    birthLunarDate: formatYmd(year, month, day),
    birthLeapMonth: leap,
    birthTime: time?.trim() || undefined,
  };
}

/** 프로필에 양력만 있을 때 음력 필드를 보강한 뷰 모델. */
export function resolveBirthParts(profile: Profile): {
  calendar: BirthCalendar;
  year: number;
  month: number;
  day: number;
  leap: boolean;
  hour: number | null;
  minute: number | null;
} {
  const calendar: BirthCalendar = profile.birthCalendar ?? 'solar';
  let year = 1990;
  let month = 1;
  let day = 1;
  let leap = false;

  if (calendar === 'lunar' && profile.birthLunarDate) {
    const lunar = parseYmd(profile.birthLunarDate);
    if (lunar) {
      year = lunar.year;
      month = lunar.month;
      day = lunar.day;
      leap = !!profile.birthLeapMonth;
    }
  } else if (profile.birthDate) {
    const solar = parseYmd(profile.birthDate);
    if (solar) {
      if (calendar === 'lunar') {
        const lunar = solarToLunar(solar.year, solar.month, solar.day);
        if (lunar) {
          year = lunar.year;
          month = lunar.month;
          day = lunar.day;
          leap = lunar.leap;
        } else {
          year = solar.year;
          month = solar.month;
          day = solar.day;
        }
      } else {
        year = solar.year;
        month = solar.month;
        day = solar.day;
      }
    }
  } else if (profile.birthLunarDate) {
    const lunar = parseYmd(profile.birthLunarDate);
    if (lunar) {
      year = lunar.year;
      month = lunar.month;
      day = lunar.day;
      leap = !!profile.birthLeapMonth;
    }
  }

  year = Math.max(BIRTH_YEAR_MIN, Math.min(BIRTH_YEAR_MAX, year));

  let hour: number | null = null;
  let minute: number | null = null;
  if (profile.birthTime) {
    const tm = profile.birthTime.match(/^(\d{1,2}):(\d{2})$/);
    if (tm) {
      hour = Math.max(0, Math.min(23, Number(tm[1])));
      minute = Math.max(0, Math.min(59, Number(tm[2])));
    }
  }

  return { calendar, year, month, day, leap, hour, minute };
}
