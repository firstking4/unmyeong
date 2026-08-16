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
export type SajuPeriod = '오늘' | '이번 달' | '올해';

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
  animal: SeedRecord;
  element: SeedRecord;
  today: PeriodReading;
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
  if (when === '이번 달') return new Date(date.getFullYear(), date.getMonth(), 1);
  return new Date(date.getFullYear(), 0, 1);
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
  if (!today || !monthReading || !yearReading) return null;

  return {
    birthYear,
    headline: `${element.label}의 기운 · ${animal.label}띠`,
    keywords,
    animal,
    element,
    today,
    month: monthReading,
    year: yearReading,
  };
}
