import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackupPasswordModal } from '@/components/profile/BackupPasswordModal';
import { Text } from '@/components/Themed';
import { ChevronRightIcon } from '@/components/icons/AppIcon';
import Colors from '@/constants/Colors';
import { radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useContacts } from '@/context/ContactsContext';
import { useProfile } from '@/context/ProfileContext';
import { useAppTheme, type ThemePreference } from '@/context/ThemeContext';
import type { EncryptedBackupEnvelope } from '@/lib/backupCrypto';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import {
  disableDailyFortuneNotification,
  enableDailyFortuneNotification,
  getFortuneNotificationSettings,
  type FortuneNotificationSettings,
} from '@/lib/fortuneNotifications';
import {
  exportProfileBackupFile,
  findDevDocumentsBackupUri,
  pickDevDocumentsBackup,
  pickProfileBackupFile,
  unlockEncryptedBackup,
} from '@/lib/profileBackupIO';
import {
  logBackupExport,
  logBackupRestore,
  logNotificationToggle,
} from '@/lib/firebase/analytics';
import type { ProfileBackup } from '@/lib/profileBackup';
import { replaceHistory } from '@/lib/history';
import { getAppVersionLabel } from '@/lib/appVersion';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];
const FORTUNE_HOURS = [7, 8, 9, 10];

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const { preference, setTheme } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, replaceProfile } = useProfile();
  const { contacts, replaceContacts } = useContacts();
  const [busy, setBusy] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<FortuneNotificationSettings>({
    enabled: false,
    hour: 9,
  });
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'export' | 'import' | null>(null);
  const [pendingEnvelope, setPendingEnvelope] = useState<EncryptedBackupEnvelope | null>(null);

  useEffect(() => {
    void getFortuneNotificationSettings().then(setNotificationSettings);
  }, []);

  const updateFortuneNotification = async (enabled: boolean, hour = notificationSettings.hour) => {
    if (notificationBusy) return;
    const wasEnabled = notificationSettings.enabled;
    setNotificationBusy(true);
    try {
      if (enabled) {
        const result = await enableDailyFortuneNotification(hour, profile.name);
        if (!result.ok) {
          Alert.alert('알림을 켜지 못했습니다', result.error);
          return;
        }
        setNotificationSettings(result.settings);
        if (!wasEnabled) void logNotificationToggle(true);
      } else {
        setNotificationSettings(await disableDailyFortuneNotification());
        if (wasEnabled) void logNotificationToggle(false);
      }
    } finally {
      setNotificationBusy(false);
    }
  };

  const applyBackup = async (backup: ProfileBackup, note?: string) => {
    const contactCount = backup.contacts.length;
    const historyCount = backup.history?.length ?? 0;
    const hasGwansang = Boolean(
      backup.profile.physiognomy && Object.keys(backup.profile.physiognomy).length > 0,
    );
    const proceed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        '백업을 복구할까요?',
        [
          note,
          `내 프로필·관상${hasGwansang ? '' : '(없음)'}·지인 ${contactCount}명·기록 ${historyCount}건이 현재 데이터를 덮어씁니다.`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        [
          { text: '취소', style: 'cancel', onPress: () => resolve(false) },
          { text: '복구', style: 'destructive', onPress: () => resolve(true) },
        ],
      );
    });
    if (!proceed) return;

    await replaceProfile(backup.profile);
    await replaceContacts(backup.contacts);
    await replaceHistory(backup.history ?? []);
    void logBackupRestore();
    Alert.alert('복구 완료', '운명인지도 데이터가 복원되었습니다.', [
      {
        text: '확인',
        onPress: () => {
          if (router.canGoBack()) router.back();
        },
      },
    ]);
  };

  const runExport = async (password: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      const result = await exportProfileBackupFile(profile, contacts, password);
      setPasswordMode(null);
      if (!result.ok) {
        if (!result.canceled && result.error) Alert.alert('백업 실패', result.error);
        return;
      }
      void logBackupExport();
      Alert.alert(
        '백업 완료',
        [
          result.savedToDownloads
            ? `다운로드 폴더에 암호화 저장했습니다.\n${result.fileName}`
            : `암호화 파일을 내보냈습니다.\n${result.fileName}`,
          '복구할 때 지금 정한 비밀번호가 필요합니다. 비밀번호를 잊으면 복구할 수 없습니다.',
        ].join('\n\n'),
      );
    } finally {
      setBusy(false);
    }
  };

  const beginImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (__DEV__) {
        const devUri = await findDevDocumentsBackupUri();
        if (devUri) {
          const fileName = devUri.split('/').pop() ?? 'backup.json';
          const useDev = await new Promise<boolean>((resolve) => {
            Alert.alert(
              '시뮬 백업 발견',
              `Expo Documents에 ${fileName}이 있습니다.\n이 파일로 복구할까요?`,
              [
                { text: '다른 파일 고르기', onPress: () => resolve(false) },
                { text: '이 파일로', onPress: () => resolve(true) },
              ],
            );
          });
          if (useDev) {
            const picked = await pickDevDocumentsBackup();
            if (!picked.ok) {
              if ('notFound' in picked && picked.notFound) {
                Alert.alert('복구 실패', 'Expo Documents에 백업 파일이 없습니다.');
              } else if (picked.error) {
                Alert.alert('복구 실패', picked.error);
              }
              return;
            }
            if (picked.kind === 'plain') {
              await applyBackup(
                picked.backup,
                '이 파일은 예전 형식(암호화 없음)입니다. 복구 후 다시 백업하면 비밀번호로 암호화됩니다.',
              );
              return;
            }
            setPendingEnvelope(picked.envelope);
            setPasswordMode('import');
            return;
          }
        }
      }

      const picked = await pickProfileBackupFile();
      if (!picked.ok) {
        if (!picked.canceled && picked.error) Alert.alert('복구 실패', picked.error);
        return;
      }
      if (picked.kind === 'plain') {
        await applyBackup(
          picked.backup,
          '이 파일은 예전 형식(암호화 없음)입니다. 복구 후 다시 백업하면 비밀번호로 암호화됩니다.',
        );
        return;
      }
      setPendingEnvelope(picked.envelope);
      setPasswordMode('import');
    } finally {
      setBusy(false);
    }
  };

  const runUnlock = async (password: string) => {
    if (!pendingEnvelope || busy) return;
    setBusy(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      const unlocked = unlockEncryptedBackup(pendingEnvelope, password);
      if (!unlocked.ok) {
        Alert.alert('복구 실패', unlocked.error);
        return;
      }
      setPasswordMode(null);
      setPendingEnvelope(null);
      await applyBackup(unlocked.backup);
    } finally {
      setBusy(false);
    }
  };

  const openBackupMenu = () => {
    if (busy) return;
    Alert.alert(
      '운명인지도 백업·복구',
      [
        '내 프로필·관상·지인을 한 파일로 다루며, 백업 시 비밀번호로 암호화합니다.',
        'Android는 다운로드 폴더에 저장합니다. 복구에는 같은 비밀번호가 필요하고, 잊으면 복구할 수 없습니다.',
      ].join('\n\n'),
      [
        { text: '취소', style: 'cancel' },
        {
          text: '백업(내보내기)',
          onPress: () => setPasswordMode('export'),
        },
        {
          text: '복구(불러오기)',
          onPress: () => void beginImport(),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: 4, paddingBottom: Math.max(insets.bottom, space.md) },
      ]}>
      <View style={styles.section}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationCopy}>
            <Text style={[styles.sectionLabel, { color: c.text }]}>오늘의 운세 알림</Text>
            <Text style={[styles.hint, { color: c.muted }]}>
              매일 오전 {notificationSettings.hour}시에 오늘의 운세를 알려드려요.
            </Text>
          </View>
          <Pressable
            onPress={() => void updateFortuneNotification(!notificationSettings.enabled)}
            disabled={notificationBusy}
            accessibilityRole="switch"
            accessibilityLabel="오늘의 운세 알림"
            accessibilityState={{ checked: notificationSettings.enabled, disabled: notificationBusy }}
            style={[
              styles.toggle,
              {
                backgroundColor: notificationSettings.enabled ? c.tint : 'transparent',
                borderColor: notificationSettings.enabled ? c.tint : c.muted,
                opacity: notificationBusy ? 0.45 : 1,
              },
            ]}>
            <View
              style={[
                styles.toggleKnob,
                {
                  backgroundColor: notificationSettings.enabled ? '#F3EEE6' : c.muted,
                  transform: [{ translateX: notificationSettings.enabled ? 18 : 0 }],
                },
              ]}
            />
          </Pressable>
        </View>
        {notificationSettings.enabled ? (
          <View style={styles.hourRow}>
            {FORTUNE_HOURS.map((hour) => {
              const selected = notificationSettings.hour === hour;
              return (
                <Pressable
                  key={hour}
                  onPress={() => void updateFortuneNotification(true, hour)}
                  disabled={notificationBusy}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: notificationBusy }}
                  accessibilityLabel={`오전 ${hour}시`}>
                  <Text
                    style={[
                      styles.hourChip,
                      {
                        backgroundColor: selected ? c.tint : c.card,
                        color: selected ? '#F3EEE6' : c.text,
                        opacity: notificationBusy ? 0.45 : 1,
                      },
                    ]}>
                    오전 {hour}시
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={[styles.section, styles.sectionRule, { borderTopColor: c.hairline }]}>
        <Text style={[styles.sectionLabel, { color: c.text }]}>화면 테마</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => {
            const selected = preference === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setTheme(opt.value)}
                style={({ pressed }) => [
                  styles.themeChip,
                  {
                    backgroundColor: selected ? c.tint : c.card,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`테마 ${opt.label}`}>
                <Text
                  style={[styles.themeChipText, { color: selected ? '#F3EEE6' : c.text }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.listSection, { borderTopColor: c.hairline }]}>
        <Pressable
          disabled={busy}
          onPress={openBackupMenu}
          style={({ pressed }) => [
            styles.row,
            {
              borderBottomColor: c.hairline,
              opacity: busy ? 0.45 : pressed ? 0.55 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="운명인지도 백업·복구"
          accessibilityState={{ disabled: busy }}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: c.text }]}>운명인지도 백업·복구</Text>
            <Text style={[styles.rowBlurb, { color: c.muted }]}>
              비밀번호로 암호화해 저장·복원 (프로필·관상·지인·기록)
            </Text>
          </View>
          <ChevronRightIcon color={c.muted} size={22} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/legal/privacy')}
          style={({ pressed }) => [
            styles.row,
            { borderBottomColor: c.hairline, opacity: pressed ? 0.55 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="개인정보 처리방침">
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: c.text }]}>개인정보 처리방침</Text>
            <Text style={[styles.rowBlurb, { color: c.muted }]}>수집·보관·이용 안내</Text>
          </View>
          <ChevronRightIcon color={c.muted} size={22} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/legal/terms')}
          style={({ pressed }) => [
            styles.row,
            { borderBottomColor: c.hairline, opacity: pressed ? 0.55 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="이용약관">
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: c.text }]}>이용약관</Text>
            <Text style={[styles.rowBlurb, { color: c.muted }]}>서비스 이용·면책 안내</Text>
          </View>
          <ChevronRightIcon color={c.muted} size={22} />
        </Pressable>
      </View>

      <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      <Text style={[styles.version, { color: c.muted }]} accessibilityLabel={`앱 버전 ${getAppVersionLabel()}`}>
        {getAppVersionLabel()}
      </Text>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <BackupPasswordModal
        visible={passwordMode != null}
        mode={passwordMode ?? 'export'}
        busy={busy}
        onClose={() => {
          if (busy) return;
          setPasswordMode(null);
          setPendingEnvelope(null);
        }}
        onSubmit={(password) => {
          if (passwordMode === 'export') void runExport(password);
          else void runUnlock(password);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: space.md },
  section: { gap: 12, marginTop: 8 },
  sectionRule: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: { fontSize: 17, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18 },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationCopy: { flex: 1, gap: 4 },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    padding: 4,
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  toggleKnob: { width: 20, height: 20, borderRadius: 10 },
  hourRow: { flexDirection: 'row', gap: 8 },
  hourChip: {
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    fontSize: 13,
    fontWeight: '600',
  },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  themeChipText: { fontSize: 14, fontWeight: '600' },
  listSection: {
    marginTop: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontSize: 17 },
  rowBlurb: { fontSize: 13, lineHeight: 18 },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
  version: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.55,
  },
});
