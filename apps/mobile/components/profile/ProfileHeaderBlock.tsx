// ============================================
// WHAT THIS FILE DOES (plain English):
// The Spotify-artist header: full-bleed photo with the back button, pixel
// name, and pin+city sitting ON TOP of the picture (name/city at the bottom
// like "Verified Artist"). Below the photo: story tile · compact View as /
// tier pill · search. Own profiles also get Edit; friends can pass a Message
// control for the top-right of the photo.
// ============================================
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  MapPinIcon,
  PencilIcon,
  PlayIcon,
  SearchIcon
} from 'lucide-react-native';
import type { Person, Tier } from '@bridger/shared';
import { PROFILE, TIER_LABEL, trackClick, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  GradientRing,
  Glow,
  RADIUS,
  cn,
  ringToneForTier,
  useThemeColors,
  withAnalyticsPress,
  type RingTone
} from '@bridger/ui';
import { getProfilePhoto, getStoryMedia } from '../../data/fixtures/demo-media';
import type { MyProfileHeader } from '../../data/profile';
import {
  PROFILE_ACTION_ROW_GAP,
  PROFILE_CITY_SIZE,
  PROFILE_GUTTER,
  PROFILE_HERO_ASPECT,
  PROFILE_META_GAP,
  PROFILE_NAME_SIZE,
  PROFILE_STORY_TILE_H,
  PROFILE_STORY_TILE_W
} from './profileSpacing';

const VIEW_AS: Array<{ label: string; tier: Tier }> = [
  { label: 'Close', tier: 'close' },
  { label: 'Friends', tier: 'friend' },
  { label: 'Everyone', tier: 'acquaintance' }
];

const TIER_OPTIONS: Tier[] = ['close', 'friend', 'acquaintance'];

/** White type on the photo so it reads on light and dark photos. */
const ON_PHOTO = '#FFFFFF';
const ON_PHOTO_MUTE = 'rgba(255, 255, 255, 0.85)';

