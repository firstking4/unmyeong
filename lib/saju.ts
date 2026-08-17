import { getFiveElement, getZodiacAnimalRecord } from '@/lib/data/catalog';
import type { SeedRecord } from '@/lib/data/types';
import { pickDaily } from '@/lib/daily/pick';
import type { PillarTone } from '@/lib/types';

const ZODIAC_ANIMALS = [
  '쥐',
  '소',
  '호랑이',
  '토끼',
  '용',
  '뱀',
  '말',
  '양',
  '원숭이',
  '닭',
  '개',
  '돼지',
] as const;

const ELEMENTS = ['목', '화', '토', '금', '수'] as const;

export type ZodiacAnimal = (typeof ZODIAC_ANIMALS)[number];
export type Element = (typeof ELEMENTS)[number];

export function parseBirthYear(birthDate?: string): number | null {
  if (!birthDate) return null;
  const match = birthDate.match(/^(\d{4})/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

/** 양력 출생연도 기준 띠 (MVP) */
export function getZodiacAnimal(birthDate?: string): ZodiacAnimal | null {
  const year = parseBirthYear(birthDate);
  if (year === null) return null;
  const index = ((year - 4) % 12 + 12) % 12;
  return ZODIAC_ANIMALS[index];
}

/** 양력 출생연도 기준 오행 (MVP) */
export function getElement(birthDate?: string): Element | null {
  const year = parseBirthYear(birthDate);
  if (year === null) return null;
  const index = ((year - 4) % 10 + 10) % 10;
  return ELEMENTS[Math.floor(index / 2)];
}

/**
 * 프로필 `HH:mm` → 사주 시진 표기 (자시~해시).
 * 정식 시주 계산이 아니라 표시용 참고 구분이다.
 */
export function formatSajuHourLabel(birthTime?: string): string | null {
  if (!birthTime) return null;
  const match = birthTime.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return null;
  const labels = [
    '자시',
    '축시',
    '인시',
    '묘시',
    '진시',
    '사시',
    '오시',
    '미시',
    '신시',
    '유시',
    '술시',
    '해시',
  ] as const;
  const index = Math.floor(((hour + 1) % 24) / 2);
  return labels[index] ?? null;
}

export function formatSajuKeywords(birthDate?: string): string | null {
  const animal = getZodiacAnimal(birthDate);
  const element = getElement(birthDate);
  if (!animal && !element) return null;

  const animalRec = getZodiacAnimalRecord(animal);
  const elementRec = getFiveElement(element);
  const parts = [
    animal && `${animal}띠`,
    element && `${element}의 기운`,
    animalRec?.keywords?.[0],
    elementRec?.mood,
  ].filter(Boolean);
  return parts.join(' · ');
}

/** 시드 요약 문장 */
export function formatSajuSummary(birthDate?: string): string | null {
  const animal = getZodiacAnimal(birthDate);
  const element = getElement(birthDate);
  const animalRec = getZodiacAnimalRecord(animal);
  const elementRec = getFiveElement(element);
  if (!animalRec && !elementRec) return null;
  return [animalRec?.summary, elementRec?.summary].filter(Boolean).join(' ');
}

export type ElementRelationKind = '같음' | '생함' | '생받음' | '극함' | '극받음';
export type SajuPeriod = '오늘' | '이번 주' | '이번 달' | '올해';

export type ElementRelation = {
  kind: ElementRelationKind;
  title: string;
  blurb: string;
};

const TONES: PillarTone[] = ['관계', '일', '재물', '성장'];

/** 양력 월 → 월지(인월=2월). 절기 보정 없는 참고용. */
const MONTH_BRANCH: { animal: ZodiacAnimal; element: Element }[] = [
  { animal: '소', element: '토' },
  { animal: '호랑이', element: '목' },
  { animal: '토끼', element: '목' },
  { animal: '용', element: '토' },
  { animal: '뱀', element: '화' },
  { animal: '말', element: '화' },
  { animal: '양', element: '토' },
  { animal: '원숭이', element: '금' },
  { animal: '닭', element: '금' },
  { animal: '개', element: '토' },
  { animal: '돼지', element: '수' },
  { animal: '쥐', element: '수' },
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function yearStamp(year: number): string {
  return `${year}-06-15`;
}

function pickTones(seed: string): PillarTone[] {
  const h = hashSeed(seed);
  const primary = TONES[h % TONES.length];
  let secondary = TONES[(h >> 2) % TONES.length];
  if (secondary === primary) secondary = TONES[(h >> 4) % TONES.length];
  if (secondary === primary) {
    secondary = TONES[(TONES.indexOf(primary) + 1) % TONES.length];
  }
  return [primary, secondary];
}

function pickFrom(pool: string[], seed: string): string {
  if (pool.length === 0) return '';
  return pool[hashSeed(seed) % pool.length];
}

/**
 * 일진(참고). 1970-01-01 = 기유(己酉)로 두고 60갑자를 굴린다.
 * 만세력·시주 정본이 아니다.
 */
function getDayStemBranch(date: Date): { animal: ZodiacAnimal; element: Element } {
  const days = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  const stem = (((5 + days) % 10) + 10) % 10;
  const branch = (((9 + days) % 12) + 12) % 12;
  return {
    animal: ZODIAC_ANIMALS[branch],
    element: ELEMENTS[Math.floor(stem / 2)],
  };
}

function getMonthBranch(date: Date): { animal: ZodiacAnimal; element: Element } {
  return MONTH_BRANCH[date.getMonth()];
}

/** 오행 상생(목→화→토→금→수) · 상극(목→토→수→화→금) */
export function relateElements(self: Element, other: Element, when: SajuPeriod): ElementRelation {
  if (self === other) {
    return {
      kind: '같음',
      title: '같은 기운',
      blurb: `${when}은 나와 같은 ${self}의 기운이 겹칩니다. 본디 가진 결이 더 또렷해집니다.`,
    };
  }
  const a = ELEMENTS.indexOf(self);
  const b = ELEMENTS.indexOf(other);
  const diff = (b - a + 5) % 5;
  if (diff === 1) {
    return {
      kind: '생함',
      title: `${self}생${other}`,
      blurb: `내 ${self} 기운이 ${when} ${other}를 살립니다. 베풀고 이끄는 흐름입니다.`,
    };
  }
  if (diff === 4) {
    return {
      kind: '생받음',
      title: `${other}생${self}`,
      blurb: `${when} ${other}의 기운이 내 ${self}를 북돋웁니다. 도움과 기회가 따라오기 쉽습니다.`,
    };
  }
  if (diff === 2) {
    return {
      kind: '극함',
      title: `${self}극${other}`,
      blurb: `내 ${self}가 ${when} ${other}를 누릅니다. 결단은 빠르지만 마찰을 살피세요.`,
    };
  }
  return {
    kind: '극받음',
    title: `${other}극${self}`,
    blurb: `${when} ${other}가 내 ${self}를 시험합니다. 무리보다 조율이 필요합니다.`,
  };
}

export type PeriodReading = {
  eyebrow: string;
  when: SajuPeriod;
  dateLabel: string;
  headline: string;
  flowLabel: string;
  relation: ElementRelation;
  summary: string;
  tones: PillarTone[];
  keywords: string[];
  hints: { label: string; text: string }[];
};

export type SajuReading = {
  birthYear: number;
  headline: string;
  keywords: string[];
  summary: string;
  hints: { label: string; text: string }[];
  animal: SeedRecord;
  element: SeedRecord;
  today: PeriodReading;
  week: PeriodReading;
  month: PeriodReading;
  year: PeriodReading;
};

function hintLines(
  animal: SeedRecord,
  element: SeedRecord,
  tones: PillarTone[],
  seed: string,
): { label: string; text: string }[] {
  const love = [animal.hints?.love, element.hints?.love].filter(Boolean) as string[];
  const work = [animal.hints?.work, element.hints?.work].filter(Boolean) as string[];
  const growth = [animal.hints?.growth, element.hints?.growth].filter(Boolean) as string[];
  const lines: { label: string; text: string }[] = [];
  if (tones.includes('관계') && love.length) {
    lines.push({ label: '관계', text: pickFrom(love, `${seed}:love`) });
  }
  if ((tones.includes('일') || tones.includes('재물')) && work.length) {
    lines.push({
      label: tones.includes('재물') && !tones.includes('일') ? '재물' : '일·재능',
      text: pickFrom(work, `${seed}:work`),
    });
  }
  if (tones.includes('성장') && growth.length) {
    lines.push({ label: '성장', text: pickFrom(growth, `${seed}:growth`) });
  }
  if (lines.length === 0 && growth.length) {
    lines.push({ label: '성장', text: pickFrom(growth, `${seed}:growth`) });
  }
  return lines;
}

function themeDateForPeriod(when: SajuPeriod, date: Date): Date {
  if (when === '오늘') return date;
  if (when === '이번 주') return startOfWeek(date);
  if (when === '이번 달') return new Date(date.getFullYear(), date.getMonth(), 1);
  return new Date(date.getFullYear(), 0, 1);
}

/** 한국 달력 관례에 맞춘 월요일~일요일 주간. */
function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

function formatWeekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const prefix = `${start.getFullYear()}년 `;
  const startLabel = `${start.getMonth() + 1}월 ${start.getDate()}일`;
  const endLabel = sameMonth
    ? `${end.getDate()}일`
    : `${sameYear ? '' : `${end.getFullYear()}년 `}${end.getMonth() + 1}월 ${end.getDate()}일`;
  return `${prefix}${startLabel} – ${endLabel}`;
}

function mostFrequent<T>(items: T[], getKey: (item: T) => string): T | null {
  if (items.length === 0) return null;
  const counts = new Map<string, number>();
  let winner = items[0];
  let max = 0;
  for (const item of items) {
    const key = getKey(item);
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    if (count > max) {
      winner = item;
      max = count;
    }
  }
  return winner;
}

function buildPeriod(input: {
  eyebrow: string;
  when: SajuPeriod;
  dateLabel: string;
  flowKind: string;
  selfElement: Element;
  periodAnimal: ZodiacAnimal;
  periodElement: Element;
  natalAnimal: SeedRecord;
  natalElement: SeedRecord;
  seed: string;
  date: Date;
}): PeriodReading | null {
  const periodAnimal = getZodiacAnimalRecord(input.periodAnimal);
  const periodElement = getFiveElement(input.periodElement);
  if (!periodAnimal || !periodElement) return null;

  const relation = relateElements(input.selfElement, input.periodElement, input.when);
  const tones = pickTones(input.seed);
  const theme = pickDaily('saju', input.seed, themeDateForPeriod(input.when, input.date));
  const keywords = [
    theme.keyword,
    ...(periodElement.keywords ?? []),
    ...(periodAnimal.keywords ?? []),
  ].filter((kw, i, all) => Boolean(kw) && all.indexOf(kw) === i);
  if (relation.kind === '극함') keywords.push('마찰');
  if (relation.kind === '극받음') keywords.push('시험');

  const summary = [
    `${input.when} 들어오는 ${periodElement.label} 기운(${input.flowKind} ${periodAnimal.label}띠)이 당신의 ${input.selfElement} 기운과 만나 ${relation.title} 흐름입니다.`,
    relation.blurb,
    theme.focus,
  ].join(' ');

  const baseHints = hintLines(input.natalAnimal, input.natalElement, tones, input.seed).map((hint) => {
    if (hint.label === '관계') {
      return { ...hint, text: `${hint.text} ${theme.relationship}` };
    }
    return hint;
  });

  const hints = [
    ...baseHints,
    { label: input.when === '오늘' ? '오늘의 한 가지' : '실천 포인트', text: theme.action },
    { label: '주의', text: theme.caution },
  ];

  return {
    eyebrow: input.eyebrow,
    when: input.when,
    dateLabel: input.dateLabel,
    headline: `${periodElement.label}의 기운, ${theme.headline}`,
    flowLabel: `${input.flowKind} · ${periodAnimal.label}띠`,
    relation,
    summary,
    tones,
    keywords: keywords.slice(0, 5),
    hints,
  };
}

/**
 * 월요일~일요일 일진을 모은 참고용 주간 흐름.
 * 정식 주간 명리 해석이 아니라 현재 일진·오행 모델의 집계값이다.
 */
function buildWeekPeriod(input: {
  selfElement: Element;
  natalAnimal: SeedRecord;
  natalElement: SeedRecord;
  birthDate: string;
  date: Date;
}): PeriodReading | null {
  const weekStart = startOfWeek(input.date);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);
    return day;
  });
  const dayFlows = days.map((day) => {
    const branch = getDayStemBranch(day);
    return {
      day,
      branch,
      relation: relateElements(input.selfElement, branch.element, '이번 주'),
      tones: pickTones(`${ymd(day)}:${input.birthDate}:day`),
      theme: pickDaily('saju', `${ymd(day)}:${input.birthDate}:day`, day),
    };
  });
  const dominant = mostFrequent(dayFlows, (flow) => flow.relation.kind);
  if (!dominant) return null;

  const weeklyTheme = pickDaily(
    'saju',
    `${ymd(weekStart)}:${input.birthDate}:week`,
    weekStart,
  );
  const tones = [...TONES]
    .sort(
      (left, right) =>
        dayFlows.filter((flow) => flow.tones.includes(right)).length -
        dayFlows.filter((flow) => flow.tones.includes(left)).length,
    )
    .slice(0, 2);
  const keywords = [
    weeklyTheme.keyword,
    ...dayFlows.map((flow) => flow.theme.keyword),
    ...(getFiveElement(dominant.branch.element)?.keywords ?? []),
    ...(getZodiacAnimalRecord(dominant.branch.animal)?.keywords ?? []),
  ].filter((keyword, index, all) => Boolean(keyword) && all.indexOf(keyword) === index);

  if (dominant.relation.kind === '극함') keywords.push('마찰');
  if (dominant.relation.kind === '극받음') keywords.push('시험');

  const baseHints = hintLines(
    input.natalAnimal,
    input.natalElement,
    tones,
    `${ymd(weekStart)}:${input.birthDate}:week`,
  ).map((hint) =>
    hint.label === '관계'
      ? { ...hint, text: `${hint.text} ${weeklyTheme.relationship}` }
      : hint,
  );

  return {
    eyebrow: '이번 주 기운',
    when: '이번 주',
    dateLabel: formatWeekLabel(weekStart),
    headline: `${dominant.branch.element}의 기운, ${weeklyTheme.headline}`,
    flowLabel: `주간 일진 · ${dominant.branch.animal}띠`,
    relation: dominant.relation,
    summary: [
      `월요일부터 일요일까지의 참고용 일진을 모으면 ${dominant.branch.element} 기운이 가장 자주 나타납니다.`,
      dominant.relation.blurb,
      weeklyTheme.focus,
    ].join(' '),
    tones,
    keywords: keywords.slice(0, 5),
    hints: [
      ...baseHints,
      { label: '이번 주의 한 가지', text: weeklyTheme.action },
      { label: '주의', text: weeklyTheme.caution },
    ],
  };
}

