/**
 * AdMob 광고 단위 ID 템플릿 (SDK 연동 전 준비용).
 *
 * 1. 이 파일을 `adUnits.local.ts`로 복사
 * 2. AdMob 콘솔에서 발급한 실 ID로 교체
 * 3. `adUnits.local.ts`는 .gitignore에 있어 커밋되지 않음
 *
 * 개발·스모크 중에는 Google 공식 테스트 ID만 사용한다.
 * @see https://developers.google.com/admob/android/test-ads
 */

/** AdMob 앱 등록 시 Android 패키지명과 일치해야 함 (`app.json` → android.package) */
export const ANDROID_PACKAGE = 'com.yun.unmyeonginjido';

/** AdMob 계정 퍼블리셔 ID (콘솔 → 설정). 앱·광고 단위 ID와 별개. */
export const ADMOB_PUBLISHER_ID = 'pub-2874731542856105';

/** Google 공식 테스트 ID — 개발 빌드·실기기 스모크용 */
export const TEST_AD_UNITS = {
  android: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    appId: 'ca-app-pub-3940256099942544~1458002511',
    banner: 'ca-app-pub-3940256099942544/2934735716',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
} as const;

/**
 * AdMob 콘솔에서 만들 광고 단위 (이름 제안).
 * 배너는 홈·메뉴 슬롯이 같아도 단위 1개로 충분.
 */
export const PRODUCTION_UNIT_NAMES = {
  banner: 'unmyeong_banner',
  rewarded: 'unmyeong_rewarded',
} as const;

/** 가입·앱 추가 후 아래를 실 ID로 채운다. 비어 있으면 SDK 연동 시 TEST_AD_UNITS 사용. */
export const PRODUCTION_AD_UNITS = {
  android: {
    appId: '',
    banner: '',
    rewarded: '',
  },
  ios: {
    appId: '',
    banner: '',
    rewarded: '',
  },
} as const;
