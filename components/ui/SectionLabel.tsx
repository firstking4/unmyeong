import { StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { display } from '@/constants/Fonts';

type Props = {
  children: string;
  color: string;
};

/** Editorial section eyebrow — 궁서 + wide tracking. */
export function SectionLabel({ children, color }: Props) {
  return <Text style={[styles.label, { color }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: display,
    fontSize: 12,
    letterSpacing: 3,
    lineHeight: 18,
  },
});
