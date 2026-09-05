import physiognomySeed from '@/data/seed/physiognomy.json';
import pairSeed from '@/data/seed/physiognomy-pairs.json';

import type { PhysiognomyCategory, SeedRecord } from './data/types';
import { pickDailyFrom, pickDailyMany, withSparseCaution } from './daily/pick';
import { withEun, withIga } from './korean/particle';
import { endSentence, joinSentences, stripSentenceEnd } from './korean/sentence';

const collection = physiognomySeed as {
  categories: PhysiognomyCategory[];
  items: SeedRecord[];
};

type PairAxis = { categoryId: string; axis: string };
type PairRule = {
  id: string;
  a: PairAxis;
  b: PairAxis;
  lines: Record<string, string>;
};

const pairCollection = pairSeed as {
  frames: string[];
  rules: PairRule[];
};

/** 상설 해설 묶음 — 고른 부위가 여기에 들어가 언급된다. */
export const PHYSIOGNOMY_BANDS = [
  { id: 'upper', label: '얼굴형·이마', categoryIds: ['face_shape', 'forehead'] },
  { id: 'gaze', label: '눈·눈썹', categoryIds: ['eyes', 'eyebrows'] },
  { id: 'lower', label: '코·입·턱', categoryIds: ['nose', 'mouth', 'chin'] },
] as const;

const FEATURED_LINE_TEMPLATES = [
  (label: string) => `오늘은 ${withIga(label)} 중심입니다.`,
  (label: string) => `${withEun(label)} 결이 오늘 앞에 나옵니다.`,
  (label: string) => `오늘 읽히는 결은 ${withIga(label)} 먼저입니다.`,
  (label: string) => `${withEun(label)} 오늘 흐름의 첫 칸입니다.`,
  (label: string) => `고른 특징 가운데 ${withIga(label)} 앞에 있습니다.`,
  (label: string) => `${withEun(label)} 오늘의 중심 결입니다.`,
];

function axisValue(categoryId: string, axis: string, optionId: string): string | null {
  const key = `${categoryId}:${axis}`;
  if (key === 'eyes:size') {
    if (optionId.includes('_large_')) return 'large';
    if (optionId.includes('_small_')) return 'small';
    return null;
  }
  if (key === 'eyes:tail') {
    if (optionId.endsWith('_upturned')) return 'upturned';
    if (optionId.endsWith('_downturned')) return 'downturned';
    return null;
  }
  if (key === 'mouth:size') {
    if (optionId.includes('_large_')) return 'large';
    if (optionId.includes('_small_')) return 'small';
    return null;
  }
  if (key === 'forehead:width') {
    if (optionId.includes('_wide_')) return 'wide';
    if (optionId.includes('_narrow_')) return 'narrow';
    return null;
  }
  if (key === 'chin:shape') {
    if (optionId === 'chin_square') return 'square';
    if (optionId === 'chin_round' || optionId === 'chin_double') return 'round';
    return null;
  }
  if (key === 'eyebrows:shape') {
    if (optionId.startsWith('brow_straight')) return 'straight';
    if (optionId.startsWith('brow_arched')) return 'arched';
    return null;
  }
  return null;
}

export type PhysiognomySelection = Partial<Record<string, string>>;

export function matchPhysiognomyPairLines(selection: PhysiognomySelection): string[] {
  const lines: string[] = [];
  for (const rule of pairCollection.rules) {
    const aId = selection[rule.a.categoryId];
    const bId = selection[rule.b.categoryId];
    if (!aId || !bId) continue;
    const aVal = axisValue(rule.a.categoryId, rule.a.axis, aId);
    const bVal = axisValue(rule.b.categoryId, rule.b.axis, bId);
    if (!aVal || !bVal) continue;
    const line = rule.lines[`${aVal}|${bVal}`];
    if (line) lines.push(line);
  }
  return lines;
}

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

/**
 * 선택을 메모 키에 넣을 때 쓰는 문자열 — 카테고리 순 정렬, 빈 값 제외.
 * `buildTodayKeywords`·`buildIntegratedFortune`이 같은 키를 써야 한다.
 */
