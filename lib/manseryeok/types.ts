export type ManseryeokPillar = {
  stem: string;
  branch: string;
  korean: string;
  hanja: string;
};

export type DetailHint = {
  label: string;
  text: string;
};

export type DetailReading = {
  summary: string;
  hints: DetailHint[];
};

export type TenGodPair = {
  stem: string;
  branch: string;
};

export type FourPillarsTenGods = {
  year: TenGodPair;
  month: TenGodPair;
  day: TenGodPair;
  hour: TenGodPair;
};

export type FourPillarsResult = {
  year: ManseryeokPillar;
  month: ManseryeokPillar;
  day: ManseryeokPillar;
  /** 출생 시각이 없으면 null */
  hour: ManseryeokPillar | null;
  /** 일간 오행 */
  dayMasterElement: string;
  tenGods: FourPillarsTenGods | null;
};

export type FourPillarsInput = {
  birthDate: string;
  birthTime?: string | null;
};

export type SolarTermInfo = {
  name: string;
  hanja: string;
  labelKst: string;
};

export type SolarTermWindow = {
  current: SolarTermInfo;
  next: SolarTermInfo;
};

export type LuckPillarItem = ManseryeokPillar & {
  age: number;
};

export type LuckPillarsResult = {
  forward: boolean;
  startAge: number;
  pillars: LuckPillarItem[];
};

export type AnimalRelationKind = '같음' | '육합' | '삼합' | '방합' | '육충' | '흐름';

export type ElementRelationKind = '같음' | '생함' | '생받음' | '극함' | '극받음';

export type CompatibilityNatal = {
  dayKorean: string;
  dayStem: string;
  dayBranch: string;
  dayMasterElement: string;
  animal: string;
};

export type CompatibilityScorePart = {
  key: string;
  label: string;
  delta: number;
};

export type CompatibilityEngineResult = {
  self: CompatibilityNatal;
  other: CompatibilityNatal;
  animalKind: AnimalRelationKind;
  animalLabel: string;
  animalScore: number;
  elementKind: ElementRelationKind;
  elementLabel: string;
  elementScore: number;
  otherToSelfTenGod: string;
  selfToOtherTenGod: string;
  tenGodScore: number;
  /** 참고용 관계 점수(합산 모델과 별개) */
  baseScore: number;
  /** 기본 궁합 → 0.20…0.40 보정 계수 */
  baseCorrectionFactor: number;
  /** (100 − 오늘원점수) × 계수 */
  baseCorrectionBonus: number;
  todayPillarKorean: string;
  selfTodayTenGod: string;
  otherTodayTenGod: string;
  /** 절기 기준 당월 월주 */
  monthPillarKorean: string;
  selfMonthTenGod: string;
  otherMonthTenGod: string;
  /** 세운(년주) */
  yearPillarKorean: string;
  selfYearTenGod: string;
  otherYearTenGod: string;
  /** +/− 합산 항목 */
  scoreParts: CompatibilityScorePart[];
  /** 시작점(기본 20) */
  scoreOrigin: number;
  /** 환산 분모 (기본 + 항목만점) */
  scoreScaleMax: number;
  /** 항목 +/− 만점 합 */
  maxPositiveSum: number;
  /** 항목 +/− 원합산 */
  rawTotal: number;
  /** 환산 직후 오늘 점수(기본 보정 전) */
  todayScore: number;
  dailyAmplitudeUp: number;
  dailyAmplitudeDown: number;
  /** 원합산과 동일 */
  dailyDelta: number;
  score: number;
};
