import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { StarIcon } from '@/components/ui/StarIcon';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { paperShadow, radius, space, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { listTarotDeck } from '@/lib/data/catalog';
import type { SeedRecord } from '@/lib/data/types';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import { tarotCardImage } from '@/lib/tarotDeckImages';
import { tarotEnglishName } from '@/lib/tarotEnglishNames';
import {
  emptyTarotBookmarks,
  isTarotBookmarked,
  loadTarotBookmarks,
  toggleTarotBookmark,
  type TarotBookmarkStore,
} from '@/lib/tarotBookmarks';

const CARD_ART_W = 72;
const CARD_ART_H = 104;

type DeckFilter =
  | 'all'
  | 'major'
  | 'wands'
  | 'cups'
  | 'swords'
  | 'pentacles'
  | 'bookmarks';

const FILTERS: { id: DeckFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'major', label: '메이저' },
  { id: 'wands', label: '완드' },
  { id: 'cups', label: '컵' },
  { id: 'swords', label: '소드' },
  { id: 'pentacles', label: '펜타클' },
  { id: 'bookmarks', label: '북마크' },
];

function matchesFilter(card: SeedRecord, filter: DeckFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'major') return card.id.startsWith('tarot_major_');
  if (filter === 'wands') return card.categoryId === 'tarot_minor_wands';
  if (filter === 'cups') return card.categoryId === 'tarot_minor_cups';
  if (filter === 'swords') return card.categoryId === 'tarot_minor_swords';
  if (filter === 'pentacles') return card.categoryId === 'tarot_minor_pentacles';
  return false;
}

function cardMetaLabel(card: SeedRecord): string {
  const en = tarotEnglishName(card);
  if (card.id.startsWith('tarot_major_')) {
    const num = typeof card.number === 'number' ? String(card.number).padStart(2, '0') : '—';
    return en ? `${num} · ${en}` : num;
  }
  const cue = card.cue ?? '마이너';
  return en ? `${cue} · ${en}` : cue;
}

function emptyCopy(filter: DeckFilter): { title: string; body: string } {
  if (filter === 'bookmarks') {
    return {
      title: '북마크한 카드가 없습니다',
      body: '전체·슈트 목록에서 별표를 누르면 여기에 모입니다.',
    };
  }
  return {
    title: '표시할 카드가 없습니다',
    body: '다른 탭을 골라 보세요.',
  };
}

export default function TarotCardbookScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const cards = useMemo(() => listTarotDeck(), []);
  const [bookmarks, setBookmarks] = useState<TarotBookmarkStore>(emptyTarotBookmarks);
  const [filter, setFilter] = useState<DeckFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void loadTarotBookmarks().then((store) => {
        if (alive) setBookmarks(store);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const counts = useMemo(() => {
    const next: Record<DeckFilter, number> = {
      all: cards.length,
      major: 0,
      wands: 0,
      cups: 0,
      swords: 0,
      pentacles: 0,
      bookmarks: bookmarks.ids.length,
    };
    for (const card of cards) {
      if (matchesFilter(card, 'major')) next.major += 1;
      if (matchesFilter(card, 'wands')) next.wands += 1;
      if (matchesFilter(card, 'cups')) next.cups += 1;
      if (matchesFilter(card, 'swords')) next.swords += 1;
      if (matchesFilter(card, 'pentacles')) next.pentacles += 1;
    }
    return next;
  }, [bookmarks.ids.length, cards]);

  const visible = useMemo(() => {
    if (filter === 'bookmarks') {
      return cards.filter((card) => isTarotBookmarked(bookmarks, card.id));
    }
    return cards.filter((card) => matchesFilter(card, filter));
  }, [bookmarks, cards, filter]);

  const onToggleBookmark = async (cardId: string) => {
    const next = await toggleTarotBookmark(cardId);
    setBookmarks(next);
  };

  const empty = emptyCopy(filter);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, space.lg) },
        ]}>
        <Text style={[styles.lead, { color: c.muted }]}>
          메이저 22장과 마이너 56장의 정·역방향 핵심을 모아 둔 타로 덱입니다. 별표로 자주 보는
          카드를 남길 수 있어요.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}>
          {FILTERS.map((item) => {
            const selected = filter === item.id;
            const count = counts[item.id];
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: selected ? c.tint : c.card,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}>
                <Text style={[styles.filterText, { color: selected ? '#F3EEE6' : c.text }]}>
                  {item.label} {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {visible.length === 0 ? (
          <View style={[styles.empty, paperShadow, { backgroundColor: c.surface }]}>
            <Text style={[styles.emptyTitle, { color: c.text, fontFamily: display }]}>
              {empty.title}
            </Text>
            <Text style={[styles.emptyBody, { color: c.muted }]}>{empty.body}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visible.map((card) => (
              <CardbookRow
                key={card.id}
                card={card}
                bookmarked={isTarotBookmarked(bookmarks, card.id)}
                expanded={expandedId === card.id}
                text={c.text}
                muted={c.muted}
                tint={c.tint}
                surface={c.surface}
                hairline={c.hairline}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === card.id ? null : card.id))
                }
                onToggleBookmark={() => void onToggleBookmark(card.id)}
              />
            ))}
          </View>
        )}

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}

