import { appStorage } from '@/lib/storage';

export const REWARD_UNLOCK_STORAGE_KEY = '@unmyeong/reward-unlocks';

export type RewardScreenId = 'seonghyang_today' | 'saju_today' | 'tarot_today' | 'contact_today';

export type RewardUnlockState = {
  date: string;
  /** 화면 id, 또는 `contact_today:<contactId>` 처럼 스코프가 붙은 키 */
  screens: Partial<Record<string, true>>;
};

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 지인 상세처럼 대상이 여럿이면 scopeId를 붙인다. */
export function rewardUnlockKey(screen: RewardScreenId, scopeId?: string): string {
  return scopeId ? `${screen}:${scopeId}` : screen;
}

export function emptyRewardUnlockState(): RewardUnlockState {
  return { date: localDateKey(), screens: {} };
}

export function normalizeRewardUnlockState(raw: string | null): RewardUnlockState {
  const current = localDateKey();
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<RewardUnlockState>) : null;
    if (!parsed || parsed.date !== current || !parsed.screens || typeof parsed.screens !== 'object') {
      return { date: current, screens: {} };
    }
    return { date: current, screens: parsed.screens };
  } catch {
    return { date: current, screens: {} };
  }
}

export async function loadRewardUnlockState(): Promise<RewardUnlockState> {
  return normalizeRewardUnlockState(await appStorage.getItem(REWARD_UNLOCK_STORAGE_KEY));
}

export async function saveRewardUnlockState(state: RewardUnlockState) {
  await appStorage.setItem(REWARD_UNLOCK_STORAGE_KEY, JSON.stringify(state));
}

export async function clearRewardUnlockState() {
  await appStorage.removeItem(REWARD_UNLOCK_STORAGE_KEY);
}

export function isRewardUnlocked(
  state: RewardUnlockState,
  screen: RewardScreenId,
  scopeId?: string,
) {
  return state.date === localDateKey() && state.screens[rewardUnlockKey(screen, scopeId)] === true;
}

export function grantRewardUnlock(
  state: RewardUnlockState,
  screen: RewardScreenId,
  scopeId?: string,
): RewardUnlockState {
  const base = state.date === localDateKey() ? state : emptyRewardUnlockState();
  return {
    ...base,
    screens: { ...base.screens, [rewardUnlockKey(screen, scopeId)]: true },
  };
}
