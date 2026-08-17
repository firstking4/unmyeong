import {
  getEarthlyBranchElement,
  getHeavenlyStemElement,
  type EarthlyBranch,
  type HeavenlyStem,
} from 'manseryeok';

import { parseYmd } from './parse';
import { natalTenGodText } from './tenGods';
import type {
  DetailHint,
  DetailReading,
  FourPillarsResult,
  LuckPillarsResult,
  SolarTermInfo,
  SolarTermWindow,
} from './types';

const ELEMENT_TONE: Record<string, string> = {
  목: '자라고 펼치는',
  화: '밝히고 드러내는',
  토: '모으고 안정시키는',
  금: '정리하고 다듬는',
  수: '흐르고 스며드는',
};

const TERM_BLURB: Record<string, string> = {
  소한: '작은 추위가 깊어지는 때입니다. 무리한 확장보다 온기를 지키는 선택이 맞습니다.',
  대한: '한해 추위의 끝자락입니다. 정리와 마무리를 하면 다음 호흡이 편해집니다.',
  입춘: '봄의 문이 열리는 절입입니다. 새 계획의 씨앗을 심기 좋은 흐름입니다.',
  우수: '눈이 비로 바뀌듯 단단함이 풀립니다. 관계를 부드럽게 풀 타이밍입니다.',
  경칩: '잠자던 것이 움직입니다. 미뤄 둔 연락·시작을 깨우기 좋습니다.',
  춘분: '낮과 밤이 균형을 이룹니다. 일과 쉼의 경계를 다시 맞춰 보세요.',
  청명: '공기가 맑아지는 때입니다. 복잡한 일을 환기하고 정리하기 좋습니다.',
  곡우: '곡식에 비가 내리듯 성장에 물이 필요합니다. 준비한 것을 키울 때입니다.',
  입하: '여름의 입구입니다. 활동량이 늘 수 있으니 페이스를 나눠 잡으세요.',
  소만: '만개에 가까워집니다. 성과가 보이기 시작해도 과신은 금물입니다.',
  망종: '심고 거두는 일이 겹칩니다. 우선순위를 고르는 눈이 중요합니다.',
  하지: '양기가 가장 긴 때입니다. 드러내기 좋지만 과열을 식힐 여백이 필요합니다.',
  소서: '작은 더위가 쌓입니다. 속도와 체력을 함께 관리하세요.',
  대서: '더위의 절정입니다. 핵심만 남기고 나머지는 내려놓아도 됩니다.',
  입추: '가을의 문이 열립니다. 확장에서 정리로 방향을 틀기 좋습니다.',
  처서: '더위가 물러갑니다. 쌓인 피로를 풀고 다음 리듬을 준비하세요.',
  백로: '이슬이 맺히듯 섬세한 감각이 살아납니다. 말과 기록을 다듬기 좋습니다.',
  추분: '다시 균형의 날입니다. 목표와 현실의 간격을 점검해 보세요.',
  한로: '찬 이슬의 때입니다. 몸을 챙기고 불필요한 지출·약속을 줄이세요.',
  상강: '서리가 내리기 전입니다. 마감과 수확에 집중하면 결과가 선명해집니다.',
  입동: '겨울의 입구입니다. 안쪽으로 기운을 모으고 기반을 보강하세요.',
  소설: '가벼운 눈이 오는 느낌입니다. 작은 준비와 예방이 큰 안정이 됩니다.',
  대설: '눈이 깊어지는 때입니다. 서두르기보다 보관·축적이 이득입니다.',
  동지: '밤이 가장 긴 날입니다. 쉬며 다음 순환의 씨앗을 품어 보세요.',
};

const PILLAR_ROLE: Record<'year' | 'month' | 'day' | 'hour', string> = {
  year: '년주는 큰 환경과 초년·가문의 결을 보여 줍니다.',
  month: '월주는 성장 환경과 사회적 리듬, 대운의 출발점과 맞닿습니다.',
  day: '일주는 나의 중심(일간)과 가까운 관계의 결입니다.',
  hour: '시주는 말년·자녀·하루의 리듬과 속마음을 비춥니다.',
};

function elementTone(element: string): string {
  return ELEMENT_TONE[element] ?? '고유한';
}

function ageYears(birthDate: string, at = new Date()): number | null {
  const ymd = parseYmd(birthDate);
  if (!ymd) return null;
  let age = at.getFullYear() - ymd.year;
  const md = (at.getMonth() + 1) * 100 + at.getDate();
  const birthMd = ymd.month * 100 + ymd.day;
  if (md < birthMd) age -= 1;
  return age;
}

