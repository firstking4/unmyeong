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
import { localYmd, pickDaily, pickDailyFrom, shuffleDaily } from '@/lib/daily/pick';
import {
  resolveParticles,
  withEulReul,
  withEun,
  withGwa,
  withIga,
  withIyeyo,
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
  /** 점수 아래 오늘의 궁합 — 짧은 한 줄 */
  summaryLine: string;
  /** 자세한 풀이 · 오늘 궁합의 속자리 한 줄 */
  todayGunghap: string;
  /** 자세한 풀이 · 이달 궁합 */
  monthGunghap: string;
  /** 자세한 풀이 · 올해 궁합 */
  yearGunghap: string;
  /** 스크립트·하위호환 — 오늘·이달·올해 이어 붙인 것 */
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
  비견: ['같이하기', '나눠 하기', '함께 가기'],
  겁재: ['빨리 정하기', '앞서가기', '속도 내기'],
  식신: ['나누기', '만들기', '이야기하기'],
  상관: ['솔직한 말', '재치', '하고 싶은 말'],
  편재: ['움직이기', '기회', '나가기'],
  정재: ['챙기기', '정리', '약속'],
  편관: ['중심 잡기', '조심하기', '할 일'],
  정관: ['약속', '순서', '정해진 일'],
  편인: ['생각 정리', '혼자 시간', '조용한 대화'],
  정인: ['챙김', '정성', '여유'],
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
    '내 이야기에 상대 말을 놓치지 않기.',
    '잘했다, 못했다로만 나누지 않기.',
    '내 이야기로만 대화를 채우지 않기.',
    '보여 주기 위해 억지로 만들지 않기.',
    '나누는 것에 점수를 매기지 않기.',
  ],
  상관: [
    '말이 너무 세지지 않게.',
    '하고 싶은 말을 다 쏟지 않기.',
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
    '다그치는 말투 피하기.',
    '명령조로 말하지 않기.',
    '걱정을 간섭처럼 전하지 않기.',
    '중요하다는 이유로 서두르게 하지 않기.',
    '기준을 들어 상대를 재지 않기.',
  ],
  정관: [
    '형식만 챙기다 마음을 놓치지 않기.',
    '규칙만 따지다 유연함을 잃지 않기.',
    '체크리스트처럼 대화하지 않기.',
    '지켜야 한다고 분위기를 얼리지 않기.',
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
    '오늘은 나누기 쪽으로 작은 이야기 하나.',
    '오늘은 만든 것과 느낀 것을 가볍게 나누기.',
    '오늘은 완성도보다 대화로 이어가기.',
  ],
  상관: [
    '오늘은 말을 부드럽게 하고 짧게 만나기.',
    '오늘은 하고 싶은 말을 제안처럼 하기.',
    '오늘은 센 말 대신 톤을 낮추기.',
  ],
  편재: [
    '오늘은 나갈 일과 새 기회 중 하나만 골라 같이하기.',
    '오늘은 새 제안을 가볍게 나누고 반응 보기.',
    '오늘은 여러 일보다 한 가지에 집중하기.',
  ],
  정재: [
    '오늘은 챙기기와 약속 중 작은 일 하나 정리하기.',
    '오늘은 계획을 짧게 맞추고 다음 만남 잡기.',
    '오늘은 신뢰 쌓는 작은 약속 하나 지키기.',
  ],
  편관: [
    '오늘은 부담을 덜고 한 가지만 맞추기.',
    '오늘은 기준을 정하되 톤은 부드럽게 하기.',
    '오늘은 책임을 나누며 짧게 만나기.',
  ],
  정관: [
    '오늘은 약속과 순서를 가볍게 맞추기.',
    '오늘은 형식보다 마음이 통하는 대화로.',
    '오늘은 해야 할 연락이나 절차 하나 처리하기.',
  ],
  편인: [
    '오늘은 혼자 시간을 존중하며 짧게 만나기.',
    '오늘은 생각을 재촉하지 않고 한 주제만 나누기.',
    '오늘은 침묵도 괜찮다고 두고 가볍게 이어가기.',
  ],
  정인: [
    '오늘은 챙김 쪽으로 작은 도움 하나.',
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
  같음: '비슷한 기질',
  육합: '잘 맞음',
  삼합: '한팀',
  방합: '가까운 사이',
  육충: '변화 잦음',
  흐름: '무난한 사이',
};

