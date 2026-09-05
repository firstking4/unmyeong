import { keywordPolarity, type KeywordPolarity } from '@/lib/keywordPolarity';
import {
  buildTodayPhysiognomy,
  countPhysiognomySelections,
  physiognomySelectionKey,
} from '@/lib/physiognomy';
import { buildSajuReading } from '@/lib/saju';
import { buildSeonghyangReading } from '@/lib/seonghyang';
import { buildTarotReading } from '@/lib/tarot';
import { memoLast } from '@/lib/memoLast';
import type { Profile } from '@/lib/types';

export type { KeywordPolarity };
export type KeywordSource = '성향' | '사주' | '타로' | '관상' | '지도' | '지인';

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
export const KEYWORD_SOURCE_ORDER: KeywordSource[] = ['성향', '사주', '타로', '관상'];

/** 중복 키워드 탭 시 이동 우선순위 */
export const KEYWORD_NAV_SOURCE_ORDER: KeywordSource[] = ['성향', '사주', '타로', '관상'];

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
 * 지도 탭 오늘의 운세 점수 안 칩.
 * 성향·사주·타로·관상 **오늘 카드에 보이는 칩**만 모은다.
 * @see .cursor/rules/today-keywords.mdc
 */
const keywordsMemo: { key: string; value: TodayKeywordSet | undefined } = { key: '', value: undefined };

export function buildTodayKeywords(profile: Profile, date = new Date()): TodayKeywordSet {
  const dateKey = ymd(date);
  const physiognomyKey = physiognomySelectionKey(profile.physiognomy);
  const key = `${dateKey}:${profile.birthDate ?? ''}:${profile.birthTime ?? ''}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}:${profile.name ?? ''}:${profile.gender ?? ''}:${physiognomyKey}`;
  return memoLast(keywordsMemo, key, () => buildTodayKeywordsNow(profile, date));
}

function buildTodayKeywordsNow(profile: Profile, date: Date): TodayKeywordSet {
  const bag = new Map<string, TodayKeyword>();

  const seonghyangToday = buildSeonghyangReading(profile, {}, date).today;
  if (seonghyangToday) addWords(bag, seonghyangToday.keywords, '성향');

  if (profile.birthDate) {
    const today = buildSajuReading(profile.birthDate, date, profile.birthTime)?.today;
    if (today) addWords(bag, today.keywords, '사주');
  }

  const tarot = buildTarotReading(profile, date);
  addWords(bag, tarot.keywords, '타로');

  if (profile.physiognomy && countPhysiognomySelections(profile.physiognomy) > 0) {
    const gwansang = buildTodayPhysiognomy(profile.physiognomy, date, profile.birthDate);
    addWords(bag, gwansang.keywords, '관상');
  }

  return { keywords: pickDisplayKeywords(bag), sources: usedSources(bag) };
}
