import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { CopyIcon } from '@/components/ui/CopyIcon';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { ProfileNeededCta } from '@/components/tabs/ProfileNeededCard';
import { ShareIcon } from '@/components/ui/ShareIcon';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { pagePad, paperShadow, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { isFortuneReady, useProfile } from '@/context/ProfileContext';
import {
  encodeSajuCodeFromProfile,
  formatSajuShareMessage,
} from '@/lib/sajuCode';

export default function SajuCodeShareScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile } = useProfile();
  const ready = isFortuneReady(profile);
  const code = useMemo(() => encodeSajuCodeFromProfile(profile), [profile]);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      Alert.alert('복사 실패', '클립보드에 코드를 넣지 못했습니다.');
    }
  };

  const shareCode = async () => {
    if (!code || !profile.name) return;
    try {
      await Share.share({
        title: '사주 코드',
        message: formatSajuShareMessage(code, profile.name.trim()),
      });
    } catch {
      // 공유 시트 취소
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>SAJU CODE</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>사주 코드 공유</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          이름·생년월일(및 입력한 성별·시각·MBTI·혈액형)이 텍스트 코드에 포함됩니다. 믿을 수 있는
          사람에게만 공유하세요.
        </Text>

        {!ready || !code ? (
          <View style={[styles.banner, paperShadow, { backgroundColor: c.surface }]}>
            <Text style={[styles.bannerTitle, { color: c.text }]}>내 프로필이 필요해요</Text>
            <Text style={[styles.bannerBody, { color: c.muted }]}>
              지도 탭 신분증에 이름과 생년월일을 입력하면 사주 코드를 만들 수 있습니다.
            </Text>
            <ProfileNeededCta />
          </View>
        ) : (
          <>
            <View style={[styles.codeCard, paperShadow, { backgroundColor: c.surface }]}>
              <Text style={[styles.codeLabel, { color: c.muted }]}>내 사주 코드</Text>
              <Text selectable style={[styles.code, { color: c.text }]}>
                {code}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={copyCode}
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: c.card, opacity: pressed ? 0.7 : 1 },
                ]}>
                <CopyIcon color={c.text} size={18} />
                <Text style={[styles.btnText, { color: c.text }]}>
                  {copied ? '복사됨' : '코드 복사'}
                </Text>
              </Pressable>
              <Pressable
                onPress={shareCode}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnPrimary,
                  { backgroundColor: c.tint, opacity: pressed ? 0.75 : 1 },
                ]}>
                <ShareIcon color="#F3EEE6" size={18} />
                <Text style={[styles.btnText, { color: '#F3EEE6' }]}>코드 공유</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: pagePad,
    paddingTop: space.sm,
    paddingBottom: space.xl,
    gap: 16,
  },
  eyebrow: { fontSize: 12, letterSpacing: 1.2 },
  title: { fontSize: 26, marginTop: -4 },
  lead: { fontSize: 14, lineHeight: 21 },
  banner: {
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  bannerBody: { fontSize: 13, lineHeight: 19 },
  codeCard: {
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  codeLabel: { fontSize: 12 },
  code: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {},
  btnText: { fontSize: 15, fontWeight: '700' },
});
