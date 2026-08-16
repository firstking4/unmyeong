import { Image, StyleSheet, View } from 'react-native';

const wash = require('../../assets/images/ink/mountains-wash.png');

export function InkMountains() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={wash} style={styles.img} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
});
