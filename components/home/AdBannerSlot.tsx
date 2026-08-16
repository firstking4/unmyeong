import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { radius } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

/** 홈 신분증 아래 광고 슬롯. SDK 연동 전 자리만 잡아 둔다. */
export function AdBannerSlot() {
  const c = Colors[useColorScheme() ?? 'light'];

  return (
    <View
      style={[styles.slot, { backgroundColor: c.card, borderColor: c.hairline }]}
      accessibilityLabel="광고 영역"
      accessibilityRole="summary">
      <Text style={[styles.label, { color: c.muted }]}>광고</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: 64,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
