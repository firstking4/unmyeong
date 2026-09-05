export type SeedHints = {
  love?: string;
  work?: string;
  growth?: string;
};

export type SeedRecord = {
  id: string;
  label: string;
  /** 선택 UI에 보이는 짧은 형태 설명. 운세 해설(summary)과 별개. */
  cue?: string;
  keywords: string[];
  summary: string;
  hints?: SeedHints;
  /** 스프레드·오늘 카드 역방향용. `reversed` 한 문장은 유지. */
  reversedHints?: SeedHints;
  dailyHints?: string[];
  mood?: string;
  nickname?: string;
  axis?: string[];
  strengths?: string[];
  watchouts?: string[];
  element?: string;
  elementAffinity?: string;
  dateRange?: { start: string; end: string };
  number?: number;
  title?: string;
  upright?: string;
  reversed?: string;
  categoryId?: string;
  /** 타로 마이너 이미지 연결 정보 */
  image?: {
    suit: 'wands' | 'cups' | 'swords' | 'pentacles';
    file: string;
  };
};

export type PhysiognomyCategory = {
  id: string;
  label: string;
  prompt: string;
};

export type PhysiognomyCollection = {
  categories: PhysiognomyCategory[];
  items: SeedRecord[];
};

export type SeedCollection = {
  items: SeedRecord[];
};
