/**
 * 오늘의 운세 다양성 점검.
 *
 * 1. 일일 팩 문구가 사용자마다 다른 순서로 돌고, 연속 이틀 같은 변주가 없는지
 * 2. 지도 오늘의 운세 점수가 며칠 주기로 반복되는지 (출생시각 없는 경우 포함)
 *
 * 실행: node scripts/verify-daily-variety.mjs
 */
import { getBranchTenGod, getTenGod } from 'manseryeok';

import { pickDailyFrom } from './lib/daily-pick.mjs';

const DAYS = 120;
const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

/** dayNumber가 곧 UTC epoch 일수라, 그 날짜를 되돌려 pickDailyFrom에 넘긴다. */
function dateFromDayNumber(day) {
  return new Date(day * 86_400_000);
}

function pickIndex(length, salt, day) {
  const items = Array.from({ length }, (_, i) => i);
  return pickDailyFrom(items, salt, dateFromDayNumber(day));
}

/** lib/manseryeok/personalFortune.ts 와 동일 상수 */
const TODAY_STEM = { 정재: 32, 식신: 28, 정인: 20, 정관: 16, 편재: 12, 비견: 0, 편인: -12, 상관: -16, 겁재: -20, 편관: -32 };
const TODAY_BRANCH = { 정재: 14, 식신: 12, 정인: 9, 정관: 7, 편재: 5, 비견: 0, 편인: -5, 상관: -7, 겁재: -9, 편관: -14 };
const MONTH = { 정재: 23, 식신: 20, 정인: 14, 정관: 12, 편재: 9, 비견: 0, 편인: -9, 상관: -12, 겁재: -14, 편관: -23 };
const YEAR = { 정재: 12, 식신: 12, 정인: 9, 정관: 6, 편재: 6, 비견: 0, 편인: -6, 상관: -6, 겁재: -9, 편관: -12 };
const ORIGIN = 44;
const SCALE_MAX = 94;
const AMPLITUDE = 0.8;
const CORRECTION = 0.42;

function finalScore(raw) {
  const today = Math.max(
    0,
    Math.min(100, Math.round(((ORIGIN + Math.round(raw * AMPLITUDE)) / SCALE_MAX) * 100)),
  );
  return Math.max(0, Math.min(100, today + Math.round((100 - today) * CORRECTION)));
}

const problems = [];

// 1. 팩 순서 — 사용자별 상이 · 연속 중복 없음
const POOL = 24;
const salts = ['A:1982-12-11', 'B:1990-05-02', 'C:2001-09-30'];
// 바퀴 경계에 맞춰 시작해야 "첫 바퀴에 전 변주 1회" 검사가 성립한다
const START_DAY = Math.ceil(20000 / POOL) * POOL;
const series = salts.map((salt) =>
  Array.from({ length: DAYS }, (_, d) => pickIndex(POOL, salt, START_DAY + d)),
);

for (const [i, salt] of salts.entries()) {
  for (let d = 1; d < DAYS; d++) {
    if (series[i][d] === series[i][d - 1]) {
      problems.push(`${salt}: ${d}일째 연속 같은 변주 (${series[i][d]})`);
    }
  }
}

const identicalPairs = [];
for (let a = 0; a < salts.length; a++) {
  for (let b = a + 1; b < salts.length; b++) {
    if (series[a].every((v, i) => v === series[b][i])) identicalPairs.push(`${salts[a]} ≡ ${salts[b]}`);
  }
}
if (identicalPairs.length) problems.push(`사용자 순서 동일: ${identicalPairs.join(', ')}`);

// 첫 24일 안에 전 변주가 한 번씩 — 순열이므로 중복 없어야 함
for (const [i, salt] of salts.entries()) {
  const firstCycle = new Set(series[i].slice(0, POOL));
  if (firstCycle.size !== POOL) problems.push(`${salt}: 첫 ${POOL}일에 중복 (${firstCycle.size}종)`);
}

// 2. 점수 주기 — 출생시각 없는 사용자(시주 보정 0)
const cycles = [];
for (const natal of STEMS) {
  const scores = Array.from({ length: 60 }, (_, i) =>
    finalScore(
      TODAY_STEM[getTenGod(natal, STEMS[i % 10])] +
        TODAY_BRANCH[getBranchTenGod(natal, BRANCHES[i % 12])] +
        MONTH['비견'] +
        YEAR['비견'],
    ),
  );
  cycles.push(new Set(scores).size);

  // 10일 주기로 완전히 반복되면 회귀
  const repeatsEvery10 = scores.every((s, i) => s === scores[i % 10]);
  if (repeatsEvery10) problems.push(`일간 ${natal}: 점수가 10일 주기로 반복`);
}

// 3. 등급 분포 — 주의·최고가 사라지지 않았는지
const grade = (s) => (s >= 90 ? '최고' : s >= 75 ? '좋음' : s >= 60 ? '무난' : s >= 50 ? '조심' : '주의');
const dist = {};
let total = 0;
for (const natal of STEMS) {
  for (let i = 0; i < 60; i++) {
    const base =
      TODAY_STEM[getTenGod(natal, STEMS[i % 10])] +
      TODAY_BRANCH[getBranchTenGod(natal, BRANCHES[i % 12])];
    for (const mk of Object.keys(MONTH)) {
      for (const yk of Object.keys(YEAR)) {
        for (const h of [6, 0, -6]) {
          const g = grade(finalScore(base + MONTH[mk] + YEAR[yk] + h));
          dist[g] = (dist[g] ?? 0) + 1;
          total++;
        }
      }
    }
  }
}
for (const g of ['주의', '최고']) {
  const pct = ((dist[g] ?? 0) * 100) / total;
  if (pct < 2) problems.push(`${g} 등급 비율 ${pct.toFixed(1)}% — 너무 희소`);
}

if (problems.length) {
  console.error('verify:daily-variety FAILED');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log('verify:daily-variety OK');
console.log(`  문구: ${POOL}종 순열 · ${DAYS}일 연속 중복 없음 · 사용자별 순서 상이`);
console.log(`  점수: 60일 중 서로 다른 값 ${Math.min(...cycles)}~${Math.max(...cycles)}개 (10일 반복 없음)`);
console.log(
  `  등급: ${['주의', '조심', '무난', '좋음', '최고']
    .map((g) => `${g} ${(((dist[g] ?? 0) * 100) / total).toFixed(1)}%`)
    .join(' · ')}`,
);
