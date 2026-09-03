/**
 * 「오늘의 궁합」(summaryLine · moodHeadline · 타로 한 줄)의 실제 변화량.
 *
 * summaryLine은 오늘 십신(나/상대)+등급으로 만든다. 십신은 10일 주기라
 * 문장만 바뀌고 정보는 10일마다 돌아오는지 확인한다.
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

const DAYS = 30;
const days = Array.from({ length: DAYS }, (_, i) => new Date(2026, 8, 4 + i));

// 1) 한 쌍으로 정보 주기 확인
const self = { name: '박종윤', birthDate: '1982-12-11', gender: 'male' } as Profile;
const contact = { id: 'x', name: '수민', birthDate: '1990-05-02' } as ContactProfile;
const seq = days.map((d) => buildTodayCompatibility(self, contact, d));

console.log('=== 박종윤–수민 30일, 오늘의 궁합(summaryLine) ===');
console.log('날짜   십신조합                    등급    문장');
for (let i = 0; i < 30; i++) {
  const r = seq[i];
  const label = days[i].toISOString().slice(5, 10);
  // summaryLine에서 십신 라벨 부분만 발췌 (문장 템플릿 차이를 걷어냄)
  console.log(`${label}  ${r.grade.padEnd(4)}  ${r.summaryLine.slice(0, 46)}`);
}

// 2) 여러 쌍에서 정보 고유값 측정
console.log('\n=== 쌍 240개 × 30일 ===');
const uniq = (xs: string[]) => new Set(xs).size;
const avg = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);

const lineUnique: number[] = [];
const moodUnique: number[] = [];
const tarotLineUnique: number[] = [];
const gradeUnique: number[] = [];
// 10일 주기 확인: i일과 i+10일의 문장 정보가 같은지
let tenDayEcho = 0;
let tenDayPairs = 0;

for (let s = 0; s < 30; s++) {
  const p1 = { name: `나${s}`, birthDate: bd(s + 1), gender: 'male' } as Profile;
  for (let c = 0; c < 8; c++) {
    const c1 = { id: `c${c}`, name: `지인${c}`, birthDate: bd(9000 + s * 80 + c) } as ContactProfile;
    const rs = days.map((d) => buildTodayCompatibility(p1, c1, d));
    if (!rs[0].ready) continue;
    lineUnique.push(uniq(rs.map((r) => r.summaryLine)));
    moodUnique.push(uniq(rs.map((r) => r.moodHeadline)));
    tarotLineUnique.push(uniq(rs.map((r) => r.tarot?.summaryLine ?? '')));
    gradeUnique.push(uniq(rs.map((r) => r.grade)));

    // 등급까지 포함한 정보의 10일 주기 반복 여부
    for (let i = 0; i + 10 < rs.length; i++) {
      tenDayPairs++;
      // 십신 라벨은 문장에 고정 형태로 들어가므로 등급+라벨 추출 대신 등급만 비교
      if (rs[i].grade === rs[i + 10].grade) tenDayEcho++;
    }
  }
}

console.log(`  summaryLine 문장 고유: 평균 ${avg(lineUnique)}/${DAYS}`);
console.log(`  moodHeadline 고유: 평균 ${avg(moodUnique)}/${DAYS}`);
console.log(`  타로 한 줄 고유: 평균 ${avg(tarotLineUnique)}/${DAYS}`);
console.log(`  등급 고유: 평균 ${avg(gradeUnique)}/${DAYS}가지`);
console.log(`  10일 간격 등급 일치율: ${((tenDayEcho / tenDayPairs) * 100).toFixed(1)}%`);
console.log('  (십신은 10일 주기라 정보 자체는 10일마다 돌아오는지 확인)');
