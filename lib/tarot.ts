import { pickTarotBySeed } from '@/lib/data/catalog';
import { pickDaily } from '@/lib/daily/pick';
import { tarotEnglishName } from '@/lib/tarotEnglishNames';
import type { Profile } from '@/lib/types';

export type TarotReading = {
  dateLabel: string;
  title: string;
  /** Rider–Waite 영문 카드명 */
  titleEn: string | null;
  /** 카드명과 별도로, 날짜·정/역에 따라 바뀌는 오늘 한 줄 */
  headline: string;
  number: number | null;
  reversed: boolean;
  orientation: '정방향' | '역방향';
  keywords: string[];
  /** 카드 기본 기운. blurb와 같으면 UI에서 생략 */
  summary: string;
  blurb: string;
  hints: { label: string; text: string }[];
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

function fortuneSeed(profile: Profile, dateKey: string): string {
  return `${dateKey}:${profile.birthDate ?? 'anon'}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}`;
}

function unique(words: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const raw of words) {
    const value = raw?.trim();
    if (!value || out.includes(value)) continue;
    out.push(value);
  }
  return out;
}

/** 홈·오늘의 키워드와 같은 시드로 뽑는 오늘의 메이저 카드 */
export function buildTarotReading(profile: Profile, date = new Date()): TarotReading {
  const dateKey = ymd(date);
  const seed = fortuneSeed(profile, dateKey);
  const card = pickTarotBySeed(seed);
  const reversed = hashSeed(`${seed}:rev`) % 2 === 1;
  const title = card.title ?? card.label;
  const theme = pickDaily('tarot', `tarot:${card.id}`, date);
  const reverseWord = theme.reverseKeyword ?? '점검';
  const seedHints = card.hints;

  const uprightCore = card.upright ?? card.summary;
  const reversedCore =
    card.reversed && !card.reversed.includes('에너지가 막히거나 지연')
      ? card.reversed
      : `${title}의 기운이 안쪽으로 가라앉아 있습니다. 속도를 낮추고 ${theme.keyword} 쪽에서 점검해 보세요.`;

  const blurb = reversed
    ? `${reversedCore} ${theme.focus}`
    : `${uprightCore} ${theme.focus}`;

  const summary = card.summary;
  const headline = reversed
    ? `${title} · ${theme.keyword}을(를) 다시 맞출 날`
    : `${title}, ${theme.headline}`;

  const keywords = unique([
    theme.keyword,
    reversed ? reverseWord : null,
    ...(card.keywords ?? []),
  ]);

  const hints: { label: string; text: string }[] = reversed
    ? [
        {
          label: '관계',
          text: seedHints?.love
            ? `역방향 · ${seedHints.love} ${theme.relationship}`
            : `역방향에서는 거리와 속도가 핵심입니다. ${theme.relationship} 다만 오늘은 먼저 맞추기보다 서로의 페이스를 확인하는 편이 낫습니다.`,
        },
        {
          label: '일·재능',
          text: seedHints?.work
            ? `역방향 · ${seedHints.work} ${theme.caution}`
            : `서두른 결정은 되감기 쉽습니다. ${theme.caution} 한 가지 업무만 우선순위로 남겨 보세요.`,
        },
        {
          label: '성장',
          text: seedHints?.growth
            ? `${seedHints.growth} ${theme.focus}`
            : `${title}이(가) 가리키는 교훈을 안으로 가져가 보세요. ${theme.focus}`,
        },
        { label: '오늘의 한 가지', text: theme.action },
        {
          label: '주의',
          text: `${theme.caution} 카드가 뒤집힌 날에는 결론보다 점검이 우선입니다.`,
        },
      ]
    : [
        {
          label: '관계',
          text: seedHints?.love
            ? `${seedHints.love} ${theme.relationship}`
            : `${theme.relationship} ${title}의 기운을 빌려 솔직한 한 마디를 건네 보세요.`,
        },
        {
          label: '일·재능',
          text: seedHints?.work
            ? `${seedHints.work} ${theme.focus}`
            : `${theme.focus} 키워드 ‘${theme.keyword}’을(를) 오늘의 업무 한 곳에 적용해 보세요.`,
        },
        {
          label: '성장',
          text: seedHints?.growth
            ? `${seedHints.growth} ${theme.action}`
            : `${uprightCore} ${theme.action}`,
        },
        { label: '오늘의 한 가지', text: theme.action },
        { label: '주의', text: theme.caution },
      ];

  return {
    dateLabel: date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
    title,
    titleEn: tarotEnglishName(card),
    headline,
    number: typeof card.number === 'number' ? card.number : null,
    reversed,
    orientation: reversed ? '역방향' : '정방향',
    keywords,
    summary,
    blurb,
    hints,
  };
}