export function buildFourPillarsDetail(
  pillars: FourPillarsResult,
  monthBoundary: SolarTermInfo | null,
): DetailReading {
  const dayStem = pillars.day.stem as HeavenlyStem;
  const dayBranch = pillars.day.branch as EarthlyBranch;
  const dayEl = getHeavenlyStemElement(dayStem);
  const dayBranchEl = getEarthlyBranchElement(dayBranch);
  const tone = elementTone(dayEl);

  const summary = [
    `일간 ${pillars.day.stem}(${dayEl})을 중심으로 본 명식입니다. ${tone} 기운이 기본 결이 됩니다.`,
    monthBoundary
      ? `월주는 ${monthBoundary.name} 절입(${monthBoundary.labelKst}) 이후의 흐름으로 잡혔습니다.`
      : null,
    pillars.hour
      ? `시주 ${pillars.hour.korean}까지 네 기둥이 갖춰져 하루의 결까지 읽을 수 있습니다.`
      : '출생 시각이 없어 시주는 비워 두었습니다. 시각을 넣으면 시주 풀이가 열립니다.',
  ]
    .filter(Boolean)
    .join(' ');

  const hints: DetailHint[] = [
    {
      label: '일간',
      text: `${pillars.day.stem}${pillars.day.branch} · ${dayEl}의 기운이 나를 읽는 기준입니다. 지지 ${dayBranchEl}와도 함께 보세요.`,
    },
    {
      label: '년주',
      text: `${pillars.year.korean}. ${PILLAR_ROLE.year}`,
    },
    {
      label: '월주',
      text: `${pillars.month.korean}. ${PILLAR_ROLE.month}`,
    },
    {
      label: '일주',
      text: `${pillars.day.korean}. ${PILLAR_ROLE.day}`,
    },
  ];

  if (pillars.hour) {
    hints.push({
      label: '시주',
      text: `${pillars.hour.korean}. ${PILLAR_ROLE.hour}`,
    });
  }

  if (pillars.tenGods) {
    const tg = pillars.tenGods;
    hints.push({
      label: '십신 요약',
      text: [
        `년 ${tg.year.stem}/${tg.year.branch}`,
        `월 ${tg.month.stem}/${tg.month.branch}`,
        `일 일간/${tg.day.branch}`,
        pillars.hour ? `시 ${tg.hour.stem}/${tg.hour.branch}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    });
    hints.push({
      label: '관계 힌트',
      text: natalTenGodText(tg.month.stem),
    });
  }

  hints.push({
    label: '참고',
    text: '명식은 절입·야자시 기준으로 계산한 참고용입니다. 점단이나 확정 예언이 아닙니다.',
  });

  return { summary, hints };
}

export function buildSolarTermDetail(window: SolarTermWindow): DetailReading {
  const currentBlurb =
    TERM_BLURB[window.current.name] ??
    `${window.current.name} 절기입니다. 계절의 호흡에 맞춰 속도와 휴식을 조율해 보세요.`;
  const nextBlurb =
    TERM_BLURB[window.next.name] ??
    `${window.next.name}으로 넘어가면 분위기가 한 번 더 바뀝니다.`;

  return {
    summary: `지금은 ${window.current.name}(${window.current.hanja}) 구간입니다. ${currentBlurb}`,
    hints: [
      {
        label: '이번 절기',
        text: `${window.current.name} · ${window.current.labelKst}. ${currentBlurb}`,
      },
      {
        label: '다음 절입',
        text: `${window.next.name} · ${window.next.labelKst}. ${nextBlurb}`,
      },
      {
        label: '활용',
        text: '절입은 월주·대운의 경계이기도 합니다. 큰 결정은 절입 전후 호흡을 한 번 더 두어도 좋습니다.',
      },
      {
        label: '참고',
        text: '표시 시각은 한국 표준시(KST) 기준이며, 진태양시 보정은 적용하지 않았습니다.',
      },
    ],
  };
}

export function buildLuckPillarsDetail(
  luck: LuckPillarsResult,
  birthDate: string,
): DetailReading {
  const age = ageYears(birthDate);
  let current = luck.pillars[0] ?? null;
  if (age !== null) {
    for (const item of luck.pillars) {
      if (age >= item.age) current = item;
      else break;
    }
  }

  const direction = luck.forward
    ? '순행이라 시간이 흐를수록 월주 이후의 기운을 차례로 밟습니다.'
    : '역행이라 월주 이전 방향으로 기운이 거슬러 흐릅니다.';

  const currentEl = current
    ? getHeavenlyStemElement(current.stem as HeavenlyStem)
    : null;
  const currentText = current
    ? `지금 흐름은 ${current.age}세에 열린 ${current.korean}(${current.hanja}) 대운입니다.${
        currentEl ? ` ${elementTone(currentEl)} ${currentEl} 기운이 배경이 됩니다.` : ''
      }`
    : '대운 목록을 나이 순으로 살펴 보세요.';

  const next = (() => {
    if (!current) return null;
    const idx = luck.pillars.findIndex((item) => item.age === current.age);
    return idx >= 0 ? luck.pillars[idx + 1] ?? null : null;
  })();

  return {
    summary: [
      `대운은 약 10년 단위의 큰 배경 흐름입니다. ${luck.startAge}세부터 시작하며 ${direction}`,
      currentText,
    ].join(' '),
    hints: [
      {
        label: '시작',
        text: `${luck.startAge}세부터 · ${luck.forward ? '순행' : '역행'}. 출생과 가까운 절입까지의 거리로 대운수를 잡았습니다.`,
      },
      ...(current
        ? [
            {
              label: '현재 대운',
              text: `${current.age}세 ${current.korean}. 이 구간의 주제는 일간과 ${current.korean}의 만남으로 읽습니다.`,
            },
          ]
        : []),
      ...(next
        ? [
            {
              label: '다음 대운',
              text: `${next.age}세 ${next.korean}으로 넘어갑니다. 경계 무렵에는 역할·환경 변화가 겹치기 쉽습니다.`,
            },
          ]
        : []),
      {
        label: '참고',
        text: '대운은 배경색에 가깝습니다. 세운·일진과 겹쳐 볼 때 체감이 더 분명해집니다. 확정 예언이 아닙니다.',
      },
    ],
  };
}
