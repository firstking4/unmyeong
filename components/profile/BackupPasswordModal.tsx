import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { CloseIcon } from '@/components/ui/CloseIcon';
import Colors from '@/constants/Colors';
import { pagePad, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type Mode = 'export' | 'import';

type Props = {
  visible: boolean;
  mode: Mode;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
};

const COPY: Record<
  Mode,
  { title: string; lead: string; confirm: boolean; submit: string; busy: string }
> = {
  export: {
    title: '백업 비밀번호',
    lead:
      '내 프로필·관상·지인 정보를 암호화해 저장합니다. 복구할 때 같은 비밀번호가 필요하며, 잊으면 복구할 수 없습니다. 다운로드 폴더·클라우드에 올려도 비밀번호 없이는 내용을 볼 수 없습니다.',
    confirm: true,
    submit: '암호화해 저장',
    busy: '암호화하는 중…',
  },
  import: {
    title: '백업 비밀번호',
    lead: '암호화된 백업을 열려면 저장할 때 정한 비밀번호를 입력하세요.',
    confirm: false,
    submit: '잠금 해제',
    busy: '잠금 해제하는 중…',
  },
};

export function BackupPasswordModal({
  visible,
  mode,
  busy = false,
  onClose,
  onSubmit,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const copy = COPY[mode];
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setPassword('');
      setConfirm('');
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (busy) Keyboard.dismiss();
  }, [busy]);

  const submit = () => {
    if (busy) return;
    const pw = password.trim();
    if (pw.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }
    if (copy.confirm && pw !== confirm.trim()) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setError(null);
    Keyboard.dismiss();
    onSubmit(pw);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={busy ? undefined : onClose}>
      {busy ? (
        <View style={styles.overlayCenter}>
          <View
            style={[styles.busyCard, { backgroundColor: c.surface }]}
            accessibilityLabel={copy.busy}>
            <ActivityIndicator color={c.tint} size="large" />
            <Text style={[styles.busyTitle, { color: c.text }]}>{copy.busy}</Text>
            <Text style={[styles.busyHint, { color: c.muted }]}>
              잠시만 기다려 주세요. 기기에서 안전하게 처리 중입니다.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.overlayTop}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: c.surface, paddingTop: insets.top + space.sm }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: c.text }]}>{copy.title}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="닫기"
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                <CloseIcon color={c.text} size={22} />
              </Pressable>
            </View>

            <Text style={[styles.lead, { color: c.muted }]}>{copy.lead}</Text>

            <Text style={[styles.label, { color: c.muted }]}>비밀번호</Text>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="4자 이상"
              placeholderTextColor={c.muted}
              style={[
                styles.input,
                { color: c.text, backgroundColor: c.card, borderColor: c.hairline },
              ]}
            />

            {copy.confirm ? (
              <>
                <Text style={[styles.label, { color: c.muted }]}>비밀번호 확인</Text>
                <TextInput
                  value={confirm}
                  onChangeText={(v) => {
                    setConfirm(v);
                    setError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="한 번 더 입력"
                  placeholderTextColor={c.muted}
                  style={[
                    styles.input,
                    { color: c.text, backgroundColor: c.card, borderColor: c.hairline },
                  ]}
                />
              </>
            ) : null}

            {error ? <Text style={[styles.error, { color: c.tint }]}>{error}</Text> : null}

            <Pressable
              onPress={submit}
              style={({ pressed }) => [
                styles.submit,
                { backgroundColor: c.tint, opacity: pressed ? 0.8 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={copy.submit}>
              <Text style={styles.submitText}>{copy.submit}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayTop: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // RN 0.86에는 `absoluteFillObject`가 없다. `absoluteFill`은 등록된 스타일 ID라
  // 스프레드하면 조용히 사라져 딤이 화면을 덮지 못한다 — 좌표를 직접 적는다.
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    paddingHorizontal: pagePad,
    paddingBottom: space.md,
    gap: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  lead: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    marginTop: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitText: {
    color: '#F3EEE6',
    fontSize: 15,
    fontWeight: '700',
  },
  busyCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg + 4,
    alignItems: 'center',
    gap: 12,
  },
  busyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  busyHint: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
