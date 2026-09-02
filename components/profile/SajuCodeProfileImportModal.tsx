import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import { CloseIcon } from '@/components/ui/CloseIcon';
import Colors from '@/constants/Colors';
import { pagePad, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import { formatBirthDateDisplay } from '@/lib/lunar';
import {
  decodeSajuCode,
  profilePatchFromSajuCode,
  type SajuCodePayload,
} from '@/lib/sajuCode';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 프로필 적용 후 (예: 메뉴 닫기). */
  onApplied?: () => void;
};

export function SajuCodeProfileImportModal({ visible, onClose, onApplied }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { updateProfile } = useProfile();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRaw('');
      setError(null);
      setBusy(false);
    }
  }, [visible]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) {
        Alert.alert('클립보드가 비어 있습니다');
        return;
      }
      setRaw(text);
      setError(null);
    } catch {
      Alert.alert('붙여넣기 실패', '클립보드를 읽지 못했습니다.');
    }
  }, []);

  const applyPayload = async (payload: SajuCodePayload) => {
    const patch = profilePatchFromSajuCode(payload);
    const previewDate =
      formatBirthDateDisplay({
        birthDate: patch.birthDate,
        birthCalendar: patch.birthCalendar,
        birthLunarDate: patch.birthLunarDate,
        birthLeapMonth: patch.birthLeapMonth,
      }) ?? patch.birthDate;
    const genderLabel =
      patch.gender === 'male' ? '남성' : patch.gender === 'female' ? '여성' : null;
    const proceed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        '프로필에 적용할까요?',
        [patch.name, previewDate, genderLabel].filter(Boolean).join('\n'),
        [
          { text: '취소', style: 'cancel', onPress: () => resolve(false) },
          { text: '적용', onPress: () => resolve(true) },
        ],
      );
    });
    if (!proceed) return;

    setBusy(true);
    try {
      await updateProfile(patch);
      onClose();
      onApplied?.();
    } catch {
      Alert.alert('적용 실패', '프로필을 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const verify = () => {
    const result = decodeSajuCode(raw);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    void applyPayload(result.payload);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.center}>
          <Pressable
            style={[styles.sheet, { backgroundColor: c.background }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: c.text }]}>프로필정보 불러오기</Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="닫기"
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
                <CloseIcon color={c.text} size={22} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}>
              <Text style={[styles.lead, { color: c.muted }]}>
                받은 사주 코드를 붙여넣으면 내 프로필(이름·생년월일·성별 등)이 채워집니다.
              </Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: c.text }]}>사주 코드</Text>
                <TextInput
                  value={raw}
                  onChangeText={(t) => {
                    setRaw(t);
                    setError(null);
                  }}
                  placeholder="여기에 붙여넣기"
                  placeholderTextColor={c.muted}
                  maxFontSizeMultiplier={1.2}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  style={[
                    styles.input,
                    {
                      color: c.text,
                      backgroundColor: c.card,
                      borderColor: error ? c.tint : c.hairline,
                    },
                  ]}
                />
              </View>

              {error ? <Text style={[styles.error, { color: c.tint }]}>{error}</Text> : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={pasteFromClipboard}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.btn,
                    { backgroundColor: c.card, opacity: pressed || busy ? 0.7 : 1 },
                  ]}>
                  <Text style={[styles.btnText, { color: c.text }]}>붙여넣기</Text>
                </Pressable>
                <Pressable
                  onPress={verify}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.btn,
                    { backgroundColor: c.tint, opacity: pressed || busy ? 0.75 : 1 },
                  ]}>
                  <Text style={[styles.btnText, { color: '#F3EEE6' }]}>확인</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: pagePad,
  },
  center: {
    width: '100%',
    maxHeight: '88%',
  },
  sheet: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700' },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  lead: { fontSize: 14, lineHeight: 21 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    fontFamily: 'SpaceMono',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  error: { fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: { fontSize: 15, fontWeight: '700' },
});
