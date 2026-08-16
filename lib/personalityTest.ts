import type { MbtiType } from '@/lib/types';

export type AxisKey = 'EI' | 'SN' | 'TF' | 'JP';

export type AxisResult = {
  axis: AxisKey;
  left: string;
  right: string;
  leftPercent: number;
  selected: string;
};

export type FourAxisResult = {
  code: MbtiType;
  axes: Record<AxisKey, AxisResult>;
  completedAt: string;
};

export type BigFiveKey = 'extraversion' | 'agreeableness' | 'conscientiousness' | 'emotionalStability' | 'openness';

export type BigFiveResult = {
  scores: Record<BigFiveKey, number>;
  completedAt: string;
};

type FourAxisQuestion = {
  id: string;
  axis: AxisKey;
  left: string;
  right: string;
};

export const FOUR_AXIS_QUESTIONS: FourAxisQuestion[] = [
  { id: 'ei-1', axis: 'EI', left: '여럿이 있을수록 에너지가 난다', right: '혼자 있어야 에너지가 회복된다' },
  { id: 'sn-1', axis: 'SN', left: '확인할 수 있는 사실부터 본다', right: '가능성과 큰 흐름부터 본다' },
  { id: 'tf-1', axis: 'TF', left: '기준과 논리가 설득력 있다', right: '사람에게 미칠 영향이 먼저 보인다' },
  { id: 'jp-1', axis: 'JP', left: '미리 정한 계획이 편하다', right: '상황에 맞춰 바꾸는 편이 편하다' },
  { id: 'ei-2', axis: 'EI', left: '생각을 말하며 정리한다', right: '생각을 충분히 정리한 뒤 말한다' },
  { id: 'sn-2', axis: 'SN', left: '익숙한 방법을 신뢰한다', right: '새로운 방법을 시도해 보고 싶다' },
  { id: 'tf-2', axis: 'TF', left: '문제를 원인부터 분석한다', right: '먼저 서로의 마음을 살핀다' },
  { id: 'jp-2', axis: 'JP', left: '마감보다 여유 있게 끝낸다', right: '마감이 가까워질 때 집중된다' },
  { id: 'ei-3', axis: 'EI', left: '새 모임에서 먼저 말을 건넨다', right: '분위기를 본 뒤 자연스럽게 섞인다' },
  { id: 'sn-3', axis: 'SN', left: '구체적인 예시가 이해에 도움이 된다', right: '개념과 비유가 이해에 도움이 된다' },
  { id: 'tf-3', axis: 'TF', left: '솔직하고 분명한 피드백이 좋다', right: '부드럽고 배려 있는 피드백이 좋다' },
  { id: 'jp-3', axis: 'JP', left: '할 일을 목록으로 관리한다', right: '그날의 우선순위에 따라 움직인다' },
  { id: 'ei-4', axis: 'EI', left: '사람들과 있으면 생각이 활발해진다', right: '조용한 환경에서 생각이 깊어진다' },
  { id: 'sn-4', axis: 'SN', left: '현재 가능한 것을 우선한다', right: '앞으로 될 수 있는 것을 상상한다' },
  { id: 'tf-4', axis: 'TF', left: '공정한 원칙을 지키려 한다', right: '관계의 조화를 지키려 한다' },
  { id: 'jp-4', axis: 'JP', left: '결정을 내려 두면 마음이 놓인다', right: '선택지를 열어 둘 때 마음이 놓인다' },
  { id: 'ei-5', axis: 'EI', left: '즐거운 일은 함께 나누고 싶다', right: '즐거운 일도 혼자 음미하고 싶다' },
  { id: 'sn-5', axis: 'SN', left: '경험에서 배운 것을 활용한다', right: '직감으로 새로운 연결을 발견한다' },
  { id: 'tf-5', axis: 'TF', left: '판단할 때 객관성을 우선한다', right: '판단할 때 공감을 우선한다' },
  { id: 'jp-5', axis: 'JP', left: '예상 가능한 하루를 선호한다', right: '즉흥적인 변화도 즐긴다' },
];

