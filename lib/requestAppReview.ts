import { Linking, Platform } from 'react-native';

import { ANDROID_PACKAGE_ID, PLAY_STORE_URL } from '@/lib/appInstall';

/** 스토어 리뷰 화면으로 연다. 네이티브 인앱 리뷰 SDK 전 스탠드인. */
export async function requestAppReview(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const market = `market://details?id=${ANDROID_PACKAGE_ID}`;
      const canMarket = await Linking.canOpenURL(market);
      if (canMarket) {
        await Linking.openURL(market);
        return true;
      }
    }
    await Linking.openURL(PLAY_STORE_URL);
    return true;
  } catch {
    return false;
  }
}
