import {
  getBloodType,
  getFiveElement,
  getMbti,
  getWesternZodiac,
  getZodiacAnimalRecord,
  pickDailyTarotCard,
} from '@/lib/data/catalog';
import { pickDaily, pickDailyFrom } from '@/lib/daily/pick';
import { withIga } from '@/lib/korean/particle';
import { joinSentences } from '@/lib/korean/sentence';
import {
  computeFourPillars,
  computePersonalFortuneScore,
  getManseryeokPeriod,
  getPillarAlignVerdict,
  tenGodPlain,
} from '@/lib/manseryeok';
import { memoLast } from '@/lib/memoLast';
import { getElement, getZodiacAnimal, tonesForTenGods } from './saju';
import type { FortuneInsights, IntegratedFortune, PillarTone, Profile } from './types';

/** 톤별 안내 — 한 문장만 두면 같은 톤이 걸린 날마다 같은 말이 나온다 */
const TONE_GUIDANCE: Record<PillarTone, string[]> = {
  관계: [
    '대화 한마디가 흐름을 바꿉니다. 먼저 손 내미는 쪽이 유리합니다.',
    '오늘은 말보다 듣는 쪽에 힘이 실립니다. 상대의 속도를 한 번 확인해 보세요.',
    '미뤄 둔 안부 하나가 관계의 매듭을 풉니다. 짧게라도 먼저 건네 보세요.',
    '가까운 사이일수록 예의가 힘이 됩니다. 익숙함에 기대 넘기지 마세요.',
    '오해는 길게 설명할수록 커집니다. 오늘은 짧고 분명하게 전하세요.',
    '함께 있는 시간의 길이보다 결이 중요한 날입니다.',
  ],
  일: [
    '집중력이 살아납니다. 미뤄 둔 일 하나를 끝내 보세요.',
    '여러 갈래로 벌리기보다 하나를 마무리하는 편이 남습니다.',
    '오늘은 시작보다 정리에 힘이 붙습니다. 쌓아 둔 것부터 걷어 보세요.',
    '중간 점검 한 번이 하루를 아낍니다. 방향을 짧게 확인해 보세요.',
    '맡은 자리가 분명할 때 성과가 납니다. 역할을 먼저 정리하세요.',
    '급한 일과 중요한 일을 나눠 두면 흐름이 잡힙니다.',
  ],
  재물: [
    '작은 지출·수입에 주의가 필요합니다. 충동 결정은 피하세요.',
    '오늘은 계산을 한 번 더 하는 쪽이 편합니다. 서둘러 정하지 마세요.',
    '큰 결정은 하루 미뤄도 늦지 않습니다. 숫자를 다시 확인해 보세요.',
    '들어오는 것보다 새는 것을 먼저 살피면 좋습니다.',
    '남의 권유보다 내 기준으로 판단하는 편이 안전합니다.',
    '작게 아끼는 습관이 오늘의 흐름과 잘 맞습니다.',
  ],
  성장: [
    '배움과 시도에 문이 열립니다. 익숙한 방식을 조금 바꿔 보세요.',
    '오늘은 잘하는 것보다 새로 해 보는 쪽에 기운이 붙습니다.',
    '작게 실패해도 남는 것이 있는 날입니다. 가볍게 시도해 보세요.',
    '어제의 방식을 한 군데만 바꿔 보면 결이 달라집니다.',
    '읽고 듣는 것이 오래 남습니다. 짧게라도 시간을 내 보세요.',
    '스스로 세운 기준을 다시 살펴보기에 좋은 날입니다.',
  ],
};

const CLOSING_LINES = [
  '오늘의 선택이 내일의 편안함을 만듭니다.',
  '무리하지 않는 하루가 가장 좋은 운을 부릅니다.',
  '작은 성취 하나만 챙겨도 충분한 날입니다.',
  '마음을 가볍게 두면 길이 보입니다.',
  '서두르지 않아도 흐름은 제 속도로 갑니다.',
  '한 가지만 제대로 챙기면 넉넉한 하루입니다.',
  '오늘 아낀 힘이 내일의 여유가 됩니다.',
  '완벽하지 않아도 이어 가는 편이 낫습니다.',
];