function CardbookRow({
  card,
  bookmarked,
  expanded,
  text,
  muted,
  tint,
  surface,
  hairline,
  onToggleExpand,
  onToggleBookmark,
}: {
  card: SeedRecord;
  bookmarked: boolean;
  expanded: boolean;
  text: string;
  muted: string;
  tint: string;
  surface: string;
  hairline: string;
  onToggleExpand: () => void;
  onToggleBookmark: () => void;
}) {
  const art = tarotCardImage(card);
  const title = card.title ?? card.label;
  const upright = card.upright ?? card.summary;
  const reversed = card.reversed ?? '역방향 해석을 준비 중입니다.';
  const meta = cardMetaLabel(card);

  const keywords = card.keywords ?? [];

  return (
    <View style={[styles.card, paperShadow, { backgroundColor: surface }]}>
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onToggleBookmark();
        }}
        hitSlop={8}
        style={styles.starBtn}
        accessibilityRole="button"
        accessibilityLabel={bookmarked ? '북마크 해제' : '북마크'}
        accessibilityState={{ selected: bookmarked }}>
        <StarIcon color={bookmarked ? tint : muted} size={20} filled={bookmarked} />
      </Pressable>

      <Pressable
        onPress={onToggleExpand}
        style={styles.cardHead}
        accessibilityRole="button"
        accessibilityLabel={`${title} 해석 ${expanded ? '접기' : '펼치기'}`}>
        {art ? (
          <View style={[styles.artFrame, { borderColor: hairline, backgroundColor: surface }]}>
            <Image
              source={art}
              style={styles.art}
              resizeMode="cover"
              accessibilityLabel={`${title} 타로 카드`}
            />
          </View>
        ) : null}
        <View style={styles.cardCopy}>
          <Text style={[styles.cardNumber, { color: tint, fontFamily: display }]}>{meta}</Text>
          <Text style={[styles.cardTitle, { color: text, fontFamily: display }]}>{title}</Text>
          {keywords.length > 0 ? (
            <View style={[styles.keywordsClip, !expanded && styles.keywordsClipCollapsed]}>
              <View style={styles.keywords}>
                {keywords.map((kw, i) => (
                  <KeywordBadge key={`${card.id}-kw-${i}-${kw}`} label={kw} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Pressable>

      {expanded ? (
        <View style={[styles.detail, { borderTopColor: hairline }]}>
          <Text style={[styles.detailLabel, { color: tint }]}>정방향</Text>
          <Text style={[styles.detailBody, { color: muted }]}>{upright}</Text>
          <Text style={[styles.detailLabel, { color: tint }]}>역방향</Text>
          <Text style={[styles.detailBody, { color: muted }]}>{reversed}</Text>
          {card.hints?.love || card.hints?.work || card.hints?.growth ? (
            <>
              {card.hints.love ? (
                <>
                  <Text style={[styles.detailLabel, { color: text }]}>관계</Text>
                  <Text style={[styles.detailHint, { color: muted }]}>{card.hints.love}</Text>
                </>
              ) : null}
              {card.hints.work ? (
                <>
                  <Text style={[styles.detailLabel, { color: text }]}>일·재능</Text>
                  <Text style={[styles.detailHint, { color: muted }]}>{card.hints.work}</Text>
                </>
              ) : null}
              {card.hints.growth ? (
                <>
                  <Text style={[styles.detailLabel, { color: text }]}>성장</Text>
                  <Text style={[styles.detailHint, { color: muted }]}>{card.hints.growth}</Text>
                </>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    ...tabSection.content,
    gap: space.sm,
  },
  lead: {
    ...tabSection.lead,
    marginBottom: 0,
  },
  filterScroll: { flexGrow: 0, marginHorizontal: -tabSection.content.paddingHorizontal },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: tabSection.content.paddingHorizontal,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  filterText: { fontSize: 13, fontWeight: '700' },
  empty: {
    borderRadius: radius.lg,
    padding: 20,
    gap: 8,
  },
  emptyTitle: { fontSize: 18 },
  emptyBody: { fontSize: 14, lineHeight: 21 },
  list: { gap: 10 },
  card: {
    borderRadius: radius.lg,
    padding: 14,
    gap: 0,
    position: 'relative',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingRight: 28,
  },
  artFrame: {
    width: CARD_ART_W,
    height: CARD_ART_H,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  art: { width: '100%', height: '100%', opacity: 0.82 },
  cardCopy: { flex: 1, gap: 6, minWidth: 0, paddingTop: 8 },
  cardNumber: { fontSize: 12, letterSpacing: 1.5 },
  cardTitle: { fontSize: 20, lineHeight: 26 },
  keywordsClip: {
    overflow: 'hidden',
  },
  /** KeywordBadge md: paddingVertical 5×2 + text ~18 ≈ 28 */
  keywordsClipCollapsed: {
    height: 28,
  },
  keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  starBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: {
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  detailLabel: { ...tabSection.detailLabel },
  detailBody: { ...tabSection.detailBody, marginBottom: 6 },
  detailHint: { ...tabSection.detailHint, marginBottom: 4 },
  disclaimer: { ...tabSection.disclaimer },
});
