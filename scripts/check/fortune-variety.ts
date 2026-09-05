import { buildIntegratedFortune } from '@/lib/fortune';
import { buildSeonghyangReading } from '@/lib/seonghyang';
import { buildTodayCompatibility } from '@/lib/gunghap';
import { buildTodayPhysiognomy } from '@/lib/physiognomy';
import { buildTarotReading } from '@/lib/tarot';
import { buildSajuReading } from '@/lib/saju';
import { buildTodayKeywords } from '@/lib/todayKeywords';
import type { ContactProfile, Profile } from '@/lib/types';

const profile = {
  name: '박종윤',
  birthDate: '1982-12-11',
  birthTime: '09:50',
  mbti: 'INTJ',
  bloodType: 'A',
  gender: 'male',
  physiognomy: {
    eyes: 'eyes_large_double_upturned',
    nose: 'nose_high_wide',
    mouth: 'mouth_large_full',
  },
} as Profile;

const contact = {
  id: 'c1',
  name: '수민',
  birthDate: '1990-05-02',
  birthTime: '14:20',
} as ContactProfile;

const DAYS = 14;
const days = Array.from({ length: DAYS }, (_, i) => new Date(2026, 8, 4 + i));

function report(title: string, lines: (string | undefined)[]) {
  const clean = lines.map((l) => (l ?? '').trim());
  const distinct = new Set(clean).size;
  let consecutive = 0;
  for (let i = 1; i < clean.length; i++) if (clean[i] === clean[i - 1]) consecutive++;
  const flag = consecutive > 0 ? ` ⚠ 연속중복 ${consecutive}회` : '';
  console.log(`  ${title.padEnd(26)} 고유 ${String(distinct).padStart(2)}/${DAYS}${flag}`);
  return { distinct, consecutive };
}

const problems: string[] = [];

console.log('=== 지도 (오늘의 운세) ===');
const fortunes = days.map((d) => buildIntegratedFortune(profile, d));
for (const [name, get] of [
  ['guidance', (f: any) => f.guidance],
  ['closing', (f: any) => f.closing],
  ['headline', (f: any) => f.headline],
  ['score', (f: any) => String(f.score)],
] as const) {
  const r = report(name, fortunes.map(get));
  // headline은 사용자 이름이라 고정, score는 정수라 인접 동일이 자연스럽다
  if (r.consecutive > 0 && name !== 'headline' && name !== 'score') {
    problems.push(`지도 ${name} 연속중복`);
  }
}

console.log('\n=== 성향 (오늘의 성향) ===');
const seong = days.map((d) => buildSeonghyangReading(profile, {}, d).today);
for (const [name, get] of [
  ['summary', (t: any) => t?.summary],
  ['주의 힌트', (t: any) => t?.hints?.find((h: any) => h.label === '주의')?.text],
  ['관계 힌트', (t: any) => t?.hints?.find((h: any) => h.label === '관계')?.text],
  ['headline', (t: any) => t?.headline],
] as const) {
  const r = report(name, seong.map(get));
  if (r.consecutive > 0) problems.push(`성향 ${name} 연속중복`);
}

console.log('\n=== 지인 (오늘 궁합) ===');
const gung = days.map((d) => buildTodayCompatibility(profile, contact, d));
/**
 * caution·guidance는 후보 풀이 오늘 십신(일간+일지)으로 매일 바뀐다.
 * 어제 풀과 오늘 풀이 다르면 순열이 새로 섞여 같은 문장이 이틀 연속 뜰 수 있어
 * 순열만으로는 0을 보장할 수 없다. 60일 실측 하한은 약 0.8%
 * (`npm run check:gunghap-repeat`). 14일 창에서 1회까지를 구조적 하한으로 둔다.
 * 완전 제거는 어제 십신 재계산이 필요하고 목록 화면 비용이 커져 채택하지 않았다.
 */
