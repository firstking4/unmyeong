import { getBloodType } from '@/lib/data/catalog';
import { buildIntegratedFortune, luckTagForTone } from '@/lib/fortune';
import { buildTodayCompatibility } from '@/lib/gunghap';
import { keywordPolarity, type KeywordPolarity } from '@/lib/keywordPolarity';
import { buildTodayPhysiognomy, countPhysiognomySelections } from '@/lib/physiognomy';
import { buildSajuReading } from '@/lib/saju';
import { buildSeonghyangReading } from '@/lib/seonghyang';
import { buildTarotReading } from '@/lib/tarot';
import { memoLast } from '@/lib/memoLast';
import type { ContactProfile, Profile } from '@/lib/types';

export type { KeywordPolarity };
export type KeywordSource = '지도' | '성향' | '사주' | '타로' | '지인' | '관상';

export type TodayKeyword = {
  label: string;
  polarity: KeywordPolarity;
  hits: number;
  sources: KeywordSource[];
};

export type TodayKeywordSet = {
  keywords: TodayKeyword[];
  sources: KeywordSource[];
};

/** 푸터 등 출처 표시 순서 */
export const KEYWORD_SOURCE_ORDER: KeywordSource[] = [
  '지도',
  '성향',
  '사주',
  '타로',
  '지인',
  '관상',
];

/** 중복 키워드 탭 시 이동 우선순위 — 지도는 가장 낮음 */
export const KEYWORD_NAV_SOURCE_ORDER: KeywordSource[] = [
  '성향',
  '사주',
  '타로',
  '지인',
  '관상',
  '지도',
];

const CAUTION_TAROT = new Set(['죽음', '악마', '탑', '달', '매달린 사람']);

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function pickBySeed(items: string[], seed: string, count: number): string[] {
  if (items.length === 0) return [];
  const start = hashSeed(seed) % items.length;
  const out: string[] = [];
  for (let i = 0; i < items.length && out.length < count; i++) {
    const item = items[(start + i) % items.length];
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function fortuneSeed(profile: Profile, dateKey: string): string {
  return `${dateKey}:${profile.birthDate ?? 'anon'}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}`;
}

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addWords(
  bag: Map<string, TodayKeyword>,
  items: (string | null | undefined)[],
  source: KeywordSource,
  forceNegative = false,
) {
  for (const raw of items) {
    const label = raw?.trim();
    if (!label) continue;
    const negative = forceNegative || keywordPolarity(label) === 'negative';
    const prev = bag.get(label);
    if (prev) {
      if (negative) prev.polarity = 'negative';
      // 같은 출처에서 또 나와도 hits는 올리지 않음 — 출처가 늘 때만 중복(강조)
      if (!prev.sources.includes(source)) {
        prev.sources.push(source);
        prev.hits += 1;
      }
    } else {
      bag.set(label, {
        label,
        polarity: negative ? 'negative' : 'positive',
        hits: 1,
        sources: [source],
      });
    }
  }
}

function usedSources(bag: Map<string, TodayKeyword>): KeywordSource[] {
  const found = new Set<KeywordSource>();
  for (const item of bag.values()) {
    for (const source of item.sources) found.add(source);
  }
  return KEYWORD_SOURCE_ORDER.filter((source) => found.has(source));
}

/**
 * 출처 라운드로빈으로 표시 순서를 잡는다 (상한 없음).
 * 삽입 순서만 쓰면 뒤에 합쳐진 타로 시드가 뒤로만 몰린다.
 */
function pickDisplayKeywords(bag: Map<string, TodayKeyword>): TodayKeyword[] {
  const pools = new Map<KeywordSource, TodayKeyword[]>();
  for (const item of bag.values()) {
    const home = item.sources[0] ?? '지도';
    const list = pools.get(home) ?? [];
    list.push(item);
    pools.set(home, list);
  }

  for (const list of pools.values()) {
    list.sort((a, b) => {
      const an = a.polarity === 'negative' ? 0 : 1;
      const bn = b.polarity === 'negative' ? 0 : 1;
      return an - bn;
    });
  }

  const order = KEYWORD_SOURCE_ORDER.filter((source) => (pools.get(source)?.length ?? 0) > 0);
  const cursors = new Map<KeywordSource, number>(order.map((source) => [source, 0]));
  const out: TodayKeyword[] = [];
  const seen = new Set<string>();

  while (true) {
    let progressed = false;
    for (const source of order) {
      const list = pools.get(source) ?? [];
      let cursor = cursors.get(source) ?? 0;
      while (cursor < list.length && seen.has(list[cursor].label)) cursor += 1;
      cursors.set(source, cursor);
      if (cursor >= list.length) continue;
      const next = list[cursor];
      cursors.set(source, cursor + 1);
      seen.add(next.label);
      out.push(next);
      progressed = true;
    }
    if (!progressed) break;
  }

  return out;
}

/**
 * 지도 탭 「오늘의 키워드」.
 * 각 탭의 오늘 카드 키워드와 같은 빌더 결과를 써야 한다 (운영 필수).
 * @see .cursor/rules/today-keywords.mdc
 */
const keywordsMemo: { key: string; value: TodayKeywordSet | undefined } = { key: '', value: undefined };

/**
 * 허브에 올릴 지인 수.
 *
 * 궁합은 지인 한 명마다 만세력을 돌려야 해서 지도 탭에서 전원을 계산하면 비싸다.
 * 고정(★)한 지인이 있으면 그쪽을, 없으면 목록 앞에서 몇 명만 쓴다.
 */
const HUB_CONTACT_LIMIT = 2;
const HUB_KEYWORDS_PER_CONTACT = 2;

function hubContacts(contacts: ContactProfile[]): ContactProfile[] {
  const pinned = contacts.filter((contact) => contact.pinned);
  return (pinned.length > 0 ? pinned : contacts).slice(0, HUB_CONTACT_LIMIT);
}

export function buildTodayKeywords(
  profile: Profile,
  date = new Date(),
  contacts: ContactProfile[] = [],
): TodayKeywordSet {
  const dateKey = ymd(date);
  // 관상 키워드도 들어가므로 얼굴 특징 선택까지 키에 넣는다
  const physiognomyKey = profile.physiognomy
    ? Object.entries(profile.physiognomy)
        .filter(([, value]) => Boolean(value))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, option]) => `${category}=${option}`)
        .join(',')
    : '';
  // 허브에 올리는 지인이 달라지면 키워드도 갱신해야 한다
  const contactsKey = hubContacts(contacts)
    .map((contact) => `${contact.birthDate ?? ''}|${contact.birthTime ?? ''}`)
    .join(';');
  const key = `${dateKey}:${profile.birthDate ?? ''}:${profile.birthTime ?? ''}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}:${profile.name ?? ''}:${profile.gender ?? ''}:${physiognomyKey}:${contactsKey}`;
  return memoLast(keywordsMemo, key, () =>
    buildTodayKeywordsNow(profile, date, dateKey, hubContacts(contacts)),
  );
}

