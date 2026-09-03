/**
 * 「오늘의 ~」 화면 안 반복·문장 길이 감사 — 전 탭.
 *
 * 지인에서 잡았던 문제(같은 단어가 한 화면에 반복)가 다른 탭에도 있는지,
 * 문장이 지나치게 길거나 군더더기 표현이 많은지를 함께 본다.
 *
 * 실행: npx ts-node --project scripts/check/tsconfig.json -r tsconfig-paths/register scripts/check/today-screen-repetition.ts
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

/** 조사·어미를 떼고 어근만 비교하기 위한 단어 정규화 */
function wordStem(word: string): string {
  return word.replace(/[은는이가을를와과로으로의에서도만부터까지며]$/, '');
}

function analyze(label: string, texts: string[]) {
  let repeatScreens = 0;
  const repeatWords: Record<string, number> = {};
  const sentenceLengths: number[] = [];

  for (const text of texts) {
    // 화면 내 반복 — 2글자 이상 단어(조사 제외)가 2회 이상
    const words = text.match(/[가-힣]{2,}/g) ?? [];
    const counts: Record<string, number> = {};
    for (const w of words) {
      const stem = wordStem(w);
      // 흔한 기능어·운세 상용어는 제외
      if (['오늘', '기운', '흐름', '하루', '쪽이', '있습', '보세', '있어', '습니다'].includes(stem)) continue;
      counts[stem] = (counts[stem] ?? 0) + 1;
    }
    const repeated = Object.entries(counts).filter(([, n]) => n >= 2);
    if (repeated.length > 0) {
      repeatScreens++;
      for (const [w, n] of repeated) repeatWords[w] = (repeatWords[w] ?? 0) + n;
    }

    for (const s of text.split(/(?<=[.?!])\s*/)) {
      const len = s.trim().length;
      if (len >= 8) sentenceLengths.push(len);
    }
  }

  const avgLen = sentenceLengths.length
    ? (sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length).toFixed(1)
    : '-';
  const longRatio = sentenceLengths.length
    ? ((sentenceLengths.filter((l) => l > 60).length / sentenceLengths.length) * 100).toFixed(0)
    : '-';

  console.log(`\n=== ${label} ===`);
  console.log(`  반복 있는 화면: ${repeatScreens}/${texts.length}`);
  const top = Object.entries(repeatWords).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top.length) console.log(`  자주 반복된 단어: ${top.map(([w, n]) => `${w}×${n}`).join(', ')}`);
  console.log(`  문장 길이: 평균 ${avgLen}자 · 60자 초과 ${longRatio}%`);
}

// 지도
const fortunes = days.map((d) => buildIntegratedFortune(profile, d));
analyze('지도 · 오늘의 운세', fortunes.map((f) => [f.summary, f.guidance, f.closing].join(' ')));

// 성향
const seongs = days.map((d) => buildSeonghyangReading(profile, {}, d).today as any);
analyze(
  '성향 · 오늘의 성향',
  seongs.map((t) => [t?.summary ?? '', ...(t?.hints ?? []).map((h: any) => h.text)].join(' ')),
);

// 사주
const sajus = days.map((d) => buildSajuReading(profile.birthDate!, d, profile.birthTime)?.today as any);
analyze(
  '사주 · 오늘의 사주',
  sajus.map((t) => [t?.summary ?? '', ...(t?.hints ?? []).map((h: any) => h.text ?? '')].join(' ')),
);

// 타로
const tarots = days.map((d) => buildTarotReading(profile, d));
analyze(
  '타로 · 오늘의 카드',
  tarots.map((t) => [t.blurb, ...t.hints.map((h) => h.text)].join(' ')),
);

// 지인
const gungs = days.map((d) => buildTodayCompatibility(profile, contact, d) as any);
analyze(
  '지인 · 오늘 궁합 전체 화면',
  gungs.map((g) => [g?.summaryLine ?? '', g?.summary ?? '', g?.relationship ?? '', g?.guidance ?? '', g?.caution ?? ''].join(' ')),
);

// 관상
const gwan = days.map((d) => buildTodayPhysiognomy(profile.physiognomy as any, d, profile.birthDate));
analyze(
  '관상 · 오늘의 관상',
  gwan.map((g) => [g.summary, ...g.hints.map((h) => h.text)].join(' ')),
);
