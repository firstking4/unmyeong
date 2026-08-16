/**
 * @deprecated Prefer `pickDaily(domain, salt, date)` from `@/lib/daily/pick`.
 * Kept as a thin wrapper for shared fallback wording.
 */
import { pickDaily, type DailyVariant } from '@/lib/daily/pick';

export type DailyTheme = DailyVariant;

/** 하위 호환: 홈 팩 기준으로 고른다. 새 코드는 도메인별 pickDaily를 쓰세요. */
export function dailyTheme(seed: string, date = new Date()): DailyTheme {
  return pickDaily('home', seed, date);
}
