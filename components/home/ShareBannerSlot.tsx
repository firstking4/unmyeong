import { Pressable, StyleSheet, View } from 'react-native';

import { ShareIcon } from '@/components/icons/AppIcon';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { radius } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { shareAppInstallPage } from '@/lib/appInstall';

/** 홈 신분증 아래 — 탭하면 설치 랜딩 페이지 URL을 공유한다. */
export function ShareBannerSlot() {
  const c = Colors[useColorScheme() ?? 'light'];

  return (
    <Pressable
      onPress={() => {
        void shareAppInstallPage();
      }}
      accessibilityRole="button"
      accessibilityLabel="앱 소개 페이지 공유"
      style={({ pressed }) => [
        styles.slot,
        {
          backgroundColor: c.card,
          borderColor: c.hairline,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: c.text }]}>친구에게 앱 공유</Text>
        <Text style={[styles.hint, { color: c.muted }]}>소개 페이지 링크 보내기</Text>
      </View>
      <ShareIcon color={c.tint} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    minHeight: 64,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  hint: { fontSize: 12, lineHeight: 17 },
});
