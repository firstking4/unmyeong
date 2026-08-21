import {
  computeCompatibility,
  meetingCopy,
  pairCopy,
  pairLead,
  tenGodKeywords,
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

function gradeFromScore(score: number): CompatibilityGrade {
  if (score >= 75) return '좋음';
  if (score >= 60) return '무난';
  return '주의';
}

function moodFromScore(score: number): string {
  if (score >= 80) return '서로 잘 맞는 하루입니다';
  if (score >= 70) return '흐름이 부드러운 하루입니다';
  if (score >= 60) return '조율하면 편안한 하루입니다';
  return '거리와 호흡을 살필 하루입니다';
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
    scoreOrigin: 20,
    scoreScaleMax: 59,
    maxPositiveSum: 46,
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

  const summary = [
    `${withGwa(selfName)} ${withEun(otherName)} ${engine.animalLabel} 관계이고, 오행으로는 ${engine.elementLabel}입니다.`,
    pairLead(engine.otherToSelfTenGod),
    pair.focus,
  ].join(' ');

  const relationship = `${meeting.lead} ${meeting.focus} ${relation.blurb}`;
  const guidance = `${meeting.action} ${
    engine.score >= 70
      ? '작은 호의를 먼저 건네면 관계가 더 부드러워집니다.'
      : '말의 속도와 거리감을 조금 늦추면 마찰이 줄어듭니다.'
  }`;
  const caution = `${meeting.caution}${
    other.mbti || other.bloodType ? ' 성향 정보는 참고용으로만 두고, 오늘의 반응을 우선하세요.' : ''
  }`;

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
    grade: gradeFromScore(engine.score),
    moodHeadline: `${meeting.keyword} · ${moodFromScore(engine.score)}`,
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
    compactDate: formatCompactDate(date),
  };
}
