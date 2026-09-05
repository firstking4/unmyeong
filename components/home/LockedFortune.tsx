import { StyleSheet, View } from 'react-native';

import { LockIcon } from '@/components/icons/AppIcon';
import { BrushScoreRing } from '@/components/ink/BrushScoreRing';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { buildPlaceholderFortune } from '@/lib/fortune';

export function LockedFortune() {
  const c = Colors[useColorScheme() ?? 'light'];
  const placeholder = buildPlaceholderFortune();

  return (
    <View style={[styles.card, paperShadow, { backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: c.text }]}>오늘의 운세 점수</Text>
        <Text style={[styles.date, { color: c.muted }]}>{placeholder.compactDate}</Text>
      </View>

      <View style={styles.body}>
        <View style={{ opacity: 0.28 }}>
          <BrushScoreRing score={0} ink={c.text} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.mood, { color: c.text, fontFamily: display }]}>
            {placeholder.moodHeadline}
          </Text>
          <Text style={[styles.blurb, { color: c.muted }]}>
            내 프로필이 필요해요. 이름과 생년월일을 채우면 오늘의 점수가 열립니다.
          </Text>
          <View style={styles.lockRow}>
            <LockIcon color={c.tint} size={14} />
            <Text style={[styles.lockText, { color: c.tint }]}>잠금</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 0,
    paddingBottom: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 15, fontWeight: '700' },
  date: { marginLeft: 'auto', fontSize: 12 },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    gap: 8,
  },
  copy: { flex: 1, paddingTop: 10, gap: 8 },
  mood: { fontSize: 18, lineHeight: 26 },
  blurb: { fontSize: 13, lineHeight: 20 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  lockText: { fontSize: 12, letterSpacing: 1 },
});
