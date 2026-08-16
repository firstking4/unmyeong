import { getSeedInsightKeywords, getWesternZodiac } from '@/lib/data/catalog';
import { formatBirthDateDisplay } from './lunar';
import { getElement, getZodiacAnimal } from './saju';
import type { BloodType, Gender, MbtiType, Profile } from './types';

export type IDCardFieldKey = 'name' | 'birthDate' | 'gender' | 'bloodType' | 'mbti';

export type IDCardFieldConfig = {
  key: IDCardFieldKey;
  label: string;
  placeholder: string;
};

export const ID_CARD_FIELDS: IDCardFieldConfig[] = [
  { key: 'name', label: '성명', placeholder: '???' },
  { key: 'birthDate', label: '생년월일', placeholder: '???' },
  { key: 'gender', label: '성별', placeholder: '???' },
  { key: 'bloodType', label: '혈액형', placeholder: '???' },
  { key: 'mbti', label: 'MBTI', placeholder: '???' },
];

export const BLOOD_TYPE_OPTIONS: BloodType[] = ['A', 'B', 'O', 'AB'];

export const MBTI_OPTIONS: MbtiType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export const GENDER_OPTIONS: { key: Gender; label: string }[] = [
  { key: 'male', label: '남성' },
  { key: 'female', label: '여성' },
];

export function getFieldDisplayValue(key: IDCardFieldKey, profile: Profile): string | null {
  switch (key) {
    case 'name':
      return profile.name?.trim() || null;
    case 'birthDate': {
      const date = formatBirthDateDisplay(profile);
      if (!date) return null;
      const cal = profile.birthCalendar === 'lunar' ? '음력' : '양력';
      return profile.birthTime ? `${date} · ${profile.birthTime} (${cal})` : `${date} (${cal})`;
    }
    case 'gender':
      if (profile.gender === 'male') return '남성';
      if (profile.gender === 'female') return '여성';
      return null;
    case 'bloodType':
      return profile.bloodType ? `${profile.bloodType}형` : null;
    case 'mbti':
      return profile.mbti ?? null;
    default:
      return null;
  }
}

export function countFilledIdCardFields(profile: Profile): number {
  return ID_CARD_FIELDS.filter((field) => getFieldDisplayValue(field.key, profile)).length;
}

export function getIdCardInsightTags(profile: Profile): string[] {
  const animal = getZodiacAnimal(profile.birthDate);
  const element = getElement(profile.birthDate);
  const west = getWesternZodiac(profile.birthDate);

  return getSeedInsightKeywords({
    bloodType: profile.bloodType,
    mbti: profile.mbti,
    zodiacAnimal: animal,
    element,
    westernZodiac: west?.label,
  });
}

export function getFieldEditorTitle(key: IDCardFieldKey): string {
  switch (key) {
    case 'name':
      return '이름 입력';
    case 'birthDate':
      return '생년월일 · 시각';
    case 'gender':
      return '성별 선택';
    case 'bloodType':
      return '혈액형 선택';
    case 'mbti':
      return 'MBTI 선택';
    default:
      return '정보 입력';
  }
}
