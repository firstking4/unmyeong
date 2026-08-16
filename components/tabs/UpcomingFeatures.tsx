import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

export type UpcomingItem = {
  title: string;
  blurb?: string;
};

/** 아직 없는 기능 — 제목만 두고 준비중 표시 */
export function UpcomingFeatures({ items }: { items: UpcomingItem[] }) {
  const c = Colors[useColorScheme() ?? 'light'];
  if (items.length === 0) return null;

  return (
    <View style={[styles.list, { borderTopColor: c.hairline }]}>
      {items.map((item) => (
        <View key={item.title} style={[styles.row, { borderBottomColor: c.hairline }]}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: c.text }]}>{item.title}</Text>
            {item.blurb ? (
              <Text style={[styles.rowBlurb, { color: c.muted }]}>{item.blurb}</Text>
            ) : null}
          </View>
          <Text style={[styles.badge, { color: c.muted }]}>준비중</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  rowBlurb: {
    fontSize: 13,
    lineHeight: 19,
  },
  badge: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
});
