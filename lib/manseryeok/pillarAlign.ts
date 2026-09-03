import { getHeavenlyStemElement } from 'manseryeok';

import { withEun, withIga } from '@/lib/korean/particle';
import { branchAnimalRelation, elementRelationKind } from './compatibility';
import { branchAnimal } from './period';
import type {
  FourPillarsResult,
  LuckPillarsResult,
  ManseryeokPillar,
  SolarTermWindow,
} from './types';
import type { ManseryeokPeriod } from './period';

export type PillarAlignVerdict = '맞음' | '어긋남' | '흐름';

export type SajuTodayContextLine = {
  text: string;
};

const TERM_SHORT: Record<string, string> = {
  소한: '작은 추위가 깊어지는 때',
  대한: '한해 추위의 끝자락',
  입춘: '봄의 문이 열리는 절입',
  우수: '눈이 비로 바뀌는 흐름',
  경칩: '잠자던 것이 움직이는 때',
  춘분: '낮과 밤이 균형을 이루는 날',
  청명: '공기가 맑아지는 때',
  곡우: '성장에 물이 필요한 때',
  입하: '여름의 입구',
  소만: '만개에 가까워지는 때',
  망종: '심고 거두는 일이 겹치는 때',
  하지: '양기가 가장 긴 날',
  소서: '작은 더위가 쌓이는 때',
  대서: '더위의 절정',
  입추: '가을의 문이 열리는 때',
  처서: '더위가 물러가는 때',
  백로: '이슬이 맺히는 때',
  추분: '다시 균형을 맞추는 날',
  한로: '찬 이슬의 때',
  상강: '서리가 내리기 전',
  입동: '겨울의 입구',
  소설: '가벼운 눈이 오는 느낌',
  대설: '눈이 깊어지는 때',
  동지: '밤이 가장 긴 날',
};

const ELEMENT_LABEL: Record<string, string> = {
  같음: '같은 천간 기운',
  생함: '천간이 서로 살림',
  생받음: '천간이 서로 받침',
  극함: '천간이 서로 누름',
  극받음: '천간이 서로 시험함',
};

function elementShortLabel(self: string, other: string): string {
  const kind = elementRelationKind(self, other);
  if (kind === '생함') return `${self}생${other}`;
  if (kind === '생받음') return `${other}생${self}`;
  if (kind === '극함') return `${self}극${other}`;
  if (kind === '극받음') return `${other}극${self}`;
  return ELEMENT_LABEL[kind];
}

function pillarAlignVerdict(natal: ManseryeokPillar, flowing: ManseryeokPillar): {
  verdict: PillarAlignVerdict;
  animalLabel: string;
  elementLabel: string;
} {
  const animal = branchAnimalRelation(
    branchAnimal(natal.branch),
    branchAnimal(flowing.branch),
  );
  const natalEl = getHeavenlyStemElement(natal.stem as never);
  const flowEl = getHeavenlyStemElement(flowing.stem as never);
  const elementLabel = elementShortLabel(natalEl, flowEl);
  const elemKind = elementRelationKind(natalEl, flowEl);

  const animalBad = animal.kind === '육충';
  const animalGood = animal.kind === '육합' || animal.kind === '삼합' || animal.kind === '방합' || animal.kind === '같음';
  const elemBad = elemKind === '극함' || elemKind === '극받음';
  const elemGood = elemKind === '같음' || elemKind === '생함' || elemKind === '생받음';

  let verdict: PillarAlignVerdict = '흐름';
  if (animalBad || elemBad) verdict = '어긋남';
  else if (animalGood || elemGood) verdict = '맞음';

  return { verdict, animalLabel: animal.label, elementLabel };
}

/** 명식 기둥 × 흐름 기둥 맞음/어긋남 — 문장·점수 공용 */
export function getPillarAlignVerdict(
  natal: ManseryeokPillar,
  flowing: ManseryeokPillar,
): PillarAlignVerdict {
  return pillarAlignVerdict(natal, flowing).verdict;
}

