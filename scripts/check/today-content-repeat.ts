/**
 * 콘텐츠 단어 반복 — 기능어는 빼고, 한 화면에서 같은 말·복합 라벨이
 * 몇 번 도는지 본다. 가장 심한 화면을 그대로 찍는다.
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

const FUNCTION = new Set([
  '오늘', '오늘은', '기운', '기운이', '기운은', '흐름', '하루', '쪽', '쪽이', '쪽에',
  '있습니다', '보세요', '됩니다', '함께', '카드', '메시지', '편입니다', '중심입니다',
  '상대', '나는', '나와', '상대는', '상대가', '상대의', '상대에게', '않습니다',
  '아직', '않은', '있습니다',
]);

function contentRepeats(text: string): [string, number][] {
  const compounds = [...text.matchAll(/[가-힣]+(?:·[가-힣]+)+/g)].map((m) => m[0]);
  const words = (text.match(/[가-힣]{2,}/g) ?? []).filter((w) => !FUNCTION.has(w) && w.length >= 2);
  const counts: Record<string, number> = {};
  for (const w of [...compounds, ...words]) {
    if (FUNCTION.has(w)) continue;
    counts[w] = (counts[w] ?? 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1]);
}

function report(label: string, screens: { date: string; text: string }[]) {
  console.log(`\n=== ${label} ===`);
  let worst: { date: string; text: string; hits: [string, number][] } | null = null;
  let screensWith3 = 0;
  for (const s of screens) {
    const hits = contentRepeats(s.text).filter(([, n]) => n >= 3);
    if (hits.length) {
      screensWith3++;
      if (!worst || hits[0][1] > worst.hits[0][1]) worst = { ...s, hits };
    }
  }
  console.log(`  같은 콘텐츠 단어 3회+ 화면: ${screensWith3}/${screens.length}`);
  if (worst) {
    console.log(`  최악 ${worst.date}: ${worst.hits.map(([w, n]) => `${w}×${n}`).join(', ')}`);
    console.log(`  ---`);
    console.log(`  ${worst.text.slice(0, 420)}`);
  }
}

const fortunes = days.map((d) => ({
  date: d.toISOString().slice(5, 10),
  text: [buildIntegratedFortune(profile, d).summary, buildIntegratedFortune(profile, d).guidance].join('\n'),
}));
report('지도', fortunes);

const seongs = days.map((d) => {
  const t = buildSeonghyangReading(profile, {}, d).today as any;
  return {
    date: d.toISOString().slice(5, 10),
    text: [t?.summary, ...(t?.hints ?? []).map((h: any) => h.text)].join('\n'),
  };
});
report('성향', seongs);

const sajus = days.map((d) => {
  const t = buildSajuReading(profile.birthDate!, d, profile.birthTime)?.today as any;
  return {
    date: d.toISOString().slice(5, 10),
    text: [t?.summary, ...(t?.hints ?? []).map((h: any) => h.text)].join('\n'),
  };
});
report('사주', sajus);

const tarots = days.map((d) => {
  const t = buildTarotReading(profile, d);
  return {
    date: d.toISOString().slice(5, 10),
    text: [t.blurb, ...t.hints.map((h) => `[${h.label}] ${h.text}`)].join('\n'),
  };
});
report('타로', tarots);

const gungs = days.map((d) => {
  const g = buildTodayCompatibility(profile, contact, d) as any;
  return {
    date: d.toISOString().slice(5, 10),
    text: [g.summaryLine, g.summary, g.relationship, g.guidance, g.caution].join('\n'),
  };
});
report('지인', gungs);

const gwan = days.map((d) => {
  const g = buildTodayPhysiognomy(profile.physiognomy as any, d, profile.birthDate);
  return {
    date: d.toISOString().slice(5, 10),
    text: [g.summary, ...g.hints.map((h) => h.text)].join('\n'),
  };
});
report('관상', gwan);
