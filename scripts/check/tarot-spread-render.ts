/**
 * 질문 스프레드 렌더 검사 — `npm run check:tarot-spread`
 *
 * 78장 × 3유형 × 정/역 × 3포지션 × 해당 포지션 frame 전부.
 * 빈 문장 0, `을(를)` 0, 마침표 중복 0.
 * 같은 카드가 다른 포지션이면 문장이 달라져야 한다.
 */
import major from '@/data/seed/tarot-major.json';
import minor from '@/data/seed/tarot-minor.json';
import {
  TAROT_SPREAD_SYNTHESIS,
  TAROT_SPREADS,
  interpretSpreadCard,
  type TarotSpreadKind,
} from '@/lib/tarotSpread';
import type { SeedRecord } from '@/lib/data/types';

const deck = [...(major as { items: SeedRecord[] }).items, ...(minor as { items: SeedRecord[] }).items];

function fail(message: string): never {
  console.error(`check:tarot-spread FAIL — ${message}`);
  process.exit(1);
}

const particle = /[을이은과][(（]/;
let rendered = 0;

if (deck.length !== 78) fail(`덱 ${deck.length}장 (78이어야 함)`);

for (const card of deck) {
  const rh = card.reversedHints;
  if (!rh?.love || !rh.work || !rh.growth) fail(`${card.id} reversedHints 누락`);
  for (const key of ['love', 'work', 'growth'] as const) {
    const text = rh[key]!;
    const n = [...text].length;
    if (n < 40 || n > 70) fail(`${card.id} reversedHints.${key} 길이 ${n} (40~70)`);
    if (particle.test(text)) fail(`${card.id} reversedHints.${key} 조사 병기`);
    if (!text.endsWith('.')) fail(`${card.id} reversedHints.${key} 마침표 없음`);
  }
}

for (const spread of TAROT_SPREADS) {
  for (const card of deck) {
    for (const reversed of [false, true]) {
      const byPosition: string[] = [];
      spread.positions.forEach((position, index) => {
        for (const frame of position.frames) {
          const text = interpretSpreadCard(card, reversed, spread.hintKey, frame);
          rendered += 1;
          if (!text.trim()) fail(`${card.id} ${spread.id} pos${index} ${reversed ? '역' : '정'} 빈 문장`);
          if (particle.test(text)) fail(`${card.id} ${spread.id} 조사 병기: ${text}`);
          if (/\.{2,}/.test(text.replace(/…/g, ''))) fail(`${card.id} ${spread.id} 마침표 중복: ${text}`);
        }
        byPosition.push(interpretSpreadCard(card, reversed, spread.hintKey, position.frames[0]));
      });
      if (new Set(byPosition).size !== 3) {
        fail(`${card.id} ${spread.id} ${reversed ? '역' : '정'} 포지션 문장 동일`);
      }
    }
  }
}

for (const kind of Object.keys(TAROT_SPREAD_SYNTHESIS) as TarotSpreadKind[]) {
  for (const n of [0, 1, 2, 3] as const) {
    const pair = TAROT_SPREAD_SYNTHESIS[kind][n];
    if (pair.length !== 2) fail(`synthesis ${kind} ${n} 후보 ${pair.length}`);
    for (const line of pair) {
      if (!line.trim() || particle.test(line) || /\.{2,}/.test(line.replace(/…/g, ''))) {
        fail(`synthesis ${kind} ${n}: ${line}`);
      }
    }
  }
}

console.log('check:tarot-spread OK');
console.log(`  ${deck.length}장 × 3유형 × 정역 × 3포지션 × frames → ${rendered}문장`);
