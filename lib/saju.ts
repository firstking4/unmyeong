import { getFiveElement, getZodiacAnimalRecord } from '@/lib/data/catalog';
import type { SeedRecord } from '@/lib/data/types';
import { pickDailyFrom, pickDailyMany, withSparseCaution } from '@/lib/daily/pick';
import { withEulReul, withEun, withIga } from '@/lib/korean/particle';
import { joinSentences } from '@/lib/korean/sentence';
import {
  computeFourPillars,
  computeLuckPillars,
  getManseryeokPeriod,
  getSolarTermWindow,
  buildSajuTodayContext,
  natalTenGodText,
  scopeCopy,
  scopeLead,
  tenGodKeywords,
} from '@/lib/manseryeok';
import type { PillarTone } from '@/lib/types';
import { memoLast } from '@/lib/memoLast';

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

export function tonesForTenGods(primary: string, secondary: string): PillarTone[] {
  const toneFor = (god: string): PillarTone => {
    if (god === '편재' || god === '정재') return '재물';
    if (god === '편관' || god === '정관') return '일';
    if (god === '식신' || god === '상관' || god === '편인' || god === '정인') return '성장';
    return '관계';
  };
  const first = toneFor(primary);
  const second = toneFor(secondary);
  return first === second ? [first, first === '성장' ? '일' : '성장'] : [first, second];
}

