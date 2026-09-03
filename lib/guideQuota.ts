import { appStorage } from '@/lib/storage';

const STORAGE_KEY = '@unmyeong/guide-quota';

/** 해금 누적 후 리뷰 안내를 띄울 최소 횟수. */
export const REVIEW_PROMPT_UNLOCK_THRESHOLD = 5;

export type GuideQuotaState = {
  unlockCount: number;
  /** 리뷰 안내를 한 번이라도 보여줬으면 true (다시 띄우지 않음). */
  reviewPromptShown: boolean;
};

export function emptyGuideQuotaState(): GuideQuotaState {
  return { unlockCount: 0, reviewPromptShown: false };
}

export function normalizeGuideQuotaState(raw: string | null): GuideQuotaState {
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<GuideQuotaState>) : null;
    if (!parsed) return emptyGuideQuotaState();
    return {
      unlockCount: typeof parsed.unlockCount === 'number' ? parsed.unlockCount : 0,
      reviewPromptShown: Boolean(parsed.reviewPromptShown),
    };
  } catch {
    return emptyGuideQuotaState();
  }
}

export async function loadGuideQuotaState(): Promise<GuideQuotaState> {
  return normalizeGuideQuotaState(await appStorage.getItem(STORAGE_KEY));
}

export async function saveGuideQuotaState(state: GuideQuotaState) {
  await appStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** 해금 1회를 기록하고, 리뷰 안내를 띄울지 여부를 반환한다. */
export function recordUnlock(state: GuideQuotaState): {
  next: GuideQuotaState;
  shouldPromptReview: boolean;
} {
  const next: GuideQuotaState = {
    unlockCount: state.unlockCount + 1,
    reviewPromptShown: state.reviewPromptShown,
  };
  const shouldPromptReview =
    !state.reviewPromptShown && next.unlockCount >= REVIEW_PROMPT_UNLOCK_THRESHOLD;
  if (shouldPromptReview) {
    next.reviewPromptShown = true;
  }
  return { next, shouldPromptReview };
}

export async function markReviewPromptShown(): Promise<GuideQuotaState> {
  const state = await loadGuideQuotaState();
  const next = { ...state, reviewPromptShown: true };
  await saveGuideQuotaState(next);
  return next;
}
