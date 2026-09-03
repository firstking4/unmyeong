import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

export type MobileAdsModule = typeof import('react-native-google-mobile-ads');

const NATIVE_MODULE = 'RNGoogleMobileAdsModule';

/** 네이티브 바이너리에 AdMob이 링크됐는지 (Expo Go·구 빌드·iOS 미prebuild면 false). */
function hasNativeAdsModule(): boolean {
  try {
    if (typeof TurboModuleRegistry?.get === 'function') {
      if (TurboModuleRegistry.get(NATIVE_MODULE) != null) return true;
    }
  } catch {
    // getEnforcing가 아닌 get — 실패해도 계속 폴백
  }
  return Boolean(NativeModules[NATIVE_MODULE]);
}

/**
 * Expo Go·웹·AdMob 미포함 네이티브 빌드에서는 null.
 * require만 try/catch하면 TurboModule getEnforcing 예외가 그대로 터지므로
 * 네이티브 모듈 존재 여부를 먼저 본다.
 */
export function getMobileAds(): MobileAdsModule | null {
  if (Platform.OS === 'web') return null;
  if (!hasNativeAdsModule()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads') as MobileAdsModule;
  } catch {
    return null;
  }
}

export function isAdsSdkPresent(): boolean {
  return hasNativeAdsModule();
}
