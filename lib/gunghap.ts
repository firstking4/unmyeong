import {
  applyBaseCorrection,
  computeCompatibility,
  meetingTone,
  tenGodPlain,
  type CompatibilityScorePart,
} from '@/lib/manseryeok';
import {
  buildGunghapTarotReading,
  rawTotalToTodayScore,
  type GunghapTarotReading,
} from '@/lib/gunghapTarot';
import { localYmd, pickDailyFrom, shuffleDaily } from '@/lib/daily/pick';
import {
  resolveParticles,
  withEulReul,
  withEun,
  withGwa,
  withIga,
  withRo,
} from '@/lib/korean/particle';
import { type Element, type ZodiacAnimal } from '@/lib/saju';
import type { ContactProfile, Profile } from '@/lib/types';

export type CompatibilityGrade = '주의' | '조심' | '무난' | '좋음' | '최고';

export type TodayCompatibility = {
  ready: boolean;
  reason?: string;
  score: number;
  baseScore: number;
  todayScore: number;
  baseCorrectionFactor: number;
  baseCorrectionBonus: number;
  scoreOrigin: number;
  scoreScaleMax: number;
  maxPositiveSum: number;
  scoreParts: CompatibilityScorePart[];
  rawTotal: number;
  dailyDelta: number;
  grade: CompatibilityGrade;
  moodHeadline: string;
  summary: string;
  /** 카드 키워드 위 — 상세 요약의 한 줄 버전 */
  summaryLine: string;
  relationship: string;
  guidance: string;
  caution: string;
  keywords: string[];
  selfAnimal: ZodiacAnimal | null;
  otherAnimal: ZodiacAnimal | null;
  selfElement: Element | null;
  otherElement: Element | null;
  animalLabel: string;
  elementLabel: string;
  /** 관계 십신(상대→나) — 점수 합산 제외, 표시용 */
  otherToSelfTenGod: string;
  selfMonthTenGod: string;
  otherMonthTenGod: string;
  monthPillarKorean: string;
  selfYearTenGod: string;
  otherYearTenGod: string;
  yearPillarKorean: string;
  compactDate: string;
  tarot: GunghapTarotReading | null;
  tarotScoreDelta: number;
};

const HARD_GODS = new Set(['겁재', '상관', '편관']);

/** 궁합 화면용 쉬운 초점 말 (전문 키워드 대신) */
const EASY_FOCUS: Record<string, string[]> = {
  비견: ['같은 속도', '같이하기', '동반'],
  겁재: ['속도', '경쟁심', '승부'],
  식신: ['표현', '나누기', '만들기'],
  상관: ['표현', '아이디어', '재치'],
  편재: ['움직임', '기회', '확장'],
  정재: ['챙기기', '약속', '관리'],
  편관: ['책임', '중심 잡기', '절제'],
  정관: ['규칙', '질서', '기준'],
  편인: ['혼자 시간', '생각', '탐구'],
  정인: ['배움', '돌봄', '받침'],
};

/** 조심할 점 — 십신별 후보(날짜·관계 시드로 순환) */
const EASY_CAUTION_VARIANTS: Record<string, string[]> = {
  비견: [
    '같은 자리에서 겨루지 않기.',
    '속도 차이를 무시하지 않기.',
    '내 방식만 맞다고 하지 않기.',
    '상대 취향을 내 기준으로 재지 않기.',
    '함께하는 시간을 늘리기만 하지 않기.',
    '비슷하다고 다 안다고 하지 않기.',
  ],
  겁재: [
    '서두르거나 다투지 않기.',
    '조급하게 결론부터 내지 않기.',
    '사소한 일로 겨루지 않기.',
    '이기는 쪽으로 몰아가지 않기.',
    '급한 마음을 상대에게 옮기지 않기.',
    '먼저 나서서 상대 몫을 빼앗지 않기.',
  ],
  식신: [
    '완성만 따지다 만남을 미루지 않기.',
    '표현 욕심에 상대 말을 놓치지 않기.',
    '잘했다·못했다만 나누지 않기.',
    '내 이야기로만 대화를 채우지 않기.',
    '보여 주기 위해 억지로 만들지 않기.',
    '나누는 것에 점수를 매기지 않기.',
  ],
  상관: [
    '말이 너무 세지지 않게.',
    '표현이 날카롭게 나가지 않게.',
    '비판 톤으로 대화하지 않기.',
    '옳고 그름을 따지기부터 하지 않기.',
    '돌려 말하다 뜻이 엇나가지 않게.',
    '유머가 상처가 되지 않게.',
  ],
  편재: [
    '약속을 너무 많이 잡지 않기.',
    '움직임만 챙기다 대화를 놓치지 않기.',
    '새 일만 벌이지 않기.',
    '결과부터 재촉하지 않기.',
    '유용함만 따져 관계를 재지 않기.',
    '바쁘다는 말로 답을 미루지 않기.',
  ],
  정재: [
    '완벽하려다 만남을 미루지 않기.',
    '세부만 챙기다 분위기를 놓치지 않기.',
    '약속을 너무 엄하게 맞추지 않기.',
    '챙기는 것을 평가받으려 하지 않기.',
    '계획이 틀어졌다고 표정이 굳지 않게.',
    '준비가 덜 됐다고 대화를 닫지 않기.',
  ],
  편관: [
    '상대를 몰아붙이지 않기.',
    '압박감을 주는 말투 피하기.',
    '명령조로 말하지 않기.',
    '걱정을 간섭처럼 전하지 않기.',
    '중요하다는 이유로 서두르게 하지 않기.',
    '기준을 들어 상대를 재지 않기.',
  ],
  정관: [
    '형식만 챙기다 마음을 놓치지 않기.',
    '규칙만 따지다 유연함을 잃지 않기.',
    '체크리스트처럼 대화하지 않기.',
    '원칙을 들어 분위기를 얼리지 않기.',
    '바른 말을 상대를 가르치는 데 쓰지 않기.',
    '해야 할 일 목록부터 꺼내지 않기.',
  ],
  편인: [
    '답을 재촉해 밀어내지 않기.',
    '혼자 생각할 시간을 빼앗지 않기.',
    '침묵을 답답해하지 않기.',
    '깊은 주제를 갑자기 꺼내지 않기.',
    '상대의 속도를 느리다고 하지 않기.',
    '혼자 정리하고 싶다는 신호를 무시하지 않기.',
  ],
  정인: [
    '결정을 전부 맡기지 않기.',
    '돌봄이 부담이 되지 않게.',
    '책임을 한쪽에만 두지 않기.',
    '받은 도움을 당연하게 여기지 않기.',
    '배움을 가르침으로 바꾸지 않기.',
    '의지한다는 말을 부담스럽게 하지 않기.',
  ],
};

