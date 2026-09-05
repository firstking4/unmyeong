import { listTarotDeck } from '@/lib/data/catalog';
import { localYmd, pickDaily } from '@/lib/daily/pick';
import { hasFinalConsonant, resolveParticles, withEulReul } from '@/lib/korean/particle';
import { tarotEnglishName } from '@/lib/tarotEnglishNames';
import type { SeedRecord } from '@/lib/data/types';

export type GunghapTarotReading = {
  cardTitle: string;
  cardTitleEn: string | null;
  reversed: boolean;
  orientation: '정방향' | '역방향';
  keyword: string;
  headline: string;
  summaryLine: string;
  relationship: string;
  /** 상세 잠금 본문 — 관계 한 줄(정방향) 또는 역방향 짧은 문장 */
  detailLine: string;
  summary: string;
  caution: string;
  keywords: string[];
  /** 오늘 원점수 raw 합산에만 반영 (기본 궁합·보정 전) */
  scoreDelta: number;
};

const SCORE_ORIGIN = 44;
const SCORE_SCALE_MAX = 94;
const MAJOR_DELTA = 6;
const MINOR_DELTA = 4;

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function pickPairCard(seed: string): SeedRecord {
  const deck = listTarotDeck();
  return deck[hashSeed(seed) % deck.length]!;
}

function isMajorArcana(card: SeedRecord): boolean {
  return typeof card.number === 'number' && !card.categoryId;
}

const fixObjectParticle = resolveParticles;

function unique(words: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const raw of words) {
    const value = raw?.trim();
    if (!value || out.includes(value)) continue;
    out.push(value);
  }
  return out;
}

/** 오늘 원점수 환산 — manseryeok 궁합과 동일 식 */
export function rawTotalToTodayScore(rawTotal: number): number {
  const scaled = ((SCORE_ORIGIN + rawTotal) / SCORE_SCALE_MAX) * 100;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

export function buildGunghapTarotReading(
  selfBirthDate: string,
  otherBirthDate: string,
  date = new Date(),
): GunghapTarotReading {
  const dateKey = localYmd(date);
  const seed = `gunghap-tarot:${dateKey}:${selfBirthDate}:${otherBirthDate}`;
  const card = pickPairCard(seed);
  const reversed = hashSeed(`${seed}:rev`) % 2 === 1;
  const title = card.title ?? card.label;
  const theme = pickDaily('tarot', `gunghap:${selfBirthDate}:${otherBirthDate}`, date);
  const reverseWord = theme.reverseKeyword ?? '점검';
  const seedHints = card.hints;
  const magnitude = isMajorArcana(card) ? MAJOR_DELTA : MINOR_DELTA;
  const scoreDelta = reversed ? -magnitude : magnitude;

  const uprightCore = card.upright ?? card.summary;
  const reversedCore =
    card.reversed && !card.reversed.includes('에너지가 막히거나 지연')
      ? card.reversed
      : `${title}의 기운이 안쪽으로 가라앉아 있습니다. 속도를 낮추고 ${theme.keyword} 쪽에서 점검해 보세요.`;

  const relationship = reversed
    ? seedHints?.love
      ? `역방향 · ${seedHints.love} ${theme.relationship}`
      : `역방향에서는 거리와 속도가 핵심입니다. ${theme.relationship} 오늘은 먼저 맞추기보다 서로의 페이스를 확인하는 편이 낫습니다.`
    : seedHints?.love
      ? `${seedHints.love} ${theme.relationship}`
      : `${theme.relationship} ${title}의 기운을 빌려 솔직한 한 마디를 건네 보세요.`;

  const summary = reversed
    ? [
        `${title}(${reverseWord}) — ${reversedCore}`,
        theme.caution,
        theme.focus,
      ]
        .filter(Boolean)
        .join(' ')
    : [
        `${title} — ${uprightCore}`,
        theme.focus,
        theme.action,
      ]
        .filter(Boolean)
        .join(' ');

  const caution = theme.caution;

  const headline = fixObjectParticle(
    reversed
      ? `${title} · ${withEulReul(theme.keyword)} 다시 맞출 날`
      : `${title}, ${theme.headline}`,
  );

  const summaryLine = reversed
    ? `타로 · ${title} · 역방향 — ${reverseWord}`
    : `타로 · ${title} — ${theme.keyword}`;

  const detailLine = fixObjectParticle(
    reversed
      ? `${title} 역방향 — 「${theme.keyword}」${hasFinalConsonant(theme.keyword) ? '을' : '를'} 한 번 더 돌아보는 날이에요.`
      : theme.relationship,
  );

  // 카드 원문 키워드(비참·황폐·악소식 …)는 지인 카드 칩으로 너무 세다.
  // 칩은 테마 키워드와 역방향 완충어만 쓰고, 카드 뜻은 summary 문장에서 본다.
  const keywords = unique([`타로·${theme.keyword}`, reversed ? reverseWord : null]);

  return {
    cardTitle: title,
    cardTitleEn: tarotEnglishName(card),
    reversed,
    orientation: reversed ? '역방향' : '정방향',
    keyword: theme.keyword,
    headline,
    summaryLine,
    relationship: fixObjectParticle(relationship),
    detailLine,
    summary: fixObjectParticle(summary),
    caution: fixObjectParticle(caution),
    keywords,
    scoreDelta,
  };
}