export const BIG_FIVE_QUESTIONS: {
  id: string;
  trait: BigFiveKey;
  text: string;
  reverse?: boolean;
}[] = [
  { id: 'bf-e-1', trait: 'extraversion', text: '사람들과 함께 있을 때 활력이 난다.' },
  { id: 'bf-a-1', trait: 'agreeableness', text: '다른 사람의 감정에 공감하는 편이다.' },
  { id: 'bf-c-1', trait: 'conscientiousness', text: '해야 할 일을 미리 준비하는 편이다.' },
  { id: 'bf-s-1', trait: 'emotionalStability', text: '대체로 편안하고 침착한 편이다.' },
  { id: 'bf-o-1', trait: 'openness', text: '새로운 생각을 탐구하는 일이 즐겁다.' },
  { id: 'bf-e-2', trait: 'extraversion', text: '낯선 사람 앞에서는 말수가 적다.', reverse: true },
  { id: 'bf-a-2', trait: 'agreeableness', text: '다른 사람의 고민에는 크게 관심이 없다.', reverse: true },
  { id: 'bf-c-2', trait: 'conscientiousness', text: '물건을 제자리에 두는 일을 자주 잊는다.', reverse: true },
  { id: 'bf-s-2', trait: 'emotionalStability', text: '작은 일에도 쉽게 걱정이 된다.', reverse: true },
  { id: 'bf-o-2', trait: 'openness', text: '추상적인 생각을 이해하기 어렵게 느낀다.', reverse: true },
  { id: 'bf-e-3', trait: 'extraversion', text: '여러 사람과 자연스럽게 대화를 시작한다.' },
  { id: 'bf-a-3', trait: 'agreeableness', text: '누군가 힘들어하면 시간을 내어 돕는다.' },
  { id: 'bf-c-3', trait: 'conscientiousness', text: '맡은 일을 미루지 않고 처리한다.' },
  { id: 'bf-s-3', trait: 'emotionalStability', text: '갑작스러운 상황에도 감정을 잘 추스른다.' },
  { id: 'bf-o-3', trait: 'openness', text: '상상하거나 새로운 아이디어를 떠올리기 좋아한다.' },
  { id: 'bf-e-4', trait: 'extraversion', text: '관심의 중심이 되는 것이 부담스럽다.', reverse: true },
  { id: 'bf-a-4', trait: 'agreeableness', text: '상대가 편안하게 느끼도록 배려한다.' },
  { id: 'bf-c-4', trait: 'conscientiousness', text: '일을 꼼꼼하게 마무리하려 한다.' },
  { id: 'bf-s-4', trait: 'emotionalStability', text: '기분 변화가 잦은 편이다.', reverse: true },
  { id: 'bf-o-4', trait: 'openness', text: '익숙하지 않은 관점도 들어 보려 한다.' },
];

export const BIG_FIVE_LABELS: Record<BigFiveKey, string> = {
  extraversion: '외향성',
  agreeableness: '원만성',
  conscientiousness: '성실성',
  emotionalStability: '정서 안정성',
  openness: '개방성',
};

const AXES: { axis: AxisKey; left: string; right: string }[] = [
  { axis: 'EI', left: 'E', right: 'I' },
  { axis: 'SN', left: 'S', right: 'N' },
  { axis: 'TF', left: 'T', right: 'F' },
  { axis: 'JP', left: 'J', right: 'P' },
];

export function formatFourAxisPercents(result: FourAxisResult): string {
  return Object.values(result.axes)
    .map((axis) => {
      const left = axis.leftPercent;
      const right = 100 - left;
      return `${axis.left} ${left}%  ${axis.right} ${right}%`;
    })
    .join('\n');
}

export function scoreFourAxis(answers: Record<string, 'left' | 'right'>): FourAxisResult {
  const axisResults = AXES.map(({ axis, left, right }) => {
    const questions = FOUR_AXIS_QUESTIONS.filter((question) => question.axis === axis);
    const leftCount = questions.filter((question) => answers[question.id] === 'left').length;
    const leftPercent = leftCount * 20;
    return {
      axis,
      left,
      right,
      leftPercent,
      selected: leftCount >= 3 ? left : right,
    };
  });
  return {
    code: axisResults.map((axis) => axis.selected).join('') as MbtiType,
    axes: Object.fromEntries(axisResults.map((result) => [result.axis, result])) as Record<AxisKey, AxisResult>,
    completedAt: new Date().toISOString(),
  };
}

export function scoreBigFive(answers: Record<string, number>): BigFiveResult {
  const scores = Object.fromEntries(
    (Object.keys(BIG_FIVE_LABELS) as BigFiveKey[]).map((trait) => {
      const items = BIG_FIVE_QUESTIONS.filter((question) => question.trait === trait);
      const mean = items.reduce((sum, item) => {
        const answer = answers[item.id] ?? 3;
        return sum + (item.reverse ? 6 - answer : answer);
      }, 0) / items.length;
      return [trait, Math.round(((mean - 1) / 4) * 100)];
    }),
  ) as Record<BigFiveKey, number>;
  return { scores, completedAt: new Date().toISOString() };
}
