/**
 * 관상 상설 해설 — 7부위 언급 + 조합 문장 — `npm run check:physiognomy-composite`
 */
import {
  buildPhysiognomyComposite,
  matchPhysiognomyPairLines,
  type PhysiognomySelection,
} from '@/lib/physiognomy';

const full: PhysiognomySelection = {
  face_shape: 'face_oval',
  forehead: 'forehead_wide_high',
  eyes: 'eyes_large_double_upturned',
  nose: 'nose_high_wide',
  mouth: 'mouth_large_full',
  chin: 'chin_round',
  eyebrows: 'brow_straight_thick',
};

function fail(message: string): never {
  console.error(`check:physiognomy-composite FAIL — ${message}`);
  process.exit(1);
}

const particle = /[을이은과][(（]/;
const composite = buildPhysiognomyComposite(full);
const mentioned = `${composite.summary}\n${composite.pairLines.join('\n')}\n${composite.detailLines
  .map((line) => `${line.category} ${line.label} ${line.blurb}`)
  .join('\n')}`;

for (const row of composite.detailLines) {
  if (!mentioned.includes(row.label)) fail(`라벨 미언급: ${row.label}`);
  if (!mentioned.includes(row.category)) fail(`부위 미언급: ${row.category}`);
}

if (composite.detailLines.length !== 7) fail(`detailLines ${composite.detailLines.length} (7이어야 함)`);
if (composite.pairLines.length < 1) fail('조합 문장 0');
if (composite.bands.length !== 3) fail(`bands ${composite.bands.length} (3이어야 함)`);

const pairs = matchPhysiognomyPairLines(full);
if (pairs.length < 1) fail('matchPhysiognomyPairLines 0');
for (const line of [...composite.pairLines, ...pairs, composite.summary]) {
  if (particle.test(line)) fail(`조사 병기: ${line}`);
}

const exprSmall = buildPhysiognomyComposite({
  ...full,
  eyes: 'eyes_small_double_upturned',
  mouth: 'mouth_small_thin',
});
if (exprSmall.pairLines.some((line) => composite.pairLines.includes(line) && line.includes('눈과 입이 모두 열려'))) {
  fail('눈·입 축이 달라도 같은 표현력 문장');
}

console.log('check:physiognomy-composite OK');
console.log(`  7부위 · 조합 ${composite.pairLines.length} · 묶음 ${composite.bands.length}`);
console.log(`  조합: ${composite.pairLines[0]?.slice(0, 40)}…`);
