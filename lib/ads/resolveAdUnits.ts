import { PRODUCTION_AD_UNITS, TEST_AD_UNITS } from './adUnits';

type Platform = 'android' | 'ios';

/** SDK 연동 전에도 import 가능. 실 ID가 없으면 Google 테스트 ID로 폴백. */
export function resolveAdUnits(platform: Platform) {
  const production = PRODUCTION_AD_UNITS[platform];
  const test = TEST_AD_UNITS[platform];

  return {
    appId: production.appId || test.appId,
    banner: production.banner || test.banner,
    rewarded: production.rewarded || test.rewarded,
    isTest: !production.appId,
  };
}