const YUKCHUNG_CAUTION = [
  '말투가 세지지 않게 조심하기.',
  '말끝을 무겁게 하지 않기.',
  '답답해하며 몰아붙이지 않기.',
];

const GENERIC_CAUTION = [
  '너무 밀어붙이지만 않기.',
  '형식만 챙기다 마음을 놓치지 않기.',
  '한쪽만 맞추려 하지 않기.',
  '답을 재촉하며 분위기를 급하게 만들지 않기.',
  '작은 일로 톤이 올라가지 않게.',
  '확답을 오늘 안에 받으려 하지 않기.',
];

/** 오늘 해보기 — 십신별 후보(날짜·관계 시드로 순환) */
const EASY_GUIDANCE_VARIANTS: Record<string, string[]> = {
  비견: [
    '오늘은 같은 속도로 한 가지만 같이하기.',
    '오늘은 각자 페이스를 존중하며 짧게 만나기.',
    '오늘은 경쟁 대신 협력으로 맞추기.',
  ],
  겁재: [
    '오늘은 서두르지 않고 한 박자 쉬며 대화하기.',
    '오늘은 결론보다 분위기를 먼저 맞추기.',
    '오늘은 다툼 대신 짧은 안부로 이어가기.',
  ],
  식신: [
    '오늘은 표현·나누기 쪽으로 작은 이야기 하나.',
    '오늘은 만든 것·느낀 것을 가볍게 공유하기.',
    '오늘은 완성도보다 대화로 이어가기.',
  ],
  상관: [
    '오늘은 표현을 부드럽게 다듬고 짧게 만나기.',
    '오늘은 아이디어를 제안으로 바꿔 말하기.',
    '오늘은 날카로운 말 대신 표현을 낮추기.',
  ],
  편재: [
    '오늘은 움직임·기회 중 하나만 골라 같이하기.',
    '오늘은 새 제안을 가볍게 나누고 반응 보기.',
    '오늘은 여러 일보다 한 가지에 집중하기.',
  ],
  정재: [
    '오늘은 챙기기·약속 중 작은 일 하나 정리하기.',
    '오늘은 계획을 짧게 맞추고 다음 만남 잡기.',
    '오늘은 신뢰 쌓는 작은 약속 하나 지키기.',
  ],
  편관: [
    '오늘은 압박·부담을 줄이고 한 가지만 맞추기.',
    '오늘은 기준을 정하되 톤은 부드럽게 하기.',
    '오늘은 책임을 나누며 짧게 만나기.',
  ],
  정관: [
    '오늘은 규칙·약속을 가볍게 맞추기.',
    '오늘은 형식보다 마음이 통하는 대화로.',
    '오늘은 해야 할 연락·절차 하나 처리하기.',
  ],
  편인: [
    '오늘은 혼자 시간을 존중하며 짧게 만나기.',
    '오늘은 생각을 재촉하지 않고 한 주제만 나누기.',
    '오늘은 침묵도 괜찮다고 두고 가볍게 이어가기.',
  ],
  정인: [
    '오늘은 배움·돌봄 쪽으로 작은 도움 하나.',
    '오늘은 천천히 익히는 대화로 이어가기.',
    '오늘은 결정을 맡기기보다 함께 정하기.',
  ],
};

const GENERIC_GUIDANCE: Record<ReturnType<typeof meetingTone>, string[]> = {
  주의: [
    '오늘은 짧은 안부만 나누기.',
    '오늘은 길게 늘이지 말기.',
    '오늘은 가볍게 인사만 나누기.',
    '오늘은 말수를 줄이고 톤을 낮추기.',
  ],
  조율: [
    '오늘은 속도 차이를 맞추며 짧게 만나기.',
    '오늘은 한쪽만 맞추지 않고 균형 잡기.',
    '오늘은 작은 일 하나로 호흡 맞추기.',
    '오늘은 페이스를 서로 확인하며 대화하기.',
  ],
  순조: [
    '오늘은 작은 일 하나만 같이하기.',
    '오늘은 짧은 대화로 가볍게 이어가기.',
    '오늘은 부담 없는 만남으로 시작하기.',
    '오늘은 좋은 흐름을 작게 이어가기.',
  ],
};

const ANIMAL_CAUTION: Record<string, string[]> = {
  육충: YUKCHUNG_CAUTION,
};

const ELEMENT_CAUTION: Record<string, string[]> = {
  극함: [
    '힘겨루기처럼 보이지 않게.',
    '맞서기보다 한 박자 쉬기.',
    '이기려 들지 않기.',
  ],
  극받음: [
    '밀어내지 않게 조심하기.',
    '상대 페이스를 존중하기.',
    '거리를 너무 멀리 두지 않기.',
  ],
};

const EASY_ANIMAL: Record<string, string> = {
  같음: '같은 결',
  육합: '잘 맞는 결',
  삼합: '한팀 같은 결',
  방합: '가까운 결',
  육충: '변화가 잦은 결',
  흐름: '평범한 결',
};

const EASY_ELEMENT: Record<string, string> = {
  같음: '같은 기운',
  생함: '서로 돕는 기운',
  생받음: '서로 돕는 기운',
  극함: '내가 이끄는 기운',
  극받음: '상대가 이끄는 기운',
};

/**
 * 일지 십신 한 단어 표기 — 속자리 문장용.
 * 겉(일간) 표기 `EASY_FOCUS`와 같은 단어가 나오면 문장 안에서 중복으로 읽혀
 * 의도적으로 다른 어휘를 둔다. 고정값이 아니라 오늘의 일지라 매일 바뀐다.
 */
const BRANCH_FOCUS: Record<string, string> = {
  비견: '동행',
  겁재: '추진',
  식신: '나눔',
  상관: '새로운 시각',
  편재: '움직임',
  정재: '챙김',
  편관: '중심',
  정관: '기준',
  편인: '사색',
  정인: '배움',
};


/** 궁합 오늘·이달·올해 — 관계 맥락 짧은 말 (tenGodPlain 잘림 대신) */
/**
 * 십신 라벨 — 한 십신에 표현이 하나뿐이면 그 십신이 올 때마다 같은 말이 된다
 * (정관만 와도 매번 「규칙·약속」). 십신당 여러 표현을 두고 날마다 돌린다.
 * 같은 날 같은 십신은 화면 어디서든 같은 라벨이어야 하므로 salt에 날짜는 없다.
 */