const EASY_ELEMENT: Record<string, string> = {
  같음: '같은 방향',
  생함: '서로 돕는',
  생받음: '서로 돕는',
  극함: '내가 이끄는',
  극받음: '상대가 이끄는',
};

const ANIMAL_PLAIN: Record<string, string> = {
  같음: '두 사람은 평소 기질이 비슷해요.',
  육합: '두 사람은 평소 잘 맞아요.',
  삼합: '두 사람은 평소 한팀처럼 움직여요.',
  방합: '두 사람은 평소 가깝게 지내는 편이에요.',
  육충: '두 사람은 평소 변화가 잦은 편이에요.',
  흐름: '두 사람은 평소 무난한 사이예요.',
};

const ELEMENT_PLAIN: Record<string, string> = {
  같음: '서로 같은 방향으로 가는 편이에요.',
  생함: '서로 힘을 보태 주는 편이에요.',
  생받음: '서로 힘을 보태 주는 편이에요.',
  극함: '오행으로 보면 내가 앞장서는 편이에요.',
  극받음: '오행으로 보면 상대가 앞장서는 편이에요.',
};

const PAIR_PLAIN: Record<string, string> = {
  비견: '평소 결이 비슷한 사이예요.',
  겁재: '평소 서로에게 자극이 되는 사이예요.',
  식신: '평소 만들어 나누기 편한 사이예요.',
  상관: '평소 이야기하기 편한 사이예요.',
  편재: '평소 함께 움직이기 쉬운 사이예요.',
  정재: '평소 차근히 쌓아 가는 사이예요.',
  편관: '평소 중심을 잡아 주는 사이예요.',
  정관: '평소 약속을 중시하는 사이예요.',
  편인: '평소 거리를 존중하는 사이예요.',
  정인: '평소 서로 받쳐 주는 사이예요.',
};

/** 오늘 톤(일간+일지 블렌드)별 마무리 — 한 문장만 두면 매일 같은 말로 끝난다 */
const TONE_ADVICE: Record<ReturnType<typeof meetingTone>, string[]> = {
  주의: [
    '오늘은 속도를 낮추고 짧게 만나는 편이 좋아요.',
    '오늘은 말을 아끼고 가볍게 지나가는 게 좋아요.',
    '오늘은 길게 끌지 않는 편이 서로 편해요.',
    '오늘은 결론을 내지 않고 넘어가도 괜찮아요.',
  ],
  조율: [
    '오늘은 서로 한 박자씩 맞춰 가면 됩니다.',
    '오늘은 속도가 조금 달라도 맞춰 가면 괜찮아요.',
    '오늘은 먼저 듣고 나서 말하면 잘 풀려요.',
    '오늘은 작은 것부터 맞춰 보면 편해져요.',
  ],
  순조: [
    '오늘은 편안한 호흡으로 이어가면 좋아요.',
    '오늘은 하던 대로 해도 잘 맞아요.',
    '오늘은 가볍게 만나도 기분이 좋아요.',
    '오늘은 별다른 준비 없이도 잘 통해요.',
  ],
};

