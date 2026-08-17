import type { DayBoundary } from 'manseryeok';

/** 23:00부터 다음날 일주·시주. */
export const DAY_BOUNDARY: DayBoundary = 'jasi';

/** 1차: 시계 시각 그대로. 출생지·진태양시는 넣지 않는다. */
export const USE_TRUE_SOLAR_TIME = false;

/**
 * 출생 시각이 없을 때 년·월·일주만 구하기 위한 대입 시각.
 * 자시 경계에서 멀어 일주가 양력 날짜에 고정된다. 시주는 쓰지 않는다.
 */
export const UNKNOWN_TIME = { hour: 12, minute: 0 } as const;