const POOL_VARIES = new Set(['guidance', 'caution']);
for (const [name, get] of [
  ['summary', (g: any) => g?.summary],
  ['summaryLine', (g: any) => g?.summaryLine],
  ['guidance', (g: any) => g?.guidance],
  ['caution', (g: any) => g?.caution],
  ['moodHeadline', (g: any) => g?.moodHeadline],
  ['relationship', (g: any) => g?.relationship],
] as const) {
  const r = report(name, gung.map(get));
  const limit = POOL_VARIES.has(name) ? 1 : 0;
  if (r.consecutive > limit) problems.push(`지인 ${name} 연속중복`);
}

console.log('\n=== 타로 (오늘의 카드) ===');
const tarot = days.map((d) => buildTarotReading(profile, d));
for (const [name, get] of [
  ['headline', (t: any) => t.headline],
  ['blurb', (t: any) => t.blurb],
  ['title', (t: any) => t.title],
] as const) {
  report(name, tarot.map(get));
}

console.log('\n=== 사주 (오늘의 사주) ===');
const saju = days.map((d) => buildSajuReading(profile.birthDate!, d, profile.birthTime)?.today);
for (const [name, get] of [
  ['summary', (t: any) => t?.summary],
  ['headline', (t: any) => t?.headline],
] as const) {
  report(name, saju.map(get));
}

console.log('\n=== 홈·타로 탭 카드 일치 ===');
let mismatch = 0;
for (let i = 0; i < DAYS; i++) {
  const home = (fortunes[i] as any).insights?.tarotTitle;
  const tab = tarot[i].title;
  if (home !== tab) {
    mismatch++;
    console.log(`  ⚠ ${days[i].toISOString().slice(0, 10)}: 홈 ${home} ≠ 타로탭 ${tab}`);
  }
}
if (mismatch === 0) console.log('  14일 전부 일치');
else problems.push(`홈·타로 카드 불일치 ${mismatch}일`);

console.log('\n=== 지도 취합 (S2) ===');
let hubMiss = 0;
let sourceMiss = 0;
let sourceCountMiss = 0;
for (const d of days) {
  const f = buildIntegratedFortune(profile, d);
  const hub = buildTodayKeywords(profile, d);
  const first = hub.keywords[0]?.label;
  const parts = f.moodHeadline.split(' · ');
  const moodKw = parts[parts.length - 1];
  if (!first || moodKw !== first || !hub.keywords.some((k) => k.label === moodKw)) {
    hubMiss += 1;
  }
  const seongToday = buildSeonghyangReading(profile, {}, d).today;
  const tarotToday = buildTarotReading(profile, d);
  const gwanToday = buildTodayPhysiognomy(profile.physiognomy!, d, profile.birthDate);
  const bySource = Object.fromEntries((f.sources ?? []).map((s) => [s.source, s.line]));
  if (seongToday && bySource['성향'] !== seongToday.focus) sourceMiss += 1;
  if (bySource['타로'] !== `「${tarotToday.title}」 — ${tarotToday.summary}`) sourceMiss += 1;
  if (bySource['관상'] !== gwanToday.focus) sourceMiss += 1;
  if ((f.sources?.length ?? 0) !== 4) sourceCountMiss += 1;
}
if (hubMiss) {
  console.log(`  ⚠ 헤드라인 ≠ 허브 첫 칩 ${hubMiss}/${DAYS}일`);
  problems.push(`지도 헤드라인이 허브 첫 칩과 다름 ${hubMiss}일`);
} else {
  console.log('  헤드라인 = 허브 첫 칩');
}
if (sourceMiss) {
  console.log(`  ⚠ 출처 줄 ≠ 탭 오늘 카드 ${sourceMiss}/${DAYS}일`);
  problems.push(`지도 출처 줄이 탭과 다름 ${sourceMiss}일`);
} else {
  console.log('  성향·타로·관상 줄 = 탭 오늘 카드');
}
if (sourceCountMiss) {
  console.log(`  ⚠ 출처 줄 수 ≠ 4 ${sourceCountMiss}/${DAYS}일`);
  problems.push(`지도 출처 줄 수 ${sourceCountMiss}일`);
} else {
  console.log('  프로필 완전: 사주·성향·타로·관상 4줄');
}

