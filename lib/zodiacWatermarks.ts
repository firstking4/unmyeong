import type { ImageSourcePropType } from 'react-native';

/** western-zodiac seed id → watermark asset */
const BY_ID: Record<string, ImageSourcePropType> = {
  zodiac_aries: require('@/assets/images/zodiac/aries.png'),
  zodiac_taurus: require('@/assets/images/zodiac/taurus.png'),
  zodiac_gemini: require('@/assets/images/zodiac/gemini.png'),
  zodiac_cancer: require('@/assets/images/zodiac/cancer.png'),
  zodiac_leo: require('@/assets/images/zodiac/leo.png'),
  zodiac_virgo: require('@/assets/images/zodiac/virgo.png'),
  zodiac_libra: require('@/assets/images/zodiac/libra.png'),
  zodiac_scorpio: require('@/assets/images/zodiac/scorpio.png'),
  zodiac_sagittarius: require('@/assets/images/zodiac/sagittarius.png'),
  zodiac_capricorn: require('@/assets/images/zodiac/capricorn.png'),
  zodiac_aquarius: require('@/assets/images/zodiac/aquarius.png'),
  zodiac_pisces: require('@/assets/images/zodiac/pisces.png'),
};

export function zodiacWatermarkSource(zodiacId?: string | null): ImageSourcePropType | null {
  if (!zodiacId) return null;
  return BY_ID[zodiacId] ?? null;
}
