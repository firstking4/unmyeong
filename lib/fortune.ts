import {
  getBloodType,
  getFiveElement,
  getMbti,
  getWesternZodiac,
  getZodiacAnimalRecord,
  mbtiAxisHint,
  pickTarotBySeed,
} from '@/lib/data/catalog';
import { pickDaily } from '@/lib/daily/pick';
import { computePersonalFortuneScore, tenGodPlain } from '@/lib/manseryeok';
import { getElement, getZodiacAnimal, tonesForTenGods } from './saju';
import type { FortuneInsights, IntegratedFortune, PillarTone, Profile } from './types';

const TONE_GUIDANCE: Record<PillarTone, string> = {
  관계: '대화 한마디가 흐름을 바꿉니다. 먼저 손 내미는 쪽이 유리합니다.',
  일: '집중력이 살아납니다. 미뤄 둔 일 하나를 끝내 보세요.',
  재물: '작은 지출·수입에 주의가 필요합니다. 충동 결정은 피하세요.',
  성장: '배움과 시도에 문이 열립니다. 익숙한 방식을 조금 바꿔 보세요.',
};

const CLOSING_LINES = [
  '오늘의 선택이 내일의 편안함을 만듭니다.',
  '무리하지 않는 하루가 가장 좋은 운을 부릅니다.',
  '작은 성취 하나만 챙겨도 충분한 날입니다.',
  '마음을 가볍게 두면 길이 보입니다.',
];

export type FortuneGrade = '주의' | '조심' | '무난' | '좋음' | '최고';

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function pickFrom<T>(items: T[], seed: string): T {
  return items[hashSeed(seed) % items.length];
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

export function getDailyTarot(seed: string) {
  const card = pickTarotBySeed(seed);
  return {
    title: card.title ?? card.label,
    blurb: card.upright ?? card.summary,
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

function buildTraitPhrase(profile: Profile): string {
  const parts: string[] = [];
  const mbtiRec = getMbti(profile.mbti);
  if (mbtiRec) {
    const letters = (profile.mbti ?? '').split('');
    const hints = [letters[0], letters[2], letters[3]]
      .map((l) => mbtiAxisHint(l))
      .filter(Boolean) as string[];
    if (hints.length) parts.push(hints.join('과 '));
    else if (mbtiRec.keywords[0]) parts.push(mbtiRec.keywords[0]);
  }
  const blood = getBloodType(profile.bloodType);
  if (blood?.keywords[0]) parts.push(blood.keywords[0]);

  const west = resolveWesternZodiac(profile);
  if (west) parts.push(`${west.label}의 기질`);

  return parts.length ? parts.join(', ') : '당신만의 결';
}

function resolveWesternZodiac(profile: Profile) {
  return getWesternZodiac(profile.birthDate);
}

function buildSajuPhrase(profile: Profile, tone: PillarTone, dailyMood: string, tenGod?: string): string {
  const animalLabel = getZodiacAnimal(profile.birthDate);
  const elementLabel = getElement(profile.birthDate);
  const animal = getZodiacAnimalRecord(animalLabel);
  const element = getFiveElement(elementLabel);
  const mood = element?.mood ?? null;
  const godBit = tenGod ? `${tenGodPlain(tenGod)}(${tenGod})` : null;

  if (animal && mood && godBit) {
    return `오늘의 ${dailyMood}·${godBit} 흐름 속에서 ${animal.label}띠의 ${mood}이 ${tone} 쪽으로 기울어 있습니다`;
  }
  if (animal && mood) {
    return `오늘의 ${dailyMood} 속에서 ${animal.label}띠의 ${mood}이 ${tone} 흐름과 맞물립니다`;
  }
  if (animal) {
    return `오늘의 ${dailyMood} 속에서 ${animal.label}띠의 기운이 ${tone} 쪽으로 기울어 있습니다`;
  }
  return `오늘은 ${dailyMood}이 ${tone} 기운을 두드러지게 합니다`;
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

/** 만세력 없을 때만 — 예전 해시 (58~97) */
function computeHashScore(seed: string, profile: Profile): number {
  const h = hashSeed(`${seed}:score:${profile.gender ?? ''}`);
  const base = 58 + (h % 35);
  const bonus =
    (profile.mbti ? 2 : 0) + (profile.bloodType ? 2 : 0) + (profile.birthDate ? 3 : 0);
  return Math.min(97, base + bonus);
}

export function buildIntegratedFortune(profile: Profile, date = new Date()): IntegratedFortune {
  const dateKey = localYmd(date);
  const seed = `${dateKey}:${profile.birthDate ?? 'anon'}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}`;

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

  const tarot = getDailyTarot(seed);
  const trait = buildTraitPhrase(profile);
  const theme = pickDaily('home', `home:${profile.birthDate ?? 'anon'}`, date);
  const dailyMood = theme.keyword;
  const primaryTone = tones[0] ?? '성장';
  const secondaryTone = tones[1];
  const sajuPhrase = buildSajuPhrase(
    profile,
    primaryTone,
    dailyMood,
    periodScore?.selfTodayTenGod,
  );

  const blood = getBloodType(profile.bloodType);
  const mbtiRec = getMbti(profile.mbti);
  const seedHint =
    blood?.hints?.growth ??
    mbtiRec?.hints?.growth ??
    pickFrom(blood?.dailyHints ?? ['흐름을 가볍게 믿어 보세요'], `${seed}:hint`);

  const guidance = [
    theme.action,
    TONE_GUIDANCE[primaryTone],
    secondaryTone && secondaryTone !== primaryTone
      ? `한편 ${secondaryTone} 영역도 함께 살보면 균형이 잡힙니다.`
      : null,
    seedHint,
  ]
    .filter(Boolean)
    .join(' ');
  const closing = theme.closing ?? pickFrom(CLOSING_LINES, `${seed}:closing`);
  const score = periodScore?.score ?? computeHashScore(seed, profile);
  const grade = fortuneGradeFromScore(score);

  const name = profile.name?.trim() || '당신';
  const headline = `${name}의 오늘`;

  const traitSubject = (() => {
    const last = trait.trim().slice(-1);
    const code = last.charCodeAt(0);
    const hasBatchim =
      !Number.isNaN(code) && code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
    return `${trait}${hasBatchim ? '이' : '가'}`;
  })();

  const summary = [
    `오늘은 ${traitSubject} ${sajuPhrase}.`,
    theme.focus,
    `이 흐름 위에 「${tarot.title}」의 기운이 겹쳐 ${tarot.blurb.replace(/\.$/, '')}.`,
  ].join(' ');

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
    caution: `${theme.caution} ${theme.relationship}`,
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
