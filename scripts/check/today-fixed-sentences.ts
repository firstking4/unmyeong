/**
 * 「오늘의 ~」 풀이에 매일 똑같이 붙는 고정 문장 검사.
 *
 * 오늘 카드의 본문을 문장 단위로 쪼개 14일을 겹쳐 본다.
 * 14일 전부에 한 글자도 안 바뀌고 등장하는 문장은 "오늘"이라는 이름 아래서는
 * 어제 읽은 문장이다. 지도·성향·사주·타로·지인·관상을 같은 기준으로 본다.
 *
 * 실행: npx ts-node --project scripts/check/tsconfig.json -r tsconfig-paths/register scripts/check/today-fixed-sentences.ts
 */
import { buildIntegratedFortune } from '@/lib/fortune';
import { buildTodayCompatibility } from '@/lib/gunghap';
import { buildTodayPhysiognomy } from '@/lib/physiognomy';
import { buildSajuReading } from '@/lib/saju';
import { buildSeonghyangReading } from '@/lib/seonghyang';
import { buildTarotReading } from '@/lib/tarot';
import type { ContactProfile, Profile } from '@/lib/types';

const DAYS = 14;
const days = Array.from({ length: DAYS }, (_, i) => new Date(2026, 8, 4 + i));

const profile = {
  name: '박종윤',
  birthDate: '1982-12-11',
  birthTime: '09:50',
  gender: 'male',
  mbti: 'INTJ',
  bloodType: 'A',
  physiognomy: {
    eyes: 'eyes_large_double_upturned',
    nose: 'nose_high_wide',
    mouth: 'mouth_large_full',
    chin: 'chin_round',
  },
} as unknown as Profile;

const contact = { id: 'x', name: '수민', birthDate: '1990-05-02' } as ContactProfile;

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.?!다요음함됨])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);
}

/**
 * 매일 등장하는 고정 문장을 찾는다.
 * 반환: { fixed: 14일 전부 등장하는 문장, total: 1일차 문장 수 }
 */
function fixedSentences(perDay: string[]): { fixed: string[]; dayCount: number } {
  const first = sentences(perDay[0] ?? '');
  const rest = perDay.slice(1).map((t) => new Set(sentences(t)));
  const fixed = first.filter((s) => rest.every((set) => set.has(s)));
  return { fixed, dayCount: first.length };
}

function section(
  label: string,
  perDay: string[],
): { label: string; fixed: string[] } {
  const { fixed } = fixedSentences(perDay);
  console.log(`\n=== ${label} ===`);
  if (fixed.length === 0) {
    console.log('  고정 문장 없음 ✅');
  } else {
    console.log(`  ⚠ ${DAYS}일 내내 같은 문장 ${fixed.length}개:`);
    for (const s of fixed) console.log(`    · ${s.slice(0, 80)}`);
  }
  return { label, fixed };
}

const results: { label: string; fixed: string[] }[] = [];

// 지도 — 오늘의 운세
const fortunes = days.map((d) => buildIntegratedFortune(profile, d));
results.push(
  section(
    '지도 · 오늘의 운세 summary',
    fortunes.map((f) => f.summary ?? ''),
  ),
);

// 성향 — 오늘의 성향
const seongs = days.map((d) => buildSeonghyangReading(profile, {}, d).today);
results.push(
  section(
    '성향 · 오늘의 성향 summary',
    seongs.map((t) => (t as any)?.summary ?? ''),
  ),
);

// 사주 — 오늘의 사주
const sajus = days.map((d) => buildSajuReading(profile.birthDate!, d, profile.birthTime)?.today);
results.push(
  section(
    '사주 · 오늘의 사주 summary',
    sajus.map((t) => (t as any)?.summary ?? ''),
  ),
);

// 타로 — 오늘의 카드
const tarots = days.map((d) => buildTarotReading(profile, d));
results.push(
  section(
    '타로 · 오늘의 카드 blurb',
    tarots.map((t) => t.blurb ?? ''),
  ),
);

// 지인 — 오늘 궁합 (요약 첫 문장 + 한 줄)
const gungs = days.map((d) => buildTodayCompatibility(profile, contact, d));
results.push(
  section(
    '지인 · 자세한 풀이 summary',
    gungs.map((g) => (g as any)?.summary ?? ''),
  ),
);
results.push(
  section(
    '지인 · 오늘의 궁합 summaryLine',
    gungs.map((g) => (g as any)?.summaryLine ?? ''),
  ),
);

// 관상 — 오늘의 관상
const gwan = days.map((d) =>
  buildTodayPhysiognomy(profile.physiognomy as any, d, profile.birthDate),
);
results.push(
  section(
    '관상 · 오늘의 관상 summary',
    gwan.map((g) => g.summary ?? ''),
  ),
);

const totalFixed = results.reduce((a, r) => a + r.fixed.length, 0);
console.log(`\n────────────────────────`);
console.log(`고정 문장 합계: ${totalFixed}개`);
if (totalFixed > 0) {
  console.log('「오늘」이라는 이름의 카드에 어제 문장이 그대로 있습니다.');
  process.exitCode = 1;
}
