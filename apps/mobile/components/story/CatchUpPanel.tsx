// ============================================
// WHAT THIS FILE DOES (plain English):
// The Catch-Up sheet on a story: peeks ~172px at the bottom, expands on tap.
// Order is fixed — actionable polls/events/questions first, Currently split,
// week photo hero, then quiet "you already answered" receipts (no results).
// PRIVACY / AI: week captions are user words only; never photo analysis.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckIcon, ChevronDownIcon } from 'lucide-react-native';
import {
  CATCH_UP,
  trackClick,
  trackProduct,
  trackUi,
  type CatchUpItem,
  type MusicPlayable
} from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  ButtonSecondary,
  CoverArt,
  PixelHeading,
  SurfaceHost,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import type { WeekDay } from '../../data/stories';
import { MusicTrackActions } from '../music/MusicTrackActions';
import {
  getPlayingPreviewUrl,
  subscribeMusicPreview,
  toggleMusicPreview
} from '../../lib/music-preview';

const PEEK_PX = 172;

type Currently = {
  listening: {
    title: string;
    artist: string;
    emoji: string;
    previewUrl?: string | null;
    spotifyId?: string | null;
    spotifyUri?: string | null;
    artworkUrl?: string | null;
  };
  reading: { title: string; author: string; emoji: string };
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  authorName: string;
  live: CatchUpItem[];
  answered: CatchUpItem[];
  week: WeekDay[];
  currently: Currently;
  onAnswer: (itemId: string, choice: string) => void | Promise<void>;
};