const GRADE_ADVICE: Record<CompatibilityGrade, string[]> = {
  주의: [
    '오늘은 말을 줄이고 한 박자 쉬는 편이 좋아요.',
    '오늘은 짧게 만나고 거리를 두는 편이 좋아요.',
  ],
  조심: [
    '오늘은 톤을 낮춰 맞추는 편이 좋아요.',
    '오늘은 서두르지 않고 호흡을 맞추면 됩니다.',
  ],
  무난: [
    '오늘은 무리 없이 이어가면 됩니다.',
    '오늘은 평소처럼 만나도 괜찮은 날이에요.',
  ],
  좋음: [
    '오늘은 편하게 만나기 좋아요.',
    '오늘은 서로를 믿어 봐도 좋은 날이에요.',
  ],
  최고: [
    '오늘은 서로 잘 열리는 날이에요.',
    '오늘은 함께 있으면 기운이 나는 날이에요.',
  ],
};

/**
 * 일지 십신 한 단어 표기 — 속자리 문장용.
 * 겉(일간) 표기 `EASY_FOCUS`와 같은 단어가 나오면 문장 안에서 중복으로 읽혀
 * 의도적으로 다른 어휘를 둔다. 고정값이 아니라 오늘의 일지라 매일 바뀐다.
 */
const BRANCH_FOCUS: Record<string, string> = {
  비견: '함께 가려는 마음',
  겁재: '앞서가려는 마음',
  식신: '나누고 싶은 기분',
  상관: '새로운 시각',
  편재: '나가고 싶은 기분',
  정재: '챙기고 싶은 기분',
  편관: '중심을 잡으려는 마음',
  정관: '기준을 지키려는 마음',
  편인: '혼자 정리하고 싶은 기분',
  정인: '든든한 뒷받침',
};


/** 궁합 오늘·이달·올해 — 관계 맥락 짧은 말 (tenGodPlain 잘림 대신) */
/**
 * 십신 라벨 — 한 십신에 표현이 하나뿐이면 그 십신이 올 때마다 같은 말이 된다
 * (정관만 와도 매번 「규칙·약속」). 십신당 여러 표현을 두고 날마다 돌린다.
 * 같은 날 같은 십신은 화면 어디서든 같은 라벨이어야 하므로 salt에 날짜는 없다.
 */
const RELATIONSHIP_TODAY: Record<string, string[]> = {
  비견: ['발 맞추기', '나란히 가기', '함께 걷기'],
  겁재: ['빨리 정하기', '앞서가기', '속도 내기'],
  식신: ['나누기', '만들기', '이야기하기'],
  상관: ['솔직한 말', '재치 있는 말', '하고 싶은 말'],
  편재: ['움직이기', '밖으로 나가기', '새 일 벌이기'],
  정재: ['챙기기', '정리하기', '약속 챙기기'],
  편관: ['맡은 일', '할 일', '조심하는 마음'],
  정관: ['약속 지키기', '순서대로 하기', '정해진 일'],
  편인: ['혼자 있는 시간', '생각 정리', '조용한 시간'],
  정인: ['천천히 익히기', '마음 쓰기', '의지하기'],
};

const RELATIONSHIP_MONTH: Record<string, string[]> = {
  비견: ['같이 하기', '서로 맞추기'],
  겁재: ['바쁜 흐름', '이기려는 마음'],
  식신: ['만들어 보여 주기', '함께 만들기'],
  상관: ['고치기', '의견 내기'],
  편재: ['늘어난 일', '보이는 기회'],
  정재: ['모아 두기', '정돈하기'],
  편관: ['마감', '책임'],
  정관: ['공식적인 일', '절차 챙기기'],
  편인: ['조용히 보내기', '생각에 잠기기'],
  정인: ['돌보기', '서로 돕기'],
};

const RELATIONSHIP_YEAR: Record<string, string[]> = {
  비견: ['함께 서기', '내 자리 지키기'],
  겁재: ['크게 바꾸기', '마음 정하기'],
  식신: ['키워 가기', '만들어 가기'],
  상관: ['새롭게 보기', '다르게 보기'],
  편재: ['넓히기', '밖으로 뻗기'],
  정재: ['차근히 쌓기', '안정 잡기'],
  편관: ['중심 잡기', '책임 지기'],
  정관: ['신뢰 쌓기', '바르게 가기'],
  편인: ['깊이 생각하기', '나만의 시간'],
  정인: ['기반 다지기', '뿌리 내리기'],
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

/** 짧은 라벨을 문장에 넣을 때 · 는 `과/와`로 푼다 */
function asTalk(label: string): string {
  const parts = label.split('·').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 2) return `${withGwa(parts[0]!)} ${parts[1]}`;
  return label;
}

