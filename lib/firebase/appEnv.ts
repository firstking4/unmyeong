export type AppEnv = 'development' | 'preview' | 'production';

/** EAS `env.EXPO_PUBLIC_APP_ENV` — 없으면 development */
export function getAppEnv(): AppEnv {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  if (raw === 'production' || raw === 'preview' || raw === 'development') {
    return raw;
  }
  return 'development';
}

/**
 * Analytics SDK 수집은 initAnalytics()에서 항상 ON.
 * 환경 구분은 user property `app_env` (= getAppEnv())로 GA4 필터.
 *
 * preview/development에서 GA4 본 리포트 오염 방지:
 *   adb setprop debug.firebase.analytics.app → DebugView 전용 (리포트 제외)
 *   SDK 수집 자체를 끄면 DebugView도 동작하지 않는다.
 *
 *   npm run analytics:debug:on
 *   앱 완전 종료 후 재실행
 */
