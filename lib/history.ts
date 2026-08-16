import { localYmd } from '@/lib/daily/pick';
import type { IntegratedFortune } from '@/lib/types';
import type { TodayCompatibility } from '@/lib/gunghap';
import { appStorage } from '@/lib/storage';
import type { TarotReading } from '@/lib/tarot';

export const HISTORY_STORAGE_KEY = '@unmyeong/history-v1';
export const HISTORY_RETENTION_DAYS = 90;

export type HistoryKind = 'fortune' | 'tarot' | 'compatibility';

type HistoryBase = {
  id: string;
  dateKey: string;
  createdAt: string;
};

export type FortuneHistoryEntry = HistoryBase & {
  kind: 'fortune';
  payload: IntegratedFortune;
};

export type TarotHistoryEntry = HistoryBase & {
  kind: 'tarot';
  payload: TarotReading;
};

export type CompatibilityHistoryEntry = HistoryBase & {
  kind: 'compatibility';
  contactId: string;
  contactName: string;
  relationship: string;
  payload: TodayCompatibility;
};

export type HistoryEntry =
  | FortuneHistoryEntry
  | TarotHistoryEntry
  | CompatibilityHistoryEntry;

export type HistoryStore = {
  version: 1;
  entries: HistoryEntry[];
};

let writeChain: Promise<void> = Promise.resolve();

function enqueueWrite(task: () => Promise<void>): Promise<void> {
  writeChain = writeChain.then(task, task);
  return writeChain;
}

function makeId(parts: string[]): string {
  return parts.join(':');
}

function daysAgoKey(days: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - days);
  return localYmd(d);
}

export function pruneHistoryEntries(
  entries: HistoryEntry[],
  now = new Date(),
): HistoryEntry[] {
  const cutoff = daysAgoKey(HISTORY_RETENTION_DAYS, now);
  return entries.filter((entry) => entry.dateKey >= cutoff);
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await appStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<HistoryStore>;
    if (!Array.isArray(parsed.entries)) return [];
    return pruneHistoryEntries(parsed.entries as HistoryEntry[]);
  } catch {
    return [];
  }
}

async function persistEntries(entries: HistoryEntry[]): Promise<HistoryEntry[]> {
  const pruned = pruneHistoryEntries(entries);
  const store: HistoryStore = { version: 1, entries: pruned };
  await appStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store));
  return pruned;
}

export async function replaceHistory(entries: HistoryEntry[]): Promise<void> {
  await enqueueWrite(async () => {
    await persistEntries(entries);
  });
}

async function upsertEntry(entry: HistoryEntry): Promise<boolean> {
  let inserted = false;
  await enqueueWrite(async () => {
    const current = await loadHistory();
    if (current.some((row) => row.id === entry.id)) {
      await persistEntries(current);
      return;
    }
    inserted = true;
    await persistEntries([entry, ...current]);
  });
  return inserted;
}

/** 첫 열람만 저장. 같은 날 운세는 1건. */
export async function recordFortuneView(
  fortune: IntegratedFortune,
  date = new Date(),
): Promise<boolean> {
  const dateKey = localYmd(date);
  return upsertEntry({
    id: makeId(['fortune', dateKey]),
    kind: 'fortune',
    dateKey,
    createdAt: new Date().toISOString(),
    payload: fortune,
  });
}

/** 첫 열람만 저장. 같은 날 타로는 1건. */
export async function recordTarotView(
  reading: TarotReading,
  date = new Date(),
): Promise<boolean> {
  const dateKey = localYmd(date);
  return upsertEntry({
    id: makeId(['tarot', dateKey]),
    kind: 'tarot',
    dateKey,
    createdAt: new Date().toISOString(),
    payload: reading,
  });
}

/** 첫 열람만 저장. 같은 날·같은 지인은 1건. */
export async function recordCompatibilityView(input: {
  contactId: string;
  contactName: string;
  relationship: string;
  reading: TodayCompatibility;
  date?: Date;
}): Promise<boolean> {
  if (!input.reading.ready) return false;
  const dateKey = localYmd(input.date ?? new Date());
  return upsertEntry({
    id: makeId(['compatibility', dateKey, input.contactId]),
    kind: 'compatibility',
    dateKey,
    createdAt: new Date().toISOString(),
    contactId: input.contactId,
    contactName: input.contactName,
    relationship: input.relationship,
    payload: input.reading,
  });
}

export function groupHistoryByDate(entries: HistoryEntry[]): { dateKey: string; items: HistoryEntry[] }[] {
  const map = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.dateKey) ?? [];
    list.push(entry);
    map.set(entry.dateKey, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dateKey, items]) => ({
      dateKey,
      items: items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    }));
}

export function historyKindLabel(kind: HistoryKind): string {
  switch (kind) {
    case 'fortune':
      return '오늘의 운세';
    case 'tarot':
      return '타로';
    case 'compatibility':
      return '궁합';
  }
}
