import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { ChevronRightIcon } from '@/components/icons/AppIcon';
import Colors from '@/constants/Colors';
import { space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';

type MenuHref =
  | '/profile-edit'
  | '/gwansang'
  | '/saju-code-share'
  | '/history'
  | '/settings';

type MenuItem = {
  key: string;
  href: MenuHref;
  title: string;
  blurb: string;
};

const MENU: MenuItem[] = [
  {
    key: 'gwansang',
    href: '/gwansang',
    title: '관상',
    blurb: '얼굴 특징으로 읽는 참고용 해설',
  },
  {
    key: 'history',
    href: '/history',
    title: '기록',
    blurb: '오늘의 운세·타로·궁합 날짜별 스냅샷',
  },
  {
    key: 'profile',
    href: '/profile-edit',
    title: '프로필관리',
    blurb: '이름·생년월일·성별 등 기본 정보',
  },
  {
    key: 'saju-share',
    href: '/saju-code-share',
    title: '사주 코드 공유',
    blurb: '내 사주 정보를 코드로 복사·공유',
  },
  {
    key: 'settings',
    href: '/settings',
    title: '설정',
    blurb: '알림·화면 테마·백업·약관',
  },
];

export default function ModalScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: 4, paddingBottom: Math.max(insets.bottom, space.md) },
      ]}>
      <View style={[styles.list, { borderColor: c.hairline }]}>
        {MENU.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomColor: c.hairline,
                opacity: pressed ? 0.55 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.title}>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: c.text }]}>{item.title}</Text>
              <Text style={[styles.rowBlurb, { color: c.muted }]}>{item.blurb}</Text>
            </View>
            <ChevronRightIcon color={c.muted} size={22} />
          </Pressable>
        ))}
      </View>

      <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: space.md },
  list: { borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontSize: 17 },
  rowBlurb: { fontSize: 13, lineHeight: 18 },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
});
