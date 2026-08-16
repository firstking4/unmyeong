import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { BirthDateTimeEditor } from '@/components/id-card/BirthDateTimeEditor';
import { Text } from '@/components/Themed';
import { ResetIcon } from '@/components/ui/ResetIcon';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import { BLOOD_TYPE_OPTIONS, GENDER_OPTIONS, MBTI_OPTIONS } from '@/lib/idCardFields';
import type { BloodType, Gender, MbtiType, Profile } from '@/lib/types';

function ChipPicker<T extends string>({
  label,
  options,
  value,
  onSelect,
  columns,
  tint,
  card,
  text,
  allowClear,
}: {
  label: string;
  options: readonly T[] | readonly { key: T; label: string }[];
  value?: T;
  onSelect: (v: T | undefined) => void;
  columns?: number;
  tint: string;
  card: string;
  text: string;
  allowClear?: boolean;
}) {
  const normalized = options.map((opt) =>
    typeof opt === 'string' ? { key: opt, label: opt } : opt,
  );

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: text }]}>{label}</Text>
      <View style={[styles.chipRow, columns ? styles.chipGrid : null]}>
        {normalized.map((opt) => {
          const selected = value === opt.key;
          return (
            <View
              key={opt.key}
              style={columns ? [styles.chipGridItem, { width: `${100 / columns}%` }] : undefined}>
              <Pressable
                onPress={() => onSelect(allowClear && selected ? undefined : opt.key)}
                style={[
                  styles.chip,
                  columns ? styles.chipFill : null,
                  {
                    backgroundColor: selected ? tint : card,
                    borderColor: selected ? tint : 'transparent',
                  },
                ]}>
                <Text
                  style={{
                    color: selected ? '#F3EEE6' : text,
                    fontWeight: '600',
                    fontSize: 13,
                    textAlign: 'center',
                  }}>
                  {opt.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const c = Colors[useColorScheme() ?? 'light'];
  const { profile, updateProfile, clearProfile } = useProfile();

  const [name, setName] = useState(profile.name ?? '');
  const [birthPatch, setBirthPatch] = useState<Partial<Profile> | null>(null);
  const [gender, setGender] = useState<Gender | undefined>(profile.gender);
  const [bloodType, setBloodType] = useState<BloodType | undefined>(profile.bloodType);
  const [mbti, setMbti] = useState<MbtiType | undefined>(profile.mbti);
  /** BirthDateTimeEditor는 마운트 시 draft를 잡으므로, 초기화 때 키를 올려 다시 심는다. */
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const resetAll = () => {
    Alert.alert(
      '프로필 초기화',
      '이름·생년월일·관상 등 저장된 프로필을 모두 지울까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            await clearProfile();
            setName('');
            setBirthPatch(null);
            setGender(undefined);
            setBloodType(undefined);
            setMbti(undefined);
            setEditorKey((k) => k + 1);
          },
        },
      ],
    );
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        ...(birthPatch ?? {}),
        gender,
        bloodType,
        mbti,
        // 별자리는 생년월일에서 계산 — 수동 값은 더 이상 저장하지 않음
        zodiac: undefined,
      });
      goBack();
    } finally {
      setSaving(false);
    }
  };

  const resetButton = (
    <Pressable
      onPress={resetAll}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="프로필 초기화"
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginRight: Platform.OS === 'ios' ? 4 : 8,
        opacity: pressed ? 0.5 : 1,
        backgroundColor: 'transparent',
      })}>
      <ResetIcon color={c.muted} size={22} />
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          // iOS 26 헤더 리퀴드 글래스(흰 원) 끄기 — contact 레이아웃과 동일
          headerRight: () => resetButton,
          unstable_headerRightItems: () => [
            { type: 'custom' as const, element: resetButton, hidesSharedBackground: true },
          ],
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.lead, { color: c.muted }]}>
            입력한 정보는 홈의 종합 운세에 반영됩니다.
          </Text>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.text }]}>이름</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="홍길동"
              placeholderTextColor={c.muted}
              maxFontSizeMultiplier={1.2}
              style={[
                styles.input,
                { color: c.text, backgroundColor: c.card, borderColor: c.hairline },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: c.text }]}>생년월일</Text>
            <BirthDateTimeEditor
              key={editorKey}
              profile={profile}
              tint={c.tint}
              card={c.card}
              text={c.text}
              muted={c.muted}
              surface={c.surface}
              onChangeReady={(patch) => setBirthPatch(patch)}
            />
          </View>

          <ChipPicker<Gender>
            label="성별 (선택)"
            options={GENDER_OPTIONS}
            value={gender}
            onSelect={setGender}
            columns={2}
            tint={c.tint}
            card={c.card}
            text={c.text}
            allowClear
          />

          <ChipPicker
            label="MBTI (선택)"
            options={MBTI_OPTIONS}
            value={mbti}
            onSelect={setMbti}
            columns={4}
            tint={c.tint}
            card={c.card}
            text={c.text}
            allowClear
          />

          <ChipPicker
            label="혈액형 (선택)"
            options={BLOOD_TYPE_OPTIONS}
            value={bloodType}
            onSelect={setBloodType}
            columns={4}
            tint={c.tint}
            card={c.card}
            text={c.text}
            allowClear
          />

          <View style={styles.actions}>
            <Pressable
              onPress={goBack}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: c.card, opacity: pressed ? 0.6 : 1 },
              ]}>
              <Text style={[styles.btnText, { color: c.text }]}>취소</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: c.tint,
                  opacity: pressed || saving ? 0.7 : 1,
                },
              ]}>
              <Text style={[styles.btnText, { color: '#F3EEE6' }]}>
                {saving ? '저장 중…' : '저장'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  lead: {
    fontSize: 14,
    lineHeight: 21,
  },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    includeFontPadding: false,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipGrid: {
    gap: 0,
    marginHorizontal: -4,
  },
  chipGridItem: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipFill: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