const RELATIONSHIP_TODAY: Record<string, string[]> = {
  비견: ['같은 페이스', '나란한 속도', '동행하는 결'],
  겁재: ['서두름·결단', '속도·승부', '추진·경쟁'],
  식신: ['표현·나누기', '만듦·나눔', '풀이·나누기'],
  상관: ['표현·아이디어', '재치·발산', '아이디어·직설'],
  편재: ['움직임·기회', '실행·확장', '기회·행동'],
  정재: ['챙기기·약속', '관리·성실', '계획·챙김'],
  편관: ['압박·책임', '책임·무게', '절제·긴장'],
  정관: ['규칙·약속', '질서·기준', '체계·원칙'],
  편인: ['혼자 시간', '사색·정리', '내면·탐구'],
  정인: ['배움·돌봄', '받침·정성', '돌봄·배움'],
};

// 오늘·이달·올해에서 같은 십신이 같은 글자로 나오지 않게 스코프 간에도 문자열을 나눈다
const RELATIONSHIP_MONTH: Record<string, string[]> = {
  비견: ['동료·경쟁', '동료·협력'],
  겁재: ['속도 경쟁', '추진 경쟁'],
  식신: ['표현·제작', '만듦·공유'],
  상관: ['피드백·개선', '재치·개선'],
  편재: ['기회·발굴', '실행·성과'],
  정재: ['축적·정리', '관리·정돈'],
  편관: ['책임·마감', '기준·마감'],
  정관: ['질서·약속', '체계·약속'],
  편인: ['탐구·혼자', '사색·혼자'],
  정인: ['배움·채움', '배움·받침'],
};

const RELATIONSHIP_YEAR: Record<string, string[]> = {
  비견: ['주체성·동료', '독립·동료'],
  겁재: ['결단·속도', '추진·결단'],
  식신: ['표현·성장', '만듦·성장'],
  상관: ['관찰·조율', '재치·조율'],
  편재: ['기회·확장', '행동·확장'],
  정재: ['안정·축적', '관리·축적'],
  편관: ['책임·기준', '절제·책임'],
  정관: ['질서·신뢰', '체계·신뢰'],
  편인: ['탐구·직관', '사색·직관'],
  정인: ['배움·기반', '배움·뿌리'],
};

/** 생년 관계 십신(상대→나) — 오늘·이달·올해와 구분 */
const RELATIONSHIP_PAIR: Record<string, string> = {
  비견: '비슷한 결',
  겁재: '서로 자극',
  식신: '표현·나눔',
  상관: '표현·아이디어',
  편재: '움직임·기회',
  정재: '챙기기·약속',
  편관: '책임·중심',
  정관: '규칙·약속',
  편인: '혼자 시간',
  정인: '배움·돌봄',
};

function formatCompactDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const w = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  return `${y}.${m}.${d} (${w})`;
}

/**
 * 5등급: 주의 · 조심 · 무난 · 좋음 · 최고
 * 컷: &lt;50 · 50~59 · 60~74 · 75~89 · ≥90
 */
function gradeFromScore(score: number): CompatibilityGrade {
  if (score >= 90) return '최고';
  if (score >= 75) return '좋음';
  if (score >= 60) return '무난';
  if (score >= 50) return '조심';
  return '주의';
}

function uniqueWords(words: string[]): string[] {
  return words.filter((w, i, all) => Boolean(w) && all.indexOf(w) === i);
}

function easyFocus(god: string, limit = 2): string {
  return (EASY_FOCUS[god] ?? []).slice(0, limit).join('·');
}

function relationshipLabel(
  scope: '오늘' | '이달' | '올해',
  god: string,
  pairSeed: string,
  date: Date,
): string {
  const map =
    scope === '오늘' ? RELATIONSHIP_TODAY : scope === '이달' ? RELATIONSHIP_MONTH : RELATIONSHIP_YEAR;
  const variants = map[god];
  if (variants?.length) {
    // salt에 날짜를 넣지 않는다 — 같은 날 같은 십신은 카드·상세 어디서든 같은 라벨
    return pickLine(variants, `rel-label:${scope}:${god}:${pairSeed}`, date);
  }
  return easyFocus(god) || tenGodPlain(god);
}

/**
 * 같은 십신의 다음 변주.
 * 카드에서 쓴 표현을 상세에서 그대로 반복하면 한 화면에 같은 말이 도배되므로,
 * 상세 블록은 다음 표현을 쓴다. 변주가 하나뿐이면 그대로.
 */
function relationshipLabelAlt(
  scope: '오늘' | '이달' | '올해',
  god: string,
  pairSeed: string,
  date: Date,
): string {
  const map =
    scope === '오늘' ? RELATIONSHIP_TODAY : scope === '이달' ? RELATIONSHIP_MONTH : RELATIONSHIP_YEAR;
  const variants = map[god];
  if (!variants || variants.length === 0) return easyFocus(god) || tenGodPlain(god);
  if (variants.length === 1) return variants[0]!;
  const base = pickLine(variants, `rel-label:${scope}:${god}:${pairSeed}`, date);
  const index = variants.indexOf(base);
  return variants[(index + 1) % variants.length]!;
}

function relationshipPairLabel(god: string): string {
  if (RELATIONSHIP_PAIR[god]) return RELATIONSHIP_PAIR[god];
  return easyFocus(god) || tenGodPlain(god);
}

function elementRelationshipLine(kind: string, pairSeed: string, date: Date): string {
  const easy = EASY_ELEMENT[kind] ?? '비슷한 기운';
  const options =
    easy.endsWith(' 기운')
      ? [
          `오행은 ${easy.slice(0, -3)} 쪽입니다.`,
          `둘의 오행은 ${easy.slice(0, -3)} 편입니다.`,
          `오행 기운은 ${easy.slice(0, -3)} 쪽에 가깝습니다.`,
        ]
      : [`오행은 ${easy}입니다.`, `둘의 오행은 ${easy} 쪽입니다.`];
  return pickLine(options, `gunghap-element:${kind}:${pairSeed}`, date);
}

function pairNames(selfName: string, otherName: string): string {
  return `${withGwa(selfName)} ${otherName}`;
}

/**
 * 자세한 풀이 첫 문장 — 오늘 점수를 실제로 움직인 요소를 짚는다.
 *
 * 띠·오행·관계 십신(생년 고정)만으로 첫 문장을 열면 어법을 돌려도
 * 매일 같은 읽기가 된다. 오늘의 십신·점수 부품은 매일 바뀌는 정보라
 * 첫 문장부터 날마다 새로워진다.
 */