function alignLine(
  subject: string,
  natal: ManseryeokPillar,
  flowing: ManseryeokPillar,
): SajuTodayContextLine {
  const { verdict, animalLabel, elementLabel } = pillarAlignVerdict(natal, flowing);
  const detail = `${animalLabel} · ${elementLabel}`;
  if (verdict === '맞음') {
    return { text: `${withIga(subject)} 맞습니다. ${detail}.` };
  }
  if (verdict === '어긋남') {
    return { text: `${withIga(subject)} 어긋납니다. ${detail}.` };
  }
  return { text: `${withEun(subject)} ${detail}.` };
}

function currentLuckPillar(luck: LuckPillarsResult, age: number | null): LuckPillarsResult['pillars'][number] | null {
  if (!luck.pillars.length) return null;
  if (age === null) return luck.pillars[0] ?? null;
  let current = luck.pillars[0] ?? null;
  for (const item of luck.pillars) {
    if (age >= item.age) current = item;
    else break;
  }
  return current;
}

function ageYears(birthDate: string, at: Date): number | null {
  const match = birthDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  let age = at.getFullYear() - year;
  const md = (at.getMonth() + 1) * 100 + at.getDate();
  const birthMd = month * 100 + day;
  if (md < birthMd) age -= 1;
  return age;
}

function backgroundLine(
  termWindow: SolarTermWindow | null,
  luck: LuckPillarsResult | null,
  birthDate: string,
  at: Date,
): SajuTodayContextLine | null {
  const termName = termWindow?.current.name;
  const termHint = termName ? TERM_SHORT[termName] ?? `${termName} 절기` : null;
  const currentLuck = luck ? currentLuckPillar(luck, ageYears(birthDate, at)) : null;

  if (termHint && currentLuck) {
    return {
      text: `지금은 ${termName} 구간(${termHint}) · ${currentLuck.korean} 대운이 배경으로 깔립니다.`,
    };
  }
  if (termHint) {
    return { text: `지금은 ${termName} 구간입니다. ${termHint}.` };
  }
  if (currentLuck) {
    return { text: `현재 ${currentLuck.korean} 대운이 배경으로 깔립니다.` };
  }
  return null;
}

/** 출생 시각이 있을 때만 — 시주 × 오늘 일진 맞음/어긋남 한 줄. */
export function buildHourPillarAlignLine(input: {
  natal: FourPillarsResult;
  todayPeriod: ManseryeokPeriod;
}): SajuTodayContextLine | null {
  if (!input.natal.hour) return null;
  return alignLine(
    `시주 ${input.natal.hour.korean}와 오늘 일진 ${input.todayPeriod.pillar.korean}`,
    input.natal.hour,
    input.todayPeriod.pillar,
  );
}

/**
 * 오늘의 사주 카드 배경·맞음/어긋남 한 줄.
 * 점수 합산 없이 문장만 — 지도·지인 궁합 점수와 역할을 나눈다.
 */
export function buildSajuTodayContext(input: {
  natal: FourPillarsResult;
  todayPeriod: ManseryeokPeriod;
  monthPeriod: ManseryeokPeriod;
  yearPeriod: ManseryeokPeriod;
  termWindow: SolarTermWindow | null;
  luck: LuckPillarsResult | null;
  birthDate: string;
  at: Date;
}): SajuTodayContextLine[] {
  const lines: SajuTodayContextLine[] = [];
  const bg = backgroundLine(input.termWindow, input.luck, input.birthDate, input.at);
  if (bg) lines.push(bg);

  const hourLine = buildHourPillarAlignLine({
    natal: input.natal,
    todayPeriod: input.todayPeriod,
  });
  if (hourLine) lines.push(hourLine);

  lines.push(
    alignLine(
      `태어난 월주 ${input.natal.month.korean}와 이달 월주 ${input.monthPeriod.pillar.korean}`,
      input.natal.month,
      input.monthPeriod.pillar,
    ),
    alignLine(
      `태어난 연주 ${input.natal.year.korean}와 올해 세운 ${input.yearPeriod.pillar.korean}`,
      input.natal.year,
      input.yearPeriod.pillar,
    ),
  );

  return lines;
}
