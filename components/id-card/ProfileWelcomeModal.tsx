import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  visible: boolean;
  onStart: () => void;
  onSkip: () => void;
};

/** 앱 첫 진입 · 프로필 없을 때 — 신분증 입력으로 이어지는 안내. */
export function ProfileWelcomeModal({ visible, onStart, onSkip }: Props) {
  const c = Colors[useColorScheme() ?? 'light'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <Pressable style={styles.backdrop} onPress={onSkip}>
        <Pressable
          style={[styles.sheet, { backgroundColor: c.background }]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: c.text, fontFamily: display }]}>
            프로필을 만들어 주세요
          </Text>
          <Text style={[styles.body, { color: c.muted }]}>
            이름과 생년월일을 입력하면 오늘의 지도·운세가 열립니다. 이어서 성별·MBTI·혈액형도
            순서대로 넣을 수 있어요.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onSkip}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: c.card, opacity: pressed ? 0.75 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="나중에">
              <Text style={{ color: c.text, fontWeight: '600' }}>나중에</Text>
            </Pressable>
            <Pressable
              onPress={onStart}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: c.tint, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="입력 시작">
              <Text style={{ color: '#F3EEE6', fontWeight: '700' }}>입력하기</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 23, 20, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    borderRadius: 18,
    padding: 22,
    gap: 16,
    width: '100%',
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