/** 오행 상생(목→화→토→금→수) · 상극(목→토→수→화→금) */
export function relateElements(self: Element, other: Element, when: SajuPeriod): ElementRelation {
  if (self === other) {
    return {
      kind: '같음',
      title: '같은 기운',
      blurb: `${withEun(when)} 나와 같은 ${self}의 기운이 겹칩니다. 본디 가진 결이 더 또렷해집니다.`,
    };
  }
  const a = ELEMENTS.indexOf(self);
  const b = ELEMENTS.indexOf(other);
  const diff = (b - a + 5) % 5;
  if (diff === 1) {
    return {
      kind: '생함',
      title: `${self}생${other}`,
      blurb: `내 ${self} 기운이 ${when} 들어오는 ${withEulReul(other)} 살립니다. 베풀고 이끄는 흐름입니다.`,
    };
  }
  if (diff === 4) {
    return {
      kind: '생받음',
      title: `${other}생${self}`,
      blurb: `${when} ${other}의 기운이 내 ${withEulReul(self)} 북돋웁니다. 도움과 기회가 따라오기 쉽습니다.`,
    };
  }
  if (diff === 2) {
    return {
      kind: '극함',
      title: `${self}극${other}`,
      blurb: `내 ${withIga(self)} ${when} 들어오는 ${withEulReul(other)} 누릅니다. 결단은 빠르지만 마찰을 살피세요.`,
    };
  }
  return {
    kind: '극받음',
    title: `${other}극${self}`,
    blurb: `${when} ${withIga(other)} 내 ${withEulReul(self)} 시험합니다. 무리보다 조율이 필요합니다.`,
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
  /** 오늘 카드 — 절기·대운 배경, 시주·월·세운 맞음/어긋남 (점수 없음) */
  contextLines?: { text: string }[];
  /** 이 블록이 쓴 팩 변주 — 같은 화면의 다른 블록이 같은 문장을 피하는 데 쓴다 */
  themeId?: string;
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

/**
 * 띠·오행 시드에서 뽑는 생활 힌트 (관계·일·성장).
 * 오늘·주·월·년 카드가 한 화면에 함께 있으므로 `rotate`로 시작 위치를 어긋내 같은 문장이 겹치지 않게 한다.
 */
function hintLines(
  animal: SeedRecord,
  element: SeedRecord,
  tones: PillarTone[],
  seed: string,
  rotate = 0,
  used?: Set<string>,
): { label: string; text: string }[] {
  const workLabel = tones.includes('재물') && !tones.includes('일') ? '재물' : '일·재능';
  const pool = [
    { tone: '관계' as PillarTone, label: '관계', text: animal.hints?.love },
    { tone: '관계' as PillarTone, label: '관계', text: element.hints?.love },
    { tone: '일' as PillarTone, label: workLabel, text: animal.hints?.work },
    { tone: '일' as PillarTone, label: workLabel, text: element.hints?.work },
    { tone: '성장' as PillarTone, label: '성장', text: animal.hints?.growth },
    { tone: '성장' as PillarTone, label: '성장', text: element.hints?.growth },
  ].filter((entry): entry is { tone: PillarTone; label: string; text: string } =>
    Boolean(entry.text),
  );
  if (pool.length === 0) return [];

  const wanted = (tone: PillarTone) =>
    tones.includes(tone) || (tone === '일' && tones.includes('재물'));
  const ranked = [...pool.filter((entry) => wanted(entry.tone)), ...pool.filter((entry) => !wanted(entry.tone))];

  const start = (hashSeed(seed) + rotate * 2) % ranked.length;
  const picked: { label: string; text: string }[] = [];
  // 1차는 다른 카드가 이미 쓴 문장을 건너뛰고, 풀이 마르면 2차에서 허용한다.
  for (let pass = 0; pass < 2 && picked.length < 2; pass++) {
    for (let i = 0; i < ranked.length && picked.length < 2; i++) {
      const entry = ranked[(start + i) % ranked.length];
      if (picked.some((line) => line.text === entry.text || line.label === entry.label)) continue;
      if (pass === 0 && used?.has(entry.text)) continue;
      picked.push({ label: entry.label, text: entry.text });
      used?.add(entry.text);
    }
  }
  return picked;
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
  /** 날짜가 든 시드 — 힌트 회전용. 팩 순열에는 쓰지 않는다 */
  seed: string;
  /** 날짜 없는 salt — 팩·십신 키워드 순열용 (`fortune-copy.mdc` §1) */
  themeSalt: string;
  /** 같은 화면의 다른 블록이 이미 쓴 팩 변주 id */
  avoidThemeIds?: string[];
  date: Date;
  pillarKorean?: string;
  tenGod?: string;
  summaryLead?: string;
  tones?: PillarTone[];
  /** 기간별 카피 역할 — 중복 문장 분리용 */
  scope?: 'day' | 'month' | 'year';
  /** 한 화면의 다른 카드가 이미 쓴 시드 문장 */
  usedHints?: Set<string>;
}): PeriodReading | null {
  const periodAnimal = getZodiacAnimalRecord(input.periodAnimal);
  const periodElement = getFiveElement(input.periodElement);
  if (!periodAnimal || !periodElement) return null;

  const relation = relateElements(input.selfElement, input.periodElement, input.when);
  const tones = input.tones ?? pickTones(input.seed);
  const themeDate = themeDateForPeriod(input.when, input.date);
  const themes = pickPeriodThemes(input.themeSalt, themeDate, input.avoidThemeIds);
  const theme = themes[0]!;
  const god = input.tenGod;
  const scoped = god && input.scope ? scopeCopy(input.scope, god) : null;
  const godKw = pickDailyFrom(
    tenGodKeywords(god),
    `saju-godkw:${input.themeSalt}:${god ?? ''}`,
    themeDate,
  );
  // 오늘 칩은 팩 이웃 변주. 닷새에 하루는 주의 칩을 넣어 3개를 맞춘다.
  const keywordParts =
    input.scope === 'day'
      ? withSparseCaution(
          themes.map((item) => item.keyword),
          `saju-caution:${input.natalAnimal.id}:${input.natalElement.id}`,
          themeDate,
        )
      : [theme.keyword, godKw];
  const keywords = keywordParts.filter(
    (kw, i, all): kw is string => Boolean(kw) && all.indexOf(kw) === i,
  );

  // 도입(scopeLead)과 기간 카피·구조 해설이 같은 형용사를 세 번 쓰지 않게
  // 요약은 도입+테마만, 십신 힌트는 기간 카피(없으면 구조 해설)만 둔다.
  const summary = joinSentences([input.summaryLead, theme.focus]);

  const practiceLabel =
    input.when === '오늘' ? '오늘의 한 가지' : input.when === '이번 달' ? '이달의 배치' : '올해의 방향';

  const tenGodHint = scoped?.focus ?? (god ? natalTenGodText(god) : '');
  const hints = [
    god
      ? {
          label:
            input.scope === 'day' ? '오늘의 십신' : input.scope === 'month' ? '이달의 십신' : '올해의 십신',
          text: `${god} · ${tenGodHint}`,
        }
      : null,
    { label: '기운 관계', text: `${relation.title} · ${relation.blurb}` },
    ...hintLines(
      input.natalAnimal,
      input.natalElement,
      tones,
      input.seed,
      input.scope === 'day' ? 0 : input.scope === 'month' ? 2 : 3,
      input.usedHints,
    ),
    { label: practiceLabel, text: scoped?.action ?? theme.action },
    { label: '주의', text: scoped?.caution ?? theme.caution },
  ].filter(Boolean) as { label: string; text: string }[];

  return {
    eyebrow: input.eyebrow,
    when: input.when,
    dateLabel: input.dateLabel,
    headline: input.pillarKorean
      ? `${input.pillarKorean} · ${god ?? periodElement.label}`
      : `${periodElement.label}의 기운, ${theme.headline}`,
    flowLabel: input.pillarKorean
      ? `${input.flowKind}`
      : `${input.flowKind} · ${periodAnimal.label}띠`,
    relation,
    summary,
    tones,
    keywords: keywords.slice(0, 5),
    hints,
    themeId: theme.id,
  };
}

/**
 * 기간 블록의 팩 변주 — 오늘 칸부터 이웃 3개.
 * 오늘·주·월·년이 한 화면에 있으므로 다른 블록이 쓴 변주는 건너뛴다.
 */
function pickPeriodThemes(themeSalt: string, themeDate: Date, avoidIds?: string[]) {
  const avoid = new Set(avoidIds ?? []);
  return pickDailyMany('saju', themeSalt, 3 + avoid.size, themeDate)
    .filter((item) => !avoid.has(item.id))
    .slice(0, 3);
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
  birthTime?: string;
  date: Date;
  usedHints?: Set<string>;
  avoidThemeIds?: string[];
}): PeriodReading | null {
  const weekStart = startOfWeek(input.date);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);
    return day;
  });
  const dayFlows = days.map((day) => {
    const period = getManseryeokPeriod(
      { birthDate: input.birthDate, birthTime: input.birthTime },
      day,
      'day',
    );
    if (!period) return null;
    return {
      day,
      period,
      relation: relateElements(input.selfElement, period.element as Element, '이번 주'),
      tones: tonesForTenGods(period.stemTenGod, period.branchTenGod),
    };
  }).filter(Boolean) as {
    day: Date;
    period: NonNullable<ReturnType<typeof getManseryeokPeriod>>;
    relation: ElementRelation;
    tones: PillarTone[];
  }[];
  const dominant = mostFrequent(dayFlows, (flow) => flow.relation.kind);
  if (!dominant) return null;
  const dominantGod =
    mostFrequent(dayFlows, (flow) => flow.period.stemTenGod)?.period.stemTenGod ??
    dominant.period.stemTenGod;
  const weeklyTheme = pickPeriodThemes(`${input.birthDate}:week`, weekStart, input.avoidThemeIds)[0]!;
  const scoped = scopeCopy('week', dominantGod);
  const tones = [...TONES]
    .sort(
      (left, right) =>
        dayFlows.filter((flow) => flow.tones.includes(right)).length -
        dayFlows.filter((flow) => flow.tones.includes(left)).length,
    )
    .slice(0, 2);
  const keywords = [
    dominantGod,
    ...tenGodKeywords(dominantGod),
    weeklyTheme.keyword,
    dominant.relation.kind === '극함' ? '마찰' : null,
    dominant.relation.kind === '극받음' ? '시험' : null,
  ].filter((keyword, index, all): keyword is string =>
    Boolean(keyword) && all.indexOf(keyword) === index,
  );

  return {
    eyebrow: '이번 주 기운',
    when: '이번 주',
    dateLabel: formatWeekLabel(weekStart),
    headline: `${dominantGod} 주간 · ${dominant.period.pillar.korean}`,
    flowLabel: `7일 일진 집계 · ${dominantGod}`,
    relation: dominant.relation,
    summary: joinSentences([scopeLead('week', dominantGod), scoped.focus, weeklyTheme.focus]),
    tones,
    keywords: keywords.slice(0, 5),
    hints: [
      { label: '주간 십신', text: `${dominantGod} · ${natalTenGodText(dominantGod)}` },
      { label: '기운 관계', text: `${dominant.relation.title} · ${dominant.relation.blurb}` },
      ...hintLines(
        input.natalAnimal,
        input.natalElement,
        tones,
        `${ymd(weekStart)}:${input.birthDate}:week`,
        1,
        input.usedHints,
      ),
      { label: '이번 주의 한 가지', text: scoped.action },
      { label: '주의', text: scoped.caution },
    ],
    themeId: weeklyTheme.id,
  };
}

