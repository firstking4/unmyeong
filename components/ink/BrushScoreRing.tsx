import { useEffect, useId, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

// 획을 구울 때 같이 나오는 치수. 손으로 적으면 두께를 손볼 때마다 어긋난다.
import geometry from '@/assets/images/ink/brush-ring.json';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { useColorScheme } from '@/components/useColorScheme';

const ring = require('../../assets/images/ink/brush-ring.png');

/** 마스크·좌표 기준 캔버스. 표시 크기는 `size` prop으로 줄인다. */
const CANVAS = 118;
const DRAW_MS = 820;
const DRAW_STEPS = 24;

// 색이 갈리는 자리를 섞는 폭(바퀴 단위). 칼로 자르면 획이 아니라 두 조각으로 보인다.
//
// 두 자리의 사정이 다르다. 12시에는 붓을 떼며 눌린 **둥근 마무리**가 있어서 그 호를 따라
// 색이 갈리면 자연스럽다 — 오히려 넓게 섞으면 마무리 위로 주홍이 배어 들어와 탁한 띠가
// 생긴다. 반면 점수가 끝나는 자리는 획 한가운데라 아무 단서가 없으니 넓게 풀어야 한다
// (시안도 그 각도에서 붉은 비율이 100% → 64% → 0%로 떨어진다).
const BLEND_IN = 0.005;
const BLEND_OUT = 0.021;
// 이웃한 부채꼴을 이만큼 겹쳐 깐다. 경계를 딱 맞추면 두 조각이 각각 반쯤만 덮이도록
// 안티에일리어싱되어 그 틈으로 아래의 먹이 비쳐 머리카락 같은 검은 선이 남는다.
const SEAM = 0.003;
const MID = CANVAS * geometry.mid; // 획의 중간 반지름 — 섞이는 띠의 방향을 잡는 데 쓴다

type Props = {
  score: number;
  ink?: string;
  /** 표시 크기. 기본 118(메인 운세). 목록은 52 정도. */
  size?: number;
  /** `/ 100` 분모 표시. 작은 크기에서는 기본 숨김. */
  showDenom?: boolean;
  /** 점수 아래 짧은 캡션(예: 좋음·무난·주의). 있으면 분모 대신 우선 표시. */
  caption?: string;
  /** false면 등장·획 애니메이션 없이 최종 점수/색으로 고정(공유 캡처용). */
  animated?: boolean;
};

function point(turn: number, radius: number): [number, number] {
  const c = CANVAS / 2;
  const angle = turn * Math.PI * 2;
  return [c + radius * Math.sin(angle), c - radius * Math.cos(angle)];
}

/** 먹과 주홍이 섞이는 두 자리(12시 시작·점수 끝)와 그 사이 진한 구간.
 *
 * **양쪽 다** 섞어야 한다. 끝만 섞으면 12시에서 주홍이 먹에 곧바로 맞닿아 칼로 자른 금이
 * 남는다. 시안도 12시 칸의 붉은 비율이 50%로 섞여 있다.
 *
 * 각도 방향 그라디언트는 SVG에 없지만, 섞이는 띠가 9° 정도로 좁아서 호가 거의 직선이다.
 * 그래서 그 구간의 접선 방향으로 선형 그라디언트를 깔면 각도 방향으로 옅어지는 것과
 * 같아진다 — 반투명 부채꼴을 여러 장 겹치는 방식과 달리 계단이 생기지 않는다.
 */
function blendBand(turn: number) {
  const room = turn <= 0 || turn >= 1 ? 0 : turn / 2;
  const head = Math.min(BLEND_IN, room); // 12시에서 여기까지 주홍이 배어 들어온다
  const fade = Math.min(BLEND_OUT, room);
  const solid = turn >= 1 ? 1 : turn - fade;
  const tail = turn >= 1 ? 1 : turn + Math.min(fade * 0.45, 1 - turn);
  return {
    head,
    solid,
    tail,
    // 두 섞임 띠의 방향(접선). 각도 방향 그라디언트 대신 쓰는 근사다.
    inFrom: point(0, MID),
    inTo: point(head, MID),
    outFrom: point(solid, MID),
    outTo: point(tail, MID),
  };
}

/** 12시 기준 `from`~`to` 바퀴 사이의 부채꼴. 반지름은 캔버스를 덮을 만큼 크게. */
function wedge(from: number, to: number): string {
  const c = CANVAS / 2;
  const r = CANVAS;
  const [x0, y0] = point(from, r);
  const [x1, y1] = point(to, r);
  const large = to - from > 0.5 ? 1 : 0;
  return `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

/** 붓으로 한 획에 돌린 원. 점수만큼 획의 **색이** 12시부터 시계 방향으로 주홍이 된다.
 *
 * 주홍을 별개의 획으로 먹 위에 얹어 봤지만 겹친 자리가 탁해지고 두 줄로 보였다. 시안은
 * 획이 하나이고 색만 갈린다. 그래서 붓 그림(`brush-ring.png`, 알파만)을 SVG 마스크로
 * 두고 그 안에서 먹 사각형 + 주홍 부채꼴을 칠한다 — 획은 한 장, 색은 테마를 따른다.
 * 색이 갈리는 자리는 그라디언트로 섞고(`blendBand`), 붓을 떼며 눌린 둥근 마무리는 먹으로
 * 되돌린다(`brush-ring.json`의 원).
 *
 * 획 자체를 SVG로 그리는 건 안 된다. `strokeDasharray` 호는 붓의 눌림·갈필·두께 흔들림이
 * 없어 기계처럼 깨끗하다. 그림은 `npm run ink:score-ring`으로 굽는다.
 */
export function BrushScoreRing({
  score,
  ink,
  size = CANVAS,
  showDenom,
  caption,
  animated = true,
}: Props) {
  const c = Colors[useColorScheme() ?? 'light'];
  const text = ink ?? c.text;
  const clamped = Math.max(0, Math.min(100, score));
  const target = clamped / 100;
  const id = useId();
  const maskId = `brush-ring-${id}`;
  const blendId = `brush-blend-${id}`;
  const scale = size / CANVAS;
  const denomVisible = !caption && (showDenom ?? size >= 90);
  const scoreFont = caption
    ? Math.max(18, Math.round(size * 0.34))
    : Math.max(14, Math.round(36 * scale));
  const subFont = caption
    ? Math.max(11, Math.round(size * 0.18))
    : Math.max(10, Math.round(11 * scale));

  const [turn, setTurn] = useState(animated ? 0 : target);
  const blend = blendBand(animated ? turn : target);
  // 붓을 대고 뗀 자리는 둘 다 12시다. 마무리 원의 중심이 거기 있고 시작 단면이 그 안에 숨는다.
  const finish = point(0, MID);
  const appear = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (!animated) {
      appear.setValue(1);
      return;
    }
    appear.setValue(0);
    Animated.spring(appear, {
      toValue: 1,
      friction: 7,
      tension: 48,
      useNativeDriver: true,
    }).start();
  }, [appear, target, animated]);

  useEffect(() => {
    if (!animated) {
      setTurn(target);
      return;
    }
    if (target <= 0) {
      setTurn(0);
      return;
    }
    setTurn(0);
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setTurn((target * step) / DRAW_STEPS);
      if (step >= DRAW_STEPS) clearInterval(timer);
    }, DRAW_MS / DRAW_STEPS);
    return () => clearInterval(timer);
  }, [target, animated]);

  const ringTurn = animated ? turn : target;

  const frameStyle = {
    width: size,
    height: size,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const ringSvg = (
      <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
        <Defs>
          <Mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={CANVAS} height={CANVAS}>
            <SvgImage href={ring} x={0} y={0} width={CANVAS} height={CANVAS} />
          </Mask>
          <LinearGradient
            id={`${blendId}-in`}
            gradientUnits="userSpaceOnUse"
            x1={blend.inFrom[0]}
            y1={blend.inFrom[1]}
            x2={blend.inTo[0]}
            y2={blend.inTo[1]}>
            <Stop offset="0" stopColor={c.tint} stopOpacity={0} />
            <Stop offset="0.5" stopColor={c.tint} stopOpacity={0.62} />
            <Stop offset="1" stopColor={c.tint} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient
            id={`${blendId}-out`}
            gradientUnits="userSpaceOnUse"
            x1={blend.outFrom[0]}
            y1={blend.outFrom[1]}
            x2={blend.outTo[0]}
            y2={blend.outTo[1]}>
            <Stop offset="0" stopColor={c.tint} stopOpacity={1} />
            <Stop offset="0.5" stopColor={c.tint} stopOpacity={0.62} />
            <Stop offset="1" stopColor={c.tint} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <G mask={`url(#${maskId})`}>
          <Rect x={0} y={0} width={CANVAS} height={CANVAS} fill={text} />
          {blend.head > 0 ? (
            <Path
              d={wedge(0, Math.min(blend.head + SEAM, blend.solid))}
              fill={`url(#${blendId}-in)`}
            />
          ) : null}
          {/* 만점은 부채꼴이 한 바퀴다. 호의 시작·끝이 같은 점이면 SVG가 아무것도 그리지
              않으니 사각형으로 덮는다. */}
          {blend.solid >= 1 ? (
            <Rect x={0} y={0} width={CANVAS} height={CANVAS} fill={c.tint} />
          ) : blend.solid > blend.head ? (
            <Path d={wedge(blend.head, blend.solid)} fill={c.tint} />
          ) : null}
          {blend.tail > blend.solid ? (
            <Path
              d={wedge(Math.max(blend.solid - SEAM, blend.head), blend.tail)}
              fill={`url(#${blendId}-out)`}
            />
          ) : null}
          {/* 붓을 떼며 눌린 **둥근 마무리**는 먹으로 남는다. 이 원은 12시에서 시계 방향으로
              부풀어 있어 그냥 두면 주홍에 덮이고, 그러면 12시에 남는 단서가 색이 갈리는
              곧은 금뿐이라 획이 잘려 보인다. 원을 되돌리면 그 금이 붓끝의 호가 된다.
              만점은 획이 온통 주홍이니 마무리까지 물든다. */}
          {ringTurn < 1 ? (
            <Circle cx={finish[0]} cy={finish[1]} r={CANVAS * geometry.cap} fill={text} />
          ) : null}
        </G>
      </Svg>
  );

  const scoreLabel = (
      <View style={[styles.center, { width: size, height: size }]} pointerEvents="none">
        <Text
          style={[
            styles.score,
            {
              color: text,
              fontFamily: display,
              fontSize: scoreFont,
              lineHeight: scoreFont + (caption ? 0 : 2),
              marginBottom: 0,
            },
          ]}>
          {Math.round(clamped)}
        </Text>
        {caption ? (
          <Text
            style={[
              styles.denom,
              {
                color: text,
                fontFamily: display,
                fontSize: subFont,
                lineHeight: subFont + 1,
                marginTop: Math.max(2, Math.round(size * 0.03)),
                opacity: 0.7,
              },
            ]}>
            {caption}
          </Text>
        ) : denomVisible ? (
          <Text
            style={[
              styles.denom,
              { color: text, fontFamily: display, fontSize: subFont },
            ]}>
            / 100
          </Text>
        ) : null}
      </View>
  );

  if (!animated) {
    return (
      <View style={frameStyle}>
        {ringSvg}
        {scoreLabel}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        frameStyle,
        {
          opacity: appear,
          transform: [
            {
              scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
            },
          ],
        },
      ]}>
      {ringSvg}
      {scoreLabel}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // RN 0.86은 `StyleSheet.absoluteFillObject`를 없앴다(`absoluteFill`만 남았다). 스프레드가
  // 조용히 빈 객체가 되면서 겹쳐야 할 층이 세로로 쌓여 카드 밖으로 넘쳤다 — 직접 적는다.
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 획이 얇아지며 안쪽이 넓어졌다. 시안의 숫자는 바깥 반지름의 절반쯤 되는 큰 글자다.
  score: {},
  denom: {
    letterSpacing: 0.8,
    marginTop: -2,
    opacity: 0.55,
  },
});
