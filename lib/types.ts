export type BloodType = 'A' | 'B' | 'O' | 'AB';

export type MbtiType =
  | 'INTJ'
  | 'INTP'
  | 'ENTJ'
  | 'ENTP'
  | 'INFJ'
  | 'INFP'
  | 'ENFJ'
  | 'ENFP'
  | 'ISTJ'
  | 'ISFJ'
  | 'ESTJ'
  | 'ESFJ'
  | 'ISTP'
  | 'ISFP'
  | 'ESTP'
  | 'ESFP';

export type ZodiacSign =
  | '양자리'
  | '황소자리'
  | '쌍둥이자리'
  | '게자리'
  | '사자자리'
  | '처녀자리'
  | '천칭자리'
  | '전갈자리'
  | '사수자리'
  | '염소자리'
  | '물병자리'
  | '물고기자리';

export type Gender = 'male' | 'female';

export type BirthCalendar = 'solar' | 'lunar';

/** 관상 카테고리별 선택 옵션 id (예: face_oval) */
export type PhysiognomySelection = Partial<Record<string, string>>;

export type ContactRelationship = '연인' | '친구' | '가족' | '동료' | '기타';

/** 궁합용 지인 프로필 — 이름·관계·생년월일 필수 */
export type ContactProfile = {
  id: string;
  name: string;
  relationship: ContactRelationship;
  /** 양력 YYYY-MM-DD — 궁합 계산 정본 */
  birthDate: string;
  birthCalendar?: BirthCalendar;
  birthLunarDate?: string;
  birthLeapMonth?: boolean;
  birthTime?: string;
  gender?: Gender;
  mbti?: MbtiType;
  bloodType?: BloodType;
  /** 궁합 목록 상단 고정 */
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  name?: string;
  gender?: Gender;
  bloodType?: BloodType;
  mbti?: MbtiType;
  zodiac?: ZodiacSign;
  /** 입력·표시에 쓰는 달력. 없으면 양력으로 본다. */
  birthCalendar?: BirthCalendar;
  /** 양력 YYYY-MM-DD — 사주·운세 계산의 정본 */
  birthDate?: string;
  /** 음력 YYYY-MM-DD (같은 순간의 음력) */
  birthLunarDate?: string;
  /** 음력이 윤달인지 */
  birthLeapMonth?: boolean;
  /** HH:mm — 시주용, 선택 */
  birthTime?: string;
  /** 얼굴 특징 입력 — 카테고리 id → 옵션 id */
  physiognomy?: PhysiognomySelection;
};

export type PillarTone = '관계' | '일' | '재물' | '성장';

export type FortuneInsights = {
  tarotTitle: string;
  tones: PillarTone[];
  traitChips: string[];
  luckTags: string[];
};

export type FortuneSource = '사주' | '성향' | '타로' | '관상';

/** 지도 본문 한 줄과 그 출처 탭 — 칩과 같은 딥링크 */
export type FortuneSourceLine = {
  source: FortuneSource;
  line: string;
  route: string;
  /** 관상 미선택 안내처럼, 오늘 풀이 대신 빈 상태 문구 */
  placeholder?: boolean;
};

export type IntegratedFortune = {
  headline: string;
  moodHeadline: string;
  /** `sources`의 줄을 사주 → 성향 → 타로 · 관상 순으로 이은 본문 */
  summary: string;
  /** 만세력 없을 때만 — 출처 라벨 없이 본문 앞에 두는 종합 리드 */
  introLine?: string;
  /** 본문을 만든 출처별 한 줄. 프로필이 비어 있으면 일부만 있다 */
  sources?: FortuneSourceLine[];
  /** 점수 근거 한 줄 (만세력 있을 때만) */
  scoreNote?: string;
  guidance: string;
  caution?: string;
  closing: string;
  score: number;
  dateLabel: string;
  compactDate: string;
  insights?: FortuneInsights;
};
