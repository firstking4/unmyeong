/**
 * 「고정된 부정 낙인」 검사.
 *
 * 점수는 매일 바뀌어서 나쁜 날이 있어도 내일을 기대할 수 있다.
 * 그런데 띠 결·오행·관계 십신은 두 사람의 생년월일로 정해지는 고정값이라,
 * 여기에 붙은 부정 표현은 그 지인에게 영구 딱지가 된다.
 * 점수에서 피한 문제가 문구에 남아 있는지 본다.
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

/** 지인에게 계속 붙으면 곤란한 표현 */
const NEGATIVE = [
  '부딪치기 쉬운',
  '힘겨루기 쉬운',
  '압박',
  '부담',
  '다툼',
  '서두름',
];

const DAYS = 60;
const days = Array.from({ length: DAYS }, (_, i) => new Date(2026, 8, 4 + i));

let pairCount = 0;
let everNegative = 0;
let alwaysNegative = 0;
const firstWordFixed: number[] = [];
const samples: string[] = [];

for (let s = 0; s < 40; s++) {
  const self = { name: `나${s}`, birthDate: bd(s + 1), gender: 'male' } as Profile;
  for (let c = 0; c < 10; c++) {
    const contact = { id: `c${c}`, name: `지인${c}`, birthDate: bd(9000 + s * 80 + c) } as ContactProfile;
    const seq = days.map((d) => buildTodayCompatibility(self, contact, d));
    if (!seq[0].ready) continue;
    pairCount++;

    const negDays = seq.filter((r) =>
      r.keywords.some((k) => NEGATIVE.some((n) => k.includes(n))),
    ).length;

    if (negDays > 0) everNegative++;
    if (negDays === DAYS) {
      alwaysNegative++;
      if (samples.length < 5) {
        const hit = seq[0].keywords.filter((k) => NEGATIVE.some((n) => k.includes(n)));
        samples.push(`${self.name}–${contact.name}: ${seq[0].keywords.join(' · ')}   ← ${hit.join(', ')}`);
      }
    }

    firstWordFixed.push(new Set(seq.map((r) => r.keywords[0])).size);
  }
}

const pct = (n: number) => `${((n / pairCount) * 100).toFixed(1)}%`;

console.log(`쌍 ${pairCount}개 × ${DAYS}일\n`);
console.log('=== 지인 키워드의 고정 부정 표현 ===');
console.log(`  한 번이라도 부정 표현이 뜨는 쌍: ${everNegative}개 (${pct(everNegative)})`);
console.log(`  ${DAYS}일 내내 부정 표현이 붙는 쌍: ${alwaysNegative}개 (${pct(alwaysNegative)})`);
console.log('  → 뒤쪽 숫자가 「그 지인에게 영구히 붙는 딱지」다\n');

if (samples.length) {
  console.log('  예시:');
  for (const s of samples) console.log(`    ${s}`);
}

const avgFirst = firstWordFixed.reduce((a, b) => a + b, 0) / firstWordFixed.length;
console.log(`\n=== 키워드 첫 단어 ===`);
console.log(`  ${DAYS}일간 첫 단어 종류: 평균 ${avgFirst.toFixed(2)}가지`);
console.log(`  첫 단어가 완전히 고정인 쌍: ${firstWordFixed.filter((n) => n === 1).length}개 (${pct(firstWordFixed.filter((n) => n === 1).length)})`);
