import { Platform } from 'react-native';

import { getNotifications, notificationsUnavailableReason } from '@/lib/notificationsModule';
import { appStorage } from '@/lib/storage';

const SETTINGS_KEY = '@unmyeong/fortune-notifications';
const CHANNEL_ID = 'daily-fortune';

export type FortuneNotificationSettings = {
  enabled: boolean;
  hour: number;
  identifier?: string;
};

const DEFAULT_SETTINGS: FortuneNotificationSettings = {
  enabled: false,
  hour: 9,
};

function validSettings(raw: unknown): FortuneNotificationSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  const row = raw as Partial<FortuneNotificationSettings>;
  const hour = typeof row.hour === 'number' && row.hour >= 0 && row.hour <= 23 ? row.hour : 9;
  return {
    enabled: row.enabled === true,
    hour,
    identifier: typeof row.identifier === 'string' ? row.identifier : undefined,
  };
}

export async function getFortuneNotificationSettings(): Promise<FortuneNotificationSettings> {
  try {
    const raw = await appStorage.getItem(SETTINGS_KEY);
    return validSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function save(settings: FortuneNotificationSettings) {
  await appStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function ensurePermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '오늘의 운세',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

async function cancel(settings: FortuneNotificationSettings) {
  if (!settings.identifier) return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(settings.identifier);
  } catch {
    // 이미 삭제됐거나 OS가 정리한 예약은 무시한다.
  }
}

/** 매일 지정한 오전 시각에 로컬 알림을 예약한다. */
export async function enableDailyFortuneNotification(
  hour: number,
  profileName?: string,
): Promise<
  | { ok: true; settings: FortuneNotificationSettings }
  | { ok: false; error: string }
> {
  const Notifications = getNotifications();
  if (!Notifications) {
    return { ok: false, error: notificationsUnavailableReason };
  }
  if (!(await ensurePermission())) {
    return { ok: false, error: '알림 권한이 필요합니다. 기기 설정에서 알림을 허용해 주세요.' };
  }

  const previous = await getFortuneNotificationSettings();
  await cancel(previous);
  const name = profileName?.trim();
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '오늘의 운세가 준비됐어요',
      body: name ? `${name}님의 오늘 흐름을 확인해 보세요.` : '오늘의 흐름을 확인해 보세요.',
      data: { href: '/' },
      sound: 'default',
    },
    trigger:
      Platform.OS === 'android'
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 }
        : { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour, minute: 0, repeats: true },
  });
  const settings = { enabled: true, hour, identifier };
  await save(settings);
  return { ok: true, settings };
}

export async function disableDailyFortuneNotification(): Promise<FortuneNotificationSettings> {
  const previous = await getFortuneNotificationSettings();
  await cancel(previous);
  const settings = { ...previous, enabled: false, identifier: undefined };
  await save(settings);
  return settings;
}
