/**
 * Firebase Analytics 상수.
 * @see config.example.ts
 */

/** Firebase Console 로그인 계정 (Play·AdMob과 분리 가능) */
export const FIREBASE_CONSOLE_ACCOUNT = 'socinal369@gmail.com';

/** Firebase Console 프로젝트 ID */
export const FIREBASE_PROJECT_ID = 'unmyeong-injido';

/** Firebase 프로젝트 번호 */
export const FIREBASE_PROJECT_NUMBER = '563909743300';

/** Firebase Android 앱 ID */
export const FIREBASE_ANDROID_APP_ID =
  '1:563909743300:android:1e12d45496c4307c586f91';

/** Android 패키지 — app.json android.package와 일치 */
export const ANDROID_PACKAGE = 'com.yun.unmyeonginjido';

/** iOS 번들 — app.json ios.bundleIdentifier와 일치 */
export const IOS_BUNDLE_ID = 'com.yun.unmyeonginjido';

/** Expo EAS projectId */
export const EAS_PROJECT_ID = '8d329f50-671e-4aea-8319-3b2805a8d100';

export const CONFIG_PATHS = {
  android: 'google-services.json',
  ios: 'GoogleService-Info.plist',
} as const;

/** 화면·버튼만 — 이름·사주 원국·지인 실명 금지 */
export const ANALYTICS_EVENTS = {
  tabView: 'tab_view',
  screenView: 'screen_view',
  todayCardOpen: 'today_card_open',
  unlockCta: 'unlock_cta',
  tarotSpreadOpen: 'tarot_spread_open',
  contactAdd: 'contact_add',
  backupExport: 'backup_export',
  backupRestore: 'backup_restore',
  notificationToggle: 'notification_toggle',
  profileComplete: 'profile_complete',
} as const;

export type AnalyticsTab =
  | 'home'
  | 'seonghyang'
  | 'saju'
  | 'tarot'
  | 'gunghap';

export type TodayCardKind = 'saju' | 'seonghyang' | 'tarot' | 'contact';
