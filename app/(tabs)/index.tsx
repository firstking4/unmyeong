import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { IntegratedFortune } from '@/components/IntegratedFortune';
import { IdentityCard } from '@/components/id-card/IdentityCard';
import { AdBannerSlot } from '@/components/home/AdBannerSlot';
import { DestinyQuote } from '@/components/home/DestinyQuote';
import { HomeHeroFilled } from '@/components/home/HomeHeroFilled';
import { LockedFortune } from '@/components/home/LockedFortune';
import { TodayKeywords } from '@/components/home/TodayKeywords';
import { PaperGrain } from '@/components/ui/PaperGrain';
import Colors from '@/constants/Colors';
import { space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { fortuneReady } = useProfile();
  const scrollRef = useRef<ScrollView>(null);
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
        <View style={styles.profileGap}>
          <IdentityCard />
        </View>
        <View style={styles.adGap}>
          <AdBannerSlot />
        </View>
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
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  profileGap: {
    marginTop: space.sm,
  },
  adGap: {
    marginTop: space.sm,
    marginBottom: space.xs,
  },
});
