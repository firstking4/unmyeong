import {
  getBloodType,
  getMbti,
  getWesternZodiac,
  pickTarotBySeed,
} from '@/lib/data/catalog';
import { buildIntegratedFortune, luckTagForTone } from '@/lib/fortune';
import { keywordPolarity, type KeywordPolarity } from '@/lib/keywordPolarity';
import { buildSajuReading } from '@/lib/saju';
import type { Profile } from '@/lib/types';

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

/** 오늘의 운세 관련 키워드. 여러 축에서 겹치면 hits > 1. */
export function buildTodayKeywords(profile: Profile, date = new Date()): TodayKeywordSet {
  const dateKey = ymd(date);
  const seed = fortuneSeed(profile, dateKey);
  const bag = new Map<string, TodayKeyword>();

  const fortune = buildIntegratedFortune(profile, date);
  addWords(bag, fortune.insights?.luckTags ?? [], '지도');
  if (fortune.score < 62) addWords(bag, ['균형 필요'], '지도', true);

  const mbti = getMbti(profile.mbti);
  addWords(bag, pickBySeed(mbti?.keywords ?? [], `${seed}:mbti`, 2), '성향');
  addWords(bag, pickBySeed(mbti?.watchouts ?? [], `${seed}:watch`, 1), '성향', true);
  addWords(bag, pickBySeed(getBloodType(profile.bloodType)?.keywords ?? [], `${seed}:blood`, 1), '성향');
  addWords(
    bag,
    pickBySeed(getWesternZodiac(profile.birthDate)?.keywords ?? [], `${seed}:west`, 1),
    '성향',
  );

  if (profile.birthDate) {
    const today = buildSajuReading(profile.birthDate, date)?.today;
    if (today) {
      // 톤은 지도 luckTags와 같은 라벨로 넣어 일↔결단 등이 합쳐지게 함
      addWords(
        bag,
        today.tones.map((tone) => luckTagForTone(tone)),
        '사주',
      );
      addWords(bag, pickBySeed(today.keywords, `${seed}:saju`, 4), '사주');
    }
  }

  const tarot = pickTarotBySeed(seed);
  const tarotTitle = tarot.title ?? tarot.label;
  addWords(bag, [tarotTitle, ...(tarot.keywords ?? []).slice(0, 2)], '타로');
  if (CAUTION_TAROT.has(tarotTitle)) addWords(bag, [tarotTitle], '타로', true);
  const reversed = hashSeed(`${seed}:rev`) % 2 === 1;
  if (reversed) addWords(bag, ['지연'], '타로', true);

  const all = [...bag.values()];
  const negative = all.filter((item) => item.polarity === 'negative');
  const positive = all.filter((item) => item.polarity !== 'negative');
  const keywords = [...negative, ...positive].slice(0, 14);

  return { keywords, sources: usedSources(bag) };
}
