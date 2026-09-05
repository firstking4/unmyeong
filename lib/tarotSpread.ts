import { listTarotDeck } from '@/lib/data/catalog';
import { joinSentences, stripSentenceEnd } from '@/lib/korean/sentence';
import type { SeedRecord } from '@/lib/data/types';

export type TarotSpreadKind = 'love' | 'work' | 'choice';

export type TarotSpreadPosition = {
  label: string;
  /** 카드 문장 앞에 붙는 자리 설명. 뽑기마다 이 중 하나를 고른다. */
  frames: readonly [string, string, string];
};

export type TarotSpreadDefinition = {
  id: TarotSpreadKind;
  title: string;
  description: string;
  positions: readonly [TarotSpreadPosition, TarotSpreadPosition, TarotSpreadPosition];
  hintKey: 'love' | 'work' | 'growth';
};

export type TarotSpreadCard = {
  card: SeedRecord;
  reversed: boolean;
  position: string;
  interpretation: string;
};

export type TarotSpreadReading = {
  definition: TarotSpreadDefinition;
  cards: TarotSpreadCard[];
  /** 역방향 개수 × 질문유형 종합 한 줄 */
  synthesis: string;
};

/** 질문 유형과 포지션을 함께 정의한다. 새 유형은 이 목록에 추가한다. */
export const TAROT_SPREADS: readonly TarotSpreadDefinition[] = [
  {
    id: 'love',
    title: '연애',
    description: '관계의 현재 흐름과 마음을 전할 방향을 살펴봅니다.',
    hintKey: 'love',
    positions: [
      {
        label: '현재 관계',
        frames: ['지금 사이에서는', '가까운 자리에서는', '두 사람 사이에서는'],
      },
      {
        label: '관계의 흐름',
        frames: ['흐름으로 보면', '시간이 흐르면', '앞으로의 결은'],
      },
      {
        label: '마음을 전하는 조언',
        frames: ['마음을 전할 때는', '한 마디를 건넬 때는', '다가갈 때는'],
      },
    ],
  },
  {
    id: 'work',
    title: '일',
    description: '지금의 과제와 일의 흐름, 실행할 한 가지를 살펴봅니다.',
    hintKey: 'work',
    positions: [
      {
        label: '지금의 과제',
        frames: ['지금 맡은 자리에서는', '눈앞의 과제에서는', '오늘 할 일에서는'],
      },
      {
        label: '일의 흐름',
        frames: ['일의 흐름으로 보면', '진행이 이어지면', '판이 움직이면'],
      },
      {
        label: '실행 조언',
        frames: ['손을 댈 때는', '실행으로 옮길 때는', '한 가지를 고를 때는'],
      },
    ],
  },
  {
    id: 'choice',
    title: '선택',
    description: '선택의 핵심과 고려할 흐름, 결정의 기준을 살펴봅니다.',
    hintKey: 'growth',
    positions: [
      {
        label: '선택의 핵심',
        frames: ['선택의 한가운데에서는', '지금 고르는 자리에서는', '갈림길에서는'],
      },
      {
        label: '고려할 흐름',
        frames: ['곁에 둘 흐름은', '함께 보면', '고려할 결은'],
      },
      {
        label: '결정 조언',
        frames: ['결정할 때는', '기준을 세울 때는', '마침표를 찍을 때는'],
      },
    ],
  },
] as const;

