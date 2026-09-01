import { Platform, Share } from 'react-native';

/** `app.json` → android.package 와 일치 */
export const ANDROID_PACKAGE_ID = 'com.yun.unmyeonginjido';

export const APP_DISPLAY_NAME = '운명人지도';

/** 공유·OG 미리보기용 설치 랜딩 (GitHub Pages). */
export const APP_LANDING_URL = 'https://firstking4.github.io/unmyeong/app/';

/** Play 스토어 설치 페이지. 랜딩 페이지에서 Android CTA로 연결한다. */
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`;

export function buildAppInstallShareMessage(): string {
  return `${APP_DISPLAY_NAME} — 성향·사주·타로·지인 궁합으로 오늘을 짚어 보세요.\n${APP_LANDING_URL}`;
}

/** 네이티브 공유 시트로 설치 랜딩 URL을 보낸다. (카톡 등 OG 미리보기) */
export async function shareAppInstallPage(): Promise<boolean> {
  try {
    const message = buildAppInstallShareMessage();
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message, url: APP_LANDING_URL, title: APP_DISPLAY_NAME }
        : { message, title: APP_DISPLAY_NAME },
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