{
  const bare = { ...profile, physiognomy: undefined };
  const emptyGwan = buildIntegratedFortune(bare, days[0]!).sources?.find((s) => s.source === '관상');
  if (!emptyGwan?.placeholder || !emptyGwan.line.includes('고르지')) {
    console.log('  ⚠ 관상 미선택 안내 없음');
    problems.push('관상 미선택 안내 없음');
  } else {
    console.log('  관상 미선택: 안내 줄 유지');
  }
}

console.log('\n=== 문장 접합 검사 (마침표 없이 붙은 문장) ===');
// `…풀립니다 INTJ로는` 처럼 종결어미 뒤에 마침표 없이 다음 문장이 붙는 경우
const RUN_ON = /(습니다|합니다|입니다|보세요|하세요|이에요|예요|어요|네요)\s+[가-힣A-Za-z‘“「]/;
const runOnSamples: string[] = [];
for (const text of [
  ...fortunes.map((f) => f.guidance),
  ...fortunes.map((f) => f.summary),
  ...seong.flatMap((t) => [t?.summary ?? '', ...(t?.hints ?? []).map((h: any) => h.text)]),
  ...tarot.flatMap((t) => [t.blurb, ...t.hints.map((h) => h.text)]),
  ...gung.flatMap((g: any) => [g?.summary ?? '', g?.guidance ?? '']),
]) {
  if (RUN_ON.test(text)) runOnSamples.push(text);
}
if (runOnSamples.length) {
  console.log(`  ⚠ ${runOnSamples.length}건`);
  runOnSamples.slice(0, 3).forEach((s) => console.log(`    · ${s.slice(0, 90)}…`));
  problems.push(`문장 접합 누락 ${runOnSamples.length}건`);
} else {
  console.log('  없음');
}

console.log('\n=== 미처리 조사 노출 검사 ===');
const allText = [
  ...fortunes.flatMap((f) => [f.guidance, f.closing, f.headline, f.moodHeadline]),
  ...seong.flatMap((t) => [t?.summary ?? '', ...(t?.hints ?? []).map((h: any) => h.text)]),
  ...gung.flatMap((g) => [g?.summary ?? '', g?.summaryLine ?? '', g?.guidance ?? '', g?.caution ?? '', g?.moodHeadline ?? '']),
  ...tarot.flatMap((t) => [t.headline, t.blurb, ...t.hints.map((h) => h.text)]),
  ...saju.flatMap((t) => [t?.summary ?? '', t?.headline ?? '']),
].join('\n');

const leaked = ['을(를)', '과(와)', '이(가)', '은(는)', '를(을)', '와(과)'].filter((p) =>
  allText.includes(p),
);
if (leaked.length) {
  console.log(`  ⚠ 노출: ${leaked.join(', ')}`);
  problems.push(`미처리 조사 노출: ${leaked.join(', ')}`);
} else {
  console.log('  없음');
}

console.log('\n=== 받침 안 맞는 조사 검사 ===');
/** 받침 없는 글자 뒤 `이/은/과/을`, 받침 있는 글자 뒤 `가/는/와/를` */
const WRONG_PARTICLE = /([가-힣])(이|은|과|을|가|는|와|를)(?=\s)/g;
const OPEN_ONLY = new Set(['가', '는', '와', '를']);
const CLOSED_ONLY = new Set(['이', '은', '과', '을']);
/** `천사는`(명사 일부)·용언 활용 등 오탐이 많아, 확실한 조합만 본다 */
const badParticles: string[] = [];
for (const line of allText.split('\n')) {
  for (const match of line.matchAll(WRONG_PARTICLE)) {
    const [, prev, particle] = match;
    const closed = (prev.charCodeAt(0) - 0xac00) % 28 !== 0;
    if (closed && OPEN_ONLY.has(particle)) continue; // 받침+가/는 → 오탐 많음(명사 끝음절)
    if (!closed && CLOSED_ONLY.has(particle)) {
      badParticles.push(`${prev}${particle} … ${line.slice(0, 70)}`);
    }
  }
}
/**
 * 으로/로 — 받침 있는 글자(ㄹ 제외) 뒤 `로`, 받침 없는 글자 뒤 `으로`는 틀리다.
 * 뒤에 공백이 오는 조사 위치만 본다(단어 중간의 `노력`·`재무로서` 같은 오탐 회피).
 */
