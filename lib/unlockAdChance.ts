/**
 * 홈 「오늘의 운세 점수」 실측 범위.
 * - 만세력: computePersonalFortuneScore → 대략 42~100 (보정 계수 때문에 0까지 안 내려감)
 * - 만세력 없을 때 해시 폴백: 58~97
 */
export const FORTUNE_SCORE_MIN = 42;
export const FORTUNE_SCORE_MAX = 100;

/** 점수 최저일 때 광고 선택지 노출 확률. */
export const AD_OFFER_CHANCE_AT_LOW_LUCK = 0.9;
/** 점수 최고일 때 광고 선택지 노출 확률. */
export const AD_OFFER_CHANCE_AT_HIGH_LUCK = 0.2;

/** 프로필·운세가 없을 때 쓰는 중립 확률 (범위 중간쯤). */
export const NEUTRAL_AD_OFFER_CHANCE = 0.55;

/** 오늘의 운세 점수 → 광고 선택지를 보여줄 확률 (선형 보간). */
export function getAdOfferChanceForFortuneScore(score: number): number {
  const clamped = Math.max(FORTUNE_SCORE_MIN, Math.min(FORTUNE_SCORE_MAX, score));
  const t = (clamped - FORTUNE_SCORE_MIN) / (FORTUNE_SCORE_MAX - FORTUNE_SCORE_MIN);
  const chance =
    AD_OFFER_CHANCE_AT_LOW_LUCK - t * (AD_OFFER_CHANCE_AT_LOW_LUCK - AD_OFFER_CHANCE_AT_HIGH_LUCK);
  return Math.max(
    AD_OFFER_CHANCE_AT_HIGH_LUCK,
    Math.min(AD_OFFER_CHANCE_AT_LOW_LUCK, chance),
  );
}

export function rollAdOfferChance(chance: number): boolean {
  return Math.random() < chance;
}
