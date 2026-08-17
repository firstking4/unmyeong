import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useScrollToTop } from 'expo-router/react-navigation';

/** 키워드 등 프로그래매틱 탭 이동 시 다음 포커스에서 스크롤 리셋 */
let pendingProgrammaticReset = false;

export function requestTabScrollReset() {
  pendingProgrammaticReset = true;
}

function consumeTabScrollReset(): boolean {
  if (!pendingProgrammaticReset) return false;
  pendingProgrammaticReset = false;
  return true;
}

function scrollToTop(ref: RefObject<ScrollView | null>) {
  requestAnimationFrame(() => {
    ref.current?.scrollTo({ y: 0, animated: false });
  });
}

/**
 * 하단 탭 이동·재탭·키워드 탭 점프 시 스크롤을 맨 위로 돌린다.
 * 상세 화면에서 뒤로 올 때는 스크롤 위치를 유지한다.
 */
export function useTabScrollReset(): RefObject<ScrollView | null> {
  const ref = useRef<ScrollView>(null);
  const navigation = useNavigation();

  useScrollToTop(ref);

  useEffect(() => {
    // tabPress는 탭 navigator 이벤트라 기본 NavigationProp 타입에 없음
    const unsub = (
      navigation as unknown as {
        addListener: (event: 'tabPress', cb: () => void) => () => void;
      }
    ).addListener('tabPress', () => {
      scrollToTop(ref);
    });
    return unsub;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (consumeTabScrollReset()) {
        scrollToTop(ref);
      }
    }, []),
  );

  return ref;
}