export function CatchUpPanel({
  open,
  onOpenChange,
  authorName,
  live,
  answered,
  week,
  currently,
  onAnswer
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const translateY = useRef(new Animated.Value(0)).current;
  const [sheetH, setSheetH] = useState(0);
  // Hide until we know the peek offset — otherwise the sheet paints fully
  // open for one frame, then springs shut (the flash when swapping authors).
  const [positioned, setPositioned] = useState(false);
  const positionedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!sheetH) return;
    const closedY = Math.max(0, sheetH - PEEK_PX);
    // First layout: jump straight to open or peek. No spring from "open".
    if (!positionedRef.current) {
      positionedRef.current = true;
      translateY.setValue(open ? 0 : closedY);
      setPositioned(true);
      return;
    }
    Animated.spring(translateY, {
      toValue: open ? 0 : closedY,
      useNativeDriver: true,
      friction: 9,
      tension: 80
    }).start();
  }, [open, sheetH, translateY]);

  // Collapsing should bring Catch-Up back to the top, not leave it parked
  // wherever the reader scrolled to — so the peek always shows the top again.
  useEffect(() => {
    if (!open) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [open]);

  // New friend in the tray: reset the peek to the top of their Catch-Up.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [authorName]);

  return (
    <View pointerEvents="box-none" className="absolute inset-0 z-50 justify-end">
      <SurfaceHost surface="catch_up" parentScreen="story" open={open}>
        {open ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close Catch-Up"
            onPress={withAnalyticsPress(CATCH_UP.chrome.dismiss, () => onOpenChange(false))}
            className="absolute inset-0 bg-black/45"
          />
        ) : null}

        <Animated.View
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
          style={{
            transform: [{ translateY }],
            height: '88%',
            opacity: positioned ? 1 : 0
          }}
        >
          {/*
            The panel background lives on this plain View, not the Animated.View
            above: NativeWind does not reliably apply className backgrounds to
            Animated.View, which left the sheet see-through over the story.
          */}
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 8) }}
            className="flex-1 overflow-hidden rounded-t-3xl bg-canvas"
          >
          <Pressable
            onPress={withAnalyticsPress(
              open ? CATCH_UP.chrome.handle : CATCH_UP.chrome.peek,
              () => onOpenChange(!open)
            )}
            accessibilityRole="button"
            accessibilityLabel={open ? 'Close Catch-Up' : 'Open Catch-Up'}
            accessibilityState={{ expanded: open }}
            className="w-full flex-row items-center justify-between px-5 pb-2 pt-3"
          >
            <Text className="font-pixel text-[19px] text-ink">Catch-Up</Text>
            {/*
              The caret sits in its own rotated View. Rotating the icon itself
              via its `style` prop stopped it drawing at all on web, which left
              the collapsed peek showing an empty circle.
            */}
            <View className="h-8 w-8 items-center justify-center rounded-full bg-ink/10">
              <View style={{ transform: [{ rotate: open ? '0deg' : '180deg' }] }}>
                <ChevronDownIcon size={20} color={c.ink} strokeWidth={2.8} />
              </View>
            </View>
          </Pressable>

          <ScrollView
            ref={scrollRef}
            scrollEnabled={open}
            className="flex-1 px-5"
            contentContainerClassName="gap-3 pb-10"
          >
            {live.map((item) => (
              <ActionableCard
                key={item.id}
                item={item}
                onAnswer={(choice) => void onAnswer(item.id, choice)}
              />
            ))}

            <CurrentlyCard currently={currently} />

            {/* PRIVACY / AI: captions are update text only — never photo analysis */}
            <View>
              <View className="mb-3 flex-row items-baseline justify-between gap-3">
                <PixelHeading size="lg">{`${authorName}'s week`}</PixelHeading>
                <Text className="font-sans-b text-[12px] text-ink-mute">
                  {week.length} days
                </Text>
              </View>
              <View className="gap-5">
                {week.map((d, i) => (
                  <Pressable
                    key={d.day}
                    onPress={() =>
                      trackUi('page_viewed', CATCH_UP.week.day_card, {
                        page_index: i,
                        surface: 'catch_up'
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${d.day}: ${d.note}. ${d.caption}`}
                    className="overflow-hidden rounded-2xl bg-surface"
                  >
                    {/* Just the day. The little emoji chip that used to sit in
                        the corner said nothing the photo below doesn't. */}
                    <View className="px-4 pb-2.5 pt-3.5">
                      <Text className="font-sans-b text-[22px] leading-none tracking-tight text-ink">
                        {d.day}
                      </Text>
                    </View>
                    <View
                      className={cn(
                        'aspect-square w-full items-center justify-center',
                        ACCENTS[d.accent].tintSolid
                      )}
                    >
                      <Text className="text-[96px]">{d.emoji}</Text>
                    </View>
                    <Text className="px-4 pb-4 pt-3 font-sans-sb text-[14px] leading-snug text-ink">
                      {d.caption}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {answered.length > 0 ? (
              <View className="pt-2">
                <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                  You already answered
                </Text>
                <View className="gap-2">
                  {answered.map((item) => (
                    <SettledRow key={item.id} item={item} />
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>
          </View>
        </Animated.View>
      </SurfaceHost>
    </View>
  );
}

function ActionableCard({
  item,
  onAnswer
}: {
  item: CatchUpItem;
  onAnswer: (choice: string) => void;
}) {
  const token = ACCENTS[item.accent];

  const answerPoll = (choice: string) => {
    trackClick(CATCH_UP.top.poll, { method: 'comment' });
    trackProduct('poll_answered', { id: item.id });
    onAnswer(choice);
  };

  const answerEvent = (choice: 'going' | 'cant') => {
    trackClick(choice === 'going' ? CATCH_UP.top.going : CATCH_UP.top.event);
    onAnswer(choice);
  };

  const answerQuestion = () => {
    trackClick(CATCH_UP.top.question);
    onAnswer('answered');
  };

  return (
    /*
      Pastel accent fills stay bright in dark mode (dark: twins do not run on
      web here). Theme ink flips light, so text-ink on these cards vanishes.
      Always-dark onaccent type keeps event / poll titles readable.
    */
    <View className={cn('overflow-hidden rounded-2xl', token.tintSolid)}>
      {item.kind === 'event' ? (
        <View className="h-24 w-full overflow-hidden">
          <CoverArt cover={item.cover} accent={item.accent} />
        </View>
      ) : null}

      <View className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-sans-b text-[10px] uppercase tracking-wide text-onaccent/60">
              {item.kind}
              {item.countdown ? ` · ${item.countdown}` : ''}
            </Text>
            <Text className="mt-0.5 font-sans-b text-[16px] leading-snug tracking-tight text-onaccent">
              {item.title}
            </Text>
            {item.detail ? (
              <Text className="font-sans-sb text-[12px] text-onaccent/75">{item.detail}</Text>
            ) : null}
          </View>
          {item.kind !== 'event' ? (
            <Text accessible={false} className="shrink-0 text-[20px]">
              {item.emoji}
            </Text>
          ) : null}
        </View>

        {item.kind === 'poll' ? (
          <View className="mt-3 flex-row gap-2">
            {item.options?.map((o) => (
              <View key={o} className="flex-1">
                <ButtonSecondary size="sm" full onPress={() => answerPoll(o)}>
                  {o}
                </ButtonSecondary>
              </View>
            ))}
          </View>
        ) : null}

        {item.kind === 'event' ? (
          <View className="mt-3 flex-row gap-2">
            <View className="flex-1">
              <ButtonSecondary size="sm" full tone="outline" onPress={() => answerEvent('cant')}>
                Can't
              </ButtonSecondary>
            </View>
            <View className="flex-1">
              <ButtonSecondary
                size="sm"
                full
                tone="positive"
                onPress={() => answerEvent('going')}
              >
                Going
              </ButtonSecondary>
            </View>
          </View>
        ) : null}

        {item.kind === 'question' ? (
          <View className="mt-3">
            <ButtonSecondary size="sm" full tone="positive" onPress={answerQuestion}>
              Answer
            </ButtonSecondary>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Quiet receipt — no results re-shown (STORIES.md). */
function SettledRow({ item }: { item: CatchUpItem }) {
  return (
    <AnalyticsRegion
      analyticsId={CATCH_UP.bottom.answered_row}
      interactive={false}
      className="flex-row items-center gap-2.5 rounded-2xl border border-ink-line bg-surface px-3.5 py-2.5"
      accessibilityLabel={`You answered: ${item.title}`}
    >
      <Text accessible={false} className="shrink-0 text-[15px]">
        {item.emoji}
      </Text>
      <Text
        numberOfLines={1}
        className="min-w-0 flex-1 font-sans-sb text-[13px] text-ink-soft"
      >
        {item.title}
      </Text>
      <CheckIcon size={16} color="#2FA85B" strokeWidth={3} />
    </AnalyticsRegion>
  );
}

function CurrentlyCard({ currently }: { currently: Currently }) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(getPlayingPreviewUrl());
  const [sheetTrack, setSheetTrack] = useState<MusicPlayable | null>(null);
  const previewUrl = currently.listening.previewUrl ?? null;
  const playing = !!previewUrl && playingUrl === previewUrl;

  useEffect(() => subscribeMusicPreview(setPlayingUrl), []);

  const listeningPlayable: MusicPlayable | null =
    currently.listening.title || currently.listening.spotifyId
      ? {
          title: currently.listening.title,
          artistName: currently.listening.artist,
          previewUrl: currently.listening.previewUrl,
          spotifyId: currently.listening.spotifyId,
          spotifyUri: currently.listening.spotifyUri,
          artworkUrl: currently.listening.artworkUrl
        }
      : null;

  return (
    <>
      {/*
        Fixed near-black cells + white type. bg-ink would flip cream in dark mode
        and wipe out text-white.
      */}
      <View className="flex-row gap-px overflow-hidden rounded-2xl bg-[#151515]">
        <Pressable
          onPress={withAnalyticsPress(CATCH_UP.currently.listening, () => {
            if (listeningPlayable) setSheetTrack(listeningPlayable);
          })}
          accessibilityRole="button"
          accessibilityLabel={`Listening ${currently.listening.title} by ${currently.listening.artist}`}
          className="min-w-0 flex-1 flex-row items-center gap-2.5 bg-[#1C1B16] px-3 py-2.5"
        >
          <View
            accessible={false}
            className="h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue"
          >
            <Text className="text-[17px]">{currently.listening.emoji}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-b text-[9px] uppercase tracking-wide text-white/50">
              Listening
            </Text>
            <Text numberOfLines={1} className="font-sans-b text-[13px] leading-tight text-white">
              {currently.listening.title}
            </Text>
            <Text numberOfLines={1} className="font-sans-sb text-[11px] text-white/60">
              {currently.listening.artist}
            </Text>
          </View>
          {previewUrl || currently.listening.spotifyId ? (
            <Pressable
              onPress={withAnalyticsPress(CATCH_UP.currently.preview_play, () => {
                if (previewUrl) {
                  void toggleMusicPreview(previewUrl).then((on) => {
                    if (on) trackProduct('music_preview_played', { method: 'tap' });
                  });
                } else if (listeningPlayable) {
                  setSheetTrack(listeningPlayable);
                }
              })}
              accessibilityRole="button"
              accessibilityLabel={
                playing
                  ? `Pause preview of ${currently.listening.title}`
                  : `Play preview of ${currently.listening.title}`
              }
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
            >
              <Text className="text-[14px] text-white">{playing ? '❚❚' : '▶'}</Text>
            </Pressable>
          ) : null}
        </Pressable>

        <AnalyticsRegion analyticsId={CATCH_UP.currently.reading} interactive={false}>
          <View className="min-w-0 flex-1 flex-row items-center gap-2.5 bg-[#1C1B16] px-3 py-2.5">
            <View
              accessible={false}
              className="h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber"
            >
              <Text className="text-[17px]">{currently.reading.emoji}</Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[9px] uppercase tracking-wide text-white/50">
                Reading
              </Text>
              <Text numberOfLines={1} className="font-sans-b text-[13px] leading-tight text-white">
                {currently.reading.title}
              </Text>
              <Text numberOfLines={1} className="font-sans-sb text-[11px] text-white/60">
                {currently.reading.author}
              </Text>
            </View>
          </View>
        </AnalyticsRegion>
      </View>

      <MusicTrackActions
        track={sheetTrack}
        visible={!!sheetTrack}
        onClose={() => setSheetTrack(null)}
      />
    </>
  );
}