export type FortuneGrade = '주의' | '조심' | '무난' | '좋음' | '최고';

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function unique(items: string[]): string[] {
  return items.filter((item, i, all) => all.indexOf(item) === i);
}

/** @deprecated 해시 톤 — 일진 연동 후 미사용. 호환용 유지 */
export function pickSajuTones(seed: string): PillarTone[] {
  const all: PillarTone[] = ['관계', '일', '재물', '성장'];
  const h = hashSeed(seed);
  const primary = all[h % 4];
  const rest = all.filter((tone) => tone !== primary);
  const secondary = rest[(h >> 2) % rest.length];
  return [primary, secondary];
}

/**
 * 홈에 겹쳐 보여 주는 오늘의 메이저 카드.
 *
 * 타로 탭(`buildTarotReading`)과 **같은 salt·날짜**를 써야 한다. 두 화면이
 * 다른 카드를 보여 주면 같은 날의 운세가 어긋나 보인다.
 */
export function getDailyTarot(profileSalt: string, date: Date) {
  const card = pickDailyTarotCard(profileSalt, date);
  return {
    title: card.title ?? card.label,
    blurb: card.upright ?? card.summary,
    /** 키워드 나열 대신 쓰는 짧은 해설 — 완충 표현이 들어 있어 홈 카드에 안전하다 */
    summary: card.summary ?? '',
  };
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function formatCompactDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const w = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  return `${y}.${m}.${d} (${w})`;
}

const LUCK_TAG: Record<PillarTone, string> = {
  관계: '인연운',
  일: '결단',
  재물: '재물운 보통',
  성장: '성장운',
};

/** 일진 톤 → 지도/키워드에 쓰는 표시 라벨 (사주 톤과 합칠 때 동일 키로 맞춤) */
export function luckTagForTone(tone: PillarTone): string {
  return LUCK_TAG[tone];
}