const WRONG_RO = /([가-힣])(으로|로)(?=\s)/g;
for (const line of allText.split('\n')) {
  for (const match of line.matchAll(WRONG_RO)) {
    const [, prev, particle] = match;
    const jong = (prev.charCodeAt(0) - 0xac00) % 28;
    const wantEuro = jong !== 0 && jong !== 8; // 받침 있고 ㄹ 아니면 으로
    if ((particle === '으로') !== wantEuro) {
      badParticles.push(`${prev}${particle} … ${line.slice(0, 70)}`);
    }
  }
}
/**
 * `·`로 이은 복합 라벨 + 가/이 — `챙김가`처럼 받침이 어긋난 경우.
 * 복합 라벨 바로 뒤라 관형사형(있는·같은) 오탐이 없어 안전하게 잡힌다.
 */
const COMPOUND_PARTICLE = /·([가-힣]+)(가|이)(?=\s)/g;
for (const line of allText.split('\n')) {
  for (const match of line.matchAll(COMPOUND_PARTICLE)) {
    const [, last, particle] = match;
    const closed = (last.charCodeAt(last.length - 1) - 0xac00) % 28 !== 0;
    if ((closed && particle === '가') || (!closed && particle === '이')) {
      badParticles.push(`${last}${particle} … ${line.slice(0, 70)}`);
    }
  }
}
if (badParticles.length) {
  console.log(`  ⚠ ${badParticles.length}건 (받침 없는 글자 + 이/은/과/을, 받침 어긋난 로/으로·복합 라벨 가/이)`);
  [...new Set(badParticles)].slice(0, 6).forEach((s) => console.log(`    · ${s}`));
  problems.push(`받침 안 맞는 조사 ${badParticles.length}건`);
} else {
  console.log('  없음');
}

console.log('\n=== 같은 말 나열 검사 ===');
/**
 * `동행·동행`처럼 같은 말을 ·로 이어 쓴 경우.
 * 왼쪽 경계가 한글·이 아니어야 `약속·속도`처럼 글자가 우연히 닿은 오탐을 피한다.
 */
const DUP_COMPOUND = /(?<![가-힣·])([가-힣]{2,})·\1/g;
const dupCompounds: string[] = [];
for (const line of allText.split('\n')) {
  for (const match of line.matchAll(DUP_COMPOUND)) {
    dupCompounds.push(`${match[0]} … ${line.slice(0, 70)}`);
  }
}
if (dupCompounds.length) {
  console.log(`  ⚠ ${dupCompounds.length}건`);
  [...new Set(dupCompounds)].slice(0, 6).forEach((s) => console.log(`    · ${s}`));
  problems.push(`같은 말 나열 ${dupCompounds.length}건`);
} else {
  console.log('  없음');
}

console.log('\n=== 지인 3일치 실제 문장 ===');
for (let i = 0; i < 3; i++) {
  const g = gung[i] as any;
  console.log(`\n[${days[i].toISOString().slice(0, 10)}] ${g?.moodHeadline ?? '-'}`);
  console.log(`  요약: ${g?.summary ?? '-'}`);
  console.log(`  한 줄: ${g?.summaryLine ?? '-'}`);
  console.log(`  해보기: ${g?.guidance ?? '-'}`);
  console.log(`  조심: ${g?.caution ?? '-'}`);
}

console.log('\n=== 지도 2일치 ===');
for (let i = 0; i < 2; i++) {
  const f = fortunes[i];
  console.log(`\n[${days[i].toISOString().slice(0, 10)}] ${f.moodHeadline} (${f.score})`);
  for (const src of f.sources ?? []) console.log(`  [${src.source}] ${src.line}`);
  if (f.scoreNote) console.log(`  ${f.scoreNote}`);
  console.log(`  ${f.guidance}`);
  console.log(`  ${f.closing}`);
}

if (problems.length) {
  console.log(`\n❌ 문제 ${problems.length}건:`);
  problems.forEach((p) => console.log(`  - ${p}`));
  throw new Error('검증 실패');
}
console.log('\n✅ 연속 중복·조사 노출 없음');
