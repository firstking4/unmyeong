import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';
import { radius } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { initMobileAds } from '@/lib/ads/initAds';
import { getMobileAds } from '@/lib/ads/mobileAds';
import { resolveAdUnits } from '@/lib/ads/resolveAdUnits';

type BannerAdComponent = typeof import('react-native-google-mobile-ads').BannerAd;
type BannerAdSizeEnum = typeof import('react-native-google-mobile-ads').BannerAdSize;

/**
 * 홈 오늘의 운세 카드 아래·메뉴 하단용 배너.
 * 네이티브 SDK 없으면 렌더하지 않음 (레이아웃만 비움).
 */
export function AdBannerSlot() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [BannerAd, setBannerAd] = useState<BannerAdComponent | null>(null);
  const [BannerAdSize, setBannerAdSize] = useState<BannerAdSizeEnum | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ads = getMobileAds();
      if (!ads) return;
      const ok = await initMobileAds();
      if (cancelled || !ok) return;
      setBannerAd(() => ads.BannerAd);
      setBannerAdSize(ads.BannerAdSize);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unitId = useMemo(() => resolveAdUnits().banner, []);

  if (Platform.OS === 'web' || !ready || !BannerAd || !BannerAdSize || failed) {
    return null;
  }

  const size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER ?? BannerAdSize.BANNER;

  return (
    <View
      style={[styles.wrap, { backgroundColor: c.card, borderColor: c.hairline }]}
      accessibilityLabel="광고">
      <BannerAd
        unitId={unitId}
        size={size}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
