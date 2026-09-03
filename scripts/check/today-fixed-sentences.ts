/**
 * 「오늘의 ~」 풀이에 매일 똑같이 붙는 고정 문장 검사 — 전 필드.
 *
 * 오늘 카드의 본문을 문장 단위로 쪼개 14일을 겹쳐 본다.
 * 14일 전부에 한 글자도 안 바뀌고 등장하는 문장은 "오늘"이라는 이름 아래서는
 * 어제 읽은 문장이다. summary뿐 아니라 힌트·관계·조심·마무리까지 같은 기준.
 *
 * 실행: npm run check:today-fixed
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

function fixedSentences(perDay: string[]): string[] {
  const first = sentences(perDay[0] ?? '');
  const rest = perDay.slice(1).map((t) => new Set(sentences(t)));
  return first.filter((s) => rest.every((set) => set.has(s)));
}

let totalFixed = 0;

function section(label: string, perDay: string[]) {
  const fixed = fixedSentences(perDay);
  if (fixed.length === 0) return;
  totalFixed += fixed.length;
  console.log(`\n⚠ ${label} — ${DAYS}일 내내 같은 문장 ${fixed.length}개:`);
  for (const s of fixed) console.log(`    · ${s.slice(0, 90)}`);
}

// 지도 — 오늘의 운세
const fortunes = days.map((d) => buildIntegratedFortune(profile, d));
section('지도 · summary', fortunes.map((f) => f.summary ?? ''));
section('지도 · guidance', fortunes.map((f) => f.guidance ?? ''));
section('지도 · closing', fortunes.map((f) => f.closing ?? ''));

// 성향 — 오늘의 성향
const seongs = days.map((d) => buildSeonghyangReading(profile, {}, d).today as any);
section('성향 · summary', seongs.map((t) => t?.summary ?? ''));
for (const hintLabel of ['관계', '오늘의 한 가지', '주의']) {
  section(
    `성향 · 힌트[${hintLabel}]`,
    seongs.map((t) => t?.hints?.find((h: any) => h.label === hintLabel)?.text ?? ''),
  );
}

// 사주 — 오늘의 사주
const sajus = days.map((d) => buildSajuReading(profile.birthDate!, d, profile.birthTime)?.today as any);
section('사주 · summary', sajus.map((t) => t?.summary ?? ''));
section('사주 · headline', sajus.map((t) => t?.headline ?? ''));
const sajuHintKeys = [...new Set(sajus.flatMap((t) => (t?.hints ?? []).map((h: any) => h.label)))];
for (const hintLabel of sajuHintKeys) {
  section(
    `사주 · 힌트[${hintLabel}]`,
    sajus.map((t) => t?.hints?.find((h: any) => h.label === hintLabel)?.text ?? ''),
  );
}

// 타로 — 오늘의 카드
const tarots = days.map((d) => buildTarotReading(profile, d));
section('타로 · blurb', tarots.map((t) => t.blurb ?? ''));
const tarotHintKeys = [...new Set(tarots.flatMap((t) => t.hints.map((h) => h.label)))];
for (const hintLabel of tarotHintKeys) {
  section(
    `타로 · 힌트[${hintLabel}]`,
    tarots.map((t) => t.hints.find((h) => h.label === hintLabel)?.text ?? ''),
  );
}

// 지인 — 오늘 궁합
const gungs = days.map((d) => buildTodayCompatibility(profile, contact, d) as any);
section('지인 · summary', gungs.map((g) => g?.summary ?? ''));
section('지인 · summaryLine', gungs.map((g) => g?.summaryLine ?? ''));
section('지인 · relationship', gungs.map((g) => g?.relationship ?? ''));
section('지인 · guidance', gungs.map((g) => g?.guidance ?? ''));
section('지인 · caution', gungs.map((g) => g?.caution ?? ''));

// 관상 — 오늘의 관상
const gwan = days.map((d) =>
  buildTodayPhysiognomy(profile.physiognomy as any, d, profile.birthDate),
);
section('관상 · summary', gwan.map((g) => g.summary ?? ''));
for (const hintLabel of ['관계', '일·재능', '오늘의 주의']) {
  section(
    `관상 · 힌트[${hintLabel}]`,
    gwan.map((g) => g.hints.find((h) => h.label === hintLabel)?.text ?? ''),
  );
}

console.log(`\n────────────────────────`);
if (totalFixed === 0) {
  console.log('고정 문장 없음 — 전 탭·전 필드 ✅');
} else {
  console.log(`고정 문장 합계: ${totalFixed}개`);
  console.log('「오늘」이라는 이름의 카드에 어제 문장이 그대로 있습니다.');
  process.exitCode = 1;
}
