import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ShareIcon } from '@/components/icons/AppIcon';
import { DojangSeal } from '@/components/ink/DojangSeal';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius } from '@/constants/Theme';
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
      style={({ pressed }) => [styles.wrap, { opacity: pressed ? 0.92 : 1 }]}>
      <View
        style={[
          styles.card,
          paperShadow,
          {
            backgroundColor: c.surface,
            borderColor: c.hairline,
          },
        ]}>
        <Image
          source={wash}
          style={[styles.wash, { opacity: isDark ? 0.22 : 0.14 }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View
          pointerEvents="none"
          style={[
            styles.accent,
            {
              backgroundColor: c.tint,
              opacity: isDark ? 0.55 : 0.85,
            },
          ]}
        />
        <View pointerEvents="none" style={styles.seal}>
          <DojangSeal size={54} rotate={-12} />
        </View>

        <View style={styles.row}>
          <Image source={icon} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
          <View style={styles.copy}>
            <Text style={[styles.eyebrow, { color: c.tint }]}>SHARE</Text>
            <Text style={[styles.title, { color: c.text, fontFamily: display }]}>친구에게 앱 공유</Text>
            <Text style={[styles.hint, { color: c.muted }]}>성향·사주·타로 함께 살펴보기</Text>
          </View>
          <View style={[styles.cta, { backgroundColor: c.tint }]}>
            <ShareIcon color="#F3EEE6" size={16} />
            <Text style={styles.ctaText}>링크</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
  },
  card: {
    minHeight: 92,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.08 }],
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  seal: {
    position: 'absolute',
    right: -6,
    bottom: -10,
    opacity: 0.1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  copy: {
    flex: 1,
    gap: 2,
    paddingRight: 4,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.2,
    fontWeight: '700',
    lineHeight: 14,
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: {
    color: '#F3EEE6',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});
