import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { BirthDateTimeEditor } from '@/components/id-card/BirthDateTimeEditor';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import {
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  getFieldEditorTitle,
  MBTI_OPTIONS,
  type IDCardFieldKey,
} from '@/lib/idCardFields';
import type { BloodType, Gender, MbtiType, Profile } from '@/lib/types';

type Props = {
  field: IDCardFieldKey | null;
  onClose: () => void;
  /** 저장 성공 후. 없으면 onClose만 호출. */
  onSaved?: (field: IDCardFieldKey) => void;
  /** 확인 버튼 라벨. 기본 '저장'. */
  confirmLabel?: string;
};

function ChipPicker<T extends string>({
  options,
  value,
  onSelect,
  tint,
  card,
  text,
  label,
  columns,
}: {
  options: readonly T[] | readonly { key: T; label: string }[];
  value?: T;
  onSelect: (v: T) => void;
  tint: string;
  card: string;
  text: string;
  label: string;
  columns?: number;
}) {
  const normalized = options.map((opt) =>
    typeof opt === 'string' ? { key: opt, label: opt } : opt,
  );

  return (
    <View style={styles.chipWrap}>
      <Text style={[styles.chipLabel, { color: text }]}>{label}</Text>
      <View style={[styles.chipRow, columns ? styles.chipGrid : null]}>
        {normalized.map((opt) => {
          const selected = value === opt.key;
          return (
            <View
              key={opt.key}
              style={columns ? [styles.chipGridItem, { width: `${100 / columns}%` }] : undefined}>
              <Pressable
                onPress={() => onSelect(opt.key)}
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

export function FieldEditorModal({ field, onClose, onSaved, confirmLabel = '저장' }: Props) {
  const c = Colors[useColorScheme() ?? 'light'];
  const { profile, updateProfile } = useProfile();

  const [name, setName] = useState(profile.name ?? '');
  const [gender, setGender] = useState<Gender | undefined>(profile.gender);
  const [bloodType, setBloodType] = useState<BloodType | undefined>(profile.bloodType);
  const [mbti, setMbti] = useState<MbtiType | undefined>(profile.mbti);
  const [birthPatch, setBirthPatch] = useState<Partial<Profile> | null>(null);
  const [birthCanSave, setBirthCanSave] = useState(false);

  useEffect(() => {
    if (!field) return;
    setName(profile.name ?? '');
    setGender(profile.gender);
    setBloodType(profile.bloodType);
    setMbti(profile.mbti);
    setBirthPatch(null);
    setBirthCanSave(false);
  }, [field, profile]);

  const saveDisabled =
    (field === 'birthDate' && !birthCanSave) ||
    (field === 'gender' && !gender) ||
    (field === 'bloodType' && !bloodType) ||
    (field === 'mbti' && !mbti);

  const finish = (saved: IDCardFieldKey) => {
    if (onSaved) onSaved(saved);
    else onClose();
  };

  const saveField = async () => {
    if (!field || saveDisabled) return;

    if (field === 'name') {
      await updateProfile({ name: name.trim() || undefined });
      finish(field);
      return;
    }

    if (field === 'birthDate') {
      if (!birthPatch || !birthCanSave) return;
      const next: Partial<Profile> = { ...birthPatch };
      if (!birthPatch.birthTime) {
        next.birthTime = undefined;
      }
      await updateProfile(next);
      finish(field);
      return;
    }

    if (field === 'gender' && gender) {
      await updateProfile({ gender });
      finish(field);
      return;
    }

    if (field === 'bloodType' && bloodType) {
      await updateProfile({ bloodType });
      finish(field);
      return;
    }

    if (field === 'mbti' && mbti) {
      await updateProfile({ mbti });
      finish(field);
    }
  };

  if (!field) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.center}>
          <Pressable
            style={[styles.sheet, { backgroundColor: c.background }]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.title, { color: c.text }]}>{getFieldEditorTitle(field)}</Text>

            <View style={styles.body}>
              {field === 'name' ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="홍길동"
                  placeholderTextColor={c.muted}
                  maxFontSizeMultiplier={1.2}
                  style={[styles.input, { backgroundColor: c.card, color: c.text }]}
                  autoFocus
                />
              ) : null}

              {field === 'birthDate' ? (
                <BirthDateTimeEditor
                  key={`birth-${profile.birthDate ?? 'new'}-${profile.birthCalendar ?? 'solar'}-${profile.birthTime ?? ''}`}
                  profile={profile}
                  tint={c.tint}
                  card={c.card}
                  text={c.text}
                  muted={c.muted}
                  surface={c.surface}
                  onChangeReady={(patch, canSave) => {
                    setBirthPatch(patch);
                    setBirthCanSave(canSave);
                  }}
                />
              ) : null}

              {field === 'gender' ? (
                <ChipPicker<Gender>
                  label="성별"
                  options={GENDER_OPTIONS}
                  value={gender}
                  onSelect={setGender}
                  tint={c.tint}
                  card={c.card}
                  text={c.text}
                />
              ) : null}

              {field === 'bloodType' ? (
                <ChipPicker<BloodType>
                  label="혈액형"
                  options={BLOOD_TYPE_OPTIONS}
                  value={bloodType}
                  onSelect={setBloodType}
                  tint={c.tint}
                  card={c.card}
                  text={c.text}
                  columns={4}
                />
              ) : null}

              {field === 'mbti' ? (
                <ChipPicker<MbtiType>
                  label="MBTI"
                  options={MBTI_OPTIONS}
                  value={mbti}
                  onSelect={setMbti}
                  tint={c.tint}
                  card={c.card}
                  text={c.text}
                  columns={4}
                />
              ) : null}
            </View>

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={[styles.btn, { backgroundColor: c.card }]}>
                <Text style={{ color: c.text, fontWeight: '600' }}>취소</Text>
              </Pressable>
              <Pressable
                onPress={saveField}
                disabled={saveDisabled}
                style={[styles.btn, { backgroundColor: c.tint, opacity: saveDisabled ? 0.45 : 1 }]}>
                <Text style={{ color: '#F3EEE6', fontWeight: '700' }}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 23, 20, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  center: { width: '100%' },
  sheet: {
    borderRadius: 18,
    padding: 22,
    gap: 18,
    width: '100%',
  },
  body: {
    gap: 16,
  },
  title: {
    fontFamily: display,
    fontSize: 20,
    lineHeight: 28,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    includeFontPadding: false,
  },
  chipWrap: { gap: 10 },
  chipLabel: { fontSize: 14, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipGrid: {
    gap: 0,
    marginHorizontal: -4,
  },
  chipGridItem: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipFill: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
