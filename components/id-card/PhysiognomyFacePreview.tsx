import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { PHYSIOGNOMY_WARPS } from '@/lib/physiognomyWarpAssets';
import type { Gender, PhysiognomySelection } from '@/lib/types';

type Props = {
  selection?: PhysiognomySelection;
  gender?: Gender;
  muted: string;
  tint?: string;
  width?: number;
};

/** On-screen 증명사진 size. Assets are 104 / 208 / 312 to match @1x @2x @3x. */
export const PORTRAIT_W = 104;
export const PORTRAIT_H = 136;

const PORTRAITS: Record<Gender, ImageSourcePropType> = {
  female: require('@/assets/images/gwansang/static/female.png'),
  male: require('@/assets/images/gwansang/static/male.png'),
};

/** 아직 아무 부위도 고르지 않았을 때의 윤곽 한 획. */
const EMPTY_PORTRAIT: ImageSourcePropType = require('@/assets/images/gwansang/static/empty.png');

/**
 * 윤곽 → 부위 순서. 얼굴형과 턱을 둘 다 고르면 미리 이어서 워프한 콤보
 * 레이어를 얼굴형 자리에 한 장만 얹는다. 따로 쌓으면 턱 윤곽이 두 겹이 된다.
 */
const LAYER_ORDER = [
  'face_shape',
  'forehead',
  'chin',
  'eyebrows',
  'eyes',
  'nose',
  'mouth',
] as const;

function comboLayerKey(face?: string, chin?: string) {
  if (!face || !chin) return undefined;
  return `${face}__${chin}` as const;
}

/**
 * 관상 증명사진.
 *
 * 성별 수묵 원화를 깔고, 선택한 옵션만 그 위에 얹는다. 각 옵션 레이어는 원화
 * 픽셀을 부위 주변에서만 밀어낸 것(scripts/build-gwansang-warps.py)이라 붓결과
 * 담묵이 그대로 남는다. 원화 그대로가 정답인 옵션(계란형 등)은 레이어가 없다.
 */
export function PhysiognomyFacePreview({ selection, gender, width = PORTRAIT_W }: Props) {
  const height = Math.round((width * PORTRAIT_H) / PORTRAIT_W);
  const resolved: Gender = gender ?? 'female';
  const warps = PHYSIOGNOMY_WARPS[resolved];
  const comboKey = comboLayerKey(selection?.face_shape, selection?.chin);
  const combo = comboKey ? warps[comboKey] : undefined;

  const chosen = LAYER_ORDER.some((category) => selection?.[category]);
  const layers = LAYER_ORDER.flatMap((category) => {
    if (combo && category === 'face_shape') return [combo];
    if (combo && category === 'chin') return [];
    const option = selection?.[category];
    const source = option ? warps[option] : undefined;
    return source ? [source] : [];
  });

  if (!chosen) {
    return (
      <View style={[styles.frame, { width, height }]}>
        <Image source={EMPTY_PORTRAIT} style={{ width, height }} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={[styles.frame, { width, height }]}>
      <Image source={PORTRAITS[resolved]} style={{ width, height }} resizeMode="cover" />
      {layers.map((source, index) => (
        <Image
          key={index}
          source={source}
          style={[styles.layer, { width, height }]}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
