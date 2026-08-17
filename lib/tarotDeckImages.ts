import type { ImageSourcePropType } from 'react-native';

import type { SeedRecord } from '@/lib/data/types';
import { tarotMajorImage } from '@/lib/tarotMajorImages';

type MinorSuit = 'wands' | 'cups' | 'swords' | 'pentacles';

const MINOR: Record<MinorSuit, Record<string, ImageSourcePropType>> = {
  wands: {
    '01': require('@/assets/images/tarot/wands/01.png'),
    '02': require('@/assets/images/tarot/wands/02.png'),
    '03': require('@/assets/images/tarot/wands/03.png'),
    '04': require('@/assets/images/tarot/wands/04.png'),
    '05': require('@/assets/images/tarot/wands/05.png'),
    '06': require('@/assets/images/tarot/wands/06.png'),
    '07': require('@/assets/images/tarot/wands/07.png'),
    '08': require('@/assets/images/tarot/wands/08.png'),
    '09': require('@/assets/images/tarot/wands/09.png'),
    '10': require('@/assets/images/tarot/wands/10.png'),
    page: require('@/assets/images/tarot/wands/page.png'),
    knight: require('@/assets/images/tarot/wands/knight.png'),
    queen: require('@/assets/images/tarot/wands/queen.png'),
    king: require('@/assets/images/tarot/wands/king.png'),
  },
  cups: {
    '01': require('@/assets/images/tarot/cups/01.png'),
    '02': require('@/assets/images/tarot/cups/02.png'),
    '03': require('@/assets/images/tarot/cups/03.png'),
    '04': require('@/assets/images/tarot/cups/04.png'),
    '05': require('@/assets/images/tarot/cups/05.png'),
    '06': require('@/assets/images/tarot/cups/06.png'),
    '07': require('@/assets/images/tarot/cups/07.png'),
    '08': require('@/assets/images/tarot/cups/08.png'),
    '09': require('@/assets/images/tarot/cups/09.png'),
    '10': require('@/assets/images/tarot/cups/10.png'),
    page: require('@/assets/images/tarot/cups/page.png'),
    knight: require('@/assets/images/tarot/cups/knight.png'),
    queen: require('@/assets/images/tarot/cups/queen.png'),
    king: require('@/assets/images/tarot/cups/king.png'),
  },
  swords: {
    '01': require('@/assets/images/tarot/swords/01.png'),
    '02': require('@/assets/images/tarot/swords/02.png'),
    '03': require('@/assets/images/tarot/swords/03.png'),
    '04': require('@/assets/images/tarot/swords/04.png'),
    '05': require('@/assets/images/tarot/swords/05.png'),
    '06': require('@/assets/images/tarot/swords/06.png'),
    '07': require('@/assets/images/tarot/swords/07.png'),
    '08': require('@/assets/images/tarot/swords/08.png'),
    '09': require('@/assets/images/tarot/swords/09.png'),
    '10': require('@/assets/images/tarot/swords/10.png'),
    page: require('@/assets/images/tarot/swords/page.png'),
    knight: require('@/assets/images/tarot/swords/knight.png'),
    queen: require('@/assets/images/tarot/swords/queen.png'),
    king: require('@/assets/images/tarot/swords/king.png'),
  },
  pentacles: {
    '01': require('@/assets/images/tarot/pentacles/01.png'),
    '02': require('@/assets/images/tarot/pentacles/02.png'),
    '03': require('@/assets/images/tarot/pentacles/03.png'),
    '04': require('@/assets/images/tarot/pentacles/04.png'),
    '05': require('@/assets/images/tarot/pentacles/05.png'),
    '06': require('@/assets/images/tarot/pentacles/06.png'),
    '07': require('@/assets/images/tarot/pentacles/07.png'),
    '08': require('@/assets/images/tarot/pentacles/08.png'),
    '09': require('@/assets/images/tarot/pentacles/09.png'),
    '10': require('@/assets/images/tarot/pentacles/10.png'),
    page: require('@/assets/images/tarot/pentacles/page.png'),
    knight: require('@/assets/images/tarot/pentacles/knight.png'),
    queen: require('@/assets/images/tarot/pentacles/queen.png'),
    king: require('@/assets/images/tarot/pentacles/king.png'),
  },
};

function isMinorSuit(value: string): value is MinorSuit {
  return value === 'wands' || value === 'cups' || value === 'swords' || value === 'pentacles';
}

/** 메이저·마이너 시드 공통 이미지 해석 */
export function tarotCardImage(card: SeedRecord): ImageSourcePropType | null {
  if (card.id.startsWith('tarot_major_') || !card.image) {
    return tarotMajorImage(typeof card.number === 'number' ? card.number : null);
  }
  const { suit, file } = card.image;
  if (!isMinorSuit(suit)) return null;
  return MINOR[suit][file] ?? null;
}