function buildTodayDriverLine(
  selfName: string,
  otherName: string,
  selfGod: string,
  otherGod: string,
  selfBranch: string,
  otherBranch: string,
  scoreParts: CompatibilityScorePart[],
  pairSeed: string,
  date: Date,
): string {
  const selfLabel = relationshipLabel('오늘', selfGod, pairSeed, date);
  const otherLabel = relationshipLabel('오늘', otherGod, pairSeed, date);
  const sb = BRANCH_FOCUS[selfBranch] ?? selfBranch;
  const ob = BRANCH_FOCUS[otherBranch] ?? otherBranch;

  const kwFor = (key: string): string => {
    if (key === 'todaySelf') return selfLabel;
    if (key === 'todayOther') return otherLabel;
    if (key === 'todaySelfBranch') return sb;
    if (key === 'todayOtherBranch') return ob;
    return '';
  };
  const whoFor = (key: string): string =>
    key === 'todaySelf' || key === 'todaySelfBranch' ? selfName : otherName;

  const todayParts = scoreParts.filter((p) => p.key.startsWith('today') && p.key !== 'todaySame');
  const byDeltaDesc = [...todayParts].sort((a, b) => b.delta - a.delta);
  const pos = byDeltaDesc[0];
  const neg = byDeltaDesc[byDeltaDesc.length - 1];

  const options: string[] = [];
  if (pos && pos.delta >= 6) {
    options.push(
      `오늘은 ${whoFor(pos.key)} 쪽 ${kwFor(pos.key)} 기운이 궁합을 끌어올립니다.`,
      `오늘 흐름은 ${whoFor(pos.key)}의 ${kwFor(pos.key)} 기운 덕이 큽니다.`,
    );
  }
  if (neg && neg.delta <= -6) {
    options.push(
      `오늘은 ${whoFor(neg.key)} 쪽 ${kwFor(neg.key)} 기운이 발목을 잡을 수 있어요.`,
      `오늘은 ${kwFor(neg.key)} 기운이 무겁게 작동해 속도 조절이 필요합니다.`,
    );
  }
  // 같은 십신끼리 밀고 견제한다고 하면 말이 안 되므로 라벨이 다를 때만 둔다
  if (pos && neg && pos.delta >= 6 && neg.delta <= -6 && kwFor(pos.key) !== kwFor(neg.key)) {
    options.push(
      `오늘은 ${kwFor(pos.key)} 결이 밀어 주고 ${kwFor(neg.key)} 결이 견제하는 하루입니다.`,
    );
  }
  // 어느 날에도 고정되지 않도록 오늘 십신 라벨이 들어간 문장을 항상 둔다.
  // 같은 기운끼리는 X·X로 나열하지 않는다.
  options.push(
    selfLabel === otherLabel
      ? `오늘은 둘 다 ${selfLabel} 기운이라 결이 선명합니다.`
      : `오늘은 ${selfLabel}·${otherLabel} 기운이 고르게 맞물립니다.`,
    sb === ob
      ? `오늘은 속자리 ${withIga(sb)} 가만히 받치는 하루입니다.`
      : `오늘은 속자리 ${withIga(`${sb}·${ob}`)} 조용히 받치는 하루입니다.`,
  );
  return pickLine(options, `gunghap-driver:${pairSeed}`, date);
}

/**
 * 자세한 풀이 둘째 문장 — 관계의 바탕(띠·오행·관계 십신)은 고정값이라
 * 단독으로 매일 서면 어제 문장이 된다. 항상 오늘의 기운과 한 문장에 엮는다.
 */
function buildRelationTodayLine(
  animalKind: string,
  elementKind: string,
  pairLabel: string,
  selfGod: string,
  otherGod: string,
  selfBranch: string,
  otherBranch: string,
  grade: CompatibilityGrade,
  pairSeed: string,
  date: Date,
): string {
  const animalEasy = EASY_ANIMAL[animalKind] ?? '평범한 결';
  const elementEasy = EASY_ELEMENT[elementKind] ?? '비슷한 기운';
  // 카드·첫 문장과 같은 표현이 반복되지 않게 다음 변주를 쓴다
  const selfLabel = relationshipLabelAlt('오늘', selfGod, pairSeed, date);
  const otherLabel = relationshipLabelAlt('오늘', otherGod, pairSeed, date);
  const sb = BRANCH_FOCUS[selfBranch] ?? selfBranch;
  const ob = BRANCH_FOCUS[otherBranch] ?? otherBranch;
  const tone = blendedTodayTone(selfGod, otherGod, selfBranch, otherBranch);
  const toneBreath =
    tone === '주의' ? '속도를 낮춘' : tone === '조율' ? '균형을 잡는' : '편안한';

  // 십신 라벨(규칙·약속 등)은 첫 문장과 카드·오늘 구간에서 이미 선다.
  // 여기서 또 쓰면 한 화면에 같은 말이 도배되므로, 라벨을 쓰는 템플릿은 하나만 둔다.
  return pickLine(
    [
      selfLabel === otherLabel
        ? `${animalEasy}인 두 사람, 오늘은 둘 다 ${selfLabel} 기운에 놓입니다.`
        : `${animalEasy}인 두 사람, 오늘은 ${selfLabel}·${otherLabel} 기운이 만납니다.`,
      `${pairLabel} 결로 이어진 두 사람에게 오늘은 ${grade} 흐름이 얹힙니다.`,
      `${elementEasy}이 오늘의 ${grade} 흐름을 받칩니다.`,
      sb === ob
        ? `${withRo(animalEasy)} 이어진 사이, 오늘은 속자리 ${withIga(sb)} 결을 더합니다.`
        : `${withRo(animalEasy)} 이어진 사이, 오늘은 속자리 ${withIga(`${sb}·${ob}`)} 결을 더합니다.`,
      `둘을 잇는 ${pairLabel} 결, 오늘은 ${toneBreath} 호흡으로 이어가면 좋습니다.`,
      `평소 ${elementEasy}이라도 오늘은 ${grade} 흐름에 맞춰 보면 좋습니다.`,
    ],
    `gunghap-summary-rel:${pairSeed}`,
    date,
  );
}

