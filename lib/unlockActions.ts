import { isRewardedAdAvailable } from '@/lib/ads/rewarded';

export type UnlockActionId = 'open_detail' | 'watch_ad';

export const UNLOCK_ACTION_LABELS: Record<UnlockActionId, string> = {
  open_detail: '즉시 확인',
  watch_ad: '광고 보고 확인',
};

export const UNLOCK_FORTUNE_COPY = {
  loadingTitle: '오늘의 광고운은?',
  /** 타이틀 아래 고정 설명 (로딩·결과 공통). */
  subtitle: '자세한 풀이를 열기 전, 오늘의 광고운을 먼저 살펴봅니다.',
  loadingBody: '광고운을 살피는 중…',
  loadingHint: '광고운은 오늘의 운세 점수와 연동됩니다.\n잠시만 기다려 주세요.',
  open_detail: {
    result: '오늘은 운이 좋네요',
    hint: '광고 없이 바로 자세한 풀이를 볼 수 있어요.\n오늘 자정까지 열려 있습니다.',
  },
  watch_ad: {
    result: '오늘은 광고를 볼 운이군요',
    hint: '짧은 광고를 끝까지 보면 자세한 풀이가 열려요.\n오늘 자정까지 유지됩니다.',
  },
} as const;

type UnlockActionOptions = {
  adAvailable?: boolean;
  /** 오늘의 운·랜덤 판정으로 광고 경로를 탈지. */
  offerAd?: boolean;
};

/**
 * 확률 결과에 따른 해금 경로 하나.
 * 광고 SDK가 없으면 항상 즉시 확인.
 */
export function resolveUnlockOutcome(options: UnlockActionOptions = {}): UnlockActionId {
  const adAvailable = options.adAvailable ?? isRewardedAdAvailable();
  const offerAd = options.offerAd ?? false;
  if (adAvailable && offerAd) return 'watch_ad';
  return 'open_detail';
}

/** @deprecated resolveUnlockOutcome 사용 */
export function getAvailableUnlockActions(options: UnlockActionOptions = {}): UnlockActionId[] {
  return [resolveUnlockOutcome(options)];
}

/** @deprecated 단일 outcome만 쓰므로 그대로 반환 */
export function pickSuggestedUnlockAction(actions: UnlockActionId[]): UnlockActionId {
  return actions[0] ?? 'open_detail';
}
