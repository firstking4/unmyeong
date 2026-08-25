import {
  applyBaseCorrection,
  computeCompatibility,
  meetingTone,
  tenGodPlain,
  type CompatibilityScorePart,
} from '@/lib/manseryeok';
import {
  buildGunghapTarotReading,
  rawTotalToTodayScore,
  type GunghapTarotReading,
} from '@/lib/gunghapTarot';
import { localYmd } from '@/lib/daily/pick';
import { type Element, type ZodiacAnimal } from '@/lib/saju';
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
  tarot: GunghapTarotReading | null;
  tarotScoreDelta: number;
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

/** 조심할 점 — 십신별 후보(날짜·관계 시드로 순환) */
const EASY_CAUTION_VARIANTS: Record<string, string[]> = {
  비견: [
    '같은 자리에서 겨루지 않기.',
    '속도 차이를 무시하지 않기.',
    '내 방식만 맞다고 하지 않기.',
  ],
  겁재: [
    '서두르거나 다투지 않기.',
    '조급하게 결론부터 내지 않기.',
    '사소한 일로 겨루지 않기.',
  ],
  식신: [
    '완성만 따지다 만남을 미루지 않기.',
    '표현 욕심에 상대 말을 놓치지 않기.',
    '잘했다·못했다만 나누지 않기.',
  ],
  상관: [
    '말이 너무 세지지 않게.',
    '직설이 날카롭게 나가지 않게.',
    '비판 톤으로 대화하지 않기.',
  ],
  편재: [
    '약속을 너무 많이 잡지 않기.',
    '움직임만 챙기다 대화를 놓치지 않기.',
    '새 일만 벌이지 않기.',
  ],
  정재: [
    '완벽하려다 만남을 미루지 않기.',
    '세부만 챙기다 분위기를 놓치지 않기.',
    '약속을 너무 엄하게 맞추지 않기.',
  ],
  편관: [
    '상대를 몰아붙이지 않기.',
    '압박감을 주는 말투 피하기.',
    '명령조로 말하지 않기.',
  ],
  정관: [
    '형식만 챙기다 마음을 놓치지 않기.',
    '규칙만 따지다 유연함을 잃지 않기.',
    '체크리스트처럼 대화하지 않기.',
  ],
  편인: [
    '답을 재촉해 밀어내지 않기.',
    '혼자 생각할 시간을 빼앗지 않기.',
    '침묵을 답답해하지 않기.',
  ],
  정인: [
    '결정을 전부 맡기지 않기.',
    '돌봄이 부담이 되지 않게.',
    '책임을 한쪽에만 두지 않기.',
  ],
};

const YUKCHUNG_CAUTION = [
  '말투가 세지지 않게 조심하기.',
  '말끝을 무겁게 하지 않기.',
  '답답해하며 몰아붙이지 않기.',
];

const GENERIC_CAUTION = [
  '너무 밀어붙이지만 않기.',
  '형식만 챙기다 마음을 놓치지 않기.',
  '한쪽만 맞추려 하지 않기.',
  '답을 재촉하며 분위기를 급하게 만들지 않기.',
  '작은 일로 톤이 올라가지 않게.',
  '확답을 오늘 안에 받으려 하지 않기.',
];

const ANIMAL_CAUTION: Record<string, string[]> = {
  육충: YUKCHUNG_CAUTION,
};

