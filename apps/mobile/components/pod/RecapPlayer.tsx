// ============================================
// WHAT THIS FILE DOES (plain English):
// The weekly recap "podcast" as a full page (not a popup). Friends' voice
// answers play as one listen. You can speed them up (1.3× / 1.5× / 2× — stays
// on for everyone), filter by Close / Friends / Acquaintances, jump to a
// person from the bottom row, see how many days their clip has left, and send
// a sticker/emoji that shows up in Notifications.
//
// PRIVACY: you only hear clips shared with a circle you belong to (server
// filters that). Analytics never include audio or reaction content — only
// counts and method.
// ACCESSIBILITY: transport, speed, filter, and voices are labelled; the
// current speaker and question are announced as text.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon
} from 'lucide-react-native';
import type { RecapAudience, RecapPlaylist, Tier } from '@bridger/shared';
import {
  RECAP_PLAYER,
  dismissSurface,
  openSurface,
  trackClick,
  trackProduct
} from '@bridger/shared';
import {
  AnalyticsRegion,
  Avatar,
  Screen,
  ScreenBody,
  ScreenHeader,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { pushNotification } from '../../data/feed';
import { isDemoMode } from '../../lib/demo';
import { sendRecapReaction } from '../../data/pod';
import { personById } from '../../data/people';
import { EMOJI_STICKERS } from '../../data/stickers';

const SPEEDS = [1, 1.3, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

const FILTERS: Array<{ key: RecapAudience; label: string }> = [
  { key: 'close', label: 'Close' },
  { key: 'friend', label: 'Friends' },
  { key: 'acquaintance', label: 'Acquaintances' }
];

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;

/** Days left until a clip expires (ceil). */
function daysLeft(iso?: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function expiryLabel(days: number | null): string {
  if (days == null) return '';
  if (days <= 0) return 'Expires today';
  if (days === 1) return 'Expires in 1 day';
  return `Expires in ${days} days`;
}

export function RecapPlayer({
  playlist,
  onClose
}: {
  playlist: RecapPlaylist;
  onClose?: () => void;
}) {
  const c = useThemeColors();
  const [filter, setFilter] = useState<RecapAudience>('close');
  const [speed, setSpeed] = useState<Speed>(1);
  const [index, setIndex] = useState(0);
  const [barWidth, setBarWidth] = useState(1);
  const [reactOpen, setReactOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const playedOnce = useRef(false);

  // Only voices in the chosen friendship circle (starts on Close).
  const filteredClips = useMemo(() => {
    return playlist.clips.filter((clip) => {
      const tier = personById(clip.authorId).tier as Tier;
      return tier === filter;
    });
  }, [playlist.clips, filter]);

  const voices = useMemo(() => {
    const ids: string[] = [];
    for (const clip of filteredClips) {
      if (!ids.includes(clip.authorId)) ids.push(clip.authorId);
    }
    return ids.map((id) => personById(id));
  }, [filteredClips]);

  // Keep the playhead inside the filtered list when the filter changes.
  useEffect(() => {
    setIndex(0);
  }, [filter]);

  const clip = filteredClips[index];
  const player = useAudioPlayer(clip?.audioUrl ? { uri: clip.audioUrl } : null);
  const status = useAudioPlayerStatus(player);

  const speaker = clip ? personById(clip.authorId) : undefined;
  const question = clip ? playlist.week.questions[clip.questionIndex] : '';
  const duration = status.duration || clip?.duration || 1;
  const elapsed = status.currentTime || 0;

  const speakerExpiry = useMemo(() => {
    if (!clip) return null;
    const theirs = filteredClips.filter((x) => x.authorId === clip.authorId);
    const stamps = theirs.map((x) => x.expiresAt).filter(Boolean) as string[];
    if (!stamps.length) return null;
    const earliest = stamps.reduce((a, b) => (a < b ? a : b));
    return daysLeft(earliest);
  }, [clip, filteredClips]);

  useEffect(() => {
    openSurface('recap_player');
    return () => dismissSurface('recap_player');
  }, []);

  // Point the player at the current clip; keep the chosen speed on every person.
  useEffect(() => {
    if (!clip?.audioUrl) return;
    player.replace({ uri: clip.audioUrl });
    player.playbackRate = speed;
    if (playedOnce.current) player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, clip?.audioUrl]);

  useEffect(() => {
    player.playbackRate = speed;
  }, [speed, player]);

  // When a clip ends, roll into the next one in this filter.
  useEffect(() => {
    if (status.didJustFinish && index + 1 < filteredClips.length) {
      setIndex((i) => i + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const toggle = () => {
    if (status.playing) {
      trackClick(RECAP_PLAYER.transport.pause);
      player.pause();
    } else {
      trackClick(RECAP_PLAYER.transport.play);
      if (!playedOnce.current) {
        playedOnce.current = true;
        trackProduct('recap_played', {
          voices: playlist.voiceIds.length,
          questions: playlist.week.questions.length
        });
      }
      player.play();
    }
  };

  const stepBy = (delta: number) => {
    trackClick(delta < 0 ? RECAP_PLAYER.transport.back : RECAP_PLAYER.transport.skip);
    setIndex((i) => Math.min(filteredClips.length - 1, Math.max(0, i + delta)));
  };

  const jumpToPerson = (authorId: string) => {
    trackClick(RECAP_PLAYER.in_this_week.voice);
    const at = filteredClips.findIndex((x) => x.authorId === authorId);
    if (at < 0) return;
    setIndex(at);
    playedOnce.current = true;
    // Play kicks in via the replace effect once index updates.
  };

  const onScrub = (e: { nativeEvent: { locationX: number } }) => {
    const fraction = Math.min(1, Math.max(0, e.nativeEvent.locationX / barWidth));
    trackClick(RECAP_PLAYER.transport.scrub);
    player.seekTo(fraction * duration);
  };

  const sendReaction = (emoji: string) => {
    if (!speaker || !clip) return;
    trackClick(RECAP_PLAYER.react.emoji, { method: 'sticker' });
    trackProduct('recap_reaction_sent', { method: 'sticker' });
    const first = speaker.name.split(' ')[0] ?? speaker.name;

    if (isDemoMode()) {
      // Demo: inject a local preview row; live mode notifies via the API.
      pushNotification({
        id: `recap-react-${Date.now()}`,
        kind: 'recap_reaction',
        personId: speaker.id,
        text: `reacted ${emoji} to ${first}'s recap`,
        time: 'now',
        unread: true
      });
    } else {
      void sendRecapReaction(clip.id, emoji).catch(() => {
        setToast('Could not send. Try again.');
        setTimeout(() => setToast(null), 1800);
      });
    }

    setToast(`Sent ${emoji} to ${first}`);
    setReactOpen(false);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Weekly recap"
        onBack={onClose}
        hideProfile
        backAnalyticsId={RECAP_PLAYER.actions.dismiss}
        titleAnalyticsId={RECAP_PLAYER.speaker.body}
        trailing={
          <Text className="font-sans-sb text-[12px] text-ink-mute">
            {playlist.week.weekOf.replace(/^Week of\s*/i, '')}
          </Text>
        }
      />

      <ScreenBody tabBarInset={false}>
        <View className="gap-4 pb-8">
          {/* Friend-group filter — always opens on Close; stays visible when empty. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={withAnalyticsPress(RECAP_PLAYER.filter.chip, () => setFilter(f.key), {
                    analyticsProps: { method: f.key }
                  })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Show ${f.label}`}
                  className={cn(
                    'min-h-[36px] justify-center rounded-full border px-3.5 py-1.5',
                    on ? 'border-transparent bg-purple' : 'border-ink-line bg-surface'
                  )}
                >
                  <Text
                    className={cn(
                      'font-sans-b text-[13px]',
                      on ? 'text-white' : 'text-ink'
                    )}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filteredClips.length === 0 || !clip ? (
            <View className="items-center py-16">
              <Text className="font-sans-b text-[15px] text-ink">
                Nobody in {FILTERS.find((f) => f.key === filter)?.label} this week.
              </Text>
              <Text className="mt-2 text-center font-sans-sb text-[13px] text-ink-mute">
                Try another circle above.
              </Text>
            </View>
          ) : (
            <>
              {/* Speaker + question + expiry */}
              <View className="items-center">
                <View
                  className={cn(
                    'rounded-full p-1.5',
                    status.playing ? 'bg-purple/20' : 'bg-ink/10'
                  )}
                >
                  {speaker ? (
                    <Avatar
                      name={speaker.name}
                      emoji={speaker.emoji}
                      accent={speaker.accent}
                      personId={speaker.id}
                      size="xl"
                    />
                  ) : null}
                </View>
                <Text className="mt-3 font-sans-b text-[18px] text-ink">
                  {speaker?.name.split(' ')[0] ?? ''}
                </Text>
                {/*
                  Always-dark type on the lavender pill — theme ink flips light
                  in dark mode and vanishes on this wash.
                */}
                <Text
                  accessibilityLiveRegion="polite"
                  className="mt-1.5 rounded-full bg-[#EDE6FF] px-3 py-1 font-sans-b text-[13px] text-onaccent"
                >
                  Q{clip.questionIndex + 1} · {question}
                </Text>
                {speakerExpiry != null ? (
                  <AnalyticsRegion
                    analyticsId={RECAP_PLAYER.expiry.label}
                    interactive={false}
                  >
                    <Text className="mt-2 font-sans-sb text-[12px] text-ink-mute">
                      {expiryLabel(speakerExpiry)}
                    </Text>
                  </AnalyticsRegion>
                ) : null}
              </View>

              {/* Scrubber */}
              <View className="flex-row items-center gap-3">
                <Text className="w-9 shrink-0 font-sans-b text-[11px] text-ink-mute">
                  {fmt(elapsed)}
                </Text>
                <Pressable
                  accessibilityRole="adjustable"
                  accessibilityLabel="Scrub"
                  onLayout={(e: LayoutChangeEvent) =>
                    setBarWidth(Math.max(1, e.nativeEvent.layout.width))
                  }
                  onPress={onScrub}
                  className="h-6 flex-1 justify-center"
                >
                  <View className="h-1.5 w-full rounded-full bg-ink/15">
                    <View
                      className="h-1.5 rounded-full bg-purple"
                      style={{ width: `${Math.min(100, (elapsed / duration) * 100)}%` }}
                    />
                  </View>
                </Pressable>
                <Text className="w-9 shrink-0 text-right font-sans-b text-[11px] text-ink-mute">
                  -{fmt(Math.max(0, duration - elapsed))}
                </Text>
              </View>

              {/* Transport — icons use theme ink so skip buttons stay visible. */}
              <View className="flex-row items-center justify-center gap-8">
                <Pressable
                  onPress={() => stepBy(-1)}
                  accessibilityRole="button"
                  accessibilityLabel="Previous answer"
                  className="h-11 w-11 items-center justify-center"
                >
                  <SkipBackIcon size={24} color={c.ink} strokeWidth={2.2} />
                </Pressable>
                <Pressable
                  onPress={toggle}
                  accessibilityRole="button"
                  accessibilityLabel={status.playing ? 'Pause' : 'Play'}
                  className="h-16 w-16 items-center justify-center rounded-full bg-[#1C1B16]"
                >
                  {status.playing ? (
                    <PauseIcon size={28} color="#FFFFFF" strokeWidth={2.4} />
                  ) : (
                    <PlayIcon
                      size={28}
                      color="#FFFFFF"
                      strokeWidth={2.4}
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => stepBy(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Next answer"
                  className="h-11 w-11 items-center justify-center"
                >
                  <SkipForwardIcon size={24} color={c.ink} strokeWidth={2.2} />
                </Pressable>
              </View>

              {/* Speed — one setting for every person in this listen. */}
              <View className="flex-row items-center justify-center gap-2">
                {SPEEDS.map((s) => {
                  const on = speed === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={withAnalyticsPress(RECAP_PLAYER.transport.speed, () => setSpeed(s), {
                        analyticsProps: { method: String(s) }
                      })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${s} times speed`}
                      className={cn(
                        'min-h-[36px] min-w-[52px] items-center justify-center rounded-full border px-3',
                        on
                          ? 'border-transparent bg-purple'
                          : 'border-ink-line bg-surface'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-sans-b text-[12px]',
                          on ? 'text-white' : 'text-ink'
                        )}
                      >
                        {s === 1 ? '1×' : `${s}×`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Question progress */}
              <View className="flex-row items-center justify-center gap-1.5">
                {playlist.week.questions.map((_, qi) => (
                  <View
                    key={qi}
                    className={cn(
                      'h-2 rounded-full',
                      qi === clip.questionIndex
                        ? 'w-5 bg-purple'
                        : qi < clip.questionIndex
                          ? 'w-2 bg-purple/40'
                          : 'w-2 bg-ink/15'
                    )}
                  />
                ))}
              </View>

              {/* Voices — scroll + tap to listen / relisten to that person. */}
              <View className="border-t border-ink-line pt-4">
                <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                  In this week · {voices.length}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: 4 }}
                >
                  {voices.map((p) => {
                    const on = p.id === clip.authorId;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => jumpToPerson(p.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Play ${p.name}'s recap`}
                        accessibilityState={{ selected: on }}
                        className="w-14 items-center gap-1"
                      >
                        <View
                          className={cn(
                            'rounded-full p-0.5',
                            on ? 'bg-purple' : 'bg-transparent'
                          )}
                        >
                          <Avatar
                            name={p.name}
                            emoji={p.emoji}
                            accent={p.accent}
                            personId={p.id}
                            size="md"
                          />
                        </View>
                        <Text
                          numberOfLines={1}
                          className={cn(
                            'w-full text-center font-sans-b text-[11px]',
                            on ? 'text-ink' : 'text-ink-mute'
                          )}
                        >
                          {p.name.split(' ')[0]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* React with a sticker / emoji → Notifications. */}
              <View className="border-t border-ink-line pt-4">
                <Pressable
                  onPress={withAnalyticsPress(RECAP_PLAYER.react.open, () =>
                    setReactOpen((v) => !v)
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: reactOpen }}
                  accessibilityLabel="React with a sticker"
                  className="min-h-[44px] items-center justify-center rounded-full border border-ink-line bg-surface px-4"
                >
                  <Text className="font-sans-b text-[14px] text-ink">
                    {reactOpen ? 'Hide stickers' : 'Send a sticker'}
                  </Text>
                </Pressable>
                {reactOpen ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, paddingTop: 12 }}
                  >
                    {EMOJI_STICKERS.slice(0, 16).map((e) => (
                      <Pressable
                        key={e}
                        onPress={() => sendReaction(e)}
                        accessibilityRole="button"
                        accessibilityLabel={`Send ${e}`}
                        className="h-11 w-11 items-center justify-center rounded-full bg-surface active:bg-[#F1ECFF]"
                      >
                        <Text className="text-[22px]">{e}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
                {toast ? (
                  <Text className="mt-2 text-center font-sans-sb text-[12px] text-purple">
                    {toast}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </View>
      </ScreenBody>
    </Screen>
  );
}
