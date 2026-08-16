import { Image, StyleSheet, View } from 'react-native';

const pine = require('../../assets/images/ink/pine.png');

/** Sumi-e pine + vermilion sun (generated asset). */
export function InkPineHero({ width = 168, height = 148 }: { width?: number; height?: number }) {
  return (
    <View style={{ width, height }}>
      <Image source={pine} style={[styles.img, { width, height }]} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    position: 'absolute',
    right: -8,
    top: -6,
  },
});