const ELEMENT_CAUTION: Record<string, string[]> = {
  극함: ['힘겨루기처럼 보이지 않게.', '맞서기보다 한 박자 쉬기.'],
  극받음: ['밀어내지 않게 조심하기.', '상대 페이스를 존중하기.'],
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

function withEulReul(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '을' : '를'}`;
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

function hashCopySeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function cautionVariantsForGod(god: string): string[] {
  return EASY_CAUTION_VARIANTS[god] ?? [];
}

function dynamicCautionLines(selfGod: string, otherGod: string): string[] {
  const focus = uniqueWords([
    ...(EASY_FOCUS[selfGod] ?? []),
    ...(EASY_FOCUS[otherGod] ?? []),
  ]);
  if (focus.length === 0) return [];

  const tone = meetingTone(selfGod, otherGod);
  const pair = focus.slice(0, 2).join('·');
  const triple = focus.slice(0, 3).join('·');
  const lines = [
    `${withEulReul(pair)} 동시에 밀지 않기.`,
    `${focus[0]}만 따지지 않기.`,
    focus[1] ? `${withIga(focus[1])} 겹치지 않게.` : `${withIga(focus[0])} 겹치지 않게.`,
    `${pair}로 밀어붙이지 않기.`,
    `${withEulReul(pair)} 한꺼번에 꺼내지 않기.`,
    focus[2] ? `${focus[2]}에만 시선이 가지 않게.` : `${focus[0]}에만 시선이 가지 않게.`,
  ];
  if (triple !== pair) lines.push(`${withIga(triple)} 한꺼번에 나오지 않게.`);
  if (tone === '주의') {
    lines.push(`${withEulReul(pair)} 줄이고 짧게 마무리하기.`);
    lines.push('말수를 줄이고 톤을 낮추기.');
  }
  if (tone === '조율') {
    lines.push(`${pair} 속도 차이를 무시하지 않기.`);
    lines.push('한쪽만 맞추라고 재촉하지 않기.');
  }
  if (tone === '순조') lines.push('너무 많은 걸 한 번에 꺼내지 않기.');
  return lines;
}

function buildGuidance(
  selfGod: string,
  otherGod: string,
  date: Date,
  pairSeed: string,
): string {
  const tone = meetingTone(selfGod, otherGod);
  const focus = uniqueWords([
    ...(EASY_FOCUS[selfGod] ?? []),
    ...(EASY_FOCUS[otherGod] ?? []),
  ])
    .slice(0, 3)
    .join('·');
  const dateKey = localYmd(date);
  const seed = hashCopySeed(`gunghap-guidance:${dateKey}:${selfGod}:${otherGod}:${pairSeed}`);

  if (!focus) {
    const fallbacks =
      tone === '주의'
        ? ['오늘은 짧은 안부만 나누기.', '오늘은 길게 늘이지 말기.', '오늘은 가볍게 인사만 나누기.']
        : ['오늘은 작은 일 하나만.', '오늘은 짧은 대화로 시작하기.', '오늘은 부담 없는 만남으로.'];
    return fallbacks[seed % fallbacks.length];
  }

  const templates: Record<ReturnType<typeof meetingTone>, string[]> = {
    주의: [
      `오늘은 ${withEulReul(focus)} 줄이고, 짧게 만나기.`,
      `오늘은 ${withEulReul(focus)} 과하게 키우지 말기.`,
      `오늘은 ${withEulReul(focus)} 내려놓고 가볍게 만나기.`,
    ],
    조율: [
      `오늘은 ${focus} 속도를 서로 맞추기.`,
      `오늘은 ${focus} 균형을 먼저 맞추기.`,
      `오늘은 ${focus} 사이를 조율하며 만나기.`,
    ],
    순조: [
      `오늘은 ${focus} 쪽으로 작은 일 하나.`,
      `오늘은 ${focus} 흐름으로 가볍게 이어가기.`,
      `오늘은 ${focus} 쪽에서 작은 제안 하나.`,
    ],
  };

  const options = templates[tone];
  return options[seed % options.length];
}

function prioritizedCautionGods(selfGod: string, otherGod: string): string[] {
  const gods: string[] = [];
  const push = (god: string) => {
    if (god && gods.indexOf(god) === -1) gods.push(god);
  };

  if (HARD_GODS.has(selfGod)) push(selfGod);
  if (HARD_GODS.has(otherGod)) push(otherGod);
  push(selfGod);
  push(otherGod);

  const assertive = new Set(['비견', '식신', '편재', '편인']);
  if (assertive.has(selfGod)) push(selfGod);
  if (assertive.has(otherGod)) push(otherGod);

  return gods;
}

/** 오늘 나·상대 십신 + 날짜·관계 시드 — 해보기처럼 매일·지인별로 달라짐 */
function buildCaution(
  selfGod: string,
  otherGod: string,
  animalKind: string,
  elementKind: string,
  date: Date,
  pairSeed: string,
): string {
  const dateKey = localYmd(date);
  const seed = hashCopySeed(
    `gunghap-caution:${dateKey}:${selfGod}:${otherGod}:${animalKind}:${elementKind}:${pairSeed}`,
  );

  const candidates: string[] = [];
  for (const god of prioritizedCautionGods(selfGod, otherGod)) {
    candidates.push(...cautionVariantsForGod(god));
  }
  candidates.push(...dynamicCautionLines(selfGod, otherGod));
  candidates.push(...(ANIMAL_CAUTION[animalKind] ?? []));
  candidates.push(...(ELEMENT_CAUTION[elementKind] ?? []));
  candidates.push(...GENERIC_CAUTION);

  const unique = candidates.filter((line, i, all) => Boolean(line) && all.indexOf(line) === i);
  if (unique.length === 0) return GENERIC_CAUTION[0];
  return unique[seed % unique.length];
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
    tarot: null,
    tarotScoreDelta: 0,
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

  const tarot = buildGunghapTarotReading(self.birthDate, other.birthDate, date);
  const rawWithTarot = engine.rawTotal + tarot.scoreDelta;
  const todayScoreWithTarot = rawTotalToTodayScore(rawWithTarot);
  const { factor, bonus, score } = applyBaseCorrection(todayScoreWithTarot, engine.baseScore);
  const scoreParts: CompatibilityScorePart[] = [
    ...engine.scoreParts,
    {
      key: 'tarot',
      label: `타로 ${tarot.cardTitle} ${tarot.orientation}`,
      delta: tarot.scoreDelta,
    },
  ];

  const otherName = other.name.trim() || '상대';
  const selfName = self.name.trim();
  const grade = gradeFromScore(score);
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
    ...tarot.keywords,
  ]).slice(0, 6);

  const summary = [
    `${withGwa(selfName)} ${withEun(otherName)} ${animalEasy}이고, ${elementEasy}입니다.`,
    `상대는 나에게 ${easyPlain(pairGod)} 쪽.`,
    pairFocus ? `오늘은 ${withIga(pairFocus)} 보이기 쉽습니다.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  // 카드 한 줄: 격식체 · 십신 이름만 (쉬운 말 풀이·칩과 겹치지 않음)
  const meetTone = meetingTone(engine.selfTodayTenGod, engine.otherTodayTenGod);
  const meetClause =
    meetTone === '주의'
      ? '언사와 거리를 살필'
      : meetTone === '조율'
        ? '호흡을 맞출'
        : '기운이 호응하기 쉬운';
  const summaryLine =
    engine.selfTodayTenGod === engine.otherTodayTenGod
      ? `${withGwa(selfName)} ${withEun(otherName)} 오늘의 만남은 ${engine.selfTodayTenGod}으로 맞닿으며, 흐름은 ${grade}에 가깝습니다.`
      : `${withGwa(selfName)} ${withEun(otherName)} 오늘은 나 ${engine.selfTodayTenGod}, 상대 ${engine.otherTodayTenGod}이라 ${meetClause} 하루이며, 기운은 ${grade}입니다.`;

  const relationship = [
    dualEasyLine('오늘', engine.selfTodayTenGod, engine.otherTodayTenGod),
    dualEasyLine('이달', engine.selfMonthTenGod, engine.otherMonthTenGod),
    dualEasyLine('올해', engine.selfYearTenGod, engine.otherYearTenGod),
    `둘의 기운은 ${elementEasy}.`,
  ].join(' ');

  return {
    ready: true,
    score,
    baseScore: engine.baseScore,
    todayScore: todayScoreWithTarot,
    baseCorrectionFactor: factor,
    baseCorrectionBonus: bonus,
    scoreOrigin: engine.scoreOrigin,
    scoreScaleMax: engine.scoreScaleMax,
    maxPositiveSum: engine.maxPositiveSum,
    scoreParts,
    rawTotal: rawWithTarot,
    dailyDelta: rawWithTarot,
    grade,
    moodHeadline: `${toneKw} · ${grade}`,
    summary: fixObjectParticle(summary),
    summaryLine: fixObjectParticle(summaryLine),
    relationship,
    guidance: fixObjectParticle(
      buildGuidance(
        engine.selfTodayTenGod,
        engine.otherTodayTenGod,
        date,
        `${self.birthDate}:${other.birthDate}`,
      ),
    ),
    caution: buildCaution(
      engine.selfTodayTenGod,
      engine.otherTodayTenGod,
      engine.animalKind,
      engine.elementKind,
      date,
      `${self.birthDate}:${other.birthDate}`,
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
    tarot,
    tarotScoreDelta: tarot.scoreDelta,
  };
}
