import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BrushScoreRing } from '@/components/ink/BrushScoreRing';
import { SajuCodeImportModal } from '@/components/gunghap/SajuCodeImportModal';
import { Text } from '@/components/Themed';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { StarIcon } from '@/components/ui/StarIcon';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius, space, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useContacts } from '@/context/ContactsContext';
import { isFortuneReady, useProfile } from '@/context/ProfileContext';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { buildTodayCompatibility } from '@/lib/gunghap';
import { getZodiacAnimal } from '@/lib/saju';
import type { ContactProfile } from '@/lib/types';

function ContactRow({
  contact,
  score,
  grade,
  summary,
  animal,
  pinned,
  onPress,
  onTogglePin,
  text,
  muted,
  tint,
  surface,
}: {
  contact: ContactProfile;
  score: number;
  grade: string;
  summary: string;
  animal: string | null;
  pinned: boolean;
  onPress: () => void;
  onTogglePin: () => void;
  text: string;
  muted: string;
  tint: string;
  surface: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        paperShadow,
        { backgroundColor: surface, opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${contact.name} 궁합 상세`}>
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onTogglePin();
        }}
        hitSlop={8}
        style={styles.pinBtn}
        accessibilityRole="button"
        accessibilityLabel={pinned ? '고정 해제' : '목록 상단 고정'}
        accessibilityState={{ selected: pinned }}>
        <StarIcon color={pinned ? tint : muted} size={16} filled={pinned} />
      </Pressable>
      <View style={styles.scoreBox}>
        <BrushScoreRing score={score} ink={text} size={68} caption={grade} />
      </View>
      <View style={styles.rowMain}>
        <View style={styles.rowHead}>
          <Text style={[styles.rowName, { color: text }]}>{contact.name}</Text>
          <Text style={[styles.rowRel, { color: muted }]}>{contact.relationship}</Text>
        </View>
        <Text style={[styles.rowMeta, { color: muted }]} numberOfLines={1}>
          {[animal ? `${animal}띠` : null, summary].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: muted }]}>›</Text>
    </Pressable>
  );
}

export default function GunghapScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { profile } = useProfile();
  const { contacts, loaded, togglePinned } = useContacts();
  const ready = isFortuneReady(profile);
  const [importOpen, setImportOpen] = useState(false);

  const rows = useMemo(() => {
    return contacts
      .map((contact) => {
        const reading = buildTodayCompatibility(profile, contact);
        return {
          contact,
          reading,
          animal: getZodiacAnimal(contact.birthDate),
        };
      })
      .sort((a, b) => {
        const pinA = a.contact.pinned ? 1 : 0;
        const pinB = b.contact.pinned ? 1 : 0;
        if (pinA !== pinB) return pinB - pinA;
        const scoreA = a.reading.ready ? a.reading.score : -1;
        const scoreB = b.reading.ready ? b.reading.score : -1;
        return scoreB - scoreA;
      });
  }, [contacts, profile]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>JIIN</Text>
        <Text style={[styles.title, { color: c.text, fontFamily: display }]}>지인</Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          {ready
            ? '지인 목록에서 오늘의 궁합 점수를 보고, 누르면 상세 풀이를 엽니다.'
            : '내 프로필이 필요해요. 지도 탭 신분증에 이름과 생년월일을 입력하면 지인과의 궁합을 계산합니다.'}
        </Text>

        <View style={styles.addRow}>
          <Pressable
            onPress={() => router.push('/contact/new')}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: c.tint, opacity: pressed ? 0.75 : 1 },
            ]}>
            <Text style={styles.addBtnText}>지인 추가</Text>
          </Pressable>
          <Pressable
            onPress={() => setImportOpen(true)}
            style={({ pressed }) => [
              styles.addBtn,
              styles.addBtnSecondary,
              { backgroundColor: c.card, opacity: pressed ? 0.75 : 1 },
            ]}>
            <Text style={[styles.addBtnText, { color: c.text }]}>사주코드 추가</Text>
          </Pressable>
        </View>

        {loaded && rows.length === 0 ? (
          <View style={[styles.empty, paperShadow, { backgroundColor: c.surface }]}>
            <Text style={[styles.emptyTitle, { color: c.text, fontFamily: display }]}>
              아직 지인이 없습니다
            </Text>
            <Text style={[styles.emptyBody, { color: c.muted }]}>
              이름·관계·생년월일을 넣으면 오늘의 궁합 점수가 목록에 나타납니다.
            </Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {rows.map(({ contact, reading, animal }) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              score={reading.ready ? reading.score : 0}
              grade={reading.ready ? reading.grade : '—'}
              summary={
                reading.ready
                  ? reading.moodHeadline
                  : reading.reason ?? '정보를 확인해 주세요'
              }
              animal={animal}
              pinned={!!contact.pinned}
              onPress={() => router.push(`/contact/${contact.id}`)}
              onTogglePin={() => {
                void togglePinned(contact.id);
              }}
              text={c.text}
              muted={c.muted}
              tint={c.tint}
              surface={c.surface}
            />
          ))}
        </View>

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>

      <SajuCodeImportModal visible={importOpen} onClose={() => setImportOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    ...tabSection.content,
    gap: space.sm,
  },
  eyebrow: {
    ...tabSection.eyebrow,
  },
  title: {
    ...tabSection.pageTitle,
  },
  lead: {
    ...tabSection.lead,
  },
  addBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addBtnSecondary: {
    alignSelf: 'flex-start',
  },
  addBtnText: { color: '#F3EEE6', fontSize: 14, fontWeight: '700' },
  empty: {
    borderRadius: radius.lg,
    padding: 20,
    gap: 8,
  },
  emptyTitle: { fontSize: 20 },
  emptyBody: { fontSize: 14, lineHeight: 21 },
  list: { gap: 10 },
  row: {
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  pinBtn: {
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: { flex: 1, gap: 4 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rowName: { fontSize: 16, fontWeight: '700' },
  rowRel: { fontSize: 12 },
  rowMeta: { fontSize: 12, lineHeight: 17 },
  scoreBox: {
    width: 68,
    alignItems: 'center',
  },
  chevron: {
    flexShrink: 0,
    fontSize: 26,
    lineHeight: 28,
    width: 20,
    textAlign: 'right',
  },
  disclaimer: {
    ...tabSection.disclaimer,
  },
});