function buildSummaryLine(
  selfName: string,
  otherName: string,
  selfGod: string,
  otherGod: string,
  selfBranch: string,
  otherBranch: string,
  grade: CompatibilityGrade,
  pairSeed: string,
  date: Date,
): string {
  const selfLabel = relationshipLabel('오늘', selfGod, pairSeed, date);
  const otherLabel = relationshipLabel('오늘', otherGod, pairSeed, date);
  const meetTone = blendedTodayTone(selfGod, otherGod, selfBranch, otherBranch);
  const meetClause =
    meetTone === '주의'
      ? '말과 거리를 살필'
      : meetTone === '조율'
        ? '호흡을 맞출'
        : '기운이 호응하기 쉬운';
  const names = pairNames(selfName, otherName);
  // 십신·등급은 날마다 바뀌므로 salt에 넣지 않는다. 넣으면 순열이 매일 다시 섞인다.
  const salt = `gunghap-summary:${pairSeed}`;

  if (selfGod === otherGod) {
    return pickLine(
      [
        `${names}, 오늘은 둘 다 ${selfLabel} 쪽이라 흐름이 ${grade}에 가깝습니다.`,
        `${names} 오늘은 나란히 ${selfLabel} 흐름이고, 기운은 ${grade} 쪽입니다.`,
        `${names}, 오늘 만남은 ${selfLabel} 결로 맞아 등급은 ${grade}입니다.`,
        `${names}, 오늘은 서로 ${selfLabel} 리듬을 타고 있어 흐름은 ${grade}입니다.`,
        `${names} 오늘은 같은 ${selfLabel} 기운에 놓여 있고, 등급은 ${grade}입니다.`,
        `${names}, 오늘 두 사람 모두 ${selfLabel} 쪽으로 기울어 흐름이 ${grade}입니다.`,
      ],
      salt,
      date,
    );
  }

  return pickLine(
    [
      `${names}, 오늘 나는 ${selfLabel}, 상대는 ${otherLabel} 쪽이라 ${meetClause} 하루이고 기운은 ${grade}입니다.`,
      `${names} 오늘은 내 쪽이 ${selfLabel}, 상대 쪽이 ${otherLabel}이라 ${meetClause} 날이고 흐름은 ${grade}입니다.`,
      `${names}, 오늘 만남은 ${selfLabel}·${otherLabel} 조합이라 ${meetClause} 하루이며 등급은 ${grade}입니다.`,
      `${names}, 오늘은 ${selfLabel} 쪽인 나와 ${otherLabel} 쪽인 상대가 만나 ${meetClause} 흐름이고 기운은 ${grade}입니다.`,
      `${names} 오늘은 ${withGwa(selfLabel)} ${withIga(otherLabel)} 마주 놓여 ${meetClause} 날이며 등급은 ${grade}입니다.`,
      `${names}, 오늘 내 결은 ${selfLabel}, 상대 결은 ${otherLabel}이라 ${meetClause} 하루로 흐름은 ${grade}입니다.`,
    ],
    salt,
    date,
  );
}

function dualEasyLine(
  scope: '오늘' | '이달' | '올해',
  selfGod: string,
  otherGod: string,
  pairSeed: string,
  date: Date,
): string {
  // 카드(summaryLine)와 같은 라벨이 한 화면에 그대로 반복되지 않게
  // 이 블록은 같은 십신의 다음 변주를 쓴다
  const selfLabel = relationshipLabelAlt(scope, selfGod, pairSeed, date);
  const otherLabel = relationshipLabelAlt(scope, otherGod, pairSeed, date);
  const topic = withEun(scope);
  const salt = `gunghap-rel:${scope}:${pairSeed}`;

  if (selfGod === otherGod) {
    const options =
      scope === '오늘'
        ? [
            `${topic} 둘 다 ${selfLabel} 쪽이에요.`,
            `${topic} 둘 다 ${selfLabel} 흐름이에요.`,
            `${topic} 나란히 ${selfLabel} 결이에요.`,
            `${topic} 서로 ${selfLabel} 리듬을 타요.`,
            `${topic} 두 사람 모두 ${selfLabel} 쪽으로 기울어요.`,
          ]
        : scope === '이달'
          ? [
              `${topic} 둘 다 ${selfLabel} 환경이에요.`,
              `${topic} 둘 다 ${selfLabel} 분위기예요.`,
              `${topic} 나란히 ${selfLabel} 흐름에 놓여요.`,
              `${topic} 서로 ${selfLabel} 리듬이에요.`,
              `${topic} 두 사람 모두 ${withRo(selfLabel)} 흘러요.`,
            ]
          : [
              `${topic} 둘 다 ${selfLabel} 방향이에요.`,
              `${topic} 둘 다 ${selfLabel} 흐름이에요.`,
              `${topic} 나란히 ${selfLabel} 쪽을 봐요.`,
              `${topic} 서로 ${withRo(selfLabel)} 결로 가요.`,
              `${topic} 두 사람 모두 ${selfLabel} 방향에 서 있어요.`,
            ];
    return pickLine(options, salt, date);
  }

  if (scope === '오늘') {
    return pickLine(
      [
        `${topic} 나는 ${selfLabel}, 상대는 ${otherLabel} 쪽이에요.`,
        `${topic} 내 쪽은 ${selfLabel}, 상대 쪽은 ${otherLabel}이에요.`,
        `${topic} 나 ${selfLabel}, 상대 ${otherLabel} 흐름이에요.`,
        `${topic} 내 결이 ${selfLabel}, 상대 결이 ${otherLabel}이에요.`,
        `${topic} ${selfLabel} 쪽인 나와 ${otherLabel} 쪽인 상대가 만나요.`,
        `${topic} 나에게 ${selfLabel}, 상대에게 ${withIga(otherLabel)} 실려요.`,
      ],
      salt,
      date,
    );
  }
  if (scope === '이달') {
    return pickLine(
      [
        `${topic} 나는 ${selfLabel}, 상대는 ${otherLabel} 흐름이에요.`,
        `${topic} 내 쪽 ${selfLabel}, 상대 쪽 ${otherLabel} 환경이에요.`,
        `${topic} 나 ${selfLabel}, 상대 ${otherLabel} 리듬이에요.`,
        `${topic} 내 결이 ${selfLabel}, 상대 결이 ${withRo(otherLabel)} 흘러요.`,
        `${topic} ${selfLabel} 자리의 나와 ${otherLabel} 자리의 상대예요.`,
        `${topic} 나에게 ${selfLabel}, 상대에게 ${otherLabel} 기운이 들어와요.`,
      ],
      salt,
      date,
    );
  }
  return pickLine(
    [
      `${topic} 나는 ${selfLabel}, 상대는 ${otherLabel} 방향이에요.`,
      `${topic} 내 쪽 ${selfLabel}, 상대 쪽 ${otherLabel} 방향이에요.`,
      `${topic} 나 ${selfLabel}, 상대 ${otherLabel} 큰 흐름이에요.`,
      `${topic} 내 결이 ${selfLabel}, 상대 결이 ${otherLabel} 쪽을 봐요.`,
      `${topic} ${selfLabel} 방향의 나와 ${otherLabel} 방향의 상대예요.`,
      `${topic} 나에게 ${selfLabel}, 상대에게 ${withIga(otherLabel)} 한 해의 결이에요.`,
    ],
    salt,
    date,
  );
}

const MOOD_TONE_LABELS: Record<ReturnType<typeof meetingTone>, string[]> = {
  주의: ['천천히', '호흡 맞추기', '짧게', '톤 낮추기'],
  조율: ['맞추기', '한 박자', '균형', '조율'],
  순조: ['잘 맞음', '순조', '호응', '가볍게'],
};

