import { getZodiacAnimalRecord } from '@/lib/data/catalog';
import { pickDaily } from '@/lib/daily/pick';
import {
  getElement,
  getZodiacAnimal,
  relateElements,
  type Element,
  type ZodiacAnimal,
} from '@/lib/saju';
import type { ContactProfile, Profile } from '@/lib/types';

export type CompatibilityGrade = '좋음' | '무난' | '주의';

export type TodayCompatibility = {
  ready: boolean;
  reason?: string;
  score: number;
  baseScore: number;
  dailyDelta: number;
  grade: CompatibilityGrade;
  moodHeadline: string;
  summary: string;
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
  compactDate: string;
};

/** 육합 */
const ANIMAL_HARMONY: Record<ZodiacAnimal, ZodiacAnimal> = {
  쥐: '소',
  소: '쥐',
  호랑이: '돼지',
  돼지: '호랑이',
  토끼: '개',
  개: '토끼',
  용: '닭',
  닭: '용',
  뱀: '원숭이',
  원숭이: '뱀',
  말: '양',
  양: '말',
};

/** 육충 */
const ANIMAL_CLASH: Record<ZodiacAnimal, ZodiacAnimal> = {
  쥐: '말',
  말: '쥐',
  소: '양',
  양: '소',
  호랑이: '원숭이',
  원숭이: '호랑이',
  토끼: '닭',
  닭: '토끼',
  용: '개',
  개: '용',
  뱀: '돼지',
  돼지: '뱀',
};

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatCompactDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const w = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  return `${y}.${m}.${d} (${w})`;
}

function animalBase(self: ZodiacAnimal, other: ZodiacAnimal): { score: number; label: string } {
  if (self === other) {
    return { score: 72, label: `같은 ${self} 기운` };
  }
  if (ANIMAL_HARMONY[self] === other) {
    return { score: 86, label: `${self}·${other} 육합` };
  }
  if (ANIMAL_CLASH[self] === other) {
    return { score: 48, label: `${self}·${other} 육충` };
  }
  return { score: 66, label: `${self}·${other} 흐름` };
}

function elementBase(self: Element, other: Element): { score: number; label: string } {
  const relation = relateElements(self, other, '오늘');
  switch (relation.kind) {
    case '같음':
      return { score: 74, label: relation.title };
    case '생함':
    case '생받음':
      return { score: 82, label: relation.title };
    case '극함':
      return { score: 58, label: relation.title };
    case '극받음':
      return { score: 54, label: relation.title };
  }
}

function gradeFromScore(score: number): CompatibilityGrade {
  if (score >= 75) return '좋음';
  if (score >= 60) return '무난';
  return '주의';
}

function moodFromScore(score: number): string {
  if (score >= 80) return '서로 잘 맞는 하루입니다';
  if (score >= 70) return '흐름이 부드러운 하루입니다';
  if (score >= 60) return '조율하면 편안한 하루입니다';
  return '거리와 호흡을 살필 하루입니다';
}

function notReady(reason: string, date: Date): TodayCompatibility {
  return {
    ready: false,
    reason,
    score: 0,
    baseScore: 0,
    dailyDelta: 0,
    grade: '무난',
    moodHeadline: '아직 열리지 않은 궁합',
    summary: reason,
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
    compactDate: formatCompactDate(date),
  };
}

export function buildTodayCompatibility(
  self: Profile,
  other: Pick<ContactProfile, 'name' | 'birthDate' | 'mbti' | 'bloodType'>,
  date = new Date(),
): TodayCompatibility {
  if (!self.name?.trim() || !self.birthDate?.trim()) {
    return notReady('내 이름과 생년월일을 먼저 입력해 주세요.', date);
  }
  if (!other.birthDate?.trim()) {
    return notReady('지인의 생년월일이 필요합니다.', date);
  }

  const selfAnimal = getZodiacAnimal(self.birthDate);
  const otherAnimal = getZodiacAnimal(other.birthDate);
  const selfElement = getElement(self.birthDate);
  const otherElement = getElement(other.birthDate);

  if (!selfAnimal || !otherAnimal || !selfElement || !otherElement) {
    return notReady('생년월일을 확인해 주세요.', date);
  }

  const animal = animalBase(selfAnimal, otherAnimal);
  const element = elementBase(selfElement, otherElement);
  const baseScore = Math.round(animal.score * 0.55 + element.score * 0.45);

  const dateKey = ymd(date);
  const seed = `${dateKey}:${self.birthDate}:${other.birthDate}`;
  const dailyDelta = (hashSeed(`${seed}:delta`) % 17) - 8; // -8 ~ +8
  const score = Math.max(35, Math.min(97, baseScore + dailyDelta));
  const theme = pickDaily(
    'gunghap',
    `${selfAnimal}:${otherAnimal}:${selfElement}:${otherElement}`,
    date,
  );

  const selfRec = getZodiacAnimalRecord(selfAnimal);
  const otherRec = getZodiacAnimalRecord(otherAnimal);
  const relation = relateElements(selfElement, otherElement, '오늘');

  const keywords = [
    animal.label.includes('육합') ? '육합' : animal.label.includes('육충') ? '육충' : '흐름',
    relation.title,
    selfRec?.keywords?.[0],
    otherRec?.keywords?.[0],
  ].filter(Boolean) as string[];

  const uniqueKeywords = keywords.filter((kw, i, all) => all.indexOf(kw) === i).slice(0, 4);

  const otherName = other.name.trim() || '상대';
  const summary = [
    `${self.name.trim()}과(와) ${otherName}은 ${animal.label}, 오행으로는 ${element.label} 결입니다.`,
    `오늘은 ${theme.keyword}에 초점을 맞춰 보세요. ${theme.focus}`,
  ].join(' ');

  const relationship = `${relation.blurb} ${theme.relationship}`;
  const guidance = `${theme.action} ${
    score >= 70
      ? '작은 호의를 먼저 건네면 관계가 더 부드러워집니다.'
      : '말의 속도와 거리감을 조금 늦추면 마찰이 줄어듭니다.'
  }`;
  const caution = `${theme.caution}${
    other.mbti || other.bloodType ? ' 성향 정보는 참고용으로만 두고, 오늘의 반응을 우선하세요.' : ''
  }`;

  return {
    ready: true,
    score,
    baseScore,
    dailyDelta,
    grade: gradeFromScore(score),
    moodHeadline: `${theme.keyword} · ${moodFromScore(score)}`,
    summary,
    relationship,
    guidance,
    caution,
    keywords: uniqueKeywords,
    selfAnimal,
    otherAnimal,
    selfElement,
    otherElement,
    animalLabel: animal.label,
    elementLabel: element.label,
    compactDate: formatCompactDate(date),
  };
}