export function ProfileHeaderBlock({
  person,
  header,
  own,
  editing,
  empty,
  asTier,
  hasRecap = false,
  onBack,
  onToggleEdit,
  onViewAs,
  onRetier,
  onPlayRecap,
  onOpenStory,
  onSearch,
  /** Optional top-right control on the photo (e.g. Message on a friend). */
  heroTrailing
}: {
  person: Person;
  header: MyProfileHeader | null;
  own: boolean;
  editing: boolean;
  empty: boolean;
  asTier?: Tier;
  hasRecap?: boolean;
  onBack?: () => void;
  onToggleEdit?: () => void;
  onViewAs?: (tier: Tier) => void;
  /** Friend: confirmed tier change (fires friend_retiered). */
  onRetier?: (tier: Tier) => void;
  onPlayRecap?: () => void;
  onOpenStory?: () => void;
  onSearch?: () => void;
  heroTrailing?: React.ReactNode;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Tall enough that name/city sit in the lower band like Spotify.
  const heroH = Math.max(Math.round(width * PROFILE_HERO_ASPECT), 320);
  const city = empty ? 'Add your city' : header?.city ?? '';
  // Prefer the live signed URL from the header, then the person's cached URL,
  // then the demo fixture photo. Emoji fills in when nothing else is there.
  const liveUri = header?.avatarUrl?.trim() || person.avatarUrl?.trim();
  const photo = liveUri ? { uri: liveUri } : getProfilePhoto(person.id);
  const hasStory = !!person.story;
  const storySeen = person.story === 'seen';
  const storyCover = getStoryMedia(person.id)[0];
  const tier = person.tier ?? 'friend';
  const ringTone: RingTone = own ? 'me' : ringToneForTier(tier);

  const [viewAsOpen, setViewAsOpen] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);

  // THIS SECTION DOES: the compact story cover (photo/emoji, not another face).
  const storyInner = (
    <Pressable
      onPress={
        hasStory
          ? withAnalyticsPress(PROFILE.header.story_tile, () => onOpenStory?.())
          : undefined
      }
      disabled={!hasStory}
      accessibilityRole={hasStory ? 'button' : 'image'}
      accessibilityLabel={
        hasStory
          ? storySeen
            ? 'Open current story, watched'
            : 'Open current story, new'
          : 'No current story'
      }
      className={cn(
        'h-full w-full overflow-hidden bg-purple/20 active:opacity-90',
        storySeen && 'rounded-card'
      )}
    >
      {storyCover?.type === 'photo' ? (
        <Image
          source={storyCover.source}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Text className="text-[28px]">{person.emoji ?? '🙂'}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    // Pull up 8px when ScreenBody has no ScreenHeader (it adds paddingTop: 8).
    <AnalyticsRegion
      analyticsId={PROFILE.header.header_bg}
      interactive={false}
      style={{ marginTop: -8 }}
    >
      {/* THIS SECTION DOES: full-bleed photo with back / name / city on top. */}
      <View style={{ width, height: heroH }} className="overflow-hidden bg-ink">
        <Pressable
          disabled={!hasStory}
          onPress={
            hasStory
              ? withAnalyticsPress(PROFILE.header.story_tile, () => {
                  trackClick(PROFILE.header.avatar, { method: 'story' });
                  onOpenStory?.();
                })
              : undefined
          }
          accessibilityRole={hasStory ? 'button' : 'image'}
          accessibilityLabel={
            hasStory ? `${person.name}'s photo, open story` : `${person.name}'s photo`
          }
          style={{ position: 'absolute', top: 0, left: 0, width, height: heroH }}
        >
          {photo ? (
            <Image source={photo} style={{ width, height: heroH }} resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-purple/40">
              <Text className="text-[80px]">{person.emoji ?? '🙂'}</Text>
            </View>
          )}
        </Pressable>

        {/* Dark fade so white name/city stay readable on any photo. */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']}
          locations={[0.35, 0.62, 1]}
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: heroH * 0.55 }}
        />

        {/* THIS SECTION DOES: back (and Edit / Message) over the top of the photo. */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: PROFILE_GUTTER,
            right: PROFILE_GUTTER,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {onBack ? (
            <Pressable
              onPress={withAnalyticsPress(PROFILE.top_nav.back, onBack)}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={4}
              className="h-11 w-11 items-center justify-center rounded-full bg-black/45 active:opacity-80"
            >
              <ChevronLeftIcon size={22} color={ON_PHOTO} strokeWidth={3} />
            </Pressable>
          ) : (
            <View />
          )}
          <View className="flex-row items-center gap-2">
            {own ? (
              <Pressable
                onPress={withAnalyticsPress(PROFILE.header.edit, () => onToggleEdit?.())}
                accessibilityRole="button"
                accessibilityLabel={editing ? 'Done rearranging' : 'Edit profile layout'}
                className={cn(
                  'h-10 flex-row items-center gap-1.5 rounded-full px-3.5',
                  editing ? 'bg-white' : 'bg-black/45'
                )}
              >
                <PencilIcon
                  size={14}
                  color={editing ? '#1C1B16' : ON_PHOTO}
                  strokeWidth={2.6}
                />
                <Text
                  className="font-sans-b text-[13px]"
                  style={{ color: editing ? '#1C1B16' : ON_PHOTO }}
                >
                  {editing ? 'Done' : 'Edit'}
                </Text>
              </Pressable>
            ) : null}
            {heroTrailing}
          </View>
        </View>

        {/* THIS SECTION DOES: name + pin/city at the bottom of the photo (Spotify verified slot). */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: PROFILE_GUTTER,
            right: PROFILE_GUTTER,
            bottom: 16
          }}
        >
          <AnalyticsRegion analyticsId={PROFILE.header.name} interactive={false}>
            <Text
              numberOfLines={2}
              className="font-pixel tracking-tight"
              style={{
                fontSize: PROFILE_NAME_SIZE + 4,
                lineHeight: PROFILE_NAME_SIZE + 10,
                color: ON_PHOTO
              }}
            >
              {person.name}
            </Text>
          </AnalyticsRegion>
          <AnalyticsRegion
            analyticsId={PROFILE.header.city}
            interactive={false}
            style={{ marginTop: PROFILE_META_GAP + 2 }}
          >
            <View className="flex-row items-center gap-1">
              <MapPinIcon size={14} color={ON_PHOTO_MUTE} strokeWidth={2.4} />
              <Text
                numberOfLines={1}
                className="min-w-0 flex-1 font-sans-sb"
                style={{ fontSize: PROFILE_CITY_SIZE, color: ON_PHOTO_MUTE }}
              >
                {city}
              </Text>
            </View>
          </AnalyticsRegion>
        </View>
      </View>

      {/* THIS SECTION DOES: story · compact pill · search (and optional ▶ recap). */}
      <View style={{ paddingHorizontal: PROFILE_GUTTER, marginTop: 14 }}>
        <View className="flex-row items-center" style={{ gap: PROFILE_ACTION_ROW_GAP }}>
          <View
            style={{ width: PROFILE_STORY_TILE_W, height: PROFILE_STORY_TILE_H }}
            className="shrink-0"
          >
            {hasStory && !storySeen ? (
              <GradientRing
                tone={ringTone}
                radius={RADIUS.card}
                width={2.5}
                fill
                spin
                style={{ flex: 1 }}
              >
                {storyInner}
              </GradientRing>
            ) : (
              <View className="h-full w-full overflow-hidden rounded-card border border-ink-line">
                {storyInner}
              </View>
            )}
          </View>

          {own ? (
            <Pressable
              onPress={withAnalyticsPress(PROFILE.header.view_as, () => setViewAsOpen(true))}
              accessibilityRole="button"
              accessibilityLabel={`View as ${VIEW_AS.find((v) => v.tier === asTier)?.label ?? 'Close'}`}
              className="h-9 shrink-0 flex-row items-center gap-0.5 rounded-full border border-ink-line bg-surface px-2.5"
            >
              <Text numberOfLines={1} className="font-sans-b text-[12px] text-ink">
                {VIEW_AS.find((v) => v.tier === asTier)?.label ?? 'Close'}
              </Text>
              <ChevronDownIcon size={12} color={c.ink} strokeWidth={2.6} />
            </Pressable>
          ) : (
            <Pressable
              onPress={withAnalyticsPress(PROFILE.header.tier_control, () => setTierOpen(true))}
              accessibilityRole="button"
              accessibilityLabel={`Friend level: ${TIER_LABEL[tier]}. Change.`}
              className="h-9 shrink-0 flex-row items-center gap-0.5 rounded-full border border-ink-line bg-surface px-2.5"
            >
              <Text numberOfLines={1} className="font-sans-b text-[12px] text-ink">
                {TIER_LABEL[tier]}
              </Text>
              <ChevronDownIcon size={12} color={c.ink} strokeWidth={2.6} />
            </Pressable>
          )}

          <Pressable
            onPress={withAnalyticsPress(PROFILE.header.search, () => onSearch?.())}
            accessibilityRole="button"
            accessibilityLabel="Search this profile"
            className="min-h-[36px] min-w-0 flex-1 flex-row items-center gap-2 rounded-full border border-ink-line bg-surface px-3"
          >
            <SearchIcon size={16} color={c.inkMute} strokeWidth={2.4} />
            <Text numberOfLines={1} className="font-sans-sb text-[13px] text-ink-mute">
              Search
            </Text>
          </Pressable>

          {hasRecap ? (
            <Glow>
              <Pressable
                onPress={withAnalyticsPress(PROFILE.header.play_recap, () => {
                  onPlayRecap?.();
                  trackProduct('recap_played', {});
                })}
                accessibilityRole="button"
                accessibilityLabel={`Play ${person.name}'s recap`}
                className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green"
              >
                <PlayIcon size={20} color="#1C1B16" fill="#1C1B16" strokeWidth={0} />
              </Pressable>
            </Glow>
          ) : null}
        </View>
      </View>

      {/* View-as picker (own). */}
      <Modal visible={viewAsOpen} transparent animationType="fade" onRequestClose={() => setViewAsOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setViewAsOpen(false)}>
          <View className="rounded-t-3xl bg-surface px-4 pb-8 pt-4">
            <Text className="mb-3 font-pixel text-[16px] text-ink">View as</Text>
            {VIEW_AS.map((v) => (
              <Pressable
                key={v.tier}
                onPress={() => {
                  onViewAs?.(v.tier);
                  setViewAsOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: asTier === v.tier }}
                className="min-h-[48px] justify-center border-b border-ink-line"
              >
                <Text className="font-sans-b text-[16px] text-ink">{v.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Tier picker (friend). Product event only after confirm. */}
      <Modal visible={tierOpen} transparent animationType="fade" onRequestClose={() => setTierOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setTierOpen(false)}>
          <View className="rounded-t-3xl bg-surface px-4 pb-8 pt-4">
            <Text className="mb-3 font-pixel text-[16px] text-ink">Friend level</Text>
            {TIER_OPTIONS.map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  const from = person.tier ?? 'friend';
                  if (t !== from) {
                    onRetier?.(t);
                    trackProduct('friend_retiered', { from_tier: from, to_tier: t });
                  }
                  setTierOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: tier === t }}
                className="min-h-[48px] justify-center border-b border-ink-line"
              >
                <Text className="font-sans-b text-[16px] text-ink">{TIER_LABEL[t]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </AnalyticsRegion>
  );
}
