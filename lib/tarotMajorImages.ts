import type { ImageSourcePropType } from 'react-native';

/** 메이저 아르카나 0–21 (Rider–Waite 시트 크롭) */
const MAJOR: ImageSourcePropType[] = [
  require('@/assets/images/tarot/major/00.png'),
  require('@/assets/images/tarot/major/01.png'),
  require('@/assets/images/tarot/major/02.png'),
  require('@/assets/images/tarot/major/03.png'),
  require('@/assets/images/tarot/major/04.png'),
  require('@/assets/images/tarot/major/05.png'),
  require('@/assets/images/tarot/major/06.png'),
  require('@/assets/images/tarot/major/07.png'),
  require('@/assets/images/tarot/major/08.png'),
  require('@/assets/images/tarot/major/09.png'),
  require('@/assets/images/tarot/major/10.png'),
  require('@/assets/images/tarot/major/11.png'),
  require('@/assets/images/tarot/major/12.png'),
  require('@/assets/images/tarot/major/13.png'),
  require('@/assets/images/tarot/major/14.png'),
  require('@/assets/images/tarot/major/15.png'),
  require('@/assets/images/tarot/major/16.png'),
  require('@/assets/images/tarot/major/17.png'),
  require('@/assets/images/tarot/major/18.png'),
  require('@/assets/images/tarot/major/19.png'),
  require('@/assets/images/tarot/major/20.png'),
  require('@/assets/images/tarot/major/21.png'),
];

export function tarotMajorImage(number: number | null | undefined): ImageSourcePropType | null {
  if (typeof number !== 'number' || number < 0 || number > 21) return null;
  return MAJOR[number] ?? null;
}
