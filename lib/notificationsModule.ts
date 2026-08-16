import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Expo Go(Android)는 SDK 53부터 알림 모듈을 불러오는 것만으로 예외를 던진다. */
export const notificationsSupported =
  Platform.OS !== 'web' && !(isExpoGo && Platform.OS === 'android');

export const notificationsUnavailableReason = isExpoGo
  ? 'Expo Go에서는 운세 알림을 사용할 수 없습니다. 설치형 앱에서 사용해 주세요.'
  : '이 환경에서는 운세 알림을 사용할 수 없습니다.';

let cached: NotificationsModule | null | undefined;

export function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (!notificationsSupported) {
    cached = null;
    return cached;
  }
  try {
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}
