import {
  computeCompatibility,
  meetingTone,
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

const HARD_GODS = new Set(['겁재', '상관', '편관']);

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

function uniqueWords(words: string[]): string[] {
  return words.filter((w, i, all) => Boolean(w) && all.indexOf(w) === i);
}

function joinFocus(words: string[], limit = 3): string {
  return uniqueWords(words).slice(0, limit).join('·');
}

/** 나·상대 십신을 한 줄로 — 같은 십신이면 짧게 */
function dualTenGodLine(scope: '오늘' | '이달' | '올해', selfGod: string, otherGod: string): string {
  const topic = withEun(scope);
  if (selfGod === otherGod) {
    return `${topic} 둘이 ${tenGodPlain(selfGod)}(${selfGod}).`;
  }
  return `${topic} 나 ${tenGodPlain(selfGod)}(${selfGod}) · 상대 ${tenGodPlain(otherGod)}(${otherGod}).`;
}

function toneKeyword(selfGod: string, otherGod: string): string {
  const tone = meetingTone(selfGod, otherGod);
  if (tone === '주의') return '호흡';
  if (tone === '조율') return '조율';
  return '맞춤';
}

function buildGuidance(selfGod: string, otherGod: string): string {
  const tone = meetingTone(selfGod, otherGod);
  const focus = joinFocus([...tenGodKeywords(selfGod), ...tenGodKeywords(otherGod)]);
  if (!focus) {
    return tone === '주의' ? '오늘은 짧은 안부만.' : '오늘은 작은 한 가지만.';
  }
  if (tone === '주의') return `오늘은 ${focus} 쪽을 줄이고 짧게.`;
  if (tone === '조율') return `오늘은 ${focus} 사이에서 한 박자 늦추기.`;
  return `오늘은 ${focus} 쪽으로 작은 한 가지.`;
}

function buildCaution(
  selfGod: string,
  otherGod: string,
  pairGod: string,
  animalKind: string,
): string {
  const hard = HARD_GODS.has(selfGod)
    ? selfGod
    : HARD_GODS.has(otherGod)
      ? otherGod
      : HARD_GODS.has(pairGod)
        ? pairGod
        : null;
  if (hard) {
    const tip = tenGodKeywords(hard)[2] ?? tenGodKeywords(hard)[0] ?? hard;
    return `${hard}의 ${tip}이(가) 과해지지 않게.`;
  }
  if (animalKind === '육충') {
    return `${tenGodPlain(pairGod)} 관계에서 말이 세지지 않게.`;
  }
  const tip = tenGodKeywords(pairGod)[0] ?? pairGod;
  return `관계 십신 ${pairGod}의 ${tip} 과잉만 살피기.`;
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
  const otherName = other.name.trim() || '상대';
  const selfName = self.name.trim();
  const grade = gradeFromScore(engine.score);
  const pairGod = engine.otherToSelfTenGod;
  const toneKw = toneKeyword(engine.selfTodayTenGod, engine.otherTodayTenGod);
  const pairFocus = joinFocus(tenGodKeywords(pairGod), 2);

  const keywords = uniqueWords([
    engine.animalKind === '육합' ||
    engine.animalKind === '삼합' ||
    engine.animalKind === '방합' ||
    engine.animalKind === '육충'
      ? engine.animalKind
      : engine.animalKind === '같음'
        ? '같은 결'
        : '',
    toneKw,
    pairGod,
    ...tenGodKeywords(pairGod),
    relation.title,
  ]).slice(0, 5);

  // 요약: 이름·일지·오행·관계 십신·키워드만
  const summary = [
    `${withGwa(selfName)} ${withEun(otherName)} ${engine.animalLabel} · ${engine.elementLabel}.`,
    `상대→나 ${tenGodPlain(pairGod)}(${pairGod}).`,
    pairFocus ? `초점 ${pairFocus}.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  // 관계 흐름: 오늘·이달·올해 + 오행 관계명
  const relationship = [
    dualTenGodLine('오늘', engine.selfTodayTenGod, engine.otherTodayTenGod),
    dualTenGodLine('이달', engine.selfMonthTenGod, engine.otherMonthTenGod),
    dualTenGodLine('올해', engine.selfYearTenGod, engine.otherYearTenGod),
    `기운 ${relation.title}.`,
  ].join(' ');

  const guidance = buildGuidance(engine.selfTodayTenGod, engine.otherTodayTenGod);
  const caution = buildCaution(
    engine.selfTodayTenGod,
    engine.otherTodayTenGod,
    pairGod,
    engine.animalKind,
  );

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
    moodHeadline: `${toneKw} · ${grade}`,
    summary,
    relationship,
    guidance,
    caution,
    keywords,
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
