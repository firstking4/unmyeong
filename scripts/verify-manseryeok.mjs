#!/usr/bin/env node
/**
 * 만세력 골든 검증 — `npm run verify:manseryeok`
 * 앱 어댑터와 같은 정책(jasi · 진시 OFF · 미입력 정오)으로 계산한다.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  calculateFourPillars,
  getSolarTermsOfYear,
  getTenGod,
  getHeavenlyStemElement,
  HEAVENLY_STEMS,
  HEAVENLY_STEMS_HANJA,
  EARTHLY_BRANCHES,
  EARTHLY_BRANCHES_HANJA,
} = require('manseryeok');

const DAY_BOUNDARY = 'jasi';
const UNKNOWN_TIME = { hour: 12, minute: 0 };

const root = dirname(fileURLToPath(import.meta.url));
const repo = join(root, '..');

function parseYmd(iso) {
  const match = String(iso).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function parseHm(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function kstInstant(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0));
}

function formatKstLabel(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type) => Number(parts.find((part) => part.type === type)?.value ?? NaN);
  return `${get('year')}년 ${get('month')}월 ${get('day')}일 ${get('hour')}시 ${get('minute')}분`;
}

function toPillar(pillar, korean, hanja) {
  return { stem: pillar.heavenlyStem, branch: pillar.earthlyBranch, korean, hanja };
}

function pillarHanja(stem, branch) {
  return `${HEAVENLY_STEMS_HANJA[HEAVENLY_STEMS.indexOf(stem)]}${EARTHLY_BRANCHES_HANJA[EARTHLY_BRANCHES.indexOf(branch)]}`;
}

function computeFourPillars(input) {
  const ymd = parseYmd(input.birthDate);
  if (!ymd) return null;
  const clock = parseHm(input.birthTime);
  const hasHour = clock !== null;
  const raw = calculateFourPillars({
    year: ymd.year,
    month: ymd.month,
    day: ymd.day,
    hour: hasHour ? clock.hour : UNKNOWN_TIME.hour,
    minute: hasHour ? clock.minute : UNKNOWN_TIME.minute,
    dayBoundary: DAY_BOUNDARY,
  });
  return {
    year: toPillar(raw.year, raw.yearString, raw.yearHanja),
    month: toPillar(raw.month, raw.monthString, raw.monthHanja),
    day: toPillar(raw.day, raw.dayString, raw.dayHanja),
    hour: hasHour ? toPillar(raw.hour, raw.hourString, raw.hourHanja) : null,
  };
}

function pillarCore(result) {
  if (!result) return null;
  return {
    year: result.year,
    month: result.month,
    day: result.day,
    hour: result.hour,
  };
}

function getMonthBoundaryTerm(birthDate, birthTime) {
  const ymd = parseYmd(birthDate);
  if (!ymd) return null;
  const clock = parseHm(birthTime) ?? UNKNOWN_TIME;
  const at = kstInstant(ymd.year, ymd.month, ymd.day, clock.hour, clock.minute);
  const jie = [
    ...getSolarTermsOfYear(ymd.year - 1),
    ...getSolarTermsOfYear(ymd.year),
    ...getSolarTermsOfYear(ymd.year + 1),
  ].filter((term) => term.index % 2 === 0);
  let boundary = null;
  for (const term of jie) {
    if (term.date.getTime() <= at.getTime()) boundary = term;
    else break;
  }
  return boundary
    ? { name: boundary.name, hanja: boundary.hanja, labelKst: formatKstLabel(boundary.date) }
    : null;
}

function getSolarTermWindow(at) {
  const year = Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(at),
  );
  const terms = [
    ...getSolarTermsOfYear(year - 1),
    ...getSolarTermsOfYear(year),
    ...getSolarTermsOfYear(year + 1),
  ];
  let current = null;
  let next = null;
  const ms = at.getTime();
  for (const term of terms) {
    if (term.date.getTime() <= ms) current = term;
    else {
      next = term;
      break;
    }
  }
  if (!current || !next) return null;
  return {
    current: { name: current.name, labelKst: formatKstLabel(current.date) },
    next: { name: next.name, labelKst: formatKstLabel(next.date) },
  };
}

function computeLuck(input) {
  const ymd = parseYmd(input.birthDate);
  if (!ymd) return null;
  const clock = parseHm(input.birthTime) ?? UNKNOWN_TIME;
  const raw = calculateFourPillars({
    year: ymd.year,
    month: ymd.month,
    day: ymd.day,
    hour: clock.hour,
    minute: clock.minute,
    dayBoundary: DAY_BOUNDARY,
    gender: input.gender,
  });
  if (!raw.luckPillars) return null;
  return {
    forward: raw.luckPillars.forward,
    startAge: raw.luckPillars.startAge,
    first: raw.luckPillars.pillars.slice(0, 3).map((item) => ({
      age: item.age,
      korean: item.korean,
      hanja: pillarHanja(item.pillar.heavenlyStem, item.pillar.earthlyBranch),
    })),
  };
}

const BRANCH_ANIMAL = {
  자: '쥐',
  축: '소',
  인: '호랑이',
  묘: '토끼',
  진: '용',
  사: '뱀',
  오: '말',
  미: '양',
  신: '원숭이',
  유: '닭',
  술: '개',
  해: '돼지',
};
const ANIMAL_HARMONY = {
  쥐: '소',
  소: '쥐',
  호랑이: '돼지',
  돼지: '호랑이',
  토끼: '개',
  개: '토끼',
  용: '닭',
  닭: '용',
  뱀: '원숭이',
  원숭이: '뱀',
  말: '양',
  양: '말',
};
const ANIMAL_CLASH = {
  쥐: '말',
  말: '쥐',
  소: '양',
  양: '소',
  호랑이: '원숭이',
  원숭이: '호랑이',
  토끼: '닭',
  닭: '토끼',
  용: '개',
  개: '용',
  뱀: '돼지',
  돼지: '뱀',
};
const ELEMENTS = ['목', '화', '토', '금', '수'];
const TEN_GOD_SCORE = {
  비견: 70,
  겁재: 52,
  식신: 80,
  상관: 58,
  편재: 74,
  정재: 82,
  편관: 54,
  정관: 76,
  편인: 68,
  정인: 78,
};
const ANIMAL_DELTA = { 육합: 12, 같음: 6, 흐름: 0, 육충: -12 };
const ELEMENT_DELTA = { 생함: 10, 생받음: 10, 같음: 5, 극함: -8, 극받음: -10 };
const RELATION_TEN_GOD_DELTA = {
  정재: 12,
  식신: 10,
  정인: 8,
  정관: 6,
  편재: 4,
  비견: 2,
  편인: -2,
  상관: -6,
  겁재: -8,
  편관: -10,
};
const TODAY_TEN_GOD_DELTA = {
  정재: 12,
  식신: 10,
  정인: 8,
  정관: 6,
  편재: 4,
  비견: 0,
  편인: -4,
  상관: -6,
  겁재: -8,
  편관: -12,
};
const SAME_TODAY_TEN_GOD_BONUS = 3;
const SCORE_ORIGIN = 10;
const MAX_POSITIVE_SUM = 12 + 10 + 12 + 12 + 12 + 3; // 61
const SCORE_SCALE_MAX = SCORE_ORIGIN + MAX_POSITIVE_SUM; // 71
const BASE_RAW_MIN = 51;
const BASE_RAW_MAX = 84;
const BASE_MAP_MIN = 35;
const BASE_MAP_MAX = 65;

function baseCorrectionFactor(baseScore) {
  const clamped = Math.max(BASE_RAW_MIN, Math.min(BASE_RAW_MAX, baseScore));
  const mapped =
    BASE_MAP_MIN +
    ((clamped - BASE_RAW_MIN) / (BASE_RAW_MAX - BASE_RAW_MIN)) * (BASE_MAP_MAX - BASE_MAP_MIN);
  return mapped / 100;
}

function natalOf(input) {
  const ymd = parseYmd(input.birthDate);
  if (!ymd) return null;
  const clock = parseHm(input.birthTime) ?? UNKNOWN_TIME;
  const raw = calculateFourPillars({
    year: ymd.year,
    month: ymd.month,
    day: ymd.day,
    hour: clock.hour,
    minute: clock.minute,
    dayBoundary: DAY_BOUNDARY,
  });
  return {
    dayKorean: raw.dayString,
    dayStem: raw.day.heavenlyStem,
    dayBranch: raw.day.earthlyBranch,
    dayMasterElement: getHeavenlyStemElement(raw.day.heavenlyStem),
    animal: BRANCH_ANIMAL[raw.day.earthlyBranch] ?? raw.day.earthlyBranch,
  };
}

function animalRelation(self, other) {
  if (self === other) return { kind: '같음', score: 72 };
  if (ANIMAL_HARMONY[self] === other) return { kind: '육합', score: 86 };
  if (ANIMAL_CLASH[self] === other) return { kind: '육충', score: 48 };
  return { kind: '흐름', score: 66 };
}

function elementRelationKind(self, other) {
  if (self === other) return '같음';
  const a = ELEMENTS.indexOf(self);
  const b = ELEMENTS.indexOf(other);
  const diff = (b - a + 5) % 5;
  if (diff === 1) return '생함';
  if (diff === 4) return '생받음';
  if (diff === 2) return '극함';
  return '극받음';
}

function elementScore(kind) {
  if (kind === '같음') return 74;
  if (kind === '생함' || kind === '생받음') return 82;
  if (kind === '극함') return 58;
  return 54;
}

function computeCompatibility(self, other, at) {
  const selfNatal = natalOf(self);
  const otherNatal = natalOf(other);
  if (!selfNatal || !otherNatal) return null;
  const today = calculateFourPillars({
    year: at.getFullYear(),
    month: at.getMonth() + 1,
    day: at.getDate(),
    hour: UNKNOWN_TIME.hour,
    minute: UNKNOWN_TIME.minute,
    dayBoundary: DAY_BOUNDARY,
  });
  const selfTodayTenGod = getTenGod(selfNatal.dayStem, today.day.heavenlyStem);
  const otherTodayTenGod = getTenGod(otherNatal.dayStem, today.day.heavenlyStem);
  const animal = animalRelation(selfNatal.animal, otherNatal.animal);
  const elementKind = elementRelationKind(selfNatal.dayMasterElement, otherNatal.dayMasterElement);
  const otherToSelfTenGod = getTenGod(selfNatal.dayStem, otherNatal.dayStem);
  const selfToOtherTenGod = getTenGod(otherNatal.dayStem, selfNatal.dayStem);
  const godScore = Math.round(
    ((TEN_GOD_SCORE[otherToSelfTenGod] ?? 66) + (TEN_GOD_SCORE[selfToOtherTenGod] ?? 66)) / 2,
  );
  const baseScore = Math.round(animal.score * 0.4 + elementScore(elementKind) * 0.35 + godScore * 0.25);
  const parts = [
    { key: 'animal', delta: ANIMAL_DELTA[animal.kind] },
    { key: 'element', delta: ELEMENT_DELTA[elementKind] },
    { key: 'relation', delta: RELATION_TEN_GOD_DELTA[otherToSelfTenGod] ?? 0 },
    { key: 'todaySelf', delta: TODAY_TEN_GOD_DELTA[selfTodayTenGod] ?? 0 },
    { key: 'todayOther', delta: TODAY_TEN_GOD_DELTA[otherTodayTenGod] ?? 0 },
  ];
  if (selfTodayTenGod === otherTodayTenGod) {
    parts.push({ key: 'todaySame', delta: SAME_TODAY_TEN_GOD_BONUS });
  }
  const rawTotal = parts.reduce((s, p) => s + p.delta, 0);
  const todayScore = Math.max(
    0,
    Math.min(100, Math.round(((SCORE_ORIGIN + rawTotal) / SCORE_SCALE_MAX) * 100)),
  );
  const factor = baseCorrectionFactor(baseScore);
  const bonus = Math.round((100 - todayScore) * factor);
  const score = Math.max(0, Math.min(100, todayScore + bonus));
  return {
    selfDay: selfNatal.dayKorean,
    otherDay: otherNatal.dayKorean,
    animalKind: animal.kind,
    elementKind,
    otherToSelfTenGod,
    selfTodayTenGod,
    otherTodayTenGod,
    todayPillarKorean: today.dayString,
    baseScore,
    partDeltas: parts.map((p) => p.delta),
    rawTotal,
    todayScore,
    baseCorrectionBonus: bonus,
    dailyDelta: rawTotal,
    score,
  };
}

function assertAdapterSource() {
  const policy = readFileSync(join(repo, 'lib/manseryeok/policy.ts'), 'utf8');
  const compute = readFileSync(join(repo, 'lib/manseryeok/compute.ts'), 'utf8');
  const luck = readFileSync(join(repo, 'lib/manseryeok/luck.ts'), 'utf8');
  const compat = readFileSync(join(repo, 'lib/manseryeok/compatibility.ts'), 'utf8');
  const gunghap = readFileSync(join(repo, 'lib/gunghap.ts'), 'utf8');
  const checks = [
    [policy.includes("DAY_BOUNDARY: DayBoundary = 'jasi'"), 'policy DAY_BOUNDARY=jasi'],
    [policy.includes('USE_TRUE_SOLAR_TIME = false'), 'policy 진태양시 OFF'],
    [policy.includes('hour: 12') && policy.includes('minute: 0'), 'policy 미입력 정오'],
    [compute.includes('dayBoundary: DAY_BOUNDARY'), 'compute dayBoundary'],
    [!compute.includes('trueSolarTime'), 'compute 진태양시 미전달'],
    [compute.includes('hasHour ? toPillar(raw.hour') && compute.includes(': null'), 'compute 시주 null'],
    [luck.includes('gender: input.gender'), 'luck gender'],
    [!luck.includes('trueSolarTime'), 'luck 진태양시 미전달'],
    [compat.includes('computeFourPillars') && compat.includes('getManseryeokPeriod'), 'compat 만세력 재사용'],
    [!compat.includes('trueSolarTime'), 'compat 진태양시 미전달'],
    [gunghap.includes('computeCompatibility') && !gunghap.includes('hashSeed'), 'gunghap 해시 일일변동 제거'],
  ];
  for (const [ok, label] of checks) {
    if (!ok) {
      console.error(`FAIL adapter source: ${label}`);
      process.exit(1);
    }
  }
  console.log('ok   adapter source policy');
}

let failed = 0;

function check(id, ok, detail) {
  if (ok) console.log(`ok   ${id}`);
  else {
    failed += 1;
    console.error(`FAIL ${id}`, detail ?? '');
  }
}

assertAdapterSource();

const pillarFixtures = JSON.parse(
  readFileSync(join(repo, 'lib/manseryeok/fixtures/four-pillars.json'), 'utf8'),
);
for (const fixture of pillarFixtures) {
  const got = pillarCore(
    computeFourPillars({
      birthDate: fixture.birthDate,
      birthTime: fixture.birthTime,
    }),
  );
  check(fixture.id, JSON.stringify(got) === JSON.stringify(fixture.expected), {
    expected: fixture.expected,
    got,
  });
}

const termFixtures = JSON.parse(
  readFileSync(join(repo, 'lib/manseryeok/fixtures/solar-terms.json'), 'utf8'),
);
for (const fixture of termFixtures) {
  if (fixture.birthDate) {
    const got = getMonthBoundaryTerm(fixture.birthDate, fixture.birthTime);
    const ok =
      got?.name === fixture.expected.name && got?.labelKst === fixture.expected.labelKst;
    check(fixture.id, ok, { expected: fixture.expected, got });
  } else {
    const got = getSolarTermWindow(new Date(fixture.atKst));
    const ok =
      got?.current.name === fixture.expected.current.name &&
      got?.current.labelKst === fixture.expected.current.labelKst &&
      got?.next.name === fixture.expected.next.name &&
      got?.next.labelKst === fixture.expected.next.labelKst;
    check(fixture.id, ok, { expected: fixture.expected, got });
  }
}

const luckFixtures = JSON.parse(
  readFileSync(join(repo, 'lib/manseryeok/fixtures/luck-pillars.json'), 'utf8'),
);
for (const fixture of luckFixtures) {
  const got = computeLuck(fixture);
  const ok =
    got?.forward === fixture.expected.forward &&
    got?.startAge === fixture.expected.startAge &&
    JSON.stringify(got.first) === JSON.stringify(fixture.expected.first);
  check(fixture.id, ok, { expected: fixture.expected, got });
}

const compatFixtures = JSON.parse(
  readFileSync(join(repo, 'lib/manseryeok/fixtures/compatibility.json'), 'utf8'),
);
for (const fixture of compatFixtures) {
  const got = computeCompatibility(fixture.self, fixture.other, new Date(fixture.atKst));
  check(fixture.id, JSON.stringify(got) === JSON.stringify(fixture.expected), {
    expected: fixture.expected,
    got,
  });
}

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log(`\nall passed`);
