import {
  computeCompatibility,
  meetingCopy,
  pairCopy,
  pairLead,
  tenGodKeywords,
  tenGodPlain,
  type CompatibilityScorePart,
} from '@/lib/manseryeok';
import { relateElements, type Element, type ZodiacAnimal } from '@/lib/saju';
import type { ContactProfile, Profile } from '@/lib/types';

export type CompatibilityGrade = '좋음' | '무난' | '주의';

export type TodayCompatibility = {
  ready: boolean;
  reason?: string;
  score: number;
  baseScore: number;
  todayScore: number;
  baseCorrectionFactor: number;
  baseCorrectionBonus: number;
  scoreOrigin: number;
  scoreScaleMax: number;
  maxPositiveSum: number;
  scoreParts: CompatibilityScorePart[];
  rawTotal: number;
  dailyDelta: number;
  grade: CompatibilityGrade;
  moodHeadline: string;
  summary: string;
  relationship: string;
  guidance: string;
  caution: string;
  keywords: string[];
  selfAnimal: ZodiacAnimal | null;
  otherAnimal: ZodiacAnimal | null;
  selfElement: Element | null;
  otherElement: Element | null;
  animalLabel: string;
  elementLabel: string;
  /** 관계 십신(상대→나) — 점수 합산 제외, 표시용 */
  otherToSelfTenGod: string;
  selfMonthTenGod: string;
  otherMonthTenGod: string;
  monthPillarKorean: string;
  selfYearTenGod: string;
  otherYearTenGod: string;
  yearPillarKorean: string;
  compactDate: string;
};

function hasFinalConsonant(word: string): boolean {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function withGwa(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '과' : '와'}`;
}

function withEun(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '은' : '는'}`;
}

function formatCompactDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const w = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  return `${y}.${m}.${d} (${w})`;
}

/** 컷 50/80 · 전체 표본 목표 대략 주의 15 · 무난 65 · 좋음 20 */
function gradeFromScore(score: number): CompatibilityGrade {
  if (score >= 80) return '좋음';
  if (score >= 50) return '무난';
  return '주의';
}

function moodFromGrade(grade: CompatibilityGrade): string {
  if (grade === '좋음') return '흐름이 열리는 하루입니다';
  if (grade === '무난') return '조율하면 편안한 하루입니다';
  return '거리와 호흡을 살필 하루입니다';
}

/** 나·상대 십신을 한 줄로 — 같은 십신이면 짧게 */
function dualTenGodLine(scope: '오늘' | '이달' | '올해', selfGod: string, otherGod: string): string {
  const topic = withEun(scope);
  if (selfGod === otherGod) {
    return `${topic} 둘이 ${tenGodPlain(selfGod)} 쪽에 가깝습니다(${selfGod}).`;
  }
  return `${topic} 나는 ${tenGodPlain(selfGod)}, 상대는 ${tenGodPlain(otherGod)} 쪽입니다(${selfGod}·${otherGod}).`;
}

function notReady(reason: string, date: Date): TodayCompatibility {
  return {
    ready: false,
    reason,
    score: 0,
    baseScore: 0,
    todayScore: 0,
    baseCorrectionFactor: 0,
    baseCorrectionBonus: 0,
    scoreOrigin: 39,
    scoreScaleMax: 94,
    maxPositiveSum: 81,
    scoreParts: [],
    rawTotal: 0,
    dailyDelta: 0,
    grade: '무난',
    moodHeadline: '아직 열리지 않은 궁합',
    summary: reason,
    relationship: '',
    guidance: '이름과 생년월일을 채우면 오늘의 궁합 점수를 볼 수 있습니다.',
    caution: '',
    keywords: [],
    selfAnimal: null,
    otherAnimal: null,
    selfElement: null,
    otherElement: null,
    animalLabel: '',
    elementLabel: '',
    otherToSelfTenGod: '',
    selfMonthTenGod: '',
    otherMonthTenGod: '',
    monthPillarKorean: '',
    selfYearTenGod: '',
    otherYearTenGod: '',
    yearPillarKorean: '',
    compactDate: formatCompactDate(date),
  };
}

