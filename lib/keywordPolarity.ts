export type KeywordPolarity = 'positive' | 'negative';

const NEGATIVE_LABELS = new Set([
  '재물운 보통',
  '과몰입',
  '자기비판',
  '산만함',
  '속도전',
  '죽음',
  '악마',
  '탑',
  '달',
  '매달린 사람',
  '지연',
  '점검',
  '집착',
  '해체',
  '마찰',
  '시험',
  '균형 필요',
  '예민',
]);

export function isNegativeKeyword(label: string): boolean {
  if (!label) return false;
  if (NEGATIVE_LABELS.has(label)) return true;
  return label.includes('보통') || label.includes('주의') || label.includes('지연');
}

export function keywordPolarity(label: string): KeywordPolarity {
  return isNegativeKeyword(label) ? 'negative' : 'positive';
}