function easyFocus(god: string, limit = 2): string {
  return joinTalk((EASY_FOCUS[god] ?? []).slice(0, limit));
}

/**
 * 문장 안 나열 — `·`로 이어 붙이면 키워드 목록처럼 읽혀 문장이 끊긴다.
 * 마지막 두 개는 `과/와`로, 그 앞은 쉼표로 잇는다.
 */
function joinTalk(words: string[]): string {
  const list = words.filter(Boolean);
  if (list.length <= 1) return list[0] ?? '';
  const last = list[list.length - 1]!;
  const prev = list[list.length - 2]!;
  const head = list.slice(0, -2);
  const tail = `${withGwa(prev)} ${last}`;
  return head.length ? `${head.join(', ')}, ${tail}` : tail;
}

function relationshipLabelAt(
  scope: '오늘' | '이달' | '올해',
  god: string,
  pairSeed: string,
  date: Date,
  shift = 0,
): string {
  const map =
    scope === '오늘' ? RELATIONSHIP_TODAY : scope === '이달' ? RELATIONSHIP_MONTH : RELATIONSHIP_YEAR;
  const variants = map[god];
  if (!variants?.length) return easyFocus(god) || tenGodPlain(god);
  const base = pickLine(variants, `rel-label:${scope}:${god}:${pairSeed}`, date);
  if (variants.length === 1 || shift === 0) return base;
  const index = variants.indexOf(base);
  return variants[(index + shift) % variants.length]!;
}

function relationshipLabel(
  scope: '오늘' | '이달' | '올해',
  god: string,
  pairSeed: string,
  date: Date,
): string {
  return relationshipLabelAt(scope, god, pairSeed, date, 0);
}

/** 카드에서 쓴 표현의 다음 변주 — 자세한 풀이 첫 문장 */
function relationshipLabelAlt(
  scope: '오늘' | '이달' | '올해',
  god: string,
  pairSeed: string,
  date: Date,
): string {
  return relationshipLabelAt(scope, god, pairSeed, date, 1);
}

