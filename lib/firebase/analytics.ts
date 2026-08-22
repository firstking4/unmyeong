import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { getAppEnv } from '@/lib/firebase/appEnv';
import {
  ANALYTICS_EVENTS,
  type AnalyticsTab,
  type TodayCardKind,
} from '@/lib/firebase/config';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Expo Go·웹에서는 네이티브 Firebase Analytics 미지원 */
export const analyticsSupported = Platform.OS !== 'web' && !isExpoGo;

type AnalyticsMod = typeof import('@react-native-firebase/analytics');
type AppMod = typeof import('@react-native-firebase/app');

type LoadedModules = {
  getAnalytics: AnalyticsMod['getAnalytics'];
  logEvent: AnalyticsMod['logEvent'];
  setAnalyticsCollectionEnabled: AnalyticsMod['setAnalyticsCollectionEnabled'];
  setUserProperty: AnalyticsMod['setUserProperty'];
  getApp: AppMod['getApp'];
};

let cachedModules: LoadedModules | null | undefined;
let initAttempted = false;

function loadModules(): LoadedModules | null {
  if (cachedModules !== undefined) return cachedModules;
  if (!analyticsSupported) {
    cachedModules = null;
    return cachedModules;
  }
  try {
    const analytics = require('@react-native-firebase/analytics') as AnalyticsMod;
    const app = require('@react-native-firebase/app') as AppMod;
    cachedModules = {
      getAnalytics: analytics.getAnalytics,
      logEvent: analytics.logEvent,
      setAnalyticsCollectionEnabled: analytics.setAnalyticsCollectionEnabled,
      setUserProperty: analytics.setUserProperty,
      getApp: app.getApp,
    };
  } catch {
    cachedModules = null;
  }
  return cachedModules;
}

function getAnalyticsInstance() {
  const modules = loadModules();
  if (!modules) return null;
  try {
    return modules.getAnalytics(modules.getApp());
  } catch {
    return null;
  }
}

/**
 * 앱 시작 시 1회.
 * SDK 수집은 모든 빌드에서 ON — DebugView(adb setprop)도 수집 ON이어야 동작한다.
 * preview/development 본 리포트 분리는 adb debug 플래그 + user property `app_env`.
 */
export async function initAnalytics(): Promise<void> {
  if (initAttempted) return;
  initAttempted = true;
  const modules = loadModules();
  const analytics = getAnalyticsInstance();
  if (!modules || !analytics) return;
  try {
    await modules.setAnalyticsCollectionEnabled(analytics, true);
    await modules.setUserProperty(analytics, 'app_env', getAppEnv());
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics] init failed', error);
    }
  }
}

export async function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number>,
): Promise<void> {
  const modules = loadModules();
  const analytics = getAnalyticsInstance();
  if (!modules || !analytics) return;
  try {
    await modules.logEvent(analytics, name, params);
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics] log failed', name, error);
    }
  }
}

export async function logTabView(tab: AnalyticsTab): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.tabView, { tab });
}

export async function logScreenView(screen: string): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.screenView, { screen });
}

export async function logTodayCardOpen(card: TodayCardKind): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.todayCardOpen, { card });
}

export async function logUnlockCta(screen: string): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.unlockCta, { screen });
}

export async function logTarotSpreadOpen(kind: string): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.tarotSpreadOpen, { kind });
}

export async function logContactAdd(): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.contactAdd);
}

export async function logBackupExport(): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.backupExport);
}

export async function logBackupRestore(): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.backupRestore);
}

export async function logNotificationToggle(enabled: boolean): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.notificationToggle, {
    enabled: enabled ? 1 : 0,
  });
}

export async function logProfileComplete(): Promise<void> {
  await logAnalyticsEvent(ANALYTICS_EVENTS.profileComplete);
}
