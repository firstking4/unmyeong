import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { IntegratedFortune } from '@/components/IntegratedFortune';
import { IdentityCard } from '@/components/id-card/IdentityCard';
import { AdBannerSlot } from '@/components/home/AdBannerSlot';
import { ShareBannerSlot } from '@/components/home/ShareBannerSlot';
import { DestinyQuote } from '@/components/home/DestinyQuote';
import { HomeHeroFilled } from '@/components/home/HomeHeroFilled';
import { LockedFortune } from '@/components/home/LockedFortune';
import { TodayKeywords } from '@/components/home/TodayKeywords';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { pagePad, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import { useTabScrollReset } from '@/lib/useTabScrollReset';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { fortuneReady } = useProfile();
  const scrollRef = useTabScrollReset();
  const fortuneY = useRef(0);

  const scrollToFortune = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, fortuneY.current - 12), animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <HomeHeroFilled />
        <IdentityCard />
        <ShareBannerSlot />
        <AdBannerSlot />
        <View onLayout={(e) => { fortuneY.current = e.nativeEvent.layout.y; }}>
          {fortuneReady ? <IntegratedFortune /> : <LockedFortune />}
        </View>
        <TodayKeywords onPressMapKeyword={scrollToFortune} />
        <DestinyQuote />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: pagePad,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    gap: space.sm,
  },
});
