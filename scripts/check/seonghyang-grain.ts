/**
 * 오늘 성향 키워드 × MBTI 강점 결 (상승·상충·별개).
 * 「얹어」·시너지·가중·중립이 없는지, INTJ×느긋함은 장기 설계 상승인지.
 *
 * 실행: npm run check:seonghyang-grain
 */
import { getMbti } from '@/lib/data/catalog';
import seonghyangPack from '@/data/daily/packs/seonghyang.json';
import { mbtiTodayGrainLine, relateGrains } from '@/lib/seonghyangGrain';

const failures: string[] = [];
function fail(message: string) {
  failures.push(message);
}

const BANNED = /얹어|시너지|역시너지|가중|중립|더해져|덧셈|뺄셈/;
const ALIGN_CUE = /상승 효과|좋은 조화|어우러|상부상조|맞물|촉매|기폭제/;
const AGAINST_CUE = /상충|역효과|상쇄|발목|불협화음|빛바래/;
const NONE_CUE = /영향이 없|별개|따로 놀|따로 놉|파장|평행선|독립적으로/;

const date = new Date(2026, 8, 5, 12, 0, 0);
const intj = getMbti('INTJ');
if (!intj) {
  fail('INTJ 시드 없음');
} else {
  const pick = mbtiTodayGrainLine(intj, '느긋함', date);
  if (!pick) fail('INTJ×느긋함 문장 없음');
  else {
    if (pick.relation !== 'align') fail(`INTJ×느긋함 relation=${pick.relation} (align이어야 함)`);
    if (pick.strength !== '장기 설계') {
      fail(`INTJ×느긋함 강점=${pick.strength} (장기 설계이어야 함)`);
    }
    if (!pick.line.includes('장기 설계')) fail(`문장에 강점 없음: ${pick.line}`);
    if (!ALIGN_CUE.test(pick.line)) fail(`INTJ×느긋함 상승 표현 없음: ${pick.line}`);
  }

  const against = relateGrains('즉흥', '구조화');
  if (against !== 'against') fail(`즉흥×구조화=${against} (against이어야 함)`);

  const none = relateGrains('느긋함', '핵심 파악');
  if (none !== 'none') fail(`느긋함×핵심 파악=${none} (none이어야 함)`);
}

const types = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;
const keywords = (seonghyangPack.variants as { keyword: string }[]).map((v) => v.keyword);

for (const type of types) {
  const mbti = getMbti(type);
  if (!mbti) {
    fail(`${type} 시드 없음`);
    continue;
  }
  for (const keyword of keywords) {
    const pick = mbtiTodayGrainLine(mbti, keyword, date);
    if (!pick) {
      fail(`${type}×${keyword} 문장 없음`);
      continue;
    }
    if (BANNED.test(pick.line)) fail(`${type}×${keyword}: 금지 어휘 ${pick.line}`);
    if (/[을이은과][(（][를가는와][)）]/.test(pick.line)) {
      fail(`${type}×${keyword}: 조사 병기 ${pick.line}`);
    }
    const cue =
      pick.relation === 'align'
        ? ALIGN_CUE
        : pick.relation === 'against'
          ? AGAINST_CUE
          : NONE_CUE;
    if (!cue.test(pick.line)) {
      fail(`${type}×${keyword} (${pick.relation}) 표현 없음: ${pick.line}`);
    }
  }
}

if (failures.length === 0) {
  console.log(`✅ 성향 결 ${types.length}×${keywords.length} · INTJ×느긋함=장기 설계 상승`);
} else {
  console.log(`\n❌ ${failures.length}건`);
  for (const line of failures) console.log(` - ${line}`);
  process.exit(1);
}
