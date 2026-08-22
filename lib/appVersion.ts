import Constants from 'expo-constants';

import { getAppEnv } from '@/lib/firebase/appEnv';

/** 설정 등에 표시할 앱 버전 문자열 (예: `0.1.5 (1) · preview`) */
export function getAppVersionLabel(): string {
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '?';
  const build = Constants.nativeBuildVersion;
  const env = getAppEnv();

  const parts = [`v${version}`];
  if (build) parts.push(`(${build})`);
  if (env !== 'production') parts.push(`· ${env}`);
  return parts.join(' ');
}