const MOOD_GRADE_LABELS: Record<CompatibilityGrade, string[]> = {
  주의: ['주의'],
  조심: ['조심', '신중'],
  무난: ['무난', '평온'],
  좋음: ['좋음', '호응'],
  최고: ['최고', '기운 좋음'],
};

type TodayTone = ReturnType<typeof meetingTone>;

/**
 * 겉(일간) 톤과 속(일지) 톤 중 조심스러운 쪽을 따른다.
 * 일간 10일 주기만 쓰면 만남 톤이 10일마다 그대로 돌아온다.
 * 일지를 섞으면 60일 주기가 되고, 점수(일지 델타 포함)와도 어긋나지 않는다.
 */
function blendedTodayTone(
  selfGod: string,
  otherGod: string,
  selfBranch: string,
  otherBranch: string,
): TodayTone {
  const stemTone = meetingTone(selfGod, otherGod);
  const branchTone = meetingTone(selfBranch, otherBranch);
  const rank: Record<TodayTone, number> = { 순조: 0, 조율: 1, 주의: 2 };
  return rank[branchTone] > rank[stemTone] ? branchTone : stemTone;
}

/**
 * 오늘 일지(속자리) 한 줄 — 60일 주기의 정보를 문장에 싣는다.
 * 같은 십신이면 나란히 놓인 형태로, 다르면 각자 자리로 적는다.
 */
function branchUnderLine(
  selfBranch: string,
  otherBranch: string,
  pairSeed: string,
  date: Date,
  saltSuffix = '',
): string {
  const sb = BRANCH_FOCUS[selfBranch] ?? selfBranch;
  const ob = BRANCH_FOCUS[otherBranch] ?? otherBranch;
  if (selfBranch === otherBranch) {
    return pickLine(
      [
        `속자리에는 둘 다 ${sb} 기운이 깔려 있어요.`,
        `밑바탕 기운도 ${sb} 쪽으로 겹칩니다.`,
        `속마음 자리도 나란히 ${sb}입니다.`,
        `겉과 속이 모두 ${sb} 쪽이라 결이 선명합니다.`,
      ],
      `gunghap-branch-same:${pairSeed}${saltSuffix}`,
      date,
    );
  }
  return pickLine(
    [
      `속자리에는 나는 ${sb}, 상대는 ${ob} 기운이 깔려 있어요.`,
      `겉 아래 속에는 ${sb}·${ob} 결이 흐릅니다.`,
      `밑바탕에는 나에게 ${sb}, 상대에게 ${ob} 기운이 놓여 있어요.`,
      `속마음 자리는 나는 ${sb}, 상대는 ${ob} 쪽입니다.`,
      `보이는 결 아래로 ${sb}·${ob} 기운이 함께 움직입니다.`,
      `속자리의 기운은 각각 ${sb}·${ob} 쪽을 향합니다.`,
    ],
    `gunghap-branch:${pairSeed}${saltSuffix}`,
    date,
  );
}

function buildMoodHeadline(
  selfGod: string,
  otherGod: string,
  selfBranch: string,
  otherBranch: string,
  grade: CompatibilityGrade,
  pairSeed: string,
  date: Date,
): string {
  const tone = blendedTodayTone(selfGod, otherGod, selfBranch, otherBranch);
  const toneLabels = MOOD_TONE_LABELS[tone];
  const gradeLabels = MOOD_GRADE_LABELS[grade];
  const tonePart = pickLine(toneLabels, `gunghap-mood-tone:${pairSeed}`, date);
  const gradePart = pickLine(gradeLabels, `gunghap-mood-grade:${pairSeed}`, date);
  return `${tonePart} · ${gradePart}`;
}

/**
 * 후보에서 오늘 쓸 문장 하나.
 *
 * 예전에는 날짜를 시드에 넣고 `seed % length`로 뽑았다. 후보가 2~3개뿐인
 * 문장이 많아 사흘에 한 번씩 같은 말이 돌아오고, 연속 이틀 중복도 잦았다.
 * `pickDailyFrom`은 순열을 돌기 때문에 한 바퀴 안에서 중복이 없다.
 */
function pickLine(options: string[], salt: string, date: Date): string {
  return pickDailyFrom(options, salt, date) ?? options[0]!;
}

function cautionVariantsForGod(god: string): string[] {
  return EASY_CAUTION_VARIANTS[god] ?? [];
}

function guidanceVariantsForGod(god: string): string[] {
  return EASY_GUIDANCE_VARIANTS[god] ?? [];
}

function dynamicGuidanceLines(
  selfGod: string,
  otherGod: string,
  selfBranch = '',
  otherBranch = '',
): string[] {
  // 겉(일간)·속(일지) 십신의 초점을 함께 쓴다. 일지가 들어가 60일 주기가 된다
  const focus = uniqueWords([
    ...(EASY_FOCUS[selfGod] ?? []),
    ...(EASY_FOCUS[otherGod] ?? []),
    ...(BRANCH_FOCUS[selfBranch] ? [BRANCH_FOCUS[selfBranch]] : []),
    ...(BRANCH_FOCUS[otherBranch] ? [BRANCH_FOCUS[otherBranch]] : []),
  ]);
  if (focus.length === 0) return [];

  const tone = blendedTodayTone(selfGod, otherGod, selfBranch, otherBranch);
  const pair = focus.slice(0, 2).join('·');
  const triple = focus.slice(0, 3).join('·');
  const lines = [
    `오늘은 ${focus[0]} 쪽에서 작은 제안 하나 나누기.`,
    focus[1]
      ? `오늘은 ${focus[1]} 흐름으로 짧게 이어가기.`
      : `오늘은 ${focus[0]} 흐름으로 짧게 이어가기.`,
    `오늘은 ${pair} 흐름을 가볍게 맞추며 만나기.`,
    `오늘은 ${focus[0]}보다 분위기를 먼저 살피기.`,
  ];
  if (triple !== pair) lines.push(`오늘은 ${triple} 쪽으로 작은 일 하나.`);
  if (tone === '주의') {
    lines.push(`오늘은 ${withEulReul(focus[0])} 낮추고 짧게 만나기.`);
    lines.push(`오늘은 ${withEulReul(pair)} 줄이고 가볍게 만나기.`);
    lines.push('오늘은 짧은 안부로 톤부터 맞추기.');
  }
  if (tone === '조율') {
    lines.push(`오늘은 ${triple || pair} 속도를 서로 맞추기.`);
    lines.push(`오늘은 ${pair} 균형을 먼저 맞추기.`);
    if (focus[1]) lines.push(`오늘은 ${withGwa(focus[0])} ${focus[1]} 사이를 조율하며 만나기.`);
  }
  if (tone === '순조') {
    lines.push(`오늘은 ${triple || pair} 흐름으로 가볍게 이어가기.`);
    lines.push(`오늘은 ${focus[0]} 쪽에서 작은 제안 하나.`);
  }
  return lines;
}

