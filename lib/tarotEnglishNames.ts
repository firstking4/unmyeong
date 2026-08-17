import type { SeedRecord } from '@/lib/data/types';

const MAJOR_EN: Record<number, string> = {
  0: 'The Fool',
  1: 'The Magician',
  2: 'The High Priestess',
  3: 'The Empress',
  4: 'The Emperor',
  5: 'The Hierophant',
  6: 'The Lovers',
  7: 'The Chariot',
  8: 'Strength',
  9: 'The Hermit',
  10: 'Wheel of Fortune',
  11: 'Justice',
  12: 'The Hanged Man',
  13: 'Death',
  14: 'Temperance',
  15: 'The Devil',
  16: 'The Tower',
  17: 'The Star',
  18: 'The Moon',
  19: 'The Sun',
  20: 'Judgement',
  21: 'The World',
};

const SUIT_EN = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
} as const;

const RANK_EN: Record<string, string> = {
  '01': 'Ace',
  '02': 'Two',
  '03': 'Three',
  '04': 'Four',
  '05': 'Five',
  '06': 'Six',
  '07': 'Seven',
  '08': 'Eight',
  '09': 'Nine',
  '10': 'Ten',
  page: 'Page',
  knight: 'Knight',
  queen: 'Queen',
  king: 'King',
};

/** Rider–Waite 영문 카드명 */
export function tarotEnglishName(card: Pick<SeedRecord, 'id' | 'number' | 'image'>): string | null {
  if (card.id.startsWith('tarot_major_')) {
    if (typeof card.number !== 'number') return null;
    return MAJOR_EN[card.number] ?? null;
  }
  const suit = card.image?.suit;
  const file = card.image?.file;
  if (!suit || !file) return null;
  const rank = RANK_EN[file];
  const suitEn = SUIT_EN[suit];
  if (!rank || !suitEn) return null;
  return `${rank} of ${suitEn}`;
}

export function tarotEnglishNameByMajorNumber(number: number | null): string | null {
  if (number === null) return null;
  return MAJOR_EN[number] ?? null;
}