const sajuMemo: { key: string; value: SajuReading | null | undefined } = { key: '', value: undefined };

export function buildSajuReading(
  birthDate: string,
  date = new Date(),
  birthTime?: string,
  gender?: 'male' | 'female' | null,
): SajuReading | null {
  const key = `${birthDate}|${birthTime ?? ''}|${gender ?? ''}|${ymd(date)}`;
  return memoLast(sajuMemo, key, () => buildSajuReadingNow(birthDate, date, birthTime, gender));
}

function buildSajuReadingNow(
  birthDate: string,
  date: Date,
  birthTime?: string,
  gender?: 'male' | 'female' | null,
): SajuReading | null {
  const birthYear = parseBirthYear(birthDate);
  const animalLabel = getZodiacAnimal(birthDate);
  const elementLabel = getElement(birthDate);
  const animal = getZodiacAnimalRecord(animalLabel);
  const element = getFiveElement(elementLabel);
  if (birthYear === null || !animal || !element || !elementLabel) return null;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const natalPillars = computeFourPillars({ birthDate, birthTime });
  const todayPeriod = getManseryeokPeriod({ birthDate, birthTime }, date, 'day');
  const monthPeriod = getManseryeokPeriod({ birthDate, birthTime }, date, 'month');
  const yearPeriod = getManseryeokPeriod({ birthDate, birthTime }, date, 'year');
  if (!natalPillars || !todayPeriod || !monthPeriod || !yearPeriod) return null;
  const dayMaster = natalPillars.dayMasterElement as Element;

  const base = {
    selfElement: dayMaster,
    natalAnimal: animal,
    natalElement: element,
    usedHints: new Set<string>(),
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
    flowKind: `일진 · ${todayPeriod.pillar.korean} · ${todayPeriod.stemTenGod}`,
    periodAnimal: todayPeriod.animal as ZodiacAnimal,
    periodElement: todayPeriod.element as Element,
    seed: `${ymd(date)}:${birthDate}:day`,
    themeSalt: `${birthDate}:day`,
    date,
    pillarKorean: todayPeriod.pillar.korean,
    tenGod: todayPeriod.stemTenGod,
    tones: tonesForTenGods(todayPeriod.stemTenGod, todayPeriod.branchTenGod),
    scope: 'day',
    summaryLead: scopeLead('day', todayPeriod.stemTenGod),
  });
  // 오늘 → 주 → 월 → 년 순으로 앞 블록이 쓴 팩 변주를 피한다 (한 화면에 같은 문장 방지)
  const usedThemeIds: string[] = [];
  const noteTheme = (block: PeriodReading | null) => {
    if (block?.themeId) usedThemeIds.push(block.themeId);
    return block;
  };
  noteTheme(today);
  const luck =
    gender === 'male' || gender === 'female'
      ? computeLuckPillars({ birthDate, birthTime, gender })
      : null;
  const termWindow = getSolarTermWindow(date);
  if (today) {
    today.contextLines = buildSajuTodayContext({
      natal: natalPillars,
      todayPeriod,
      monthPeriod,
      yearPeriod,
      termWindow,
      luck,
      birthDate,
      at: date,
    });
  }
  const week = noteTheme(
    buildWeekPeriod({
      ...base,
      birthDate,
      birthTime,
      date,
      avoidThemeIds: [...usedThemeIds],
    }),
  );
  const monthReading = noteTheme(
    buildPeriod({
      ...base,
      eyebrow: '이달의 사주',
      when: '이번 달',
      dateLabel: `${year}년 ${month}월`,
      flowKind: `절입 월주 · ${monthPeriod.pillar.korean} · ${monthPeriod.stemTenGod}`,
      periodAnimal: monthPeriod.animal as ZodiacAnimal,
      periodElement: monthPeriod.element as Element,
      seed: `${year}-${pad2(month)}:${birthDate}:month`,
      themeSalt: `${birthDate}:month`,
      avoidThemeIds: [...usedThemeIds],
      date,
      pillarKorean: monthPeriod.pillar.korean,
      tenGod: monthPeriod.stemTenGod,
      tones: tonesForTenGods(monthPeriod.stemTenGod, monthPeriod.branchTenGod),
      scope: 'month',
      summaryLead: scopeLead('month', monthPeriod.stemTenGod),
    }),
  );
  const yearReading = buildPeriod({
    ...base,
    eyebrow: '올해의 사주',
    when: '올해',
    dateLabel: `${year}년`,
    flowKind: `입춘 세운 · ${yearPeriod.pillar.korean} · ${yearPeriod.stemTenGod}`,
    periodAnimal: yearPeriod.animal as ZodiacAnimal,
    periodElement: yearPeriod.element as Element,
    seed: `${year}:${birthDate}:year`,
    themeSalt: `${birthDate}:year`,
    avoidThemeIds: [...usedThemeIds],
    date,
    pillarKorean: yearPeriod.pillar.korean,
    tenGod: yearPeriod.stemTenGod,
    tones: tonesForTenGods(yearPeriod.stemTenGod, yearPeriod.branchTenGod),
    scope: 'year',
    summaryLead: scopeLead('year', yearPeriod.stemTenGod),
  });
  if (!today || !week || !monthReading || !yearReading) return null;

  const dayEl = getFiveElement(natalPillars.dayMasterElement);
  const natalKeywords = [
    `일간 ${natalPillars.day.stem}`,
    natalPillars.dayMasterElement,
    natalPillars.day.korean,
    ...(dayEl?.keywords ?? []).slice(0, 2),
  ].filter((kw, i, all) => Boolean(kw) && all.indexOf(kw) === i);

  const natalSummary = [
    `일간 ${natalPillars.day.stem}(${natalPillars.dayMasterElement}) · 일주 ${withIga(natalPillars.day.korean)} 나의 중심입니다.`,
    dayEl?.summary,
    `${animal.label}띠는 배경 기운으로만 참고하세요. 네 기둥·십신 구조는 아래 사주팔자에서 봅니다.`,
  ]
    .filter(Boolean)
    .join(' ');

  const natalHints = [
    {
      label: '일간',
      text: `${natalPillars.day.stem} · ${natalPillars.dayMasterElement}. 타고난 반응과 선택의 기준입니다.${
        dayEl?.mood ? ` 기본 결은 ${dayEl.mood}입니다.` : ''
      }`,
    },
    {
      label: '일주',
      text: `${natalPillars.day.korean}. 가까운 관계와 일상의 결을 읽는 자리입니다. 월주 ${withEun(
        natalPillars.month.korean,
      )} 사회·환경, 연주 ${withEun(natalPillars.year.korean)} 뿌리로 봅니다.`,
    },
    natalPillars.tenGods
      ? {
          label: '월지 십신',
          text: `${natalPillars.tenGods.month.branch} · ${natalTenGodText(
            natalPillars.tenGods.month.branch,
          )}`,
        }
      : null,
    dayEl?.hints?.work ? { label: '일·재능', text: dayEl.hints.work } : null,
    dayEl?.hints?.growth ? { label: '성장', text: dayEl.hints.growth } : null,
    {
      label: '배경',
      text: `${animal.label}띠 · ${element.label}의 기운은 보조 배경입니다. ${
        animal.summary ?? ''
      } 기간 풀이(오늘·주·월·년)는 일간 기준으로 봅니다.`.replace(/\s+/g, ' '),
    },
  ].filter(Boolean) as { label: string; text: string }[];

  return {
    birthYear,
    headline: `일간 ${natalPillars.day.stem} · ${natalPillars.dayMasterElement}의 기운`,
    keywords: natalKeywords.slice(0, 6),
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
