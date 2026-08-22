/**
 * Firebase Analytics 준비용 상수 (SDK 연동 전).
 *
 * 콘솔 작업 (socinal369@gmail.com — Play·AdMob은 firstking4, Firebase만 분리 OK):
 * 1. Firebase 프로젝트 `unmyeong-injido` — Google Analytics(GA4) 사용
 * 2. GA 데이터 공유(3단계): **약관만 ON** — 벤치마킹·기술지원·계정전문가·제품개선 OFF
 * 3. Android 앱 추가 — 패키지 `com.yun.unmyeonginjido`, 닉네임 `운명人지도`
 * 4. `google-services.json` 다운로드 → `npm run firebase:install -- <경로>` 또는 루트 배치
 * 5. (iOS 나중) `GoogleService-Info.plist` → 프로젝트 루트
 *
 * SHA-1: Analytics만이면 필수 아님. AdMob·Play App Signing 연동 시 EAS 지문 추가.
 *
 * SDK 연동: `@react-native-firebase/app` + `analytics` — lib/firebase/analytics.ts 참고.
 * 수집: SDK 항상 ON · preview/development는 adb DebugView(setprop)로 본 리포트와 분리.
 * 주의: SDK 수집 OFF면 DebugView도 동작하지 않음 (0.1.4 preview 버그).
 * 개발 빌드로 DebugView 확인 → Play 데이터 안전성 「분석 예」 → versionCode 2+ AAB.
 */

/** Firebase Console 로그인 계정 (Play·AdMob과 분리 가능) */
export const FIREBASE_CONSOLE_ACCOUNT = 'socinal369@gmail.com';

/** Firebase Console 프로젝트 ID (생성 시 확인) */
export const FIREBASE_PROJECT_ID = 'unmyeong-injido';

/** Firebase 프로젝트 번호 — `google-services.json` project_info.project_number */
export const FIREBASE_PROJECT_NUMBER = '563909743300';

/** Firebase Android 앱 ID — `google-services.json` client_info.mobilesdk_app_id */
export const FIREBASE_ANDROID_APP_ID =
  '1:563909743300:android:1e12d45496c4307c586f91';

/** Android 패키지 — `app.json` android.package와 일치 */
export const ANDROID_PACKAGE = 'com.yun.unmyeonginjido';

/** iOS 번들 — `app.json` ios.bundleIdentifier와 일치 */
export const IOS_BUNDLE_ID = 'com.yun.unmyeonginjido';

/** Expo EAS projectId — `app.json` extra.eas.projectId */
export const EAS_PROJECT_ID = '8d329f50-671e-4aea-8319-3b2805a8d100';

/**
 * 루트에 둘 Firebase 설정 파일 (실 파일은 gitignore).
 * @see google-services.json.example · GoogleService-Info.plist.example
 */
export const CONFIG_PATHS = {
  android: 'google-services.json',
  ios: 'GoogleService-Info.plist',
} as const;

/**
 * SDK 연동 후 logEvent 이름 (화면·버튼만 — 이름·사주 원국·지인 실명 금지).
 * ADID 수집 없음 → withoutAdIdSupport.
 */
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
