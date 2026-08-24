import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { isFortuneReady, useProfile } from '@/context/ProfileContext';
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
  return KEYWORD_NAV_SOURCE_ORDER.find((item) => keyword.sources.includes(item)) ?? '지도';
}

export function TodayKeywords({ onPressMapKeyword }: { onPressMapKeyword?: () => void }) {
  const c = Colors[useColorScheme() ?? 'light'];
  const { profile } = useProfile();
  const router = useRouter();
  const ready = isFortuneReady(profile);
  const dateKey = useLocalDateKey();
  const { keywords, sources } = useMemo(
    () => (ready ? buildTodayKeywords(profile) : { keywords: [], sources: [] as KeywordSource[] }),
    [profile, ready, dateKey],
  );

  const handlePress = (keyword: TodayKeyword) => {
    const source = primarySource(keyword);
    if (source === '지도') {
      onPressMapKeyword?.();
      return;
    }
    if (source !== '관상') {
      requestTabScrollReset();
    }
    router.navigate(SOURCE_ROUTES[source]);
  };

  return (
    <View style={[styles.card, paperShadow, { backgroundColor: c.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>오늘의 키워드</Text>
        {ready && keywords.length > 0 ? (
          <Text style={[styles.caption, { color: c.muted }]}>
            키워드를 누르면 관련 위치로 이동합니다.
          </Text>
        ) : null}
      </View>
      {ready && keywords.length > 0 ? (
        <>
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
          {sources.length > 0 ? (
            <Text style={[styles.footer, { color: c.muted, borderTopColor: c.hairline }]}>
              {sources.join(' · ')}
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={[styles.hint, { color: c.muted }]}>
          내 프로필이 필요해요. 지도 탭 신분증에 이름과 생년월일을 입력하면 오늘의 키워드가
          모입니다.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingTop: 16,
    paddingBottom: 14,
    marginTop: 12,
    gap: 14,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hint: {
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontSize: 12,
    lineHeight: 18,
  },
});
