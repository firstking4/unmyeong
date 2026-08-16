import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { PhysiognomyFacePreview } from '@/components/id-card/PhysiognomyFacePreview';
import type { Gender, PhysiognomySelection } from '@/lib/types';

export const OPTION_TILE_W = 88;

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  selection: PhysiognomySelection;
  gender?: Gender;
  tint: string;
  text: string;
  muted: string;
  hairline: string;
  card: string;
  width?: number;
};

/**
 * 관상 옵션 칩. 글자 대신 해당 옵션을 얹은 증명사진 썸네일을 보여 준다.
 * 선택 강조는 배경색이 아니라 테두리 — 초상화를 가리면 형이 안 읽힌다.
 */
export function PhysiognomyOptionTile({
  label,
  selected,
  onPress,
  selection,
  gender,
  tint,
  text,
  muted,
  hairline,
  card,
  width = OPTION_TILE_W,
}: Props) {
  const portraitW = width - 8;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          width,
          backgroundColor: card,
          borderColor: selected ? tint : hairline,
          opacity: pressed ? 0.82 : 1,
        },
      ]}>
      <View style={styles.photo}>
        <PhysiognomyFacePreview
          selection={selection}
          gender={gender}
          muted={muted}
          tint={tint}
          width={portraitW}
        />
      </View>
      <Text style={[styles.label, { color: selected ? tint : text }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexShrink: 0,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 4,
    paddingBottom: 6,
    alignItems: 'center',
    gap: 6,
  },
  photo: {
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 2,
    textAlign: 'center',
  },
});
