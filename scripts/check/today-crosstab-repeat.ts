/**
 * S1 팩 분리 완료 기준 (`.cursor/handoffs/quality-plan-20260905.md` §3).
 *
 * 1. 팩 스키마 — 24변주 · 필드 누락 0 · 문장 끝 마침표 0 · 조사 병기 0 ·
 *    keyword 팩 안 고유 · 성향/사주/타로/관상 네 팩 사이 고유
 * 2. 팩 문장 — 도메인 간 동일한 headline·action·caution 0
 * 3. 화면 — 같은 날 2개 이상 화면에 같은 문장 0/60일
 *
 * 실행: npm run check:today-crosstab
 * S1-b가 끝나기 전에는 남은 팩 때문에 실패한다. 어떤 팩이 남았는지 출력으로 본다.
 */
import gunghapPack from '@/data/daily/packs/gunghap.json';
import homePack from '@/data/daily/packs/home.json';
import physiognomyPack from '@/data/daily/packs/physiognomy.json';
import sajuPack from '@/data/daily/packs/saju.json';
import seonghyangPack from '@/data/daily/packs/seonghyang.json';
import tarotPack from '@/data/daily/packs/tarot.json';
import { buildIntegratedFortune } from '@/lib/fortune';
import { buildTodayCompatibility } from '@/lib/gunghap';
import { buildTodayPhysiognomy } from '@/lib/physiognomy';
import { buildSajuReading } from '@/lib/saju';
import { buildSeonghyangReading } from '@/lib/seonghyang';
import { buildTarotReading } from '@/lib/tarot';
import type { ContactProfile, Profile } from '@/lib/types';

type Variant = {
  id: string;
  keyword: string;
  headline: string;
  focus: string;
  relationship: string;
  action: string;
  caution: string;
  closing?: string;
  reverseKeyword?: string;
  reverseHeadline?: string;
};

type Pack = { version: number; variants: Variant[] };

const DOMAINS = ['home', 'seonghyang', 'saju', 'tarot', 'gunghap', 'physiognomy'] as const;
const packs: Record<(typeof DOMAINS)[number], Pack> = {
  home: homePack as Pack,
  seonghyang: seonghyangPack as Pack,
  saju: sajuPack as Pack,
  tarot: tarotPack as Pack,
  gunghap: gunghapPack as Pack,
  physiognomy: physiognomyPack as Pack,
};
/** 허브 칩에 들어가는 네 팩 — 키워드가 겹치면 한 탭 칩이 사라진다 */
const HUB_DOMAINS = ['seonghyang', 'saju', 'tarot', 'physiognomy'] as const;
const NO_PERIOD_FIELDS = ['focus', 'relationship', 'action', 'caution'] as const;
const PARTICLE_PAIRS = /[을이은과][(（][를가는와][)）]/;

const failures: string[] = [];
function fail(message: string) {
  failures.push(message);
}

// 1. 스키마
for (const domain of DOMAINS) {
  const { variants } = packs[domain];
  if (variants.length !== 24) fail(`${domain}: 변주 ${variants.length}개 (24 필요)`);
  const seen = new Set<string>();
  for (const v of variants) {
    for (const field of ['id', 'keyword', 'headline', ...NO_PERIOD_FIELDS] as const) {
      if (!v[field]?.trim()) fail(`${domain}/${v.id}: ${field} 비어 있음`);
    }
    for (const field of NO_PERIOD_FIELDS) {
      if (/[.。!?]$/.test(v[field] ?? '')) fail(`${domain}/${v.id}: ${field} 끝에 마침표`);
    }
    for (const field of ['headline', ...NO_PERIOD_FIELDS] as const) {
      if (PARTICLE_PAIRS.test(v[field] ?? '')) fail(`${domain}/${v.id}: ${field} 조사 병기`);
    }
    if (seen.has(v.keyword)) fail(`${domain}: keyword 중복 「${v.keyword}」`);
    seen.add(v.keyword);
  }
}

const hubOwner = new Map<string, string>();
for (const domain of HUB_DOMAINS) {
  for (const v of packs[domain].variants) {
    const owner = hubOwner.get(v.keyword);
    if (owner && owner !== domain) fail(`허브 키워드 겹침 「${v.keyword}」: ${owner} · ${domain}`);
    hubOwner.set(v.keyword, domain);
  }
}

// 2. 팩 간 동일 문장
for (const field of ['headline', 'action', 'caution'] as const) {
  const owner = new Map<string, string>();
  const dupes = new Map<string, Set<string>>();
  for (const domain of DOMAINS) {
    for (const v of packs[domain].variants) {
      const text = v[field];
      const prev = owner.get(text);
      if (prev && prev !== domain) {
        const key = [prev, domain].sort().join('+');
        (dupes.get(key) ?? dupes.set(key, new Set()).get(key)!).add(text);
      } else owner.set(text, domain);
    }
  }
  for (const [pair, texts] of dupes) fail(`${field} 동일 문장 ${texts.size}개: ${pair}`);
}

// 3. 같은 날 여러 화면에 같은 문장
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

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.?!다요음함됨])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 10);
}

let daysWithCollision = 0;
const pairs: Record<string, number> = {};
const examples: string[] = [];
for (const d of days) {
  const texts: Record<string, string[]> = {};
  const f = buildIntegratedFortune(profile, d);
  texts['지도'] = sentences([f.summary, f.guidance, f.caution ?? ''].join(' '));
  const s = buildSeonghyangReading(profile, {}, d).today;
  texts['성향'] = sentences([s?.summary ?? '', ...(s?.hints ?? []).map((h) => h.text)].join(' '));
  const sj = buildSajuReading(profile.birthDate!, d, profile.birthTime)?.today;
  texts['사주'] = sentences([sj?.summary ?? '', ...(sj?.hints ?? []).map((h) => h.text)].join(' '));
  const t = buildTarotReading(profile, d);
  texts['타로'] = sentences([t.blurb, ...t.hints.map((h) => h.text)].join(' '));
  const g = buildTodayPhysiognomy(profile.physiognomy!, d, profile.birthDate);
  texts['관상'] = sentences([g.summary, ...g.hints.map((h) => h.text)].join(' '));
  const c = buildTodayCompatibility(profile, contact, d);
  texts['지인'] = sentences([c.summary, c.guidance, c.caution].join(' '));

  const owners = new Map<string, string[]>();
  for (const [tab, list] of Object.entries(texts)) {
    for (const sen of new Set(list)) owners.set(sen, [...(owners.get(sen) ?? []), tab]);
  }
  let hit = 0;
  for (const [sen, tabs] of owners) {
    if (tabs.length < 2) continue;
    hit += 1;
    const key = tabs.join('+');
    pairs[key] = (pairs[key] ?? 0) + 1;
    if (examples.length < 5) examples.push(`  ${d.toISOString().slice(5, 10)} [${key}] ${sen}`);
  }
  if (hit) daysWithCollision += 1;
}
if (daysWithCollision > 0) {
  fail(`같은 날 2개 이상 화면에 같은 문장: ${daysWithCollision}/${DAYS}일 ${JSON.stringify(pairs)}`);
  examples.forEach((line) => console.log(line));
}

console.log(
  `팩 version: ${DOMAINS.map((d) => `${d}@${packs[d].version}`).join(' · ')}`,
);
if (failures.length === 0) {
  console.log('✅ 팩 스키마 · 팩 간 문장 · 같은 날 교차 중복 모두 0');
} else {
  console.log(`\n❌ ${failures.length}건`);
  for (const line of failures) console.log(` - ${line}`);
  process.exit(1);
}
