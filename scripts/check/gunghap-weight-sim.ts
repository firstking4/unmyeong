/**
 * 「사람 고유 비중을 올리면 좋은 지인은 계속 좋고 나쁜 지인은 계속 나쁘지 않을까」
 * 를 수치로 확인하는 what-if 시뮬레이션.
 *
 * 기본 궁합 편차를 쌍 평균에 k배로 얹어 보고,
 *  - 사람 고유가 설명하는 비율 (지인 구분 가능성)
 *  - 부정 등급(주의·조심)에 갇히는 최악 쌍
 *  - 모든 쌍이 60일 안에 좋음 이상을 며칠 보는가
 * 를 함께 본다. 갇히는 쌍이 생기는 지점이 상한선이다.
 */
import { buildTodayCompatibility } from '@/lib/gunghap';
import type { ContactProfile, Profile } from '@/lib/types';

function bd(seed: number): string {
  let h = (seed * 2654435761) >>> 0;
  const next = (n: number) => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h % n;
  };
  return `${1960 + next(45)}-${String(1 + next(12)).padStart(2, '0')}-${String(1 + next(28)).padStart(2, '0')}`;
}

const DAYS = 60;
const days = Array.from({ length: DAYS }, (_, i) => new Date(2026, 8, 4 + i));

// 실제 엔진을 한 번만 돌리고, 가중치별로 후처리해서 비교
type Pair = { base: number; scores: number[] };
const pairs: Pair[] = [];

for (let s = 0; s < 40; s++) {
  const self = {
    name: `나${s}`,
    birthDate: bd(s + 1),
    gender: s % 2 === 0 ? 'male' : 'female',
  } as Profile;
  for (let c = 0; c < 10; c++) {
    const contact = { id: `c${c}`, name: `지인${c}`, birthDate: bd(9000 + s * 80 + c) } as ContactProfile;
    const seq = days.map((d) => buildTodayCompatibility(self, contact, d));
    if (!seq[0].ready) continue;
    pairs.push({ base: seq[0].baseScore, scores: seq.map((r) => r.score) });
  }
}

const bases = pairs.map((p) => p.base);
const baseMean = bases.reduce((a, b) => a + b, 0) / bases.length;
const baseStd = Math.sqrt(bases.reduce((a, b) => a + (b - baseMean) ** 2, 0) / bases.length);

console.log(`쌍 ${pairs.length}개 × ${DAYS}일`);
console.log(`기본 궁합: 평균 ${baseMean.toFixed(1)} · 표준편차 ${baseStd.toFixed(1)} · 범위 ${Math.min(...bases)}~${Math.max(...bases)}\n`);

function grade(score: number): string {
  if (score >= 90) return '최고';
  if (score >= 75) return '좋음';
  if (score >= 60) return '무난';
  if (score >= 50) return '조심';
  return '주의';
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * kUp / kDown 을 따로 둔다.
 * kDown 을 작게 하면 낮은 궁합이 아래로 눌리지 않아 「계속 나쁜 지인」이 안 생긴다.
 */
const CASES: { label: string; up: number; down: number; offset?: number }[] = [
  { label: '현재', up: 0, down: 0 },
  { label: '대칭 0.7', up: 0.7, down: 0.7 },
  { label: '대칭 1.0', up: 1.0, down: 1.0 },
  { label: '비대칭 2.0/0.0', up: 2.0, down: 0.0 },
  // 위로 부푼 분포를 전체 하향으로 되돌리면 갇힘이 다시 생기는지
  { label: '비대칭 2.0/0.0 −4', up: 2.0, down: 0.0, offset: -4 },
  { label: '비대칭 2.0/0.0 −6', up: 2.0, down: 0.0, offset: -6 },
  { label: '비대칭 2.0/0.0 −8', up: 2.0, down: 0.0, offset: -8 },
];

for (const { label, up, down, offset = 0 } of CASES) {
  const shifted = pairs.map((p) => {
    const dev = p.base - baseMean;
    const shift = (dev >= 0 ? dev * up : dev * down) + offset;
    return { base: p.base, scores: p.scores.map((s) => clamp(s + shift)) };
  });

  const pairMeans = shifted.map((p) => p.scores.reduce((a, b) => a + b, 0) / p.scores.length);
  const grandMean = pairMeans.reduce((a, b) => a + b, 0) / pairMeans.length;
  const betweenVar = pairMeans.reduce((a, b) => a + (b - grandMean) ** 2, 0) / pairMeans.length;
  const withinVar =
    shifted.reduce((acc, p, i) => {
      const m = pairMeans[i];
      return acc + p.scores.reduce((a, b) => a + (b - m) ** 2, 0) / p.scores.length;
    }, 0) / shifted.length;

  const dist: Record<string, number> = {};
  let total = 0;
  // 쌍별로: 부정 등급 일수, 좋음 이상 일수
  const negDays: number[] = [];
  const goodDays: number[] = [];

  for (const p of shifted) {
    let neg = 0;
    let good = 0;
    for (const s of p.scores) {
      const g = grade(s);
      dist[g] = (dist[g] ?? 0) + 1;
      total++;
      if (g === '주의' || g === '조심') neg++;
      if (g === '좋음' || g === '최고') good++;
    }
    negDays.push(neg);
    goodDays.push(good);
  }

  const share = (betweenVar / (betweenVar + withinVar)) * 100;
  const pct = (g: string) => (((dist[g] ?? 0) / total) * 100).toFixed(1).padStart(4);

  console.log(`── ${label}  (up ${up} / down ${down})`);
  console.log(`   사람 고유 비율 ${share.toFixed(1)}%`);
  console.log(
    `   분포  주의 ${pct('주의')}% · 조심 ${pct('조심')}% · 무난 ${pct('무난')}% · 좋음 ${pct('좋음')}% · 최고 ${pct('최고')}%`,
  );
  console.log(
    `   부정 등급 일수 (60일 중): 평균 ${(negDays.reduce((a, b) => a + b, 0) / negDays.length).toFixed(1)}일 · 최악 쌍 ${Math.max(...negDays)}일`,
  );
  console.log(
    `   좋음 이상 일수 (60일 중): 평균 ${(goodDays.reduce((a, b) => a + b, 0) / goodDays.length).toFixed(1)}일 · 최소 쌍 ${Math.min(...goodDays)}일`,
  );
  console.log(`   좋음을 한 번도 못 보는 쌍: ${goodDays.filter((d) => d === 0).length}개`);
  console.log(`   부정이 절반(30일) 넘는 쌍: ${negDays.filter((d) => d > 30).length}개\n`);
}
