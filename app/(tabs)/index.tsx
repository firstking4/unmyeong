import { ScrollView, StyleSheet, View } from 'react-native';

import { IntegratedFortune } from '@/components/IntegratedFortune';
import { IdentityCard } from '@/components/id-card/IdentityCard';
import { AdBannerSlot } from '@/components/home/AdBannerSlot';
import { ShareBannerSlot } from '@/components/home/ShareBannerSlot';
import { DestinyQuote } from '@/components/home/DestinyQuote';
import { HomeHeroFilled } from '@/components/home/HomeHeroFilled';
import { LockedFortune } from '@/components/home/LockedFortune';
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
        {fortuneReady ? <IntegratedFortune /> : <LockedFortune />}
        <AdBannerSlot />
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
