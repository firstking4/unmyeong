import { getMobileAds } from './mobileAds';

let initPromise: Promise<boolean> | null = null;

/** 앱 기동 시 1회. 네이티브 모듈 없으면 false. */
export function initMobileAds(): Promise<boolean> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const ads = getMobileAds();
    if (!ads) return false;
    try {
      await ads.default().setRequestConfiguration({
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      });
      await ads.default().initialize();
      return true;
    } catch {
      return false;
    }
  })();

  return initPromise;
}
