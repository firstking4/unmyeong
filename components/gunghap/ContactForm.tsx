import { useRef, useState } from 'react';
import {
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
import {
  CONTACT_RELATIONSHIP_OPTIONS,
  type ContactInput,
} from '@/context/ContactsContext';
import { BLOOD_TYPE_OPTIONS, GENDER_OPTIONS, MBTI_OPTIONS } from '@/lib/idCardFields';
import type {
  BloodType,
  ContactProfile,
  ContactRelationship,
  Gender,
  MbtiType,
  Profile,
} from '@/lib/types';

type Props = {
  initial?: {
    name?: string;
    relationship?: ContactRelationship;
    birthDate?: string;
    birthCalendar?: ContactProfile['birthCalendar'];
    birthLunarDate?: string;
    birthLeapMonth?: boolean;
    birthTime?: string;
    gender?: Gender;
    mbti?: MbtiType;
    bloodType?: BloodType;
  };
  /** 신규일 때는 생년월일을 한 번이라도 바꿔야 저장 가능 */
  requireBirthTouch?: boolean;
  /** 전체 화면일 때 flex:1. 모달 등 가변 높이 부모에서는 false */
  fill?: boolean;
  submitLabel: string;
  onSubmit: (input: ContactInput) => Promise<void>;
  onCancel: () => void;
};

function birthFromContact(
  contact?: Props['initial'],
): Partial<Profile> | null {
  if (!contact?.birthDate) return null;
  return {
    birthDate: contact.birthDate,
    birthCalendar: contact.birthCalendar,
    birthLunarDate: contact.birthLunarDate,
    birthLeapMonth: contact.birthLeapMonth,
    birthTime: contact.birthTime,
  };
}

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

export function ContactForm({
  initial,
  requireBirthTouch = !initial?.birthDate,
  fill = true,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const c = Colors[useColorScheme() ?? 'light'];
  const [name, setName] = useState(initial?.name ?? '');
  const [relationship, setRelationship] = useState<ContactRelationship | undefined>(
    initial?.relationship,
  );
  const [gender, setGender] = useState<Gender | undefined>(initial?.gender);
  const [mbti, setMbti] = useState<MbtiType | undefined>(initial?.mbti);
  const [bloodType, setBloodType] = useState<BloodType | undefined>(initial?.bloodType);
  const [birthPatch, setBirthPatch] = useState<Partial<Profile> | null>(() =>
    birthFromContact(initial),
  );
  const [birthTouched, setBirthTouched] = useState(!requireBirthTouch);
  const [birthKey, setBirthKey] = useState(0);
  const skipFirstBirth = useRef(true);
  const [saving, setSaving] = useState(false);

  const birthProfile: Profile = {
    birthDate: birthPatch?.birthDate ?? initial?.birthDate,
    birthCalendar: birthPatch?.birthCalendar ?? initial?.birthCalendar,
    birthLunarDate: birthPatch?.birthLunarDate ?? initial?.birthLunarDate,
    birthLeapMonth: birthPatch?.birthLeapMonth ?? initial?.birthLeapMonth,
    birthTime: birthPatch?.birthTime ?? initial?.birthTime,
  };

  const canSave =
    Boolean(name.trim()) &&
    Boolean(relationship) &&
    Boolean(birthPatch?.birthDate) &&
    birthTouched &&
    !saving;

  const resetForm = () => {
    if (initial && (initial.name || initial.birthDate)) {
      setName(initial.name ?? '');
      setRelationship(initial.relationship);
      setGender(initial.gender);
      setMbti(initial.mbti);
      setBloodType(initial.bloodType);
      setBirthPatch(birthFromContact(initial));
      setBirthTouched(!requireBirthTouch || Boolean(initial.birthDate));
    } else {
      setName('');
      setRelationship(undefined);
      setGender(undefined);
      setMbti(undefined);
      setBloodType(undefined);
      setBirthPatch(null);
      setBirthTouched(!requireBirthTouch);
    }
    skipFirstBirth.current = true;
    setBirthKey((k) => k + 1);
  };

  const save = async () => {
    if (!canSave || !relationship || !birthPatch?.birthDate) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        relationship,
        birthDate: birthPatch.birthDate,
        birthCalendar: birthPatch.birthCalendar,
        birthLunarDate: birthPatch.birthLunarDate,
        birthLeapMonth: birthPatch.birthLeapMonth,
        birthTime: birthPatch.birthTime,
        gender,
        mbti,
        bloodType,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: fill ? 1 : undefined, backgroundColor: c.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={fill ? { flex: 1 } : undefined}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled>
        <View style={styles.toolbar}>
          <Pressable
            onPress={resetForm}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="입력 초기화"
            style={({ pressed }) => [styles.resetBtn, { opacity: pressed ? 0.5 : 1 }]}>
            <ResetIcon color={c.muted} size={22} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: c.text }]}>이름</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="지인 이름"
            placeholderTextColor={c.muted}
            maxFontSizeMultiplier={1.2}
            style={[
              styles.input,
              { color: c.text, backgroundColor: c.card, borderColor: c.hairline },
            ]}
          />
        </View>

        <ChipPicker
          label="관계"
          options={CONTACT_RELATIONSHIP_OPTIONS}
          value={relationship}
          onSelect={(v) => {
            if (v) setRelationship(v);
          }}
          tint={c.tint}
          card={c.card}
          text={c.text}
        />

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: c.text }]}>생년월일</Text>
          {requireBirthTouch && !birthTouched ? (
            <Text style={[styles.hint, { color: c.muted }]}>
              연·월·일을 한 번 선택해 생년월일을 확정해 주세요.
            </Text>
          ) : null}
          <BirthDateTimeEditor
            key={birthKey}
            profile={birthProfile}
            tint={c.tint}
            card={c.card}
            text={c.text}
            muted={c.muted}
            surface={c.surface}
            onChangeReady={(patch) => {
              if (skipFirstBirth.current) {
                skipFirstBirth.current = false;
                setBirthPatch(patch);
                return;
              }
              setBirthTouched(true);
              setBirthPatch(patch);
            }}
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
            onPress={onCancel}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: c.card, opacity: pressed ? 0.6 : 1 },
            ]}>
            <Text style={[styles.btnText, { color: c.text }]}>취소</Text>
          </Pressable>
          <Pressable
            onPress={save}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: canSave ? c.tint : c.card,
                opacity: pressed && canSave ? 0.7 : 1,
              },
            ]}>
            <Text style={[styles.btnText, { color: canSave ? '#F3EEE6' : c.muted }]}>
              {saving ? '저장 중…' : submitLabel}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  toolbar: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: -8,
  },
  resetBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 12, lineHeight: 18 },
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