function elementRelationshipLine(kind: string, pairSeed: string, date: Date): string {
  const table: Record<string, string[]> = {
    같음: [
      '서로 같은 방향으로 가는 편이에요.',
      '오행도 비슷한 색을 띠고 있어요.',
      '기운의 방향이 같아서 함께 가기 쉬워요.',
      '같은 결의 오행이라 호흡을 맞추기 좋아요.',
      '서로 비슷한 오행을 나누는 사이예요.',
      '오행으로 보면 같은 길을 보는 편이에요.',
    ],
    생함: [
      '서로 힘을 보태 주는 편이에요.',
      '기운이 서로를 살려 주는 관계예요.',
      '서로 도우며 가는 오행이에요.',
      '주고받는 힘이 있는 오행이라 든든해요.',
      '오행이 서로를 밀어 주는 편이에요.',
      '힘을 나눠 갖는 오행 사이예요.',
    ],
    생받음: [
      '서로 힘을 보태 주는 편이에요.',
      '기운이 서로를 살려 주는 관계예요.',
      '서로 도우며 가는 오행이에요.',
      '주고받는 힘이 있는 오행이라 든든해요.',
      '오행이 서로를 밀어 주는 편이에요.',
      '힘을 나눠 갖는 오행 사이예요.',
    ],
    극함: [
      '내가 이끄는 흐름이 되기 쉬워요.',
      '오행으로 보면 내가 속도를 내는 편이에요.',
      '내가 방향을 잡으면 상대가 따라오기 쉬워요.',
      '이끄는 힘이 나에게 있는 오행이에요.',
      '내가 먼저 가면 흐름이 열리는 오행이에요.',
      '오행은 내가 앞장서는 편에 가깝습니다.',
    ],
    극받음: [
      '상대가 이끄는 흐름이 되기 쉬워요.',
      '오행으로 보면 상대가 속도를 내는 편이에요.',
      '상대가 방향을 잡으면 내가 따라가기 쉬워요.',
      '이끄는 힘이 상대에게 있는 오행이에요.',
      '상대가 먼저 가면 흐름이 열리는 오행이에요.',
      '오행은 상대가 앞장서는 편에 가깝습니다.',
    ],
  };
  const options = table[kind] ?? table.같음!;
  return pickLine(options, `gunghap-element:${kind}:${pairSeed}`, date);
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
  // 카드(summaryLine)와 같은 라벨이 한 화면에 반복되지 않게 다음 변주를 쓴다
  const selfLabel = relationshipLabelAlt('오늘', selfGod, pairSeed, date);
  const otherLabel = relationshipLabelAlt('오늘', otherGod, pairSeed, date);
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

  const selfTalk = asTalk(selfLabel);
  const otherTalk = asTalk(otherLabel);

  const options: string[] = [];
  if (pos && pos.delta >= 6) {
    const kw = asTalk(kwFor(pos.key));
    const who = whoFor(pos.key);
    options.push(
      `오늘은 ${withIga(who)} ${kw} 쪽이라 두 사람 사이가 한결 편해요.`,
      `오늘은 ${withIga(who)} ${withEulReul(kw)} 살려 줘서 만남이 수월합니다.`,
    );
  }
  if (neg && neg.delta <= -6) {
    const kw = asTalk(kwFor(neg.key));
    const who = whoFor(neg.key);
    options.push(
      `오늘은 ${who}에게 ${withIga(kw)} 조금 무겁게 느껴질 수 있어요. 속도를 낮추는 편이 좋아요.`,
      `오늘은 ${kw}에 너무 매이지 않는 게 좋아요.`,
    );
  }
  if (pos && neg && pos.delta >= 6 && neg.delta <= -6 && kwFor(pos.key) !== kwFor(neg.key)) {
    options.push(
      `오늘은 ${withIga(asTalk(kwFor(pos.key)))} 도와주는 만큼, ${withEun(asTalk(kwFor(neg.key)))} 천천히 가는 게 좋아요.`,
    );
  }
  options.push(
    selfLabel === otherLabel
      ? `오늘은 두 사람이 같은 ${selfTalk} 흐름에 있어요. 같은 방향을 보면 됩니다.`
      : `오늘은 ${withEun(selfTalk)} 내가, ${withEun(otherTalk)} 상대가 맡으면 수월해요.`,
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
  pairGod: string,
  selfGod: string,
  otherGod: string,
  selfBranch: string,
  otherBranch: string,
  grade: CompatibilityGrade,
  pairSeed: string,
  date: Date,
): string {
  const animal = ANIMAL_PLAIN[animalKind] ?? ANIMAL_PLAIN.흐름!;
  const element = ELEMENT_PLAIN[elementKind] ?? ELEMENT_PLAIN.같음!;
  const pair = PAIR_PLAIN[pairGod] ?? PAIR_PLAIN.비견!;
  const tone = blendedTodayTone(selfGod, otherGod, selfBranch, otherBranch);
  const toneLine = pickLine(TONE_ADVICE[tone], `gunghap-tone-advice:${pairSeed}`, date);
  const gradeLines = GRADE_ADVICE[grade];
  const gradeLine = pickLine(gradeLines, `gunghap-grade-advice:${pairSeed}`, date);

  return pickLine(
    [
      `${animal} ${gradeLine}`,
      `${element} ${gradeLine}`,
      `${pair} ${gradeLine}`,
      `${animal} ${toneLine}`,
      `${element} ${toneLine}`,
      `${pair} ${toneLine}`,
    ],
    `gunghap-summary-rel:${pairSeed}`,
    date,
  );
}

function buildSummaryLine(
  selfGod: string,
  otherGod: string,
  pairSeed: string,
  date: Date,
): string {
  const selfTalk = asTalk(relationshipLabel('오늘', selfGod, pairSeed, date));
  const otherTalk = asTalk(relationshipLabel('오늘', otherGod, pairSeed, date));
  const salt = `gunghap-summary:${pairSeed}`;

  if (selfGod === otherGod) {
    return pickLine(
      [
        `오늘은 둘 다 ${selfTalk} 쪽에 가까워요.`,
        `오늘은 서로 ${selfTalk}에 마음이 맞아요.`,
        `오늘은 두 사람 모두 ${withEulReul(selfTalk)} 보는 날이에요.`,
        `오늘은 나란히 ${selfTalk}에 마음이 가요.`,
        `오늘은 둘 다 ${withEulReul(selfTalk)} 살리면 만남이 편해요.`,
        `오늘은 둘 다 ${selfTalk}에 힘이 실려요.`,
      ],
      salt,
      date,
    );
  }

  return pickLine(
    [
      `오늘은 나는 ${selfTalk} 쪽, 상대는 ${otherTalk} 쪽이에요.`,
      `오늘은 내 관심은 ${selfTalk}, 상대 관심은 ${otherTalk}에 가깝습니다.`,
      `오늘은 나는 ${withEulReul(selfTalk)} 살리고, 상대는 ${withEulReul(otherTalk)} 보는 날이에요.`,
      `오늘은 나는 ${selfTalk}에 가깝고, 상대는 ${otherTalk}에 가까워요.`,
      `오늘 나는 ${selfTalk}, 상대는 ${withEulReul(otherTalk)} 보면 됩니다.`,
      `오늘은 ${withGwa(selfTalk)} ${withIga(otherTalk)} 만나는 자리예요.`,
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
  const selfTalk = asTalk(relationshipLabelAt(scope, selfGod, pairSeed, date, 1));
  const otherTalk = asTalk(relationshipLabelAt(scope, otherGod, pairSeed, date, 1));
  const salt = `gunghap-rel:${scope}:${pairSeed}`;

  if (selfGod === otherGod) {
    if (scope === '이달') {
      return pickLine(
        [
          `둘 다 ${selfTalk}에 더 어울리는 달이에요.`,
          `두 사람 모두 ${withEulReul(selfTalk)} 보는 달이에요.`,
          `나란히 같은 ${selfTalk} 흐름에 있는 달이에요.`,
          `서로 ${selfTalk} 리듬을 타는 달이에요.`,
          `둘 다 ${selfTalk}에 마음이 가는 달이에요.`,
          `같은 ${selfTalk} 방향을 보면 되는 달이에요.`,
        ],
        salt,
        date,
      );
    }
    return pickLine(
      [
        `둘 다 ${selfTalk}에 힘을 쓰는 해예요.`,
        `두 사람 모두 ${withEulReul(selfTalk)} 보는 해예요.`,
        `나란히 ${selfTalk} 방향에 서 있는 해예요.`,
        `서로 ${withEulReul(selfTalk)} 키우는 해예요.`,
        `둘 다 ${selfTalk}에 마음이 가는 해예요.`,
        `같은 ${selfTalk} 방향을 보면 되는 해예요.`,
      ],
      salt,
      date,
    );
  }

  if (scope === '이달') {
    return pickLine(
      [
        `나는 ${selfTalk}에 가깝고, 상대는 ${otherTalk}에 가까운 달이에요.`,
        `${withEun(selfTalk)} 내가, ${withEun(otherTalk)} 상대가 더 신경 쓰는 달이에요.`,
        `${withEun(selfTalk)} 나에게, ${withEun(otherTalk)} 상대에게 더 어울리는 달이에요.`,
        `내 자리는 ${selfTalk}, 상대 자리는 ${withIyeyo(otherTalk)}.`,
        `나는 ${selfTalk} 쪽이고, 상대는 ${otherTalk} 쪽인 달이에요.`,
        `이달은 나는 ${selfTalk}, 상대는 ${otherTalk}에 더 기울어요.`,
      ],
      salt,
      date,
    );
  }

  return pickLine(
    [
      `나는 ${selfTalk}, 상대는 ${otherTalk}에 힘이 실리는 해예요.`,
      `내 방향은 ${selfTalk}, 상대 방향은 ${withIyeyo(otherTalk)}.`,
      `올해 내 관심은 ${selfTalk}, 상대 관심은 ${otherTalk}에 기울어요.`,
      `나는 ${selfTalk}에, 상대는 ${otherTalk}에 가까운 한 해예요.`,
      `올해는 나는 ${selfTalk}, 상대는 ${otherTalk}에 무게를 둬요.`,
      `나는 ${selfTalk} 쪽이고, 상대는 ${otherTalk} 쪽인 해예요.`,
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
        `겉으로는 달라도, 속마음은 둘 다 ${sb}에 가깝습니다.`,
        `마음 밑바닥도 둘 다 ${sb} 쪽이에요.`,
        `보이지 않는 쪽도 나란히 ${sb}입니다.`,
        `오늘은 속마음까지 ${withRo(sb)} 겹쳐 있어요.`,
      ],
      `gunghap-branch-same:${pairSeed}${saltSuffix}`,
      date,
    );
  }
  return pickLine(
    [
      `겉과 달리 속마음은 나는 ${sb}, 상대는 ${ob}에 가깝습니다.`,
      `마음 밑바닥에는 나는 ${sb}, 상대는 ${withIga(ob)} 깔려 있어요.`,
      `보이지 않는 쪽은 나는 ${sb}, 상대는 ${withIyeyo(ob)}.`,
      `오늘은 속마음이 나는 ${sb}, 상대는 ${ob} 쪽으로 기울어요.`,
      `겉모습 아래로는 나는 ${sb}, 상대는 ${withEulReul(ob)} 보고 있어요.`,
      `속마음은 각각 ${sb}, ${ob} 쪽을 향합니다.`,
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
  const pair = joinTalk(focus.slice(0, 2));
  const lines = [
    `오늘은 ${focus[0]} 쪽에서 작은 제안 하나 나누기.`,
    focus[1]
      ? `오늘은 ${withEulReul(focus[1])} 살려 짧게 이어가기.`
      : `오늘은 ${withEulReul(focus[0])} 살려 짧게 이어가기.`,
    `오늘은 ${withEulReul(pair)} 가볍게 맞추며 만나기.`,
    `오늘은 ${focus[0]}보다 분위기를 먼저 살피기.`,
  ];
  if (focus[2]) lines.push(`오늘은 ${focus[2]} 쪽으로 작은 일 하나.`);
  if (tone === '주의') {
    lines.push(`오늘은 ${withEun(focus[0])} 잠시 두고 짧게 만나기.`);
    lines.push(`오늘은 ${withEulReul(pair)} 앞세우지 않고 가볍게 만나기.`);
    lines.push('오늘은 짧은 안부로 톤부터 맞추기.');
  }
  if (tone === '조율') {
    lines.push(`오늘은 ${withEulReul(pair)} 두고 속도를 서로 맞추기.`);
    lines.push(`오늘은 ${pair} 중에 하나만 골라 해 보기.`);
    if (focus[1]) lines.push(`오늘은 ${withGwa(focus[0])} ${focus[1]} 사이를 조율하며 만나기.`);
  }
  if (tone === '순조') {
    lines.push(`오늘은 ${withEulReul(pair)} 가볍게 이어가기.`);
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
  const pair = joinTalk(focus.slice(0, 2));
  const lines = [
    `${withEulReul(pair)} 동시에 밀지 않기.`,
    `${focus[0]}만 고집하지 않기.`,
    focus[1] ? `${focus[1]}에 너무 매이지 않기.` : `${focus[0]}에 너무 매이지 않기.`,
    `${withEulReul(pair)} 상대에게 강요하지 않기.`,
    `${withEulReul(pair)} 한꺼번에 꺼내지 않기.`,
    focus[2] ? `${focus[2]}에만 시선이 가지 않게.` : `${focus[0]}에만 시선이 가지 않게.`,
  ];
  if (focus[2]) lines.push(`${focus[2]}부터 앞세우지 않기.`);
  if (tone === '주의') {
    lines.push(`${withEulReul(pair)} 앞세우지 않고 짧게 마무리하기.`);
    lines.push('말수를 줄이고 톤을 낮추기.');
  }
  if (tone === '조율') {
    lines.push(`${pair}에서 서로 속도가 다를 수 있다는 걸 잊지 않기.`);
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
    todayGunghap: '',
    monthGunghap: '',
    yearGunghap: '',
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

  // 카드 타이틀(「○○님과 ○○님의 오늘은」)과 같은 호칭 — 문장 안에서도 `님`을 붙인다
  const otherName = other.name.trim() ? `${other.name.trim()}님` : '상대';
  const selfName = `${self.name.trim()}님`;
  const grade = gradeFromScore(score);
  const pairGod = engine.otherToSelfTenGod;
  const pairSeed = `${self.birthDate}:${other.birthDate}`;
  const animalEasy = EASY_ANIMAL[engine.animalKind] ?? '무난한 사이';
  const elementEasy = EASY_ELEMENT[engine.elementKind] ?? '같은 방향';

  const todayTone = blendedTodayTone(
    engine.selfTodayTenGod,
    engine.otherTodayTenGod,
    engine.selfTodayBranchTenGod,
    engine.otherTodayBranchTenGod,
  );
  const theme = pickDaily('gunghap', `gunghap:${pairSeed}`, date);
  const toneKw = pickDailyFrom(MOOD_TONE_LABELS[todayTone], `gunghap-tone-kw:${pairSeed}`, date);
  // 띠 결·오행·관계 십신은 생년 고정값 — 칩에 넣으면 매일 같은 카드가 된다.
  // 칩은 오늘 팩·오늘 톤·오늘 타로만.
  const keywords = shuffleDaily(
    uniqueWords(
      [
        theme.keyword,
        toneKw,
        tarot.keyword,
        tarot.reversed ? tarot.keywords.find((word) => !word.startsWith('타로·')) : undefined,
      ].filter((word): word is string => Boolean(word)),
    ),
    `gunghap-keywords:${pairSeed}`,
    date,
  ).slice(0, 4);

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
      pairGod,
      engine.selfTodayTenGod,
      engine.otherTodayTenGod,
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      grade,
      pairSeed,
      date,
    ),
  ].join(' ');

  const summaryLine = buildSummaryLine(
    engine.selfTodayTenGod,
    engine.otherTodayTenGod,
    pairSeed,
    date,
  );

  const todayGunghap = fixObjectParticle(
    branchUnderLine(
      engine.selfTodayBranchTenGod,
      engine.otherTodayBranchTenGod,
      pairSeed,
      date,
    ),
  );
  const monthGunghap = fixObjectParticle(
    dualEasyLine('이달', engine.selfMonthTenGod, engine.otherMonthTenGod, pairSeed, date),
  );
  const yearGunghap = fixObjectParticle(
    [
      dualEasyLine('올해', engine.selfYearTenGod, engine.otherYearTenGod, pairSeed, date),
      elementRelationshipLine(engine.elementKind, pairSeed, date),
    ].join(' '),
  );
  const relationship = [todayGunghap, monthGunghap, yearGunghap].filter(Boolean).join(' ');

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
    todayGunghap,
    monthGunghap,
    yearGunghap,
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