export function buildTodayCompatibility(
  self: Profile,
  other: Pick<ContactProfile, 'name' | 'birthDate' | 'birthTime' | 'mbti' | 'bloodType'>,
  date = new Date(),
): TodayCompatibility {
  if (!self.name?.trim() || !self.birthDate?.trim()) {
    return notReady('내 이름과 생년월일을 먼저 입력해 주세요.', date);
  }
  if (!other.birthDate?.trim()) {
    return notReady('지인의 생년월일이 필요합니다.', date);
  }

  const engine = computeCompatibility(
    { birthDate: self.birthDate, birthTime: self.birthTime },
    { birthDate: other.birthDate, birthTime: other.birthTime },
    date,
  );
  if (!engine) {
    return notReady('생년월일을 확인해 주세요.', date);
  }

  const relation = relateElements(
    engine.self.dayMasterElement as Element,
    engine.other.dayMasterElement as Element,
    '오늘',
  );
  const pair = pairCopy(engine.otherToSelfTenGod);
  const meeting = meetingCopy(engine.selfTodayTenGod, engine.otherTodayTenGod);
  const otherName = other.name.trim() || '상대';
  const selfName = self.name.trim();
  const grade = gradeFromScore(engine.score);

  const keywords = [
    engine.animalKind === '육합' ||
    engine.animalKind === '삼합' ||
    engine.animalKind === '방합' ||
    engine.animalKind === '육충'
      ? engine.animalKind
      : engine.animalKind === '같음'
        ? '같은 결'
        : null,
    meeting.keyword,
    engine.otherToSelfTenGod,
    ...tenGodKeywords(engine.otherToSelfTenGod),
    relation.title,
  ].filter((kw, i, all): kw is string => Boolean(kw) && all.indexOf(kw) === i);

  // 요약: 고정 관계(일지·오행·관계 십신)만 — 점수대 고정 톤 없음
  const summary = [
    `${withGwa(selfName)} ${withEun(otherName)} ${engine.animalLabel} 관계이고, 오행으로는 ${engine.elementLabel}입니다.`,
    pairLead(engine.otherToSelfTenGod),
    pair.focus,
  ].join(' ');

  // 관계 흐름: 오늘·이달·올해 십신 + 오행 한 줄 (요인 조합)
  const relationship = [
    dualTenGodLine('오늘', engine.selfTodayTenGod, engine.otherTodayTenGod),
    dualTenGodLine('이달', engine.selfMonthTenGod, engine.otherMonthTenGod),
    dualTenGodLine('올해', engine.selfYearTenGod, engine.otherYearTenGod),
    relation.blurb,
  ].join(' ');

  // 행동·주의: 오늘 만남 톤만 (점수대·MBTI 고정 덧붙임 제거)
  const guidance = meeting.action;
  const caution = meeting.caution;

  return {
    ready: true,
    score: engine.score,
    baseScore: engine.baseScore,
    todayScore: engine.todayScore,
    baseCorrectionFactor: engine.baseCorrectionFactor,
    baseCorrectionBonus: engine.baseCorrectionBonus,
    scoreOrigin: engine.scoreOrigin,
    scoreScaleMax: engine.scoreScaleMax,
    maxPositiveSum: engine.maxPositiveSum,
    scoreParts: engine.scoreParts,
    rawTotal: engine.rawTotal,
    dailyDelta: engine.dailyDelta,
    grade,
    moodHeadline: `${meeting.keyword} · ${moodFromGrade(grade)}`,
    summary,
    relationship,
    guidance,
    caution,
    keywords: keywords.slice(0, 5),
    selfAnimal: engine.self.animal as ZodiacAnimal,
    otherAnimal: engine.other.animal as ZodiacAnimal,
    selfElement: engine.self.dayMasterElement as Element,
    otherElement: engine.other.dayMasterElement as Element,
    animalLabel: engine.animalLabel,
    elementLabel: engine.elementLabel,
    otherToSelfTenGod: engine.otherToSelfTenGod,
    selfMonthTenGod: engine.selfMonthTenGod,
    otherMonthTenGod: engine.otherMonthTenGod,
    monthPillarKorean: engine.monthPillarKorean,
    selfYearTenGod: engine.selfYearTenGod,
    otherYearTenGod: engine.otherYearTenGod,
    yearPillarKorean: engine.yearPillarKorean,
    compactDate: formatCompactDate(date),
  };
}
