import { appStorage } from '@/lib/storage';

const STORAGE_KEY = '@unmyeong/reward-unlocks';

export type RewardScreenId = 'seonghyang_today' | 'saju_today' | 'tarot_today' | 'contact_today';

export type RewardUnlockState = {
  date: string;
  screens: Partial<Record<RewardScreenId, true>>;
};

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  return normalizeRewardUnlockState(await appStorage.getItem(STORAGE_KEY));
}

export async function saveRewardUnlockState(state: RewardUnlockState) {
  await appStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isRewardUnlocked(state: RewardUnlockState, screen: RewardScreenId) {
  return state.date === localDateKey() && state.screens[screen] === true;
}

export function grantRewardUnlock(state: RewardUnlockState, screen: RewardScreenId): RewardUnlockState {
  const base = state.date === localDateKey() ? state : emptyRewardUnlockState();
  return { ...base, screens: { ...base.screens, [screen]: true } };
}
