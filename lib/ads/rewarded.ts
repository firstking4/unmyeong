/**
 * 보상형 광고 — AdMob Rewarded.
 * reward earned 콜백일 때만 'earned'.
 * 호출 전에 RN Modal을 닫아 두는 것을 권장(표시 실패 예방).
 */
import { Platform } from 'react-native';

import { initMobileAds } from './initAds';
import { getMobileAds, isAdsSdkPresent } from './mobileAds';
import { resolveAdUnits } from './resolveAdUnits';

export type RewardedResult = 'earned' | 'dismissed' | 'unavailable';

const LOAD_TIMEOUT_MS = 25_000;

export function isRewardedAdAvailable(): boolean {
  return Platform.OS !== 'web' && isAdsSdkPresent();
}

export async function showRewarded(): Promise<RewardedResult> {
  if (!isRewardedAdAvailable()) return 'unavailable';

  const ready = await initMobileAds();
  const ads = getMobileAds();
  if (!ready || !ads) return 'unavailable';

  const { RewardedAd, RewardedAdEventType, AdEventType } = ads;
  const unitId = resolveAdUnits().rewarded;

  return new Promise<RewardedResult>((resolve) => {
    let settled = false;
    let earned = false;
    const rewarded = RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const finish = (result: RewardedResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubs.forEach((u) => {
        try {
          u();
        } catch {
          // ignore
        }
      });
      resolve(result);
    };

    const unsubs = [
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        void rewarded.show().catch(() => finish('unavailable'));
      }),
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        finish(earned ? 'earned' : 'dismissed');
      }),
      rewarded.addAdEventListener(AdEventType.ERROR, () => {
        finish('unavailable');
      }),
    ];

    const timer = setTimeout(() => finish('unavailable'), LOAD_TIMEOUT_MS);
    try {
      rewarded.load();
    } catch {
      finish('unavailable');
    }
  });
}