function buildLuckTags(tones: PillarTone[]): string[] {
  const tags: string[] = [];
  for (const tone of tones) {
    const tag = luckTagForTone(tone);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  const fallback = ['결단', '인연운', '재물운 보통'];
  for (const t of fallback) {
    if (tags.length >= 3) break;
    if (!tags.includes(t)) tags.push(t);
  }
  return tags.slice(0, 3);
}

/** 지인 궁합과 동일 5등급 컷 */
export function fortuneGradeFromScore(score: number): FortuneGrade {
  if (score >= 90) return '최고';
  if (score >= 75) return '좋음';
  if (score >= 60) return '무난';
  if (score >= 50) return '조심';
  return '주의';
}

/**
 * `오늘은 {이 구절}이 …` 형태로 쓰이는 주어.
 *
 * 예전에는 MBTI 축 힌트 3개를 `과`로 잇고 혈액형·별자리까지 쉼표로 붙여
 * `내면의 기준과 논리적 판단과 계획과 정리, 섬세, 사수자리의 기질`처럼
 * 읽기 어려운 나열이 됐다. 신호는 두 덩이까지만 남기고 안은 가운뎃점으로 묶는다.
 */
function resolveWesternZodiac(profile: Profile) {
  return getWesternZodiac(profile.birthDate);
}

/**
 * 오늘의 기운 한 줄 — 십신은 쉬운 말로만 (상관 같은 명칭은 사주 탭에 둔다).
 */
function buildTodayLead(tone: PillarTone, dailyMood: string, tenGod?: string): string {
  const godPlain = tenGod ? tenGodPlain(tenGod) : null;
  if (godPlain) return `${withIga(godPlain)} 도드라지는 날입니다. ${tone} 쪽에 힘이 실립니다.`;
  return `오늘은 ${withIga(dailyMood)} ${tone} 쪽에 힘이 실립니다.`;
}

/**
 * 내 고유의 결과 오늘의 만남 — 하나만 골라 엮는다.
 * 띠·별자리·MBTI·혈액형을 한 문장에 다 넣으면 읽기 어려운 장문이 된다.
 */
function buildBaseMeetLine(profile: Profile, profileSalt: string, date: Date): string | null {
  const mbtiRec = getMbti(profile.mbti);
  const blood = getBloodType(profile.bloodType);
  const west = resolveWesternZodiac(profile);
  const animal = getZodiacAnimalRecord(getZodiacAnimal(profile.birthDate));
  const mood = getFiveElement(getElement(profile.birthDate))?.mood;

  const options = [
    animal && mood ? `${animal.label}띠의 ${withIga(mood)} 오늘 흐름과 잘 맞물립니다.` : null,
    west ? `${west.label} 기질이 오늘 흐름을 타기 쉽습니다.` : null,
    mbtiRec?.keywords[0] ? `평소의 ${mbtiRec.keywords[0]} 결이 오늘은 힘이 됩니다.` : null,
    blood?.keywords[0]
      ? `${blood.label}형 특유의 ${withIga(blood.keywords[0])} 오늘은 빛을 냅니다.`
      : null,
  ].filter((line): line is string => Boolean(line));

  return pickDailyFrom(options, `fortune-base:${profileSalt}`, date);
}

function buildInsightChips(profile: Profile, tarotTitle: string, tones: PillarTone[]): string[] {
  const chips: string[] = [];
  const animal = getZodiacAnimal(profile.birthDate);
  const element = getElement(profile.birthDate);
  const west = resolveWesternZodiac(profile);
  const mbtiRec = getMbti(profile.mbti);
  const blood = getBloodType(profile.bloodType);

  if (animal) chips.push(`${animal}띠`);
  if (element) chips.push(`${element}의 기운`);
  if (mbtiRec) chips.push(mbtiRec.label);
  if (blood) chips.push(`${blood.label}형`);
  if (west) chips.push(west.label);
  chips.push(`타로 · ${tarotTitle}`);
  if (tones[0]) chips.push(tones[0]);

  return chips;
}

function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 출생 시각이 있을 때 시주 × 오늘 일진 맞음/어긋남 — 지도 카드용 쉬운 말.
 * 「시주 정사 · 일진 신사 · 화극금」 같은 코드는 사주 탭에만 두고 여기선 뜻만 전한다.
 */
function buildHourPillarContext(profile: Profile, date: Date): string | null {
  const birthDate = profile.birthDate?.trim();
  if (!birthDate || !profile.birthTime) return null;

  const input = { birthDate, birthTime: profile.birthTime };
  const natal = computeFourPillars(input);
  const todayPeriod = getManseryeokPeriod(input, date, 'day');
  if (!natal?.hour || !todayPeriod) return null;

  const verdict = getPillarAlignVerdict(natal.hour, todayPeriod.pillar);
  if (verdict === '맞음') return '태어난 시와 오늘이 맞물리는 날입니다.';
  if (verdict === '어긋남') return '태어난 시와 오늘이 엇갈립니다. 오늘은 서두르지 않는 편이 낫습니다.';
  return null;
}

/** 만세력 없을 때만 — 예전 해시 (58~97) */
function computeHashScore(seed: string, profile: Profile): number {
  const h = hashSeed(`${seed}:score:${profile.gender ?? ''}`);
  const base = 58 + (h % 35);
  const bonus =
    (profile.mbti ? 2 : 0) + (profile.bloodType ? 2 : 0) + (profile.birthDate ? 3 : 0);
  return Math.min(97, base + bonus);
}

const fortuneMemo: { key: string; value: IntegratedFortune | undefined } = { key: '', value: undefined };

export function buildIntegratedFortune(profile: Profile, date = new Date()): IntegratedFortune {
  const dateKey = localYmd(date);
  const key = `${dateKey}:${profile.birthDate ?? ''}:${profile.birthTime ?? ''}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}:${profile.name ?? ''}:${profile.gender ?? ''}`;
  return memoLast(fortuneMemo, key, () => buildIntegratedFortuneNow(profile, date, dateKey));
}

function buildIntegratedFortuneNow(
  profile: Profile,
  date: Date,
  dateKey: string,
): IntegratedFortune {
  const seed = `${dateKey}:${profile.birthDate ?? 'anon'}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}`;
  /**
   * 날짜를 뺀 프로필 시드.
   *
   * `pickDailyFrom`은 salt로 순열을 만들고 날짜로 그 순열을 훑는다. salt에 날짜가
   * 들어가면 하루마다 순열이 다시 섞여 무작위 추출과 다를 바 없어진다.
   */
  const profileSalt = `${profile.birthDate ?? 'anon'}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}`;

  const periodScore =
    profile.birthDate?.trim()
      ? computePersonalFortuneScore(
          { birthDate: profile.birthDate, birthTime: profile.birthTime },
          date,
        )
      : null;

  const tones = periodScore
    ? tonesForTenGods(periodScore.selfTodayTenGod, periodScore.todayBranchTenGod)
    : pickSajuTones(seed);

  const tarot = getDailyTarot(profileSalt, date);
  const theme = pickDaily('home', `home:${profile.birthDate ?? 'anon'}`, date);
  const dailyMood = theme.keyword;
  const primaryTone = tones[0] ?? '성장';
  const secondaryTone = tones[1];

  const blood = getBloodType(profile.bloodType);
  const mbtiRec = getMbti(profile.mbti);
  // 고정 문장(hints.growth)만 쓰면 프로필이 같은 동안 힌트가 늘 같다. 후보로 묶어 돌린다.
  const hintPool = unique(
    [
      ...(blood?.dailyHints ?? []),
      blood?.hints?.growth,
      mbtiRec?.hints?.growth,
      '흐름을 가볍게 믿어 보세요.',
    ].filter((line): line is string => Boolean(line)),
  );
  const seedHint = pickDailyFrom(hintPool, `fortune-hint:${profileSalt}`, date) ?? hintPool[0];

  const guidance = joinSentences([
    theme.action,
    pickDailyFrom(TONE_GUIDANCE[primaryTone], `fortune-tone:${profileSalt}`, date),
    secondaryTone && secondaryTone !== primaryTone
      ? `한편 ${secondaryTone} 영역도 함께 살펴보면 균형이 잡힙니다.`
      : null,
    seedHint,
  ]);
  // home 팩의 closing은 24변주에 고유값이 4개뿐이다. 팩 값을 우선하면 4종만 돌기에 풀에 합친다.
  const closingPool = unique([theme.closing, ...CLOSING_LINES].filter(Boolean) as string[]);
  const closing =
    pickDailyFrom(closingPool, `fortune-closing:${profileSalt}`, date) ?? closingPool[0];
  const score = periodScore?.score ?? computeHashScore(seed, profile);
  const grade = fortuneGradeFromScore(score);

  const name = profile.name?.trim() || '당신';
  const headline = `${name}의 오늘`;

  // 지도 카드는 한 문장에 하나씩, 쉬운 말로 — 전문 코드는 사주 탭에 둔다
  const summary = joinSentences([
    buildTodayLead(primaryTone, dailyMood, periodScore?.selfTodayTenGod),
    buildHourPillarContext(profile, date),
    buildBaseMeetLine(profile, profileSalt, date),
    theme.focus,
    tarot.summary ? `타로 「${tarot.title}」 — ${tarot.summary}` : null,
  ]);

  const luckTags = [theme.keyword, ...buildLuckTags(tones)].filter(
    (tag, index, all) => all.indexOf(tag) === index,
  );

  const insights: FortuneInsights = {
    tarotTitle: tarot.title,
    tones,
    traitChips: buildInsightChips(profile, tarot.title, tones),
    luckTags: luckTags.slice(0, 4),
  };

  return {
    headline,
    moodHeadline: `${theme.keyword} · ${grade}`,
    summary,
    guidance,
    caution: joinSentences([theme.caution, theme.relationship]),
    closing,
    score,
    dateLabel: formatDateLabel(date),
    compactDate: formatCompactDate(date),
    insights,
  };
}

export function buildPlaceholderFortune(): IntegratedFortune {
  const today = new Date();
  return {
    headline: '나의 오늘',
    moodHeadline: '아직 열리지 않은 하루',
    summary:
      '신분증에 이름과 생년월일을 입력하면, 성향·사주·타로가 하나의 오늘의 운세로 합쳐집니다.',
    guidance: '신분증 항목을 탭해 이름과 생년월일을 입력해 보세요. 혈액형·MBTI는 더 깊은 해석에 쓰입니다.',
    caution: '',
    closing: '운명은 타고나는 것이 아니라, 스스로 선택하고 만들어가는 것입니다.',
    score: 0,
    dateLabel: formatDateLabel(today),
    compactDate: formatCompactDate(today),
  };
}