function dynamicCautionLines(
  selfGod: string,
  otherGod: string,
  selfBranch = '',
  otherBranch = '',
): string[] {
  const focus = uniqueWords([
    ...(EASY_FOCUS[selfGod] ?? []),
    ...(EASY_FOCUS[otherGod] ?? []),
    ...(BRANCH_FOCUS[selfBranch] ? [BRANCH_FOCUS[selfBranch]] : []),
    ...(BRANCH_FOCUS[otherBranch] ? [BRANCH_FOCUS[otherBranch]] : []),
  ]);
  if (focus.length === 0) return [];

  const tone = blendedTodayTone(selfGod, otherGod, selfBranch, otherBranch);
  const pair = focus.slice(0, 2).join('·');
  const triple = focus.slice(0, 3).join('·');
  const lines = [
    `${withEulReul(pair)} 동시에 밀지 않기.`,
    `${focus[0]}만 따지지 않기.`,
    focus[1] ? `${withIga(focus[1])} 겹치지 않게.` : `${withIga(focus[0])} 겹치지 않게.`,
    `${pair}로 밀어붙이지 않기.`,
    `${withEulReul(pair)} 한꺼번에 꺼내지 않기.`,
    focus[2] ? `${focus[2]}에만 시선이 가지 않게.` : `${focus[0]}에만 시선이 가지 않게.`,
  ];
  if (triple !== pair) lines.push(`${withIga(triple)} 한꺼번에 나오지 않게.`);
  if (tone === '주의') {
    lines.push(`${withEulReul(pair)} 줄이고 짧게 마무리하기.`);
    lines.push('말수를 줄이고 톤을 낮추기.');
  }
  if (tone === '조율') {
    lines.push(`${pair} 속도 차이를 무시하지 않기.`);
    lines.push('한쪽만 맞추라고 재촉하지 않기.');
  }
  if (tone === '순조') lines.push('너무 많은 걸 한 번에 꺼내지 않기.');
  return lines;
}

function buildGuidance(
  selfGod: string,
  otherGod: string,
  selfBranch: string,
  otherBranch: string,
  date: Date,
  pairSeed: string,
): string {
  const tone = blendedTodayTone(selfGod, otherGod, selfBranch, otherBranch);

  const candidates: string[] = [];
  for (const god of prioritizedCautionGods(selfGod, otherGod, selfBranch, otherBranch)) {
    candidates.push(...guidanceVariantsForGod(god));
  }
  candidates.push(...dynamicGuidanceLines(selfGod, otherGod, selfBranch, otherBranch));
  candidates.push(...GENERIC_GUIDANCE[tone]);

  const unique = candidates.filter((line, i, all) => Boolean(line) && all.indexOf(line) === i);
  if (unique.length === 0) return GENERIC_GUIDANCE[tone][0];
  return pickLine(unique, `gunghap-guidance:${pairSeed}`, date);
}

function prioritizedCautionGods(
  selfGod: string,
  otherGod: string,
  selfBranch = '',
  otherBranch = '',
): string[] {
  const gods: string[] = [];
  const push = (god: string) => {
    if (god && gods.indexOf(god) === -1) gods.push(god);
  };

  if (HARD_GODS.has(selfGod)) push(selfGod);
  if (HARD_GODS.has(otherGod)) push(otherGod);
  // 속자리(일지)에 어려운 기운이 있으면 그쪽 조언도 후보에 넣는다
  if (HARD_GODS.has(selfBranch)) push(selfBranch);
  if (HARD_GODS.has(otherBranch)) push(otherBranch);
  push(selfGod);
  push(otherGod);
  push(selfBranch);
  push(otherBranch);

  const assertive = new Set(['비견', '식신', '편재', '편인']);
  if (assertive.has(selfGod)) push(selfGod);
  if (assertive.has(otherGod)) push(otherGod);

  return gods;
}

/** 오늘 나·상대 십신 + 날짜·관계 시드 — 해보기처럼 매일·지인별로 달라짐 */
function buildCaution(
  selfGod: string,
  otherGod: string,
  selfBranch: string,
  otherBranch: string,
  animalKind: string,
  elementKind: string,
  date: Date,
  pairSeed: string,
): string {
  const candidates: string[] = [];
  for (const god of prioritizedCautionGods(selfGod, otherGod, selfBranch, otherBranch)) {
    candidates.push(...cautionVariantsForGod(god));
  }
  candidates.push(...dynamicCautionLines(selfGod, otherGod, selfBranch, otherBranch));
  candidates.push(...(ANIMAL_CAUTION[animalKind] ?? []));
  candidates.push(...(ELEMENT_CAUTION[elementKind] ?? []));
  candidates.push(...GENERIC_CAUTION);

  const unique = candidates.filter((line, i, all) => Boolean(line) && all.indexOf(line) === i);
  if (unique.length === 0) return GENERIC_CAUTION[0];
  return pickLine(unique, `gunghap-caution:${animalKind}:${elementKind}:${pairSeed}`, date);
}

const fixObjectParticle = resolveParticles;

function notReady(reason: string, date: Date): TodayCompatibility {
  return {
    ready: false,
    reason,
    score: 0,
    baseScore: 0,
    todayScore: 0,
    baseCorrectionFactor: 0,
    baseCorrectionBonus: 0,
    scoreOrigin: 44,
    scoreScaleMax: 94,
    maxPositiveSum: 81,
    scoreParts: [],
    rawTotal: 0,
    dailyDelta: 0,
    grade: '무난',
    moodHeadline: '아직 열리지 않은 궁합',
    summary: reason,
    summaryLine: reason,
    relationship: '',
    guidance: '이름과 생년월일을 채우면 오늘의 궁합 점수를 볼 수 있습니다.',
    caution: '',
    keywords: [],
    selfAnimal: null,
    otherAnimal: null,
    selfElement: null,
    otherElement: null,
    animalLabel: '',
    elementLabel: '',
    otherToSelfTenGod: '',
    selfMonthTenGod: '',
    otherMonthTenGod: '',
    monthPillarKorean: '',
    selfYearTenGod: '',
    otherYearTenGod: '',
    yearPillarKorean: '',
    compactDate: formatCompactDate(date),
    tarot: null,
    tarotScoreDelta: 0,
  };
}

