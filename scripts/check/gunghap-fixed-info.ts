/**
 * 자세한 풀이에서 「정보」가 얼마나 고정인지.
 *
 * 같은 지인에 대해 30일 내내 바뀌는 것 vs 바뀌지 않는 것을 나눠서 본다.
 * 문장이 매일 달라도 안에 든 정보가 같으면 "같은 얘기"로 들린다.
 */
import { buildTodayCompatibility } from '@/lib/gunghap';
import type { ContactProfile, Profile } from '@/lib/types';

const self = { name: '박종윤', birthDate: '1982-12-11', gender: 'male' } as Profile;
const contact = { id: 'x', name: '수민', birthDate: '1990-05-02' } as ContactProfile;

const DAYS = 14;
const days = Array.from({ length: DAYS }, (_, i) => new Date(2026, 8, 4 + i));
const seq = days.map((d) => buildTodayCompatibility(self, contact, d));

// relationship 문장을 「오늘/이달/올해/오행」 구간으로 나눠 각각 며칠이나 바뀌는지
function splitRel(rel: string) {
  const sentences = rel.split('.').map((s) => s.trim()).filter(Boolean);
  return {
    today: sentences[0] ?? '',
    month: sentences[1] ?? '',
    year: sentences[2] ?? '',
    element: sentences[3] ?? '',
  };
}

console.log(`박종윤–수민 ${DAYS}일, relationship 문장 구간별 변화\n`);
console.log('날짜       오늘          이달          올해          오행');
for (let i = 0; i < DAYS; i++) {
  const r = seq[i];
  const label = days[i].toISOString().slice(5, 10);
  const p = splitRel(r.relationship);
  // 내용이 바뀌는지만 보려고 앞 10글자만
  const cut = (s: string) => s.replace(/\s/g, '').slice(0, 14);
  console.log(`${label}  ${cut(p.today)}  ${cut(p.month)}  ${cut(p.year)}  ${cut(p.element)}`);
}

console.log('\n=== 각 구간의 고유값 수 (14일) ===');
const parts = seq.map((r) => splitRel(r.relationship));
for (const k of ['today', 'month', 'year', 'element'] as const) {
  const vals = parts.map((p) => p[k].replace(/\s/g, '').slice(0, 20));
  console.log(`  ${k}: ${new Set(vals).size}가지`);
}

console.log('\n=== summary 도 마찬가지인지 ===');
console.log('summary는 띠·오행·관계 십신 모두 생년 고정값이라 내용은 100% 고정, 어법만 회전.');
