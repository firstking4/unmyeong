import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import {
  buildTodayKeywords,
  KEYWORD_NAV_SOURCE_ORDER,
  type KeywordSource,
  type TodayKeyword,
} from '@/lib/todayKeywords';
import { useLocalDateKey } from '@/lib/useLocalDateKey';
import { requestTabScrollReset } from '@/lib/useTabScrollReset';

const SOURCE_ROUTES: Record<KeywordSource, Href> = {
  지도: '/',
  성향: '/seonghyang',
  사주: '/saju',
  타로: '/tarot',
  지인: '/gunghap',
  관상: '/gwansang',
};

function primarySource(keyword: TodayKeyword): KeywordSource {
  return KEYWORD_NAV_SOURCE_ORDER.find((item) => keyword.sources.includes(item)) ?? '성향';
}

function useTodayKeywordList() {
  const { profile } = useProfile();
  const dateKey = useLocalDateKey();
  return useMemo(() => buildTodayKeywords(profile, new Date()).keywords, [profile, dateKey]);
}

/** 점수 링 옆 안내. 칩이 있을 때만. */
export function TodayKeywordCaption() {
  const c = Colors[useColorScheme() ?? 'light'];
  const keywords = useTodayKeywordList();
  if (keywords.length === 0) return null;

  return (
    <Text style={[styles.caption, { color: c.muted }]}>
      키워드를 누르면 관련 위치로 이동합니다.
    </Text>
  );
}

/** 점수 아래 칩 줄. */
export function TodayKeywords() {
  const router = useRouter();
  const keywords = useTodayKeywordList();
  if (keywords.length === 0) return null;

  const handlePress = (keyword: TodayKeyword) => {
    const source = primarySource(keyword);
    if (source === '지도') return;
    if (source !== '관상') {
      requestTabScrollReset();
    }
    router.navigate(SOURCE_ROUTES[source]);
  };

  return (
    <View style={styles.chips}>
      {keywords.map((kw) => (
        <KeywordBadge
          key={kw.label}
          label={kw.label}
          hits={kw.hits}
          size="lg"
          onPress={() => handlePress(kw)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontSize: 13,
    lineHeight: 19,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
