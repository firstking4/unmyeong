import { pickDailyTarotCard } from '@/lib/data/catalog';
import { pickDailyFrom, pickDailyPair } from '@/lib/daily/pick';
import { hasFinalConsonant, withIga } from '@/lib/korean/particle';
import { endSentence, joinSentences } from '@/lib/korean/sentence';
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
  const profileSalt = `${profile.birthDate ?? 'anon'}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}`;
  const card = pickDailyTarotCard(profileSalt, date);
  const reversed = hashSeed(`${seed}:rev`) % 2 === 1;
  const title = card.title ?? card.label;
  // 프로필 salt — dayNumber와 함께 날짜마다 변주가 바뀌게 한다 (카드 id salt는 연속일 동일 문구 가능).
  // 팩 문장이 한 화면의 여러 필드에 다시 쓰이므로, 겹치지 않는 두 변주를 함께 받는다.
  const [theme, theme2] = pickDailyPair(
    'tarot',
    `tarot:${profile.birthDate ?? 'anon'}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}`,
    date,
  );
  // 정방향에도 주의 칩을 둔다. 역방향 전용으로 두면 주의 칩이 거의 안 나온다.
  const reverseWord = theme.reverseKeyword ?? '점검';
  const seedHints = card.hints;

  const uprightCore = card.upright ?? card.summary;
  const reversedCoreFallbacks = [
    '기운이 안쪽으로 가라앉아 있습니다. 속도를 낮추고 빈칸을 먼저 보세요.',
    '겉보다 안쪽의 빈자리가 먼저입니다. 오늘은 밀어붙이지 마세요.',
    '흐름이 잠시 멈춘 자리입니다. 점검을 결론보다 앞에 두세요.',
    '힘이 흩어져 보일 수 있습니다. 한 가지만 붙잡고 정리해 보세요.',
    '서두른 판단이 되감기 쉬운 날입니다. 확인을 한 번 더 남기세요.',
    '겉은 가벼워도 안쪽이 무거운 자리입니다. 숨을 고른 뒤 움직여 보세요.',
  ];
  const reversedCore =
    card.reversed && !card.reversed.includes('에너지가 막히거나 지연')
      ? card.reversed
      : (pickDailyFrom(reversedCoreFallbacks, `tarot-rev-core:${profileSalt}`, date) ??
        reversedCoreFallbacks[0]!);

  const blurb = reversed
    ? joinSentences([reversedCore, theme.focus])
    : joinSentences([uprightCore, theme.focus]);

  const summary = card.summary;
  // 카드명·정/역은 화면이 따로 그리므로 헤드라인은 오늘 상징 한 줄만 둔다.
  const headline = reversed
    ? (theme.reverseHeadline ?? `${theme.keyword} · 한 번 더 돌아보는 날`)
    : theme.headline;

  const keywords = unique([theme.keyword, theme2.keyword, reverseWord]);

  const hints: { label: string; text: string }[] = reversed
    ? [
        {
          label: '관계',
          text: card.reversedHints?.love
            ? joinSentences([card.reversedHints.love, theme.relationship])
            : seedHints?.love
              ? joinSentences([`역방향 · ${seedHints.love}`, theme.relationship])
              : joinSentences([
                  '역방향에서는 거리와 속도가 핵심입니다.',
                  theme.relationship,
                  '다만 오늘은 먼저 맞추기보다 서로의 페이스를 확인하는 편이 낫습니다.',
                ]),
        },
        {
          label: '일·재능',
          text: card.reversedHints?.work
            ? joinSentences([card.reversedHints.work, theme2.caution])
            : seedHints?.work
              ? joinSentences([`역방향 · ${seedHints.work}`, theme2.caution])
              : joinSentences([
                  '서두른 결정은 되감기 쉽습니다.',
                  theme2.caution,
                  '한 가지 업무만 우선순위로 남겨 보세요.',
                ]),
        },
        {
          label: '성장',
          text: card.reversedHints?.growth
            ? joinSentences([card.reversedHints.growth, theme2.focus])
            : seedHints?.growth
              ? joinSentences([seedHints.growth, theme2.focus])
              : joinSentences([
                  `${withIga(title)} 가리키는 교훈을 안으로 가져가 보세요.`,
                  theme2.focus,
                ]),
        },
        { label: '오늘의 한 가지', text: endSentence(theme.action) },
        { label: '주의', text: endSentence(theme.caution) },
      ]
    : [
        {
          label: '관계',
          text: seedHints?.love
            ? joinSentences([seedHints.love, theme.relationship])
            : joinSentences([
                theme.relationship,
                `${title}의 기운을 빌려 솔직한 한 마디를 건네 보세요.`,
              ]),
        },
        {
          label: '일·재능',
          text: seedHints?.work
            ? joinSentences([seedHints.work, theme2.focus])
            : joinSentences([
                theme2.focus,
                `오늘의 상징 ‘${theme.keyword}’${hasFinalConsonant(theme.keyword) ? '을' : '를'} 업무 한 곳에 떠올려 보세요.`,
              ]),
        },
        {
          label: '성장',
          text: seedHints?.growth
            ? joinSentences([seedHints.growth, theme2.action])
            : joinSentences([uprightCore, theme2.action]),
        },
        { label: '오늘의 한 가지', text: endSentence(theme.action) },
        { label: '주의', text: endSentence(theme.caution) },
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
