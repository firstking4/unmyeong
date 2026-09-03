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

/**
 * 지인에게 계속 붙으면 곤란한 표현.
 *
 * 조심할 점(오늘 할 행동)은 검사 대상이 아니다. 그건 사람에 대한 판정이
 * 아니라 하루짜리 조언이라 매일 바뀐다. 여기서 잡는 건 고정값에 물려
 * 영원히 따라다니는 말이다.
 */
const NEGATIVE = [
  '부딪치',
  '힘겨루기',
  '압박',
  '부담',
  '다툼',
  '서두름',
  '마찰',
  '맞서',
  '밀어내',
  '밀릴',
  '누릅니다',
  '눌러',
  '조심스러운',
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

    // 키워드뿐 아니라 매일 노출되는 요약 본문까지 본다
    const hits = seq.map((r) => {
      const text = [...r.keywords, r.summary, r.summaryLine].join(' ');
      return NEGATIVE.filter((n) => text.includes(n));
    });
    const negDays = hits.filter((h) => h.length > 0).length;

    if (negDays > 0) everNegative++;
    if (negDays === DAYS) {
      alwaysNegative++;
      if (samples.length < 5) {
        samples.push(
          `${self.name}–${contact.name}: ${seq[0].summary}   ← ${[...new Set(hits[0])].join(', ')}`,
        );
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
console.log('');
console.log('  앞 숫자는 높아도 된다 — 마찰을 솔직히 말한다는 뜻이다.');
console.log('  뒤 숫자가 「그 지인에게 영구히 붙는 딱지」이고, 0이어야 한다.');
console.log(
  alwaysNegative === 0
    ? '\n  ✅ 영구 딱지 없음'
    : `\n  ❌ ${alwaysNegative}개 쌍이 고정 부정 표현을 달고 있다`,
);
console.log('');

if (samples.length) {
  console.log('  예시:');
  for (const s of samples) console.log(`    ${s}`);
}

const avgFirst = firstWordFixed.reduce((a, b) => a + b, 0) / firstWordFixed.length;
console.log(`\n=== 키워드 첫 단어 ===`);
console.log(`  ${DAYS}일간 첫 단어 종류: 평균 ${avgFirst.toFixed(2)}가지`);
console.log(`  첫 단어가 완전히 고정인 쌍: ${firstWordFixed.filter((n) => n === 1).length}개 (${pct(firstWordFixed.filter((n) => n === 1).length)})`);
