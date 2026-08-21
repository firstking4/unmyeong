import {
  computeCompatibility,
  meetingTone,
  tenGodPlain,
  type CompatibilityScorePart,
} from '@/lib/manseryeok';
import { relateElements, type Element, type ZodiacAnimal } from '@/lib/saju';
import type { ContactProfile, Profile } from '@/lib/types';

export type CompatibilityGrade = '주의' | '조심' | '무난' | '좋음' | '최고';

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
  /** 카드 키워드 위 — 상세 요약의 한 줄 버전 */
  summaryLine: string;
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

/** 궁합 화면용 쉬운 초점 말 (전문 키워드 대신) */
const EASY_FOCUS: Record<string, string[]> = {
  비견: ['같은 속도', '같이하기'],
  겁재: ['서두름', '다툼'],
  식신: ['표현', '나누기'],
  상관: ['직설', '날카로움'],
  편재: ['움직임', '기회'],
  정재: ['챙기기', '약속'],
  편관: ['압박', '부담'],
  정관: ['규칙', '약속'],
  편인: ['혼자 시간', '생각'],
  정인: ['배움', '돌봄'],
};

/** 조심할 점 — 십신 이름 없이 */
const EASY_CAUTION: Record<string, string> = {
  비견: '같은 자리에서 겨루지 않기.',
  겁재: '서두르거나 다투지 않기.',
  식신: '완성만 따지다 만남을 미루지 않기.',
  상관: '말이 너무 세지지 않게.',
  편재: '약속을 너무 많이 잡지 않기.',
  정재: '완벽하려다 만남을 미루지 않기.',
  편관: '상대를 몰아붙이지 않기.',
  정관: '형식만 챙기다 마음을 놓치지 않기.',
  편인: '답을 재촉해 밀어내지 않기.',
  정인: '결정을 전부 맡기지 않기.',
};

const EASY_ANIMAL: Record<string, string> = {
  같음: '같은 결',
  육합: '잘 맞는 결',
  삼합: '한팀 같은 결',
  방합: '가까운 결',
  육충: '부딪치기 쉬운 결',
  흐름: '평범한 결',
};

