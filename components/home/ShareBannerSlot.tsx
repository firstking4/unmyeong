import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ShareIcon } from '@/components/icons/AppIcon';
import { DojangSeal } from '@/components/ink/DojangSeal';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { shareAppInstallPage } from '@/lib/appInstall';

const icon = require('@/assets/images/icon.png');
const wash = require('@/assets/images/ink/mountains-wash.png');

/** 홈 신분증 아래 — 탭하면 설치 랜딩 페이지 URL을 공유한다. */
export function ShareBannerSlot() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const isDark = scheme === 'dark';

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
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <Image
        source={wash}
        style={[styles.wash, { opacity: isDark ? 0.16 : 0.1 }]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View
        pointerEvents="none"
        style={[styles.accent, { backgroundColor: c.tint, opacity: isDark ? 0.5 : 0.75 }]}
      />
      <View pointerEvents="none" style={styles.seal}>
        <DojangSeal size={34} rotate={-10} />
      </View>

      <Image
        source={icon}
        style={[styles.thumb, { borderColor: c.hairline }]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: c.text }]}>친구에게 앱 공유</Text>
        <Text style={[styles.hint, { color: c.muted }]}>성향·사주·타로 함께 살펴보기</Text>
      </View>
      <View style={[styles.cta, { backgroundColor: `${c.tint}18` }]}>
        <ShareIcon color={c.tint} size={18} />
      </View>
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
    paddingHorizontal: 12,
    paddingVertical: space.sm,
    gap: 10,
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    right: -24,
    top: -8,
    width: 120,
    height: 80,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: space.sm,
    bottom: space.sm,
    width: 3,
    borderRadius: 2,
  },
  seal: {
    position: 'absolute',
    right: 44,
    bottom: -8,
    opacity: 0.08,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
