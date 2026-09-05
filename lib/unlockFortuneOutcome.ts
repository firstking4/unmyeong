import { appStorage } from '@/lib/storage';
import type { UnlockActionId } from '@/lib/unlockActions';
import { rewardUnlockKey, type RewardScreenId } from '@/lib/rewardUnlock';

export const UNLOCK_FORTUNE_OUTCOME_STORAGE_KEY = '@unmyeong/unlock-fortune-outcomes';

export type UnlockFortuneOutcomeState = {
  date: string;
  /** lockId → 당일 고정 결과 (open_detail | watch_ad) */
  outcomes: Partial<Record<string, UnlockActionId>>;
};

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** LockedContentCard 잠금 키. 지인은 scopeId 필요. */
export function unlockFortuneLockId(screen: RewardScreenId, scopeId?: string): string {
  return rewardUnlockKey(screen, scopeId);
}

export function emptyUnlockFortuneOutcomeState(): UnlockFortuneOutcomeState {
  return { date: localDateKey(), outcomes: {} };
}

export function normalizeUnlockFortuneOutcomeState(
  raw: string | null,
): UnlockFortuneOutcomeState {
  const current = localDateKey();
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<UnlockFortuneOutcomeState>) : null;
    if (!parsed || parsed.date !== current || !parsed.outcomes || typeof parsed.outcomes !== 'object') {
      return { date: current, outcomes: {} };
    }
    const outcomes: Partial<Record<string, UnlockActionId>> = {};
    for (const [key, value] of Object.entries(parsed.outcomes)) {
      if (value === 'open_detail' || value === 'watch_ad') {
        outcomes[key] = value;
      }
    }
    return { date: current, outcomes };
  } catch {
    return { date: current, outcomes: {} };
  }
}

export async function loadUnlockFortuneOutcomeState(): Promise<UnlockFortuneOutcomeState> {
  return normalizeUnlockFortuneOutcomeState(await appStorage.getItem(UNLOCK_FORTUNE_OUTCOME_STORAGE_KEY));
}

export async function saveUnlockFortuneOutcomeState(state: UnlockFortuneOutcomeState) {
  await appStorage.setItem(UNLOCK_FORTUNE_OUTCOME_STORAGE_KEY, JSON.stringify(state));
}

export async function clearUnlockFortuneOutcomeState() {
  await appStorage.removeItem(UNLOCK_FORTUNE_OUTCOME_STORAGE_KEY);
}

/** 당일 고정 결과가 있으면 반환, 없으면 null. */
export async function peekUnlockFortuneOutcome(lockId: string): Promise<UnlockActionId | null> {
  const state = await loadUnlockFortuneOutcomeState();
  const existing = state.outcomes[lockId];
  return existing === 'open_detail' || existing === 'watch_ad' ? existing : null;
}

/**
 * 당일·해당 잠금의 광고운 결과.
 * 이미 굴렸으면 그대로 반환, 없으면 roll 후 저장.
 */
export async function getOrRollUnlockFortuneOutcome(
  lockId: string,
  roll: () => UnlockActionId,
): Promise<UnlockActionId> {
  const existing = await peekUnlockFortuneOutcome(lockId);
  if (existing) return existing;

  const next = roll();
  const state = await loadUnlockFortuneOutcomeState();
  const base = state.date === localDateKey() ? state : emptyUnlockFortuneOutcomeState();
  await saveUnlockFortuneOutcomeState({
    ...base,
    outcomes: { ...base.outcomes, [lockId]: next },
  });
  return next;
}
