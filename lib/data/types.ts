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