function buildTodayKeywordsNow(
  profile: Profile,
  date: Date,
  dateKey: string,
  contacts: ContactProfile[],
): TodayKeywordSet {
  const seed = fortuneSeed(profile, dateKey);
  const bag = new Map<string, TodayKeyword>();

  // 지도 — 오늘의 운세 luckTags
  const fortune = buildIntegratedFortune(profile, date);
  addWords(bag, fortune.insights?.luckTags ?? [], '지도');
  if (fortune.score < 62) addWords(bag, ['균형 필요'], '지도', true);

  // 성향 — 오늘의 성향 카드와 동일 키워드 (+ 혈액형은 오늘 카드에 없어 보조)
  const seonghyangToday = buildSeonghyangReading(profile, {}, date).today;
  if (seonghyangToday) {
    addWords(bag, seonghyangToday.keywords, '성향');
  }
  addWords(
    bag,
    pickBySeed(getBloodType(profile.bloodType)?.keywords ?? [], `${seed}:blood`, 1),
    '성향',
  );

  // 사주 — 오늘의 사주 카드와 동일
  if (profile.birthDate) {
    const today = buildSajuReading(profile.birthDate, date, profile.birthTime)?.today;
    if (today) {
      addWords(
        bag,
        today.tones.map((tone) => luckTagForTone(tone)),
        '사주',
      );
      addWords(bag, today.keywords, '사주');
    }
  }

  // 지인 — 지인 탭 오늘 카드와 동일 빌더. 고정(★)한 지인부터 앞에서 몇 명만
  for (const contact of contacts) {
    const compatibility = buildTodayCompatibility(profile, contact, date);
    if (!compatibility.ready) continue;
    addWords(bag, compatibility.keywords.slice(0, HUB_KEYWORDS_PER_CONTACT), '지인');
    if (compatibility.grade === '주의' || compatibility.grade === '조심') {
      addWords(bag, ['조심'], '지인', true);
    }
  }

  // 타로 — 오늘의 카드와 동일 키워드
  const tarot = buildTarotReading(profile, date);
  addWords(bag, tarot.keywords, '타로');
  if (CAUTION_TAROT.has(tarot.title)) addWords(bag, [tarot.title], '타로', true);
  if (tarot.reversed) addWords(bag, ['지연'], '타로', true);

  // 관상 — 얼굴 특징을 채운 경우에만. 관상 화면 오늘 카드와 동일 빌더
  if (profile.physiognomy && countPhysiognomySelections(profile.physiognomy) > 0) {
    const gwansang = buildTodayPhysiognomy(profile.physiognomy, date, profile.birthDate);
    addWords(bag, gwansang.keywords, '관상');
  }

  return { keywords: pickDisplayKeywords(bag), sources: usedSources(bag) };
}