const EASY_ELEMENT: Record<string, string> = {
  같음: '같은 기운',
  생함: '서로 돕는 기운',
  생받음: '서로 돕는 기운',
  극함: '힘겨루기 쉬운 기운',
  극받음: '힘겨루기 쉬운 기운',
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

/**
 * 5등급: 주의 · 조심 · 무난 · 좋음 · 최고
 * 컷: &lt;50 · 50~59 · 60~74 · 75~89 · ≥90
 */
function gradeFromScore(score: number): CompatibilityGrade {
  if (score >= 90) return '최고';
  if (score >= 75) return '좋음';
  if (score >= 60) return '무난';
  if (score >= 50) return '조심';
  return '주의';
}

function uniqueWords(words: string[]): string[] {
  return words.filter((w, i, all) => Boolean(w) && all.indexOf(w) === i);
}

function easyFocus(god: string, limit = 2): string {
  return (EASY_FOCUS[god] ?? []).slice(0, limit).join('·');
}

function easyPlain(god: string): string {
  // tenGodPlain이 길면 첫 덩어리만
  const plain = tenGodPlain(god);
  const cut = plain.split('과')[0]?.split('와')[0]?.trim();
  return cut || plain;
}

function dualEasyLine(scope: '오늘' | '이달' | '올해', selfGod: string, otherGod: string): string {
  const topic = withEun(scope);
  if (selfGod === otherGod) {
    return `${topic} 둘이 ${easyPlain(selfGod)} 쪽.`;
  }
  return `${topic} 나는 ${easyPlain(selfGod)}, 상대는 ${easyPlain(otherGod)} 쪽.`;
}

function toneKeyword(selfGod: string, otherGod: string): string {
  const tone = meetingTone(selfGod, otherGod);
  if (tone === '주의') return '천천히';
  if (tone === '조율') return '맞추기';
  return '잘 맞음';
}

function buildGuidance(selfGod: string, otherGod: string): string {
  const tone = meetingTone(selfGod, otherGod);
  const focus = uniqueWords([
    ...(EASY_FOCUS[selfGod] ?? []),
    ...(EASY_FOCUS[otherGod] ?? []),
  ])
    .slice(0, 3)
    .join('·');
  if (!focus) {
    return tone === '주의' ? '오늘은 짧은 안부만 나누기.' : '오늘은 작은 일 하나만.';
  }
  if (tone === '주의') return `오늘은 ${focus}를 줄이고, 짧게 만나기.`;
  if (tone === '조율') return `오늘은 ${focus} 속도를 서로 맞추기.`;
  return `오늘은 ${focus} 쪽으로 작은 일 하나.`;
}

function buildCaution(selfGod: string, otherGod: string, pairGod: string, animalKind: string): string {
  const hard = HARD_GODS.has(selfGod)
    ? selfGod
    : HARD_GODS.has(otherGod)
      ? otherGod
      : HARD_GODS.has(pairGod)
        ? pairGod
        : null;
  if (hard && EASY_CAUTION[hard]) return EASY_CAUTION[hard];
  if (animalKind === '육충') return '말투가 세지지 않게 조심하기.';
  return EASY_CAUTION[pairGod] ?? '너무 밀어붙이지만 않기.';
}

function withIga(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '이' : '가'}`;
}

function fixObjectParticle(text: string): string {
  return text.replace(/을\(를\)/g, '를').replace(/이\(가\)/g, '가');
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
    summaryLine: reason,
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
  const animalEasy = EASY_ANIMAL[engine.animalKind] ?? '평범한 결';
  const elementEasy = EASY_ELEMENT[engine.elementKind] ?? '기운';
  const pairFocus = easyFocus(pairGod, 2);

  const keywords = uniqueWords([
    animalEasy,
    toneKw,
    ...((EASY_FOCUS[pairGod] ?? []).slice(0, 2)),
    elementEasy,
  ]).slice(0, 5);

  const summary = [
    `${withGwa(selfName)} ${withEun(otherName)} ${animalEasy}이고, ${elementEasy}입니다.`,
    `상대는 나에게 ${easyPlain(pairGod)} 쪽.`,
    pairFocus ? `오늘은 ${withIga(pairFocus)} 보이기 쉽습니다.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  // 카드 한 줄: 오늘 만남만 — 칩(결·기운·초점)과 말을 겹치지 않음
  const summaryLine =
    engine.selfTodayTenGod === engine.otherTodayTenGod
      ? `${withGwa(selfName)} ${withEun(otherName)} 오늘은 둘이 ${easyPlain(engine.selfTodayTenGod)}으로 만나기 쉽고, ${grade} 흐름입니다.`
      : `${withGwa(selfName)} ${withEun(otherName)} 오늘은 나는 ${easyPlain(engine.selfTodayTenGod)}, 상대는 ${easyPlain(engine.otherTodayTenGod)}으로 만나며 ${grade} 흐름입니다.`;

  const relationship = [
    dualEasyLine('오늘', engine.selfTodayTenGod, engine.otherTodayTenGod),
    dualEasyLine('이달', engine.selfMonthTenGod, engine.otherMonthTenGod),
    dualEasyLine('올해', engine.selfYearTenGod, engine.otherYearTenGod),
    `둘의 기운은 ${elementEasy}.`,
  ].join(' ');

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
    summary: fixObjectParticle(summary),
    summaryLine: fixObjectParticle(summaryLine),
    relationship,
    guidance: fixObjectParticle(buildGuidance(engine.selfTodayTenGod, engine.otherTodayTenGod)),
    caution: buildCaution(
      engine.selfTodayTenGod,
      engine.otherTodayTenGod,
      pairGod,
      engine.animalKind,
    ),
    keywords,
    selfAnimal: engine.self.animal as ZodiacAnimal,
    otherAnimal: engine.other.animal as ZodiacAnimal,
    selfElement: engine.self.dayMasterElement as Element,
    otherElement: engine.other.dayMasterElement as Element,
    // 카드 요약에도 쉬운 말
    animalLabel: animalEasy,
    elementLabel: elementEasy,
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
