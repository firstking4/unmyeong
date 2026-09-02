import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/Themed';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { pagePad, paperShadow, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import {
  groupHistoryByDate,
  historyKindLabel,
  loadHistory,
  type HistoryEntry,
} from '@/lib/history';

function entryTitle(entry: HistoryEntry): string {
  switch (entry.kind) {
    case 'fortune':
      return entry.payload.moodHeadline;
    case 'tarot':
      return `${entry.payload.title} · ${entry.payload.orientation}`;
    case 'compatibility':
      return `${entry.contactName} · ${entry.relationship}`;
  }
}

function entrySummary(entry: HistoryEntry): string {
  switch (entry.kind) {
    case 'fortune':
      return entry.payload.summary;
    case 'tarot':
      return entry.payload.headline;
    case 'compatibility':
      return entry.payload.moodHeadline;
  }
}

function formatDateHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export default function HistoryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setEntries(await loadHistory());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const groups = groupHistoryByDate(entries);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void reload(true)} tintColor={c.tint} />
        }>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>HISTORY</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>기록</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          오늘의 운세·타로·지인 궁합을 처음 본 날의 스냅샷을 기기 안에만 보관합니다. 최근 90일까지
          남습니다.
        </Text>

        {loading ? (
          <ActivityIndicator color={c.tint} style={{ marginTop: space.lg }} />
        ) : groups.length === 0 ? (
          <View style={[styles.empty, paperShadow, { backgroundColor: c.surface }]}>
            <Text style={[styles.emptyTitle, { color: c.text, fontFamily: display }]}>
              아직 기록이 없습니다
            </Text>
            <Text style={[styles.emptyBody, { color: c.muted }]}>
              지도의 오늘의 운세, 타로 탭, 지인 궁합 상세를 열면 자동으로 쌓입니다.
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.dateKey} style={styles.group}>
              <Text style={[styles.dateHead, { color: c.text, fontFamily: display }]}>
                {formatDateHeading(group.dateKey)}
              </Text>
              {group.items.map((entry) => (
                <View
                  key={entry.id}
                  style={[styles.card, paperShadow, { backgroundColor: c.surface }]}>
                  <Text style={[styles.kind, { color: c.tint }]}>{historyKindLabel(entry.kind)}</Text>
                  <Text style={[styles.cardTitle, { color: c.text, fontFamily: display }]}>
                    {entryTitle(entry)}
                  </Text>
                  <Text style={[styles.cardBody, { color: c.muted }]} numberOfLines={3}>
                    {entrySummary(entry)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: pagePad,
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: space.sm,
  },
  empty: {
    borderRadius: radius.lg,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  group: {
    gap: space.sm,
    marginTop: space.sm,
  },
  dateHead: {
    fontSize: 18,
    lineHeight: 26,
  },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  kind: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  disclaimer: {
    marginTop: space.lg,
    fontSize: 12,
    lineHeight: 18,
  },
});
