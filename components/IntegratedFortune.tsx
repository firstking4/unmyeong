import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrushScoreRing } from '@/components/ink/BrushScoreRing';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import { buildIntegratedFortune } from '@/lib/fortune';
import { recordFortuneView } from '@/lib/history';
import { useLocalDateKey } from '@/lib/useLocalDateKey';

export function IntegratedFortune() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile } = useProfile();
  const dateKey = useLocalDateKey();

  const fortune = useMemo(() => buildIntegratedFortune(profile), [profile, dateKey]);
  const tags = fortune.insights?.luckTags ?? [];

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
          <View style={styles.chips}>
            {tags.map((tag, i) => (
              <KeywordBadge key={`luck-${i}-${tag}`} label={tag} />
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.detail, { borderTopColor: c.card }]}>
        <Text style={[styles.detailBody, { color: c.text }]}>{fortune.summary}</Text>
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
    paddingBottom: 12,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detail: {
    marginHorizontal: space.md,
    marginBottom: space.md,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
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
