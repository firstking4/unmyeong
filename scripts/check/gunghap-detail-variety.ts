/**
 * 지인 「자세한 풀이」 문장 다양성.
 *
 * 요약(summary)은 문구만 돌고 정보(띠·오행·관계 십신)가 고정이라
 * 날마다 같은 말로 들릴 수 있다. 고유 문장 수와 고유 단어 수로 본다.
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

function uniq(xs: string[]) {
  return new Set(xs).size;
}

const summaryUnique: number[] = [];
const summaryWords: number[] = [];
const relUnique: number[] = [];
const relWords: number[] = [];
const guidanceUnique: number[] = [];

for (let s = 0; s < 30; s++) {
  const self = { name: `나${s}`, birthDate: bd(s + 1), gender: 'male' } as Profile;
  for (let c = 0; c < 8; c++) {
    const contact = { id: `c${c}`, name: `지인${c}`, birthDate: bd(9000 + s * 80 + c) } as ContactProfile;
    const seq = days.map((d) => buildTodayCompatibility(self, contact, d));
    if (!seq[0].ready) continue;

    const summaries = seq.map((r) => r.summary);
    const rels = seq.map((r) => r.relationship);
    const guids = seq.map((r) => r.guidance);

    summaryUnique.push(uniq(summaries));
    summaryWords.push(uniq(summaries.flatMap((t) => t.split(/\s+/))));
    relUnique.push(uniq(rels));
    relWords.push(uniq(rels.flatMap((t) => t.split(/\s+/))));
    guidanceUnique.push(uniq(guids));
  }
}

const avg = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);

console.log(`쌍 ${summaryUnique.length}개 × ${DAYS}일\n`);
console.log('=== 자세한 풀이 30일치 ===');
console.log(`  요약(summary) 고유 문장: 평균 ${avg(summaryUnique)}/${DAYS}`);
console.log(`  요약 고유 단어 수: 평균 ${avg(summaryWords)}개  ← 낮으면 문구만 바뀌고 내용은 같음`);
console.log(`  오늘·이달·올해(relationship) 고유 문장: 평균 ${avg(relUnique)}/${DAYS}`);
console.log(`  오늘·이달·올해 고유 단어 수: 평균 ${avg(relWords)}개`);
console.log(`  해보기(guidance) 고유 문장: 평균 ${avg(guidanceUnique)}/${DAYS}`);

console.log('\n=== 해석 ===');
console.log('  요약 고유 단어가 ~15개 안팎이면, 띠/오행/관계 라벨 몇 개를 계속 재조합하는 것.');
console.log('  relationship은 오늘 십신이 들어가지만 이달·올해는 월·년 단위라 거의 고정.');
