import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { BrushScoreRing } from '@/components/ink/BrushScoreRing';
import {
  ShareCardBrandFooter,
  shareCaptureHostStyle,
  waitFrames,
} from '@/components/ink/ShareCardBrandFooter';
import { Text } from '@/components/Themed';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { LockedContentCard } from '@/components/ui/LockedContentCard';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { ShareIcon } from '@/components/ui/ShareIcon';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius, space, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useContacts } from '@/context/ContactsContext';
import { useProfile } from '@/context/ProfileContext';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { buildTodayCompatibility, type TodayCompatibility } from '@/lib/gunghap';
import { recordCompatibilityView } from '@/lib/history';
import { formatBirthDateDisplay } from '@/lib/lunar';

type Reading = TodayCompatibility;

const DETAIL_LOCK = {
  title: '상세 풀이',
  description:
    '광고를 보면 상세 풀이와 행동 가이드를 열 수 있어요. 지금은 광고 준비 중이라 눌러서 바로 확인할 수 있습니다.',
  ctaLabel: '내용 보기',
} as const;

function ContactDetailBody({
  reading,
  muted,
  tint,
}: {
  reading: Reading;
  muted: string;
  tint: string;
}) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <LockedContentCard
      title={DETAIL_LOCK.title}
      description={DETAIL_LOCK.description}
      ctaLabel={DETAIL_LOCK.ctaLabel}
      onPress={() => setUnlocked(true)}>
      {unlocked ? (
        <>
          <Text style={[styles.body, { color: muted }]}>{reading.summary}</Text>
          <Text style={[styles.sectionLabel, { color: tint, fontFamily: display }]}>관계 흐름</Text>
          <Text style={[styles.hintText, { color: muted }]}>{reading.relationship}</Text>
          <Text style={[styles.sectionLabel, { color: tint, fontFamily: display }]}>
            행동 가이드
          </Text>
          <Text style={[styles.hintText, { color: muted }]}>{reading.guidance}</Text>
          <Text style={[styles.sectionLabel, { color: tint, fontFamily: display }]}>오늘의 주의</Text>
          <Text style={[styles.hintText, { color: muted }]}>{reading.caution}</Text>
        </>
      ) : null}
    </LockedContentCard>
  );
}

