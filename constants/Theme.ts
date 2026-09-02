import { Platform, StyleSheet } from 'react-native';

/** 앱 전체 본문·타이틀 확대. `Themed` Text·탭바·헤더에 적용. */
export const FONT_SCALE = 1.18;

export function fs(size: number): number {
  return Math.round(size * FONT_SCALE);
}

/** 8pt grid — editorial spacing. */
export const space = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
} as const;

/** Soft paper lift — no heavy material shadow. */
export const paperShadow = Platform.select({
  ios: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
  },
  default: {
    elevation: 3,
  },
});

/**
 * 성향·사주·타로 공통 리듬 (사주 화면에서 확정).
 * - 최상단 오늘 카드 타이틀 / 카드 밖 섹션 타이틀: 26pt
 * - 섹션 구분 밑줄: 위·아래 동일하게 space.sm (16)
 * - 카드/섹션 안 요약·상세 구분선도 위·아래 space.sm (부모 gap 없이 배치)
 * - 선 없는 영역: tabSection.band(marginVertical) / 영역 나열은 tabSection.stack(gap)
 */
export const tabSection = {
  /** 탭 스크롤 페이지 여백 */
  content: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.lg,
  },
  /** SEONGHYANG / SAJU / TAROT / JIIN / JIDO */
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 8,
  },
  /** 탭 화면 한글 타이틀 (성향·사주·타로·지인) */
  pageTitle: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    alignItems: 'stretch' as const,
    gap: 10,
    padding: 18,
    borderRadius: radius.lg,
    marginBottom: 0,
  },
  cardTitle: {
    alignSelf: 'flex-start' as const,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 0.5,
  },
  rule: {
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  /**
   * 요약(헤드라인·부제) / 상세(관계·키워드·본문·힌트).
   * 부모에 gap을 두지 않고 바로 이어 붙여 위·아래 space.sm이 같게.
   */
  cardSplit: {
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  /**
   * 선 없는 영역(설명·본문·부가 블록).
   * 위·아래 여백을 항상 같게 — marginVertical만 쓴다. 위/아래를 따로 주지 말 것.
   */
  band: {
    marginVertical: space.xs,
  },
  /** 영역끼리 동일한 세로 간격 (자식에는 marginTop/Bottom을 두지 않음) */
  stack: {
    gap: space.xs,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: space.sm,
  },
  /** 카드/섹션 요약 블록 안 세로 간격 */
  summaryGap: 8,
  flowTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as const,
  },
  /** 상세 풀이 본문 (요약·해설) */
  detailBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  /** 상세 풀이 소제목 (관계·일·성장·행동 가이드 등) */
  detailLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700' as const,
  },
  /** 상세 풀이 힌트·가이드 문장 */
  detailHint: {
    fontSize: 14,
    lineHeight: 21,
  },
  detailStack: {
    gap: 8,
  },
  detailHintBlock: {
    gap: 4,
  },
  disclaimer: {
    marginTop: space.md,
    fontSize: 12,
    lineHeight: 18,
  },
} as const;
