import { pickDailyFrom } from '@/lib/daily/pick';
import { withEulReul, withEun, withGwa, withIga } from '@/lib/korean/particle';

/**
 * 오늘 성향 키워드와 MBTI 강점의 결.
 * 화면 말은 상승 효과·어우러짐 / 역효과·상충 / 별개·무영향.
 * 시너지·역시너지·가중·중립·덧셈·뺄셈은 쓰지 않는다.
 * 음의 결은 드물다. 부드럽다고 돌려 말하지 않고 역효과·발목·불협화음을 그대로 쓴다.
 * 같은 극이면 상승(+), 같은 축의 반대면 상충(-), 겹치는 축이 없으면 별개(0).
 * 상승과 상충이 같이 있으면 상승으로 본다 — 「장기 설계」와 「느긋함」처럼
 * 먼 그림·서두르지 않음이 겹치면 서로 키워 주는 조합으로 읽히게.
 */
export type GrainRelation = 'align' | 'against' | 'none';

export type MbtiGrainPick = {
  strength: string;
  relation: GrainRelation;
  line: string;
};

type Pole = 'ease' | 'rush' | 'firm' | 'flex' | 'far' | 'near' | 'warm' | 'cool' | 'open' | 'hold';

const OPPOSITE: Record<Pole, Pole> = {
  ease: 'rush',
  rush: 'ease',
  firm: 'flex',
  flex: 'firm',
  far: 'near',
  near: 'far',
  warm: 'cool',
  cool: 'warm',
  open: 'hold',
  hold: 'open',
};

const GRAIN: Record<string, Pole[]> = {
  // 성향 오늘 키워드 24
  몰입: ['near', 'firm'],
  거리감: ['hold', 'cool'],
  즉흥: ['flex', 'rush'],
  꼼꼼함: ['firm', 'near'],
  말수: ['hold'],
  온도: ['warm', 'open'],
  속도: ['rush'],
  관찰: ['hold', 'near'],
  직진: ['rush', 'firm', 'open'],
  리듬: ['ease'],
  취향: ['far', 'warm'],
  눈치: ['hold', 'warm'],
  유머: ['open', 'warm', 'flex'],
  솔직함: ['open'],
  느긋함: ['ease', 'flex'],
  기민함: ['rush'],
  진지함: ['cool', 'firm'],
  장난기: ['flex', 'open'],
  뚝심: ['firm'],
  융통성: ['flex'],
  감수성: ['warm'],
  실행력: ['rush', 'near'],
  상상력: ['far', 'flex'],
  소신: ['firm', 'cool'],
  // MBTI 강점
  비전: ['far'],
  '장기 설계': ['far', 'ease'],
  '핵심 파악': ['near', 'cool'],
  구조화: ['firm'],
  '독립 판단': ['hold', 'cool'],
  우선순위: ['firm', 'near'],
  분석: ['cool', 'near'],
  '개념 정리': ['firm', 'near'],
  호기심: ['far', 'open'],
  '문제 분해': ['near', 'cool'],
  '논리 검증': ['cool', 'firm'],
  '열린 시각': ['flex', 'open'],
  결단: ['firm', 'rush'],
  '목표 설정': ['far', 'firm'],
  추진력: ['rush'],
  '팀 정비': ['firm', 'open'],
  '큰 그림': ['far'],
  '책임 수용': ['firm'],
  발상: ['far', 'flex'],
  '문제 재정의': ['far', 'flex'],
  설득: ['open'],
  '순간 재치': ['rush', 'flex'],
  '실험 정신': ['flex', 'rush'],
  확장력: ['far', 'flex'],
  '의미 발견': ['far', 'warm'],
  공감: ['warm'],
  통찰: ['far', 'cool'],
  '조용한 끈기': ['ease', 'firm'],
  '사람 이해': ['warm', 'hold'],
  '장기 시야': ['far', 'ease'],
  진정성: ['warm', 'open'],
  '가치 기준': ['firm', 'cool'],
  '조용한 배려': ['warm', 'hold'],
  '깊은 몰입': ['near', 'firm'],
  격려: ['warm', 'open'],
  '분위기 조율': ['flex', 'warm'],
  조화: ['flex', 'warm'],
  '방향 제시': ['far', 'open'],
  '사람 연결': ['open', 'warm'],
  설득력: ['open'],
  열정: ['rush', 'warm'],
  '공감 표현': ['warm', 'open'],
  '가능성 발굴': ['far', 'flex'],
  '분위기 전환': ['flex', 'open'],
  '즉흥 대응': ['rush', 'flex'],
  회복력: ['flex', 'ease'],
  책임: ['firm'],
  정확: ['firm', 'near'],
  꾸준함: ['ease', 'firm'],
  '기준 유지': ['firm'],
  '절차 관리': ['firm'],
  '실무 신뢰': ['near', 'firm'],
  배려: ['warm'],
  안정감: ['ease', 'hold'],
  성실: ['firm', 'ease'],
  '세심한 기억': ['near', 'hold'],
  뒷받침: ['hold', 'warm'],
  '실무 지원': ['near', 'hold'],
  질서: ['firm'],
  '명확한 기준': ['firm'],
  '일정 관리': ['firm', 'near'],
  '조직 정비': ['firm'],
  협력: ['open', 'warm'],
  '분위기 관리': ['open', 'warm'],
  친화력: ['open', 'warm'],
  '세심한 응대': ['warm', 'near'],
  '실행 지원': ['near', 'hold'],
  실용: ['near'],
  침착: ['ease', 'cool'],
  손기술: ['near'],
  '문제 해결': ['near', 'cool'],
  '상황 판단': ['near', 'cool'],
  간결함: ['hold', 'cool'],
  감각: ['near', 'warm'],
  미감: ['warm', 'far'],
  '손끝 표현': ['near', 'open'],
  '현장 적응': ['flex', 'near'],
  여유: ['ease', 'flex'],
  행동력: ['rush'],
  순발력: ['rush', 'flex'],
  '현장 감각': ['near', 'rush'],
  협상: ['open', 'rush'],
  '위기 대응': ['rush', 'firm'],
  배짱: ['rush', 'open'],
  즐거움: ['warm', 'open'],
  표현력: ['open'],
  사교: ['open', 'warm'],
  '현재 집중': ['near'],
  '활력 전달': ['rush', 'warm'],
  친화: ['open', 'warm'],
};

