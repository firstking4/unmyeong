import { listTarotDeck } from '@/lib/data/catalog';
import { appStorage } from '@/lib/storage';

export const TAROT_BOOKMARKS_KEY = '@unmyeong/tarot-bookmarks-v1';

export type TarotBookmarkStore = {
  version: 1;
  /** 타로 카드 id (`tarot_major_00` · `tarot_minor_wands_ace` …) */
  ids: string[];
};

const VALID_IDS = new Set(listTarotDeck().map((card) => card.id));

export function emptyTarotBookmarks(): TarotBookmarkStore {
  return { version: 1, ids: [] };
}

export function normalizeTarotBookmarks(raw: string | null): TarotBookmarkStore {
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<TarotBookmarkStore>) : null;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.ids)) {
      return emptyTarotBookmarks();
    }
    const ids = parsed.ids.filter(
      (id): id is string => typeof id === 'string' && VALID_IDS.has(id),
    );
    return { version: 1, ids: [...new Set(ids)] };
  } catch {
    return emptyTarotBookmarks();
  }
}

export async function loadTarotBookmarks(): Promise<TarotBookmarkStore> {
  return normalizeTarotBookmarks(await appStorage.getItem(TAROT_BOOKMARKS_KEY));
}

export async function saveTarotBookmarks(store: TarotBookmarkStore): Promise<void> {
  await appStorage.setItem(TAROT_BOOKMARKS_KEY, JSON.stringify(store));
}

export function isTarotBookmarked(store: TarotBookmarkStore, cardId: string): boolean {
  return store.ids.includes(cardId);
}

export async function toggleTarotBookmark(cardId: string): Promise<TarotBookmarkStore> {
  if (!VALID_IDS.has(cardId)) return loadTarotBookmarks();
  const current = await loadTarotBookmarks();
  const next: TarotBookmarkStore = isTarotBookmarked(current, cardId)
    ? { version: 1, ids: current.ids.filter((id) => id !== cardId) }
    : { version: 1, ids: [...current.ids, cardId] };
  await saveTarotBookmarks(next);
  return next;
}
