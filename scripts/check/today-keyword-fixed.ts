/**
 * 「오늘의 ~」 카드 칩이 매일 같은 말로 고정되는지 검사.
 *
 * 실행: npm run check:today-keywords-fixed
 */
import { buildTodayCompatibility } from '@/lib/gunghap';
import { buildTodayPhysiognomy } from '@/lib/physiognomy';
import { buildSajuReading } from '@/lib/saju';
import { buildSeonghyangReading } from '@/lib/seonghyang';
import { buildTarotReading } from '@/lib/tarot';
import { buildTodayKeywords } from '@/lib/todayKeywords';
import type { ContactProfile, Profile } from '@/lib/types';

const DAYS = 60;
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

function freq(perDay: string[][]) {
  const counts: Record<string, number> = {};
  for (const row of perDay) {
    for (const label of new Set(row)) {
      counts[label] = (counts[label] ?? 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function section(label: string, perDay: string[][]) {
  const ranked = freq(perDay);
  const stuck = ranked.filter(([, n]) => n === DAYS);
  const top = ranked.slice(0, 6).map(([word, n]) => `${word}:${n}(${Math.round((n / DAYS) * 100)}%)`);
  console.log(`\n${label}`);
  console.log(`  고유 ${ranked.length} · 상위 ${top.join(', ') || '(없음)'}`);
  if (stuck.length) {
    console.log(`  ❌ ${DAYS}일 내내: ${stuck.map(([word]) => word).join(', ')}`);
    return stuck.length;
  }
  console.log(`  ✅ 매일 고정 칩 없음`);
  return 0;
}

let failed = 0;

failed += section(
  '성향 오늘',
  days.map((d) => buildSeonghyangReading(profile, {}, d).today?.keywords ?? []),
);
failed += section(
  '사주 오늘',
  days.map((d) => buildSajuReading(profile.birthDate!, d, profile.birthTime)?.today?.keywords ?? []),
);
failed += section(
  '타로 오늘',
  days.map((d) => buildTarotReading(profile, d).keywords ?? []),
);
failed += section(
  '관상 오늘',
  days.map((d) => buildTodayPhysiognomy(profile.physiognomy!, d, profile.birthDate).keywords ?? []),
);
failed += section(
  '지인 오늘 궁합',
  days.map((d) => buildTodayCompatibility(profile, contact, d).keywords ?? []),
);
failed += section(
  '지도 허브',
  days.map((d) => buildTodayKeywords(profile, d).keywords.map((item) => item.label)),
);

if (failed > 0) {
  console.log(`\n❌ 매일 고정 칩 ${failed}곳`);
  process.exit(1);
}
console.log('\n✅ 오늘 카드·궁합 칩에 매일 고정 키워드 없음');
