/**
 * 지인 궁합 등급 분포·문구 다변화 실측.
 *
 * 여러 나 × 여러 지인 조합을 여러 날 돌려서
 *  - 주의/조심/무난/좋음/최고 비율
 *  - 같은 지인을 매일 볼 때 등급이 얼마나 움직이는지
 *  - 문구 필드별 고유값·연속 중복
 * 을 함께 본다.
 */
import { buildTodayCompatibility } from '@/lib/gunghap';
import type { ContactProfile, Profile } from '@/lib/types';

const GRADES = ['주의', '조심', '무난', '좋음', '최고'] as const;

function randomBirthDate(seed: number): string {
  // 결정적 의사난수 — 실행마다 같은 표본
  let h = (seed * 2654435761) >>> 0;
  const next = (n: number) => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h % n;
  };
  const year = 1960 + next(45);
  const month = 1 + next(12);
  const day = 1 + next(28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const SELF_COUNT = 40;
const CONTACT_COUNT = 15;
const DAYS = 30;

const selves: Profile[] = Array.from({ length: SELF_COUNT }, (_, i) => ({
  name: `나${i}`,
  birthDate: randomBirthDate(i + 1),
  birthTime: i % 3 === 0 ? '09:50' : undefined,
  gender: i % 2 === 0 ? 'male' : 'female',
})) as Profile[];

const days = Array.from({ length: DAYS }, (_, i) => new Date(2026, 8, 4 + i));

const gradeCount: Record<string, number> = {};
const scores: number[] = [];
let total = 0;

// 같은 지인을 매일 볼 때 등급이 며칠에 한 번 바뀌는지
let gradeChanges = 0;
let gradeTransitions = 0;
const perPairDistinctGrades: number[] = [];

for (const [selfIdx, self] of selves.entries()) {
  for (let c = 0; c < CONTACT_COUNT; c++) {
    const contact = {
      id: `c${c}`,
      name: `지인${c}`,
      birthDate: randomBirthDate(1000 + selfIdx * 100 + c),
    } as ContactProfile;

    const seq = days.map((d) => buildTodayCompatibility(self, contact, d));
    if (!seq[0].ready) continue;

    const grades = seq.map((r) => r.grade);
    perPairDistinctGrades.push(new Set(grades).size);
    for (let i = 1; i < grades.length; i++) {
      gradeTransitions++;
      if (grades[i] !== grades[i - 1]) gradeChanges++;
    }

    for (const r of seq) {
      gradeCount[r.grade] = (gradeCount[r.grade] ?? 0) + 1;
      scores.push(r.score);
      total++;
    }
  }
}

scores.sort((a, b) => a - b);
const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;
const quantile = (q: number) => scores[Math.floor(scores.length * q)];

console.log(`표본: 나 ${SELF_COUNT}명 × 지인 ${CONTACT_COUNT}명 × ${DAYS}일 = ${total}건\n`);

console.log('=== 등급 분포 ===');
for (const g of GRADES) {
  const n = gradeCount[g] ?? 0;
  const bar = '█'.repeat(Math.round((n / total) * 60));
  console.log(`  ${g}  ${pct(n).padStart(6)}  ${bar}`);
}

console.log('\n=== 점수 분포 ===');
console.log(`  최소 ${scores[0]} · 최대 ${scores[scores.length - 1]}`);
console.log(
  `  10% ${quantile(0.1)} · 25% ${quantile(0.25)} · 중앙 ${quantile(0.5)} · 75% ${quantile(0.75)} · 90% ${quantile(0.9)}`,
);
console.log(`  평균 ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}`);

console.log('\n=== 등급 체감 변화 (같은 지인을 매일 볼 때) ===');
console.log(`  하루 만에 등급이 바뀌는 비율: ${((gradeChanges / gradeTransitions) * 100).toFixed(1)}%`);
const avgDistinct =
  perPairDistinctGrades.reduce((a, b) => a + b, 0) / perPairDistinctGrades.length;
console.log(`  ${DAYS}일간 한 지인에게서 보는 등급 종류: 평균 ${avgDistinct.toFixed(2)}가지`);

console.log('\n=== 등급 기준 ===');
console.log('  주의 <50 · 조심 50~59 · 무난 60~74 · 좋음 75~89 · 최고 ≥90');

// 사람 고유(기본 궁합) 성분이 그날 변동에 묻히는지
const pairMeans: number[] = [];
const withinVars: number[] = [];
const sameDaySpreads: number[] = [];

for (let s = 0; s < 25; s++) {
  const self = selves[s % selves.length];
  const contacts = Array.from(
    { length: 8 },
    (_, c) => ({ id: `c${c}`, name: `지인${c}`, birthDate: randomBirthDate(9000 + s * 80 + c) }) as ContactProfile,
  );
  const perContact = contacts.map((c) => days.map((d) => buildTodayCompatibility(self, c, d)));
  if (!perContact[0][0].ready) continue;

  for (const seq of perContact) {
    const vals = seq.map((r) => r.score);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    pairMeans.push(mean);
    withinVars.push(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  }
  for (let d = 0; d < DAYS; d++) {
    const dayScores = perContact.map((seq) => seq[d].score);
    sameDaySpreads.push(Math.max(...dayScores) - Math.min(...dayScores));
  }
}

const grandMean = pairMeans.reduce((a, b) => a + b, 0) / pairMeans.length;
const betweenVar = pairMeans.reduce((a, b) => a + (b - grandMean) ** 2, 0) / pairMeans.length;
const withinVar = withinVars.reduce((a, b) => a + b, 0) / withinVars.length;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

console.log('\n=== 사람 고유 vs 그날 변동 ===');
console.log(`  쌍 간 표준편차 (사람 고유): ${Math.sqrt(betweenVar).toFixed(1)}점`);
console.log(`  쌍 내 표준편차 (그날 변동): ${Math.sqrt(withinVar).toFixed(1)}점`);
console.log(
  `  사람 고유가 설명하는 비율: ${((betweenVar / (betweenVar + withinVar)) * 100).toFixed(1)}%`,
);
console.log(`  같은 날 지인 8명 점수 차이: 평균 ${mean(sameDaySpreads).toFixed(1)}점`);
console.log('  (이 비율이 낮으면 지인마다의 궁합이 그날 운에 묻힌다)');
