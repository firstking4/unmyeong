import { StyleSheet, View } from 'react-native';

import { DojangSeal } from '@/components/ink/DojangSeal';
import { InkMountains } from '@/components/ink/InkMountains';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { useColorScheme } from '@/components/useColorScheme';

export function DestinyQuote() {
  const c = Colors[useColorScheme() ?? 'light'];

  return (
    <View style={styles.wrap}>
      <InkMountains />
      <Text style={[styles.quote, { color: c.text, fontFamily: display }]}>
        “운명은 타고나는 것이 아니라{'\n'}스스로 선택하고 만들어가는 것입니다.”
      </Text>
      <View style={styles.seal}>
        <DojangSeal size={28} color={c.tint} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  quote: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  seal: {
    marginTop: 10,
  },
});