export function physiognomySelectionKey(selection?: PhysiognomySelection | null): string {
  if (!selection) return '';
  return Object.entries(selection)
    .filter(([, value]) => Boolean(value))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, option]) => `${category}=${option}`)
    .join(',');
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
    .filter((row): row is { category: PhysiognomyCategory; option: SeedRecord } =>
      Boolean(row.option),
    );

  const keywords = picks.flatMap((row) => row.option.keywords ?? []).slice(0, 6);
  const loveHints = picks.map((row) => row.option.hints?.love).filter(Boolean) as string[];
  const workHints = picks.map((row) => row.option.hints?.work).filter(Boolean) as string[];
  const growthHints = picks.map((row) => row.option.hints?.growth).filter(Boolean) as string[];

  const bands = PHYSIOGNOMY_BANDS.flatMap((band) => {
    const parts = picks.filter((row) =>
      (band.categoryIds as readonly string[]).includes(row.category.id),
    );
    if (parts.length === 0) return [];
    const labels = parts.map((row) => row.option.label).join(' · ');
    return [
      {
        id: band.id,
        label: band.label,
        text: `${withEun(band.label)} ${labels} 결입니다.`,
      },
    ];
  });

  const pairLines = matchPhysiognomyPairLines(selection).slice(0, 2);

  const headline =
    picks.length >= 3
      ? `${keywords.slice(0, 3).join(' · ')}의 얼굴 기운`
      : picks.length > 0
        ? '선택한 특징을 바탕으로 읽는 관상'
        : '얼굴 특징을 골라 보세요';

  const summary =
    bands.length > 0
      ? joinSentences(bands.map((band) => band.text))
      : '사진 분석이 아니라, 본인이 고른 특징을 바탕으로 참고용 해설을 보여 줍니다.';

  return {
    picks,
    bands,
    pairLines,
    headline,
    summary,
    keywords,
    hints: {
      love: loveHints[0] ?? '관계에서는 진심을 표현하는 방식이 중요합니다.',
      work: workHints[Math.min(1, Math.max(0, workHints.length - 1))] ?? '강점을 살릴 수 있는 역할을 찾아 보세요.',
      growth:
        growthHints[Math.min(2, Math.max(0, growthHints.length - 1))] ??
        '약점만 보지 않고 강점 루틴을 하나씩 쌓아 보세요.',
    },
    detailLines: picks.map((row) => ({
      category: row.category.label,
      label: row.option.label,
      blurb: row.option.summary ?? '',
    })),
  };
}

/**
 * 선택한 특징을 바탕으로, 날짜마다 달라지는 참고용 관상 흐름.
 *
 * `personSalt`에는 생년월일처럼 사람마다 다르고 **날짜에 따라 변하지 않는** 값을
 * 넘긴다. 없으면 같은 특징을 고른 사용자끼리 같은 날 같은 흐름을 보게 된다.
 */
export function buildTodayPhysiognomy(
  selection: PhysiognomySelection,
  date = new Date(),
  personSalt?: string | null,
) {
  const composite = buildPhysiognomyComposite(selection);
  const selectedIds = Object.values(selection).filter(Boolean).sort().join(':');
  const themes = pickDailyMany(
    'physiognomy',
    `physiognomy:${selectedIds || 'empty'}:${personSalt ?? ''}`,
    3,
    date,
  );
  const theme = themes[0]!;

  // 선택 특징의 고정 설명을 매일 통째로 실으면 어제 문장이 된다.
  // 오늘의 중심 특징 하나를 날마다 돌려 오늘 흐름 옆에 둔다.
  // 전체 합성(composite.summary·hints)은 아래 「해설」 섹션에서 그대로 본다.
  const featured = pickDailyFrom(
    composite.picks,
    `physiognomy:featured:${selectedIds}:${personSalt ?? ''}`,
    date,
  );

  const featuredLines = featured
    ? FEATURED_LINE_TEMPLATES.map((build) => build(featured.category.label))
    : [];
  const featuredLine =
    featuredLines.length > 0
      ? (pickDailyFrom(
          featuredLines,
          `physiognomy:featured-line:${selectedIds}:${personSalt ?? ''}`,
          date,
        ) ?? featuredLines[0]!)
      : null;

  const pairPool = matchPhysiognomyPairLines(selection);
  const pairCore =
    pairPool.length > 0
      ? (pickDailyFrom(
          pairPool,
          `physiognomy:pair:${selectedIds}:${personSalt ?? ''}`,
          date,
        ) ?? pairPool[0]!)
      : null;
  const pairFrame =
    pairCore && pairCollection.frames.length > 0
      ? (pickDailyFrom(
          pairCollection.frames,
          `physiognomy:pair-frame:${selectedIds}:${personSalt ?? ''}`,
          date,
        ) ?? pairCollection.frames[0]!)
      : null;
  const pairLine =
    pairCore && pairFrame ? `${pairFrame} ${stripSentenceEnd(pairCore)}` : null;

  const summary = joinSentences([theme.focus, featuredLine, pairLine].filter(Boolean));

  return {
    dateLabel: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
    // 팩 headline이 이미 「키워드 · 문장」이라 키워드를 다시 붙이지 않는다
    headline: theme.headline,
    /** 오늘 팩 focus 한 문장 — `summary`의 첫 문장이자 지도 「관상」 줄 */
    focus: endSentence(theme.focus),
    keywords: withSparseCaution(
      themes.map((item) => item.keyword),
      `physiognomy-caution:${selectedIds}:${personSalt ?? ''}`,
      date,
    ),
    summary,
    hints: [
      {
        label: '관계',
        text: joinSentences([
          featured?.option?.hints?.love ?? composite.hints.love,
          theme.relationship,
        ]),
      },
      {
        label: '일·재능',
        text: joinSentences([
          featured?.option?.hints?.work ?? composite.hints.work,
          theme.action,
        ]),
      },
      { label: '오늘의 주의', text: endSentence(theme.caution) },
    ],
  };
}