function CompatibilityCardBody({
  cardTitle,
  reading,
  text,
  muted,
  tint,
  hairline,
  titlePadRight,
  staticRing,
}: {
  cardTitle: string;
  reading: Reading;
  text: string;
  muted: string;
  tint: string;
  hairline: string;
  titlePadRight?: number;
  /** 공유 캡처용 — 점수 링 애니메이션 생략 */
  staticRing?: boolean;
}) {
  return (
    <>
      <Text
        style={[styles.cardTitle, { color: text, fontFamily: display, paddingRight: titlePadRight }]}
        numberOfLines={2}>
        {cardTitle}
      </Text>

      <View style={styles.scoreRow}>
        <BrushScoreRing
          score={reading.ready ? reading.score : 0}
          ink={text}
          animated={!staticRing}
        />
        <View style={styles.scoreCopy}>
          <Text style={[styles.date, { color: muted }]}>{reading.compactDate}</Text>
          <Text style={[styles.mood, { color: text, fontFamily: display }]}>
            {reading.moodHeadline}
          </Text>
          {reading.ready ? (
            <Text style={[styles.grade, { color: tint }]}>오늘의 궁합 · {reading.grade}</Text>
          ) : null}
        </View>
      </View>

      {reading.ready ? (
        <>
          <View style={styles.cardSummary}>
            <Text style={[styles.sectionLabel, { color: text }]}>기본 궁합</Text>
            <Text style={[styles.body, { color: muted }]}>
              {reading.animalLabel} · {reading.elementLabel}
              {'\n'}기준 점수 {reading.baseScore}점
              {reading.dailyDelta === 0
                ? ''
                : ` · 오늘 ${reading.dailyDelta > 0 ? '+' : ''}${reading.dailyDelta}`}
            </Text>
            {reading.keywords.length > 0 ? (
              <View style={styles.chips}>
                {reading.keywords.map((kw, i) => (
                  <KeywordBadge key={`kw-${i}-${kw}`} label={kw} />
                ))}
              </View>
            ) : null}
          </View>
          <View style={[styles.cardSplit, { borderTopColor: hairline }]}>
            <ContactDetailBody reading={reading} muted={muted} tint={tint} />
          </View>
        </>
      ) : (
        <Text style={[styles.body, { color: muted, marginTop: 12 }]}>{reading.reason}</Text>
      )}
    </>
  );
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const c = Colors[useColorScheme() ?? 'light'];
  const { width: windowW } = useWindowDimensions();
  const { profile } = useProfile();
  const { getContact, deleteContact, loaded } = useContacts();
  const contact = id ? getContact(id) : undefined;
  const shareRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const cardW = windowW - space.md * 2;

  const reading = useMemo(
    () => (contact ? buildTodayCompatibility(profile, contact) : null),
    [contact, profile],
  );

  useEffect(() => {
    if (!contact || !reading?.ready) return;
    void recordCompatibilityView({
      contactId: contact.id,
      contactName: contact.name,
      relationship: contact.relationship,
      reading,
    });
  }, [contact, reading]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: contact?.name ?? '궁합 상세' });
  }, [contact?.name, navigation]);

  if (loaded && !contact) {
    return (
      <View style={[styles.missing, { backgroundColor: c.background }]}>
        <Text style={[styles.missingTitle, { color: c.text }]}>지인을 찾을 수 없습니다</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: c.tint, fontWeight: '600' }}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  if (!contact || !reading) {
    return <View style={{ flex: 1, backgroundColor: c.background }} />;
  }

  const birthLabel = formatBirthDateDisplay(contact) ?? contact.birthDate;
  const myName = profile.name?.trim() || '나';
  const theirName = contact.name.trim();
  const cardTitle = `${myName}님과 ${theirName}님의 오늘은`;

  const shareCard = async () => {
    setSharing(true);
    try {
      await waitFrames(5);
      if (!shareRef.current) return;
      const uri = await captureRef(shareRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '오늘의 궁합',
        });
      } else if (Platform.OS === 'ios') {
        await Share.share({ url: uri, title: '오늘의 궁합' });
      } else {
        Alert.alert('공유 불가', '이 기기에서는 이미지 공유를 지원하지 않습니다.');
      }
    } catch {
      // 공유 시트 취소
    } finally {
      setSharing(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('지인 삭제', `${contact.name}을(를) 목록에서 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteContact(contact.id);
          router.replace('/gunghap');
        },
      },
    ]);
  };

  const bodyProps = {
    cardTitle,
    reading,
    text: c.text,
    muted: c.muted,
    tint: c.tint,
    hairline: c.hairline,
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>
          {contact.relationship}
        </Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>{contact.name}</Text>
        <Text style={[styles.meta, { color: c.muted }]}>
          {[
            birthLabel,
            contact.gender === 'male' ? '남성' : contact.gender === 'female' ? '여성' : null,
            contact.mbti,
            contact.bloodType ? `${contact.bloodType}형` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <View style={[styles.card, paperShadow, { backgroundColor: c.surface }]}>
          <Pressable
            onPress={shareCard}
            disabled={sharing}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="궁합 카드 공유"
            style={({ pressed }) => [
              styles.shareBtn,
              { opacity: pressed || sharing ? 0.55 : 1 },
            ]}>
            <ShareIcon color={c.muted} size={18} />
          </Pressable>

          <CompatibilityCardBody {...bodyProps} titlePadRight={28} />
        </View>

        {sharing ? (
          <View style={shareCaptureHostStyle} pointerEvents="none">
            <View
              ref={shareRef}
              collapsable={false}
              style={[
                styles.card,
                paperShadow,
                { width: cardW, backgroundColor: c.surface },
              ]}>
              <CompatibilityCardBody {...bodyProps} staticRing />
              <ShareCardBrandFooter tint={c.tint} text={c.text} hairline={c.hairline} />
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push(`/contact/${contact.id}/edit`)}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: c.card, opacity: pressed ? 0.65 : 1 },
            ]}>
            <Text style={[styles.btnText, { color: c.text }]}>정보 수정</Text>
          </Pressable>
          <Pressable
            onPress={confirmDelete}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: c.card, opacity: pressed ? 0.65 : 1 },
            ]}>
            <Text style={[styles.btnText, { color: c.tint }]}>삭제</Text>
          </Pressable>
        </View>

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    ...tabSection.content,
    gap: space.sm,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  missingTitle: { fontSize: 16, fontWeight: '600' },
  eyebrow: { ...tabSection.eyebrow },
  title: { ...tabSection.pageTitle },
  meta: { fontSize: 13, marginTop: -6, marginBottom: space.sm },
  card: {
    borderRadius: radius.lg,
    padding: 18,
    gap: 0,
    position: 'relative',
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 10,
  },
  cardSummary: {
    gap: tabSection.summaryGap,
    marginTop: 10,
  },
  cardSplit: {
    ...tabSection.cardSplit,
  },
  shareBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreCopy: { flex: 1, gap: 4 },
  date: { fontSize: 12 },
  mood: { fontSize: 20, lineHeight: 26 },
  grade: { fontSize: 13, fontWeight: '600' },
  sectionLabel: { ...tabSection.detailLabel },
  body: { ...tabSection.detailBody },
  hintText: { ...tabSection.detailHint },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnText: { fontSize: 14, fontWeight: '700' },
  disclaimer: { ...tabSection.disclaimer },
});
