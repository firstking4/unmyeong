import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { pagePad, space, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { LEGAL_UPDATED, TERMS_SECTIONS } from '@/lib/legal';

export default function TermsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, space.md) },
      ]}>
      <Text style={[styles.title, { color: c.text, fontFamily: display }]}>이용약관</Text>
      <Text style={[styles.updated, { color: c.muted }]}>최종 업데이트 · {LEGAL_UPDATED}</Text>
      {TERMS_SECTIONS.map((section) => (
        <View key={section.heading} style={styles.block}>
          <Text style={[styles.heading, { color: c.text }]}>{section.heading}</Text>
          <Text style={[styles.body, { color: c.muted }]}>{section.body}</Text>
        </View>
      ))}
      <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: pagePad, paddingTop: 8, gap: space.sm },
  title: { fontSize: 26, lineHeight: 34 },
  updated: { fontSize: 13, marginBottom: 8 },
  block: { gap: 8 },
  heading: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22 },
  disclaimer: { ...tabSection.disclaimer, marginTop: space.sm },
});
