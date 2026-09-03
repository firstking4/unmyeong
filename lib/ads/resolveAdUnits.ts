import { Platform } from 'react-native';

import { getAppEnv } from '@/lib/firebase/appEnv';

import { PRODUCTION_AD_UNITS, TEST_AD_UNITS } from './adUnits';
import { getMobileAds } from './mobileAds';

type AdsPlatform = 'android' | 'ios';

function currentPlatform(): AdsPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/** 개발·preview는 Google 테스트 ID. production만 실 유닛. */
function shouldUseTestAds(): boolean {
  if (__DEV__) return true;
  return getAppEnv() !== 'production';
}

/**
 * 개발(__DEV__)·preview는 Google 테스트 ID.
 * production만 실 유닛(없으면 테스트 폴백).
 * 실 ID로 본인 클릭 테스트 금지.
 */
export function resolveAdUnits(platform: AdsPlatform = currentPlatform()) {
  const production = PRODUCTION_AD_UNITS[platform];
  const test = TEST_AD_UNITS[platform];
  const ads = getMobileAds();
  const TestIds = ads?.TestIds;

  if (shouldUseTestAds()) {
    return {
      appId: test.appId,
      banner: TestIds?.ADAPTIVE_BANNER ?? TestIds?.BANNER ?? test.banner,
      rewarded: TestIds?.REWARDED ?? test.rewarded,
      isTest: true as const,
    };
  }

  const hasProduction = Boolean(production.appId && production.banner && production.rewarded);
  return {
    appId: production.appId || test.appId,
    banner: production.banner || test.banner,
    rewarded: production.rewarded || test.rewarded,
    isTest: !hasProduction,
  };
}
