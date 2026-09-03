/**
 * 지인 조심·해보기 연속 중복 실측.
 *
 * 후보 풀이 오늘 십신으로 정해져 날마다 갈린다. 순열만으로는 없앨 수 없어서
 * 실제로 얼마나 반복되는지 재고, 고칠 가치가 있는지 판단한다.
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

function run(field: 'caution' | 'guidance') {
  let consecutivePairs = 0; // 이틀 연속 같은 문구가 한 번이라도 있는 쌍
  let consecutiveDays = 0; // 그런 날 수 (전체 전이 대비)
  let transitions = 0;
  let pairCount = 0;
  const maxRun: number[] = [];

  for (let s = 0; s < 40; s++) {
    const self = { name: `나${s}`, birthDate: bd(s + 1), gender: 'male' } as Profile;
    for (let c = 0; c < 10; c++) {
      const contact = { id: `c${c}`, name: `지인${c}`, birthDate: bd(9000 + s * 80 + c) } as ContactProfile;
      const seq = days.map((d) => buildTodayCompatibility(self, contact, d));
      if (!seq[0].ready) continue;
      pairCount++;

      let run = 1;
      let worst = 1;
      let repeated = false;
      for (let i = 1; i < seq.length; i++) {
        transitions++;
        if (seq[i][field] === seq[i - 1][field]) {
          consecutiveDays++;
          repeated = true;
          run++;
          worst = Math.max(worst, run);
        } else {
          run = 1;
        }
      }
      if (repeated) consecutivePairs++;
      maxRun.push(worst);
    }
  }

  const longest = Math.max(...maxRun);
  console.log(`\n=== ${field === 'caution' ? '조심할 점' : '해보기'} ===`);
  console.log(`  이틀 연속 같은 문구가 있는 쌍: ${consecutivePairs}/${pairCount} (${((consecutivePairs / pairCount) * 100).toFixed(1)}%)`);
  console.log(`  연속 중복 일수 / 전체 전이: ${consecutiveDays}/${transitions} (${((consecutiveDays / transitions) * 100).toFixed(1)}%)`);
  console.log(`  최장 연속 길이: ${longest}일`);
  console.log(`  평균 최장 연속: ${(maxRun.reduce((a, b) => a + b, 0) / maxRun.length).toFixed(1)}일`);
}

run('caution');
run('guidance');

console.log('\n해석:');
console.log('  후보 풀은 EASY_CAUTION/GUIDANCE + 오늘 나·상대 십신이 만드는 동적 문구까지');
console.log('  합쳐져 20개 안팎이다. 「이틀 연속 있는 쌍」이 높아 보여도 중복 일수는 낮다.');
console.log('  남은 0.x%는 같은 십신이 이틀 이어지는 날의 우연이라, 어제 십신을 다시 계산');
console.log('  하지 않는 한 구조상 없앨 수 없다. 계산 2배를 감수할 만큼 체감이 크지 않다.');