export function buildTodayCompatibility(
  self: Profile,
  other: Pick<ContactProfile, 'name' | 'birthDate' | 'birthTime' | 'mbti' | 'bloodType'>,
  date = new Date(),
): TodayCompatibility {
  if (!self.name?.trim() || !self.birthDate?.trim()) {
    return notReady('내 이름과 생년월일을 먼저 입력해 주세요.', date);
  }
  if (!other.birthDate?.trim()) {
    return notReady('지인의 생년월일이 필요합니다.', date);
  }

  const engine = computeCompatibility(
    { birthDate: self.birthDate, birthTime: self.birthTime },
    { birthDate: other.birthDate, birthTime: other.birthTime },
    date,
  );
  if (!engine) {
    return notReady('생년월일을 확인해 주세요.', date);
  }

  const tarot = buildGunghapTarotReading(self.birthDate, other.birthDate, date);
  const rawWithTarot = engine.rawTotal + tarot.scoreDelta;
  const todayScoreWithTarot = rawTotalToTodayScore(rawWithTarot);
  const { factor, bonus, score } = applyBaseCorrection(todayScoreWithTarot, engine.baseScore);
  const scoreParts: CompatibilityScorePart[] = [
    ...engine.scoreParts,
    {
      key: 'tarot',
      label: `타로 ${tarot.cardTitle} ${tarot.orientation}`,
      delta: tarot.scoreDelta,
    },
  ];

  const otherName = other.name.trim() || '상대';
  const selfName = self.name.trim();
  const grade = gradeFromScore(score);
  const pairGod = engine.otherToSelfTenGod;
  const toneKw =
    MOOD_TONE_LABELS[
      blendedTodayTone(
        engine.selfTodayTenGod,
        engine.otherTodayTenGod,
        engine.selfTodayBranchTenGod,
        engine.otherTodayBranchTenGod,
      )
    ][0];
  const animalEasy = EASY_ANIMAL[engine.animalKind] ?? '평범한 결';
  const elementEasy = EASY_ELEMENT[engine.elementKind] ?? '기운';
  const pairLabel = relationshipPairLabel(pairGod);

  const pairSeed = `${self.birthDate}:${other.birthDate}`;

  // 띠 결·오행·관계 십신은 생년으로 정해져 값이 고정이다. 순서까지 고정이면
  // 늘 같은 단어로 시작해 매일 같은 카드처럼 보인다. 자리를 날마다 돌린다.
  // 관계 십신 칩도 고정 두 개가 매일 서지 않게, 풀에서 날마다 두 개를 고른다.
  const pairFocus = shuffleDaily(EASY_FOCUS[pairGod] ?? [], `gunghap-focus:${pairSeed}`, date).slice(
    0,
    2,
  );
  const keywords = shuffleDaily(
    uniqueWords([
      animalEasy,
      toneKw,
      ...pairFocus,
      elementEasy.replace(/ 기운$/, ''),
      ...tarot.keywords,
    ]),
    `gunghap-keywords:${pairSeed}`,
    date,
  ).slice(0, 6);

  // 자세한 풀이 — 고정 소개(띠·오행·관계 나열)는 매일 같은 읽기라 두지 않는다.
  // 오늘 점수를 움직인 요소가 앞에 오고, 관계 바탕은 오늘과 엮인 형태로만 선다.
  const summary = [
    buildTodayDriverLine(
      selfName,
      otherName,
      engine.selfTodayTenGod,
      engine.otherTodayTenGod,
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      scoreParts,
      pairSeed,
      date,
    ),
    buildRelationTodayLine(
      engine.animalKind,
      engine.elementKind,
      pairLabel,
      engine.selfTodayTenGod,
      engine.otherTodayTenGod,
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      grade,
      pairSeed,
      date,
    ),
  ].join(' ');

  const summaryLine = [
    buildSummaryLine(
      selfName,
      otherName,
      engine.selfTodayTenGod,
      engine.otherTodayTenGod,
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      grade,
      pairSeed,
      date,
    ),
    // 일지(속자리) 문장 — 일간 10일 주기와 어긋나 60일 주기의 정보가 된다
    branchUnderLine(
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      pairSeed,
      date,
    ),
  ].join(' ');

  const relationship = [
    dualEasyLine('오늘', engine.selfTodayTenGod, engine.otherTodayTenGod, pairSeed, date),
    // 카드의 속자리 문장과 템플릿이 겹치지 않게 salt를 다르게 둔다
    branchUnderLine(
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      pairSeed,
      date,
      ':rel',
    ),
    dualEasyLine('이달', engine.selfMonthTenGod, engine.otherMonthTenGod, pairSeed, date),
    dualEasyLine('올해', engine.selfYearTenGod, engine.otherYearTenGod, pairSeed, date),
    elementRelationshipLine(engine.elementKind, pairSeed, date),
  ].join(' ');

  return {
    ready: true,
    score,
    baseScore: engine.baseScore,
    todayScore: todayScoreWithTarot,
    baseCorrectionFactor: factor,
    baseCorrectionBonus: bonus,
    scoreOrigin: engine.scoreOrigin,
    scoreScaleMax: engine.scoreScaleMax,
    maxPositiveSum: engine.maxPositiveSum,
    scoreParts,
    rawTotal: rawWithTarot,
    dailyDelta: rawWithTarot,
    grade,
    moodHeadline: buildMoodHeadline(
      engine.selfTodayTenGod,
      engine.otherTodayTenGod,
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      grade,
      pairSeed,
      date,
    ),
    summary: fixObjectParticle(summary),
    summaryLine: fixObjectParticle(summaryLine),
    relationship,
    guidance: fixObjectParticle(
      buildGuidance(
        engine.selfTodayTenGod,
        engine.otherTodayTenGod,
        engine.selfTodayBranchTenGod,
        engine.otherTodayBranchTenGod,
        date,
        pairSeed,
      ),
    ),
    caution: buildCaution(
      engine.selfTodayTenGod,
      engine.otherTodayTenGod,
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      engine.animalKind,
      engine.elementKind,
      date,
      pairSeed,
    ),
    keywords,
    selfAnimal: engine.self.animal as ZodiacAnimal,
    otherAnimal: engine.other.animal as ZodiacAnimal,
    selfElement: engine.self.dayMasterElement as Element,
    otherElement: engine.other.dayMasterElement as Element,
    // 카드 요약에도 쉬운 말
    animalLabel: animalEasy,
    elementLabel: elementEasy,
    otherToSelfTenGod: engine.otherToSelfTenGod,
    selfMonthTenGod: engine.selfMonthTenGod,
    otherMonthTenGod: engine.otherMonthTenGod,
    monthPillarKorean: engine.monthPillarKorean,
    selfYearTenGod: engine.selfYearTenGod,
    otherYearTenGod: engine.otherYearTenGod,
    yearPillarKorean: engine.yearPillarKorean,
    compactDate: formatCompactDate(date),
    tarot,
    tarotScoreDelta: tarot.scoreDelta,
  };
}
