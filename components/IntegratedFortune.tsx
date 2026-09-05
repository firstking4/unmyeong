import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { TodayKeywordCaption, TodayKeywords } from '@/components/home/TodayKeywords';
import { BrushScoreRing } from '@/components/ink/BrushScoreRing';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import { buildIntegratedFortune } from '@/lib/fortune';
import { recordFortuneView } from '@/lib/history';
import type { FortuneSourceLine } from '@/lib/types';
import { useLocalDateKey } from '@/lib/useLocalDateKey';
import { requestTabScrollReset } from '@/lib/useTabScrollReset';

export function IntegratedFortune() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile } = useProfile();
  const dateKey = useLocalDateKey();

  const fortune = useMemo(() => buildIntegratedFortune(profile), [profile, dateKey]);

  useEffect(() => {
    void recordFortuneView(fortune);
  }, [fortune]);

  return (
    <View style={[styles.card, paperShadow, { backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: c.text }]}>오늘의 운세 점수</Text>
        <View style={[styles.info, { borderColor: c.muted }]}>
          <Text style={[styles.infoGlyph, { color: c.muted }]}>i</Text>
        </View>
        <Text style={[styles.date, { color: c.muted }]}>{fortune.compactDate}</Text>
      </View>

      <View style={styles.body}>
        <BrushScoreRing score={fortune.score} ink={c.text} />
        <View style={styles.copy}>
          <Text style={[styles.mood, { color: c.text, fontFamily: display }]}>
            {fortune.moodHeadline}
          </Text>
          <TodayKeywordCaption />
        </View>
      </View>

      <View style={styles.keywords}>
        <TodayKeywords />
      </View>

      <View style={[styles.detail, { borderTopColor: c.card }]}>
        {fortune.introLine ? (
          <Text style={[styles.detailBody, { color: c.text }]}>{fortune.introLine}</Text>
        ) : null}
        {fortune.sources?.length ? (
          <FortuneSourceLines sources={fortune.sources} />
        ) : (
          <Text style={[styles.detailBody, { color: c.text }]}>{fortune.summary}</Text>
        )}
        {fortune.scoreNote ? (
          <Text style={[styles.detailMuted, { color: c.muted }]}>{fortune.scoreNote}</Text>
        ) : null}
        <Text style={[styles.detailLabel, { color: c.tint, fontFamily: display }]}>행동 가이드</Text>
        <Text style={[styles.detailMuted, { color: c.muted }]}>{fortune.guidance}</Text>
        {fortune.caution ? (
          <>
            <Text style={[styles.detailLabel, { color: c.tint, fontFamily: display }]}>오늘의 주의</Text>
            <Text style={[styles.detailMuted, { color: c.muted }]}>{fortune.caution}</Text>
          </>
        ) : null}
        <Text style={[styles.closing, { color: c.text, fontFamily: display }]}>
          {fortune.closing}
        </Text>
      </View>
    </View>
  );
}

function FortuneSourceLines({ sources }: { sources: FortuneSourceLine[] }) {
  const router = useRouter();
  const c = Colors[useColorScheme() ?? 'light'];

  const openSource = (item: FortuneSourceLine) => {
    if (item.source !== '관상') requestTabScrollReset();
    router.navigate(item.route as Href);
  };

  return (
    <View style={styles.sourceStack}>
      {sources.map((item) => (
        <Pressable
          key={item.source}
          onPress={() => openSource(item)}
          accessibilityRole="link"
          accessibilityLabel={`${item.source} 오늘 카드로 이동`}
        >
          <Text style={[styles.sourceLabel, { color: c.muted }]}>{item.source}</Text>
          <Text style={[styles.detailBody, { color: c.text }]}>{item.line}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  info: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGlyph: {
    fontSize: 10,
    lineHeight: 12,
    fontStyle: 'italic',
  },
  date: {
    marginLeft: 'auto',
    fontSize: 12,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  copy: {
    flex: 1,
    paddingTop: 8,
    gap: 8,
  },
  mood: {
    fontSize: 18,
    lineHeight: 26,
  },
  keywords: {
    paddingHorizontal: space.md,
    paddingBottom: 12,
  },
  detail: {
    marginHorizontal: space.md,
    marginBottom: space.md,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  sourceStack: {
    gap: 10,
  },
  sourceLabel: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  detailBody: {
    fontSize: 15,
    lineHeight: 24,
  },
  detailLabel: {
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 4,
  },
  detailMuted: {
    fontSize: 14,
    lineHeight: 22,
  },
  closing: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 6,
  },
});