export function buildSajuReading(birthDate: string, date = new Date()): SajuReading | null {
  const birthYear = parseBirthYear(birthDate);
  const animalLabel = getZodiacAnimal(birthDate);
  const elementLabel = getElement(birthDate);
  const animal = getZodiacAnimalRecord(animalLabel);
  const element = getFiveElement(elementLabel);
  if (birthYear === null || !animal || !element || !elementLabel) return null;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const yearStampDate = yearStamp(year);
  const yearAnimalLabel = getZodiacAnimal(yearStampDate);
  const yearElementLabel = getElement(yearStampDate);
  if (!yearAnimalLabel || !yearElementLabel) return null;

  const dayBranch = getDayStemBranch(date);
  const monthBranch = getMonthBranch(date);
  const keywords = [...(animal.keywords ?? []), ...(element.keywords ?? [])]
    .filter((kw, i, all) => Boolean(kw) && all.indexOf(kw) === i)
    .slice(0, 6);

  const base = {
    selfElement: elementLabel,
    natalAnimal: animal,
    natalElement: element,
  };

  const today = buildPeriod({
    ...base,
    eyebrow: '오늘의 사주',
    when: '오늘',
    dateLabel: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
    flowKind: '일진',
    periodAnimal: dayBranch.animal,
    periodElement: dayBranch.element,
    seed: `${ymd(date)}:${birthDate}:day`,
    date,
  });
  const week = buildWeekPeriod({
    ...base,
    birthDate,
    date,
  });
  const monthReading = buildPeriod({
    ...base,
    eyebrow: '이달의 사주',
    when: '이번 달',
    dateLabel: `${year}년 ${month}월`,
    flowKind: '월건',
    periodAnimal: monthBranch.animal,
    periodElement: monthBranch.element,
    seed: `${year}-${pad2(month)}:${birthDate}:month`,
    date,
  });
  const yearReading = buildPeriod({
    ...base,
    eyebrow: '올해의 사주',
    when: '올해',
    dateLabel: `${year}년`,
    flowKind: '세운',
    periodAnimal: yearAnimalLabel,
    periodElement: yearElementLabel,
    seed: `${year}:${birthDate}:year`,
    date,
  });
  if (!today || !week || !monthReading || !yearReading) return null;

  const natalSummary = [animal.summary, element.summary].filter(Boolean).join(' ');
  const natalHints = hintLines(animal, element, [...TONES], `${birthDate}:natal`);

  return {
    birthYear,
    headline: `${element.label}의 기운 · ${animal.label}띠`,
    keywords,
    summary: natalSummary,
    hints: natalHints,
    animal,
    element,
    today,
    week,
    month: monthReading,
    year: yearReading,
  };
}
