import { StyleSheet } from 'react-native';

import { View } from '@/components/Themed';

/** 빈 상태 — 히어로 카피는 쓰지 않고 신분증만 노출 */
export function HomeHeroEmpty() {
  return <View style={styles.wrap} />;
}

const styles = StyleSheet.create({
  wrap: { height: 0 },
});