export function relateGrains(keyword: string, strength: string): GrainRelation {
  const a = new Set(GRAIN[keyword] ?? []);
  const b = new Set(GRAIN[strength] ?? []);
  let align = false;
  let against = false;
  for (const pole of a) {
    if (b.has(pole)) align = true;
    if (b.has(OPPOSITE[pole])) against = true;
  }
  if (align) return 'align';
  if (against) return 'against';
  return 'none';
}

/**
 * 키워드 두 개의 상성 문장. 성향뿐 아니라 풀이에서 결을 비교할 때 이 풀을 쓴다.
 */
export function keywordPairLines(
  relation: GrainRelation,
  left: string,
  right: string,
  label?: string,
): string[] {
  if (relation === 'align') {
    return [
      `${withGwa(left)} ${withEun(right)} 서로 상승 효과를 내는 조합입니다.`,
      `${withGwa(left)} ${withEun(right)} 좋은 조화를 이룹니다.`,
      `${withGwa(left)} ${withEun(right)} 잘 어우러집니다.`,
      `${withGwa(left)} ${withEun(right)} 서로 상부상조합니다.`,
      `${withGwa(left)} ${withEun(right)} 잘 맞물리는 조합입니다.`,
      label
        ? `${label}의 ${withGwa(left)} ${withIga(right)} 서로 촉매가 됩니다.`
        : `${withIga(left)} 오늘의 ${withEulReul(right)} 살리는 기폭제가 됩니다.`,
    ];
  }
  if (relation === 'against') {
    return [
      `${withGwa(left)} ${withEun(right)} 상충하는 조합입니다.`,
      `${withGwa(left)} ${withEun(right)} 만나면 역효과가 나기 쉽습니다.`,
      `${withIga(left)} ${withEulReul(right)} 상쇄하기 쉽습니다.`,
      `${withIga(left)} ${right}의 발목을 잡기 쉽습니다.`,
      `${withGwa(left)} ${withEun(right)} 불협화음을 내기 쉽습니다.`,
      label
        ? `${label}의 ${withIga(left)} 오늘의 ${withEulReul(right)} 빛바래게 만들기 쉽습니다.`
        : `${withIga(left)} ${withEulReul(right)} 빛바래게 만들기 쉽습니다.`,
    ];
  }
  return [
    `${withGwa(left)} ${withEun(right)} 서로 아무런 영향이 없습니다.`,
    `${withGwa(left)} ${withEun(right)} 오늘은 별개의 결입니다.`,
    `${withGwa(left)} ${withEun(right)} 오늘은 따로 놉니다.`,
    `${withGwa(left)} ${withEun(right)} 겹쳐도 아무런 파장이 없습니다.`,
    `${withGwa(left)} ${withEun(right)} 평행선을 달립니다.`,
    label
      ? `오늘의 ${withEun(right)} ${label} 강점과는 별개로 움직입니다.`
      : `${withGwa(left)} ${withEun(right)} 서로 독립적으로 움직입니다.`,
  ];
}

type MbtiGrainInput = {
  id: string;
  label: string;
  strengths?: string[];
  keywords?: string[];
};

/** 오늘 키워드와 결이 맞는 강점을 고른 뒤, 상승·상충·별개 한 줄을 돌린다. */
export function mbtiTodayGrainLine(
  mbti: MbtiGrainInput,
  keyword: string,
  date: Date,
): MbtiGrainPick | null {
  const strengths = mbti.strengths ?? mbti.keywords ?? [];
  if (strengths.length === 0) return null;

  const ranked = strengths.map((strength) => ({
    strength,
    relation: relateGrains(keyword, strength),
  }));
  const align = ranked.filter((row) => row.relation === 'align').map((row) => row.strength);
  const against = ranked.filter((row) => row.relation === 'against').map((row) => row.strength);
  const none = ranked.filter((row) => row.relation === 'none').map((row) => row.strength);

  const relation: GrainRelation = align.length ? 'align' : against.length ? 'against' : 'none';
  const pool = align.length ? align : against.length ? against : none;
  const strength = pickDailyFrom(pool, `${mbti.id}:grain-str`, date) ?? pool[0];
  if (!strength) return null;

  const templates = keywordPairLines(relation, strength, keyword, mbti.label);
  const line =
    pickDailyFrom(templates, `${mbti.id}:grain-line`, date) ?? templates[0]!;

  return { strength, relation, line };
}
