import { listTarotDeck } from '@/lib/data/catalog';
import type { SeedRecord } from '@/lib/data/types';

export type TarotSpreadKind = 'love' | 'work' | 'choice';

export type TarotSpreadDefinition = {
  id: TarotSpreadKind;
  title: string;
  description: string;
  positions: readonly [string, string, string];
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
};

/** 질문 유형과 포지션을 함께 정의한다. 새 유형은 이 목록에 추가한다. */
export const TAROT_SPREADS: readonly TarotSpreadDefinition[] = [
  {
    id: 'love',
    title: '연애',
    description: '관계의 현재 흐름과 마음을 전할 방향을 살펴봅니다.',
    positions: ['현재 관계', '관계의 흐름', '마음을 전하는 조언'],
    hintKey: 'love',
  },
  {
    id: 'work',
    title: '일',
    description: '지금의 과제와 일의 흐름, 실행할 한 가지를 살펴봅니다.',
    positions: ['지금의 과제', '일의 흐름', '실행 조언'],
    hintKey: 'work',
  },
  {
    id: 'choice',
    title: '선택',
    description: '선택의 핵심과 고려할 흐름, 결정의 기준을 살펴봅니다.',
    positions: ['선택의 핵심', '고려할 흐름', '결정 조언'],
    hintKey: 'growth',
  },
] as const;

export function getTarotSpread(kind: TarotSpreadKind): TarotSpreadDefinition {
  return TAROT_SPREADS.find((spread) => spread.id === kind) ?? TAROT_SPREADS[0];
}

export function isTarotSpreadKind(value: string | null | undefined): value is TarotSpreadKind {
  return value === 'love' || value === 'work' || value === 'choice';
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
  const cards = shuffledDeck().slice(0, definition.positions.length).map((card, index) => {
    const reversed = Math.random() >= 0.5;
    const interpretation =
      (reversed ? card.reversed : card.hints?.[definition.hintKey] ?? card.upright) ??
      card.summary;

    return {
      card,
      reversed,
      position: definition.positions[index],
      interpretation,
    };
  });

  return { definition, cards };
}
