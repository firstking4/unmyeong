import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
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

import { ContactForm } from '@/components/gunghap/ContactForm';
import { Text } from '@/components/Themed';
import { CloseIcon } from '@/components/ui/CloseIcon';
import Colors from '@/constants/Colors';
import { pagePad, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useContacts } from '@/context/ContactsContext';
import { decodeSajuCode, type SajuCodePayload } from '@/lib/sajuCode';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SajuCodeImportModal({ visible, onClose }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { addContact, findDuplicate } = useContacts();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SajuCodePayload | null>(null);

  useEffect(() => {
    if (!visible) {
      setRaw('');
      setError(null);
      setPayload(null);
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

  const verify = () => {
    const result = decodeSajuCode(raw);
    if (!result.ok) {
      setPayload(null);
      setError(result.error);
      return;
    }
    setError(null);
    setPayload(result.payload);
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
              <Text style={[styles.title, { color: c.text }]}>사주코드 추가</Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="닫기"
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
                <CloseIcon color={c.text} size={22} />
              </Pressable>
            </View>

            {payload ? (
              <View style={styles.formWrap}>
                <ContactForm
                  key={`${payload.name}-${payload.birthDate}-${payload.gender ?? ''}`}
                  initial={{
                    name: payload.name,
                    birthDate: payload.birthDate,
                    birthCalendar: payload.birthCalendar,
                    birthLunarDate: payload.birthLunarDate,
                    birthLeapMonth: payload.birthLeapMonth,
                    birthTime: payload.birthTime,
                    gender: payload.gender,
                    mbti: payload.mbti,
                    bloodType: payload.bloodType,
                    relationship: '친구',
                  }}
                  requireBirthTouch={false}
                  submitLabel="친구에 추가"
                  onCancel={() => setPayload(null)}
                  onSubmit={async (input) => {
                    const dup = findDuplicate(input.name, input.birthDate);
                    if (dup) {
                      const proceed = await new Promise<boolean>((resolve) => {
                        Alert.alert(
                          '이미 등록된 지인',
                          `${dup.name} (${dup.birthDate})이(가) 이미 목록에 있습니다. 그래도 추가할까요?`,
                          [
                            { text: '취소', style: 'cancel', onPress: () => resolve(false) },
                            { text: '추가', onPress: () => resolve(true) },
                          ],
                        );
                      });
                      if (!proceed) return;
                    }
                    const created = await addContact(input);
                    onClose();
                    router.push(`/contact/${created.id}`);
                  }}
                />
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}>
                <Text style={[styles.lead, { color: c.muted }]}>
                  받은 사주 코드를 붙여넣으면 지인 정보가 채워집니다.
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
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: c.card, opacity: pressed ? 0.7 : 1 },
                    ]}>
                    <Text style={[styles.btnText, { color: c.text }]}>붙여넣기</Text>
                  </Pressable>
                  <Pressable
                    onPress={verify}
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: c.tint, opacity: pressed ? 0.75 : 1 },
                    ]}>
                    <Text style={[styles.btnText, { color: '#F3EEE6' }]}>확인</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
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
  formWrap: {
    height: 520,
    maxHeight: '78%',
  },
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
