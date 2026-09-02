import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { pagePad, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';

export type SectionFeature = {
  title: string;
  blurb: string;
};

type Props = {
  eyebrow: string;
  title: string;
  lead: string;
  features: SectionFeature[];
};

/** Per-tab hub — editorial placeholders for upcoming detail features. */
export function SectionHub({ eyebrow, title, lead, features }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <PaperGrain color={c.grain} />
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>{eyebrow}</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>{title}</Text>
        <Text style={[styles.lead, { color: c.muted }]}>{lead}</Text>

        <View style={[styles.list, { borderTopColor: c.hairline }]}>
          {features.map((f) => (
            <View key={f.title} style={[styles.row, { borderBottomColor: c.hairline }]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: c.text }]}>{f.title}</Text>
                <Text style={[styles.rowBlurb, { color: c.muted }]}>{f.blurb}</Text>
              </View>
              <Text style={[styles.soon, { color: c.muted }]}>준비 중</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    paddingHorizontal: pagePad,
    paddingTop: space.md,
    paddingBottom: space.lg,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: space.xs,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 1,
    marginBottom: 12,
  },
  lead: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: space.lg,
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
  rowTitle: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  rowBlurb: {
    fontSize: 13,
    lineHeight: 20,
  },
  soon: {
    fontSize: 11,
    letterSpacing: 1.5,
  },
  disclaimer: {
    marginTop: space.lg,
    fontSize: 12,
    lineHeight: 18,
  },
});
