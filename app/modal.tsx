import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdBannerSlot } from '@/components/home/AdBannerSlot';
import { Text } from '@/components/Themed';
import { ChevronRightIcon } from '@/components/icons/AppIcon';
import Colors from '@/constants/Colors';
import { pagePad, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { shareAppInstallPage } from '@/lib/appInstall';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { requestAppReview } from '@/lib/requestAppReview';

type MenuHref =
  | '/profile-edit'
  | '/gwansang'
  | '/saju-code-share'
  | '/history'
  | '/settings';

type MenuItem = {
  key: string;
  title: string;
  blurb: string;
} & (
  | { href: MenuHref; action?: never }
  | { action: 'share_app'; href?: never }
  | { action: 'leave_review'; href?: never }
);

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
    key: 'app-share',
    action: 'share_app',
    title: '앱 공유하기',
    blurb: '친구에게 설치 페이지 링크 보내기',
  },
  {
    key: 'leave-review',
    action: 'leave_review',
    title: '리뷰 남기기',
    blurb: 'Play 스토어에서 평가 남기기',
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

  const onPressItem = (item: MenuItem) => {
    if (item.action === 'share_app') {
      void shareAppInstallPage();
      return;
    }
    if (item.action === 'leave_review') {
      void requestAppReview();
      return;
    }
    router.push(item.href);
  };

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
            onPress={() => onPressItem(item)}
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
      <View style={styles.adSlot}>
        <AdBannerSlot />
      </View>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: pagePad },
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
  adSlot: { marginTop: 16 },
});
