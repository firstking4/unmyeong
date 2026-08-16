/**
 * 실제 AdMob 연동 전의 보상형 광고 경계.
 * SDK를 추가하는 단계에서만 이 함수를 네이티브 광고 표시·reward earned 콜백으로 교체한다.
 */
export type RewardedResult = 'earned' | 'dismissed' | 'unavailable';

export async function showRewarded(): Promise<RewardedResult> {
  return 'unavailable';
}