/** 역방향 개수(0~3) × 질문유형. 각 2후보, 뽑기마다 무작위. */
export const TAROT_SPREAD_SYNTHESIS: Record<TarotSpreadKind, Record<0 | 1 | 2 | 3, readonly [string, string]>> =
  {
    love: {
      0: [
        '세 장이 같은 방향을 봅니다. 마음을 숨기지 않아도 되는 자리입니다.',
        '정방향이 겹칩니다. 솔직한 한 마디가 사이를 열어 줍니다.',
      ],
      1: [
        '한 장이 뒤집혀 속도만 늦춥니다. 관계는 이어지되 밀어붙이지는 마세요.',
        '점검이 하나 끼어 있습니다. 다정함 옆에 거리를 한 줄 남겨 두세요.',
      ],
      2: [
        '둘의 점검이 겹칩니다. 오늘은 결론보다 호흡을 먼저 맞춰 보세요.',
        '뒤집힌 장이 많습니다. 마음을 급히 열기보다 빈칸을 확인해 보세요.',
      ],
      3: [
        '세 장이 모두 안쪽을 가리킵니다. 전하기보다 숨을 고르는 날이 낫습니다.',
        '관계의 겉보다 안쪽이 먼저입니다. 오늘은 약속을 늘리지 마세요.',
      ],
    },
    work: {
      0: [
        '세 장이 같은 방향을 봅니다. 맡은 일을 밀어 가도 되는 자리입니다.',
        '정방향이 겹칩니다. 한 가지를 끝까지 표시해도 괜찮습니다.',
      ],
      1: [
        '한 장이 뒤집혀 속도를 낮춥니다. 실행은 하되 확인을 한 칸 더 두세요.',
        '점검이 하나 끼어 있습니다. 마감 옆에 빈칸을 먼저 메우세요.',
      ],
      2: [
        '둘의 점검이 겹칩니다. 오늘은 새 판보다 정리와 인계가 먼저입니다.',
        '뒤집힌 장이 많습니다. 성과를 재촉하기보다 리스크를 한 줄 적으세요.',
      ],
      3: [
        '세 장이 모두 안쪽을 가리킵니다. 실행보다 점검이 먼저입니다.',
        '일의 겉보다 안쪽이 먼저입니다. 오늘은 범위를 줄여 보세요.',
      ],
    },
    choice: {
      0: [
        '세 장이 같은 방향을 봅니다. 고른 쪽으로 한 걸음 옮겨도 됩니다.',
        '정방향이 겹칩니다. 기준이 선 만큼 마침표를 찍어도 됩니다.',
      ],
      1: [
        '한 장이 뒤집혀 속도를 낮춥니다. 선택은 하되 되돌릴 칸을 남겨 두세요.',
        '점검이 하나 끼어 있습니다. 큰 결정보다 작은 시험을 먼저 하세요.',
      ],
      2: [
        '둘의 점검이 겹칩니다. 오늘은 고르기보다 기준을 다시 적어 보세요.',
        '뒤집힌 장이 많습니다. 결정을 하루 미뤄도 늦지 않습니다.',
      ],
      3: [
        '세 장이 모두 안쪽을 가리킵니다. 고르지 않는 선택도 답일 수 있습니다.',
        '겉으로 급해 보여도 안쪽은 아직입니다. 오늘은 선만 남겨 두세요.',
      ],
    },
  };

export function getTarotSpread(kind: TarotSpreadKind): TarotSpreadDefinition {
  return TAROT_SPREADS.find((spread) => spread.id === kind) ?? TAROT_SPREADS[0];
}

export function isTarotSpreadKind(value: string | null | undefined): value is TarotSpreadKind {
  return value === 'love' || value === 'work' || value === 'choice';
}

export function spreadPositionLabels(spread: TarotSpreadDefinition): string[] {
  return spread.positions.map((position) => position.label);
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function pickSpreadSynthesis(kind: TarotSpreadKind, reversedCount: number): string {
  const n = Math.max(0, Math.min(3, reversedCount)) as 0 | 1 | 2 | 3;
  return pickRandom(TAROT_SPREAD_SYNTHESIS[kind][n]);
}

export function coreForSpreadCard(
  card: SeedRecord,
  reversed: boolean,
  hintKey: 'love' | 'work' | 'growth',
): string {
  if (reversed) {
    return card.reversedHints?.[hintKey] ?? card.reversed ?? card.summary ?? '';
  }
  return card.hints?.[hintKey] ?? card.upright ?? card.summary ?? '';
}

export function interpretSpreadCard(
  card: SeedRecord,
  reversed: boolean,
  hintKey: 'love' | 'work' | 'growth',
  frame: string,
): string {
  const core = coreForSpreadCard(card, reversed, hintKey);
  return joinSentences([`${frame} ${stripSentenceEnd(core)}`]);
}

function shuffledDeck(): SeedRecord[] {
  const cards = [...listTarotDeck()];
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }
  return cards;
}

/** 메이저·마이너 78장 전체에서 중복 없이 세 장을 뽑는다. */
export function drawTarotSpread(kind: TarotSpreadKind): TarotSpreadReading {
  const definition = getTarotSpread(kind);
  const cards = shuffledDeck()
    .slice(0, definition.positions.length)
    .map((card, index) => {
      const reversed = Math.random() >= 0.5;
      const position = definition.positions[index]!;
      const frame = pickRandom(position.frames);
      return {
        card,
        reversed,
        position: position.label,
        interpretation: interpretSpreadCard(card, reversed, definition.hintKey, frame),
      };
    });

  const reversedCount = cards.filter((item) => item.reversed).length;
  return {
    definition,
    cards,
    synthesis: pickSpreadSynthesis(kind, reversedCount),
  };
}
