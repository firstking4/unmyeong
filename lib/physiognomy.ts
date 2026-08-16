import physiognomySeed from '@/data/seed/physiognomy.json';

import type { PhysiognomyCategory, SeedRecord } from './data/types';
import { pickDaily } from './daily/pick';

const collection = physiognomySeed as {
  categories: PhysiognomyCategory[];
  items: SeedRecord[];
};

export type PhysiognomySelection = Partial<Record<string, string>>;

export function listPhysiognomyCategories(): PhysiognomyCategory[] {
  return collection.categories;
}

export function listPhysiognomyOptions(categoryId: string): SeedRecord[] {
  return collection.items.filter((item) => item.categoryId === categoryId);
}

export function getPhysiognomyOption(optionId?: string | null): SeedRecord | null {
  if (!optionId) return null;
  return collection.items.find((item) => item.id === optionId) ?? null;
}

export function physiognomyFeatureCue(
  categoryPrompt: string,
  optionId?: string | null,
): string {
  return getPhysiognomyOption(optionId)?.cue ?? categoryPrompt;
}

export function getPhysiognomyOptionForCategory(
  categoryId: string,
  selection: PhysiognomySelection,
): SeedRecord | null {
  return getPhysiognomyOption(selection[categoryId]);
}

export function countPhysiognomySelections(selection: PhysiognomySelection): number {
  return collection.categories.filter((cat) => selection[cat.id]).length;
}

export function buildPhysiognomyComposite(selection: PhysiognomySelection) {
  const picks = collection.categories
    .map((cat) => ({
      category: cat,
      option: getPhysiognomyOption(selection[cat.id]),
    }))
    .filter((row) => row.option);

  const keywords = picks.flatMap((row) => row.option?.keywords ?? []).slice(0, 6);
  const summaries = picks.map((row) => row.option?.summary).filter(Boolean) as string[];

  const loveHints = picks.map((row) => row.option?.hints?.love).filter(Boolean) as string[];
  const workHints = picks.map((row) => row.option?.hints?.work).filter(Boolean) as string[];
  const growthHints = picks.map((row) => row.option?.hints?.growth).filter(Boolean) as string[];

  const headline =
    picks.length >= 3
      ? `${keywords.slice(0, 3).join(' · ')}의 얼굴 기운`
      : picks.length > 0
        ? '선택한 특징을 바탕으로 읽는 관상'
        : '얼굴 특징을 골라 보세요';

  const summary =
    summaries.length > 0
      ? summaries.slice(0, 3).join(' ')
      : '사진 분석이 아니라, 본인이 고른 특징을 바탕으로 참고용 해설을 보여 줍니다.';

  return {
    picks,
    headline,
    summary,
    keywords,
    hints: {
      love: loveHints[0] ?? '관계에서는 진심을 표현하는 방식이 중요합니다.',
      work: workHints[0] ?? '강점을 살릴 수 있는 역할을 찾아 보세요.',
      growth: growthHints[0] ?? '약점만 보지 않고 강점 루틴을 하나씩 쌓아 보세요.',
    },
    detailLines: picks.map((row) => ({
      category: row.category.label,
      label: row.option?.label ?? '',
      blurb: row.option?.summary ?? '',
    })),
  };
}

/** 선택한 특징을 바탕으로, 날짜마다 달라지는 참고용 관상 흐름 */
export function buildTodayPhysiognomy(selection: PhysiognomySelection, date = new Date()) {
  const composite = buildPhysiognomyComposite(selection);
  const selectedIds = Object.values(selection).filter(Boolean).sort().join(':');
  const theme = pickDaily('physiognomy', `physiognomy:${selectedIds || 'empty'}`, date);

  return {
    dateLabel: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
    headline: `${theme.keyword} · ${theme.headline}`,
    keywords: [theme.keyword, ...composite.keywords].filter(
      (word, index, all) => Boolean(word) && all.indexOf(word) === index,
    ).slice(0, 4),
    summary: `${composite.summary} ${theme.focus}`,
    hints: [
      { label: '관계', text: `${composite.hints.love} ${theme.relationship}` },
      { label: '일·재능', text: `${composite.hints.work} ${theme.action}` },
      { label: '오늘의 주의', text: theme.caution },
    ],
  };
}
