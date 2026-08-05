// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared profile card — the Hinge-style scroll a friend sees when they
// open your page. Header (photo, name, city, song, bio), the dark "Currently"
// weekly check-in, About me, Hobbies, List of favs, Places traveled, This or
// that, and (in edit mode) the "Add to your profile" module list that opens
// the one-question-at-a-time flow. `asTier` filters exactly the way a friend
// in that circle would see it.
// Analytics: own card uses PROFILE.header.* / PROFILE.card.*; friend view uses
// PROFILE.about_them.* for dead-clicks. Module open/done emit product events.
// ============================================
import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  BookOpenIcon,
  CameraIcon,
  EyeIcon,
  MapPinIcon,
  MusicIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon
} from 'lucide-react-native';
import type { Person, Tier } from '@bridger/shared';
import { PROFILE, TIER_LABEL, trackClick, trackProduct } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  Avatar,
  ButtonSecondary,
  CollapsibleSection,
  EmptyState,
  ModuleFlow,
  ShowAllList,
  cn,
  useThemeColors,
  withAnalyticsPress,
  type Accent,
  type ModuleAnswer,
  type ModuleVisibility,
  type WashStoryRing
} from '@bridger/ui';
import { getProfilePhoto } from '../../data/fixtures/demo-media';
import { PROFILE_MODULES, type ProfileModuleId } from '../../data/profile-modules';
import type {
  AboutField,
  Currently,
  FavGroup,
  Interest,
  MyProfileHeader,
  ThisOrThatRow,
  TravelPlace
} from '../../data/profile';
import {
  saveAboutFields,
  saveCustomNotes,
  saveFavs,
  saveHobbies,
  savePlaces,
  saveThisOrThat,
  TIER_RANK
} from '../../data/profile';
import { searchPlaces } from '../../lib/geocode';
import { HobbiesWidget } from './HobbiesWidget';
import { TravelModule } from './TravelModule';

const TOT_ACCENTS: Accent[] = ['purple', 'coral', 'teal', 'amber', 'pink', 'blue'];

export function ProfileCard({
  person,
  header,
  currently,
  about,
  hobbies,
  favs,
  thisOrThat,
  places,
  editable = false,
  own = false,
  showHeader = true,
  asTier = 'close',
  empty = false,
  hobbyFollowUps,
  onToggleEdit,
  onCheckIn,
  onEditHeader,
  onAnswered,
  onOpenStory
}: {
  person: Person;
  header: MyProfileHeader | null;
  currently: Currently | null;
  about: AboutField[];
  hobbies: Interest[];
  favs: FavGroup[];
  thisOrThat: ThisOrThatRow[];
  places: TravelPlace[];
  editable?: boolean;
  /** your own profile: Currently is always updatable, edit mode or not */
  own?: boolean;
  /** set false when the screen already shows the identity block above the tabs */
  showHeader?: boolean;
  asTier?: Tier;
  empty?: boolean;
  /** friend profiles pass their own follow-ups so the widget can peek */
  hobbyFollowUps?: Record<string, { question: string; answer: string }>;
  /** own profile only — small Edit / Done beside the name */
  onToggleEdit?: () => void;
  onCheckIn?: (on: boolean) => void;
  onEditHeader?: (patch: Partial<MyProfileHeader>) => void;
  /** called after a module saves so the parent can refetch the card */
  onAnswered?: () => void;
  /** Tap the photo story ring → open their (or your) live update */
  onOpenStory?: () => void;
}) {
  // PRIVACY: only fields shared at or below the viewing tier are shown
  const visible = empty ? [] : about.filter((f) => TIER_RANK[f.tier] <= TIER_RANK[asTier]);
  const showHobbies = empty ? [] : hobbies;
  const picks = empty ? [] : thisOrThat;
  const favGroups = empty ? [] : favs;

  /** every module opens the same one-question-per-screen flow */
  const [module, setModule] = useState<ProfileModuleId | null>(null);
  const activeModule = PROFILE_MODULES.find((m) => m.id === module);
  /** when the current module was opened — for time_to_complete_ms */
  const moduleStartedAt = useRef<number | null>(null);

  // Own card vs friend view pick different dead-click / widget ids.
  const aboutMeId = own ? PROFILE.card.about_me : PROFILE.about_them.about_me;
  const hobbiesId = own ? PROFILE.card.hobbies_widget : PROFILE.about_them.hobbies_widget;
  const placesId = own ? PROFILE.card.places_map : PROFILE.about_them.places_map;
  const totId = own ? PROFILE.card.this_or_that_row : PROFILE.about_them.this_or_that_row;

  const openModule = (id: ProfileModuleId) => {
    setModule(id);
    moduleStartedAt.current = Date.now();
    // Product event: they started a profile module (module id only, no answers).
    trackProduct('module_started', { module: id });
  };

  /** Persist answers, fire analytics, then ask the parent to refresh the card. */
  const finishModule = async (
    answers: Record<string, ModuleAnswer>,
    visibility?: ModuleVisibility
  ) => {
    const id = module;
    const started = moduleStartedAt.current;
    const vis = visibility ?? {};

    if (id) {
      switch (id) {
        case 'hobbies':
          await saveHobbies(answers, vis);
          break;
        case 'about':
          await saveAboutFields(answers, vis);
          break;
        case 'favs':
          await saveFavs(answers, vis);
          break;
        case 'places':
          await savePlaces(answers, vis);
          break;
        case 'tot':
          await saveThisOrThat(answers, vis);
          break;
        case 'notes':
          await saveCustomNotes(answers, vis);
          break;
      }
      if (started != null) {
        trackProduct('module_completed', {
          module: id,
          items_added: Object.keys(answers).length,
          time_to_complete_ms: Date.now() - started
        });
      }
    }
    moduleStartedAt.current = null;
    setModule(null);
    onAnswered?.();
  };

  return (
    <View className="gap-4">
      {showHeader ? (
        <ProfileHeader
          person={person}
          header={header}
          own={own}
          editing={editable}
          empty={empty}
          onToggleEdit={onToggleEdit}
          onEditHeader={onEditHeader}
          onOpenStory={onOpenStory}
        />
      ) : null}

      <CurrentlyCard
        currently={currently}
        own={own}
        empty={empty}
        headerHasSongBook={!!(header?.song?.title && header?.book?.title)}
        onCheckIn={onCheckIn}
      />

      <CollapsibleSection title="About me" count={visible.length}>
        {/* Body only — title stays expandable; taps on rows log dead_click */}
        <AnalyticsRegion analyticsId={aboutMeId} interactive={false}>
          {visible.length > 0 ? (
            <View>
              {visible.map((f, i) => (
                <View
                  key={f.id}
                  className={cn(
                    'flex-row items-center gap-3 py-2.5',
                    i > 0 && 'border-t border-ink-line'
                  )}
                >
                  <Text className="w-[104px] shrink-0 font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                    {f.key}
                  </Text>
                  <Text numberOfLines={1} className="min-w-0 flex-1 font-sans-sb text-[14px] text-ink">
                    {f.value}
                  </Text>
                  {editable ? (
                    <VisibilityPill tier={f.tier} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <ModuleEmpty
              emoji="🪪"
              line={editable ? 'Add the basics. Hometown, work, birthday.' : 'Nothing shared at this level.'}
              cta={editable ? 'Add details' : undefined}
              analyticsId={PROFILE.card.add_details}
              onPress={editable ? () => openModule('about') : undefined}
            />
          )}
        </AnalyticsRegion>
      </CollapsibleSection>

      <CollapsibleSection title="Hobbies" count={showHobbies.length}>
        {showHobbies.length > 0 ? (
          <HobbiesWidget
            hobbies={showHobbies}
            analyticsId={hobbiesId}
            followUps={hobbyFollowUps}
          />
        ) : (
          <ModuleEmpty
            emoji="🎛"
            line={editable ? 'Pick a few things you like.' : 'No hobbies yet.'}
            cta={editable ? 'Add hobbies' : undefined}
            analyticsId={PROFILE.card.add_hobbies}
            onPress={editable ? () => openModule('hobbies') : undefined}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="List of favs"
        count={favGroups.reduce((n, f) => n + f.total, 0)}
        defaultOpen={empty}
      >
        <AnalyticsRegion analyticsId={PROFILE.card.favs} interactive={false}>
          {favGroups.length > 0 ? (
            <View className="gap-4">
              {favGroups.map((group) => (
                <View key={group.group}>
                  <Text className="mb-2 font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                    {group.emoji} {group.group} · {group.total}
                  </Text>
                  <ShowAllList items={group.items} total={group.total} />
                </View>
              ))}
            </View>
          ) : (
            <ModuleEmpty
              emoji="⭐️"
              line={editable ? 'Start a list. Food, films, everyday.' : 'No favs yet.'}
              cta={editable ? 'Add favs' : undefined}
              analyticsId={PROFILE.card.add_favs}
              onPress={editable ? () => openModule('favs') : undefined}
            />
          )}
        </AnalyticsRegion>
      </CollapsibleSection>

      {/* polls live on Home now — one place to ask, one place to read results */}

      <CollapsibleSection title="Places traveled" count={empty ? 0 : places.length}>
        <AnalyticsRegion analyticsId={placesId} interactive={false}>
          {empty || places.length === 0 ? (
            <ModuleEmpty
              emoji="🗺"
              line={editable ? 'Pin the places you have been.' : 'No places yet.'}
              cta={editable ? 'Add places' : undefined}
              analyticsId={PROFILE.card.add_places}
              onPress={editable ? () => openModule('places') : undefined}
            />
          ) : (
            <TravelModule places={places} analyticsId={placesId} />
          )}
        </AnalyticsRegion>
      </CollapsibleSection>

      <CollapsibleSection title="This or that" count={picks.length}>
        {picks.length > 0 ? (
          /* Friend view: dead_click on the row body. Own edit: taps open the module. */
          <AnalyticsRegion
            analyticsId={totId}
            interactive={false}
            className="overflow-hidden rounded-card border border-ink-line bg-surface"
          >
            {picks.map((t, i) => {
              const token = ACCENTS[TOT_ACCENTS[i % TOT_ACCENTS.length]];
              const both = t.pick === 'both';
              return (
                <View key={t.id} className={cn(i > 0 && 'border-t border-ink-line')}>
                  <View className="flex-row">
                    {(['a', 'b'] as const).map((side) => {
                      const label = side === 'a' ? t.a : t.b;
                      const chosen = both || t.pick === side;
                      return (
                        <Pressable
                          key={side}
                          onPress={
                            editable
                              ? withAnalyticsPress(totId, () => openModule('tot'))
                              : undefined
                          }
                          disabled={!editable}
                          accessibilityRole={editable ? 'button' : 'text'}
                          accessibilityState={{ selected: chosen }}
                          accessibilityLabel={`${label}${chosen ? ', picked' : ''}`}
                          className={cn(
                            'min-h-[44px] flex-1 flex-row items-center gap-2 px-3.5 py-3',
                            side === 'a' && 'border-r border-ink-line',
                            chosen ? token.bg : 'bg-surface'
                          )}
                        >
                          {side === 'a' ? (
                            <Text accessible={false} className="shrink-0 text-[15px]">
                              {t.emoji}
                            </Text>
                          ) : null}
                          <Text
                            numberOfLines={1}
                            className={cn(
                              'min-w-0 flex-1 text-[14px]',
                              chosen ? cn('font-sans-b', token.text) : 'font-sans-sb text-ink-mute'
                            )}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {both ? (
                    <Text className="bg-surface px-3.5 py-1 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                      Honestly, both
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </AnalyticsRegion>
        ) : (
          <ModuleEmpty
            emoji="⚖️"
            line={editable ? 'Quick picks, one tap each.' : 'Not taken yet.'}
            cta={editable ? 'Take it' : undefined}
            analyticsId={PROFILE.card.take_this_or_that}
            onPress={editable ? () => openModule('tot') : undefined}
          />
        )}
      </CollapsibleSection>

      {editable ? (
        <View className="rounded-card border border-ink-line bg-surface p-4">
          <Text className="font-pixel text-[15px] text-ink">Add to your profile</Text>
          <View className="mt-3 gap-2">
            {PROFILE_MODULES.map((m) => (
              <Pressable
                key={m.id}
                onPress={withAnalyticsPress(PROFILE.card.add_module, () => openModule(m.id))}
                accessibilityRole="button"
                accessibilityLabel={`${m.label}. ${m.line}`}
                className="min-h-[44px] w-full flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3 active:border-purple/40 active:bg-[#F1ECFF]"
              >
                <Text accessible={false} className="text-[20px]">
                  {m.emoji}
                </Text>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="font-sans-b text-[14px] text-ink">
                    {m.label}
                  </Text>
                  <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
                    {m.line}
                  </Text>
                </View>
                <PlusIcon size={16} color="#6B2FEA" strokeWidth={3} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <ModuleFlow
        open={Boolean(activeModule)}
        title={activeModule?.label ?? ''}
        questions={activeModule?.questions ?? []}
        mode="share"
        audienceSetAllAnalyticsId={PROFILE.module.audience_set_all}
        audienceRowAnalyticsId={PROFILE.module.audience_row}
        searchPlaces={searchPlaces}
        placeSearchAnalyticsId={PROFILE.module.place_search}
        placeResultAnalyticsId={PROFILE.module.place_result}
        onClose={() => {
          moduleStartedAt.current = null;
          setModule(null);
        }}
        onDone={(answers, visibility) => {
          void finishModule(answers, visibility);
        }}
      />
    </View>
  );
}

/** Small pill showing which circle can see a field (edit mode only). */
function VisibilityPill({ tier }: { tier: Tier }) {
  const c = useThemeColors();
  return (
    <View className="shrink-0 flex-row items-center gap-1 rounded-full border border-ink-line px-2 py-0.5">
      <EyeIcon size={12} color={c.inkSoft} strokeWidth={2.6} />
      <Text className="font-sans-b text-[10px] text-ink-soft">{TIER_LABEL[tier]}</Text>
    </View>
  );
}

/**
 * Photo, name, city, bio and profile song. On your own profile these become
 * editable in place once you tap the small Edit next to your name — otherwise
 * you see your profile exactly the way your friends do.
 *
 * Friend profiles: name and "N mutuals" share one line; city / song / book sit
 * under it as one quiet details group (pin on city). Tap mutuals → In common.
 * If they have a live update, their photo gets a story ring — tap opens it.
 */
export function ProfileHeader({
  person,
  header,
  own,
  editing,
  empty,
  onToggleEdit,
  onEditHeader,
  onOpenMutuals,
  onOpenStory
}: {
  person: Person;
  header: MyProfileHeader | null;
  own: boolean;
  /** Edit is on, so the photo, city, song and bio can be changed */
  editing: boolean;
  empty: boolean;
  onToggleEdit?: () => void;
  onEditHeader?: (patch: Partial<MyProfileHeader>) => void;
  /** Friend profiles: tap "N mutuals" to open the In common tab */
  onOpenMutuals?: () => void;
  /** Friend profiles: tap the photo ring to watch their live update */
  onOpenStory?: () => void;
}) {
  const c = useThemeColors();
  const canEdit = own && editing;
  const city = empty ? 'Add your city' : header?.city ?? '';
  const bio = empty ? '' : header?.bio ?? '';
  const [editingCity, setEditingCity] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [cityDraft, setCityDraft] = useState(city);
  const [bioDraft, setBioDraft] = useState(bio);
  const showMutuals = !own && person.mutuals > 0;
  const mutualsLabel = `${person.mutuals} mutual${person.mutuals === 1 ? '' : 's'}`;
  // Live update: same ring language as Friends roster (you or a friend).
  const hasStory = !!person.story;
  const tier = person.tier ?? 'friend';
  const ringWash: WashStoryRing = own
    ? 'friend'
    : tier === 'close'
      ? 'close'
      : tier === 'acquaintance'
        ? 'acquaintance'
        : 'friend';

  return (
    <AnalyticsRegion
      analyticsId={PROFILE.header.header_bg}
      interactive={false}
      className="gap-3"
    >
      <View className="flex-row items-center gap-4">
        {/*
          Story ring on the photo when they have an update — tap opens the
          viewer. No story: photo is not a button (edit camera still works).
        */}
        <View className="relative shrink-0">
          <Avatar
            name={person.name}
            emoji={person.emoji}
            accent={person.accent}
            photo={getProfilePhoto(person.id)}
            size="xl"
            story={hasStory ? person.story : undefined}
            ringWash={ringWash}
            onStory={
              hasStory
                ? () => {
                    trackClick(PROFILE.header.avatar, { method: 'story' });
                    onOpenStory?.();
                  }
                : undefined
            }
          />
          {!hasStory ? (
            <AnalyticsRegion
              analyticsId={PROFILE.header.avatar}
              interactive={false}
              accessibilityLabel={`${person.name}'s photo`}
              className="absolute inset-0"
            />
          ) : null}
          {canEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-ink"
            >
              <CameraIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>

        <View className="min-w-0 flex-1">
          {/* Name · mutuals on one line (friend), or name + Edit (own). */}
          <View className="flex-row items-center gap-2">
            <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-1.5">
              <AnalyticsRegion
                analyticsId={PROFILE.header.name}
                interactive={false}
                className="shrink"
              >
                <Text
                  numberOfLines={1}
                  className="font-sans-b text-[20px] tracking-tight text-ink"
                >
                  {person.name}
                </Text>
              </AnalyticsRegion>
              {showMutuals ? (
                <>
                  <Text accessible={false} className="font-sans-sb text-[13px] text-ink-mute">
                    ·
                  </Text>
                  <Pressable
                    onPress={withAnalyticsPress(PROFILE.header.mutuals, onOpenMutuals)}
                    accessibilityRole="button"
                    accessibilityLabel={`${mutualsLabel}. See who you both know.`}
                    hitSlop={8}
                    className="active:opacity-70"
                  >
                    <Text className="font-sans-sb text-[13px] text-ink-mute">{mutualsLabel}</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
            {own && onToggleEdit ? (
              <Pressable
                onPress={withAnalyticsPress(PROFILE.top_nav.edit, onToggleEdit)}
                accessibilityRole="button"
                accessibilityLabel={editing ? 'Done editing profile' : 'Edit profile'}
                className={cn(
                  'h-8 shrink-0 items-center justify-center rounded-full px-3 active:opacity-80',
                  editing ? 'bg-ink' : 'border border-ink-line bg-surface'
                )}
              >
                <Text
                  className={cn(
                    'font-sans-b text-[12px]',
                    editing ? 'text-white' : 'text-ink'
                  )}
                >
                  {editing ? 'Done' : 'Edit'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* City + song + book — one quiet details group under the name. */}
          <View className="mt-1.5 gap-1">
            {editingCity ? (
              <TextInput
                autoFocus
                value={cityDraft}
                onChangeText={setCityDraft}
                onBlur={() => {
                  setEditingCity(false);
                  onEditHeader?.({ city: cityDraft });
                }}
                accessibilityLabel="Your city"
                className="w-full rounded-md border border-ink-line bg-surface px-2 py-1 font-sans-sb text-[13px] text-ink"
              />
            ) : (
              <Pressable
                disabled={!canEdit}
                onPress={() => {
                  setCityDraft(city);
                  setEditingCity(true);
                }}
                accessibilityRole={canEdit ? 'button' : 'text'}
                accessibilityLabel={canEdit ? `Edit city, ${city}` : city}
                className="flex-row items-center gap-1.5"
              >
                <MapPinIcon size={14} color={c.inkMute} strokeWidth={2.6} />
                <Text numberOfLines={1} className="shrink font-sans-sb text-[13px] text-ink-soft">
                  {city}
                </Text>
                {canEdit ? <PencilIcon size={12} color={c.inkMute} strokeWidth={2.6} /> : null}
              </Pressable>
            )}

            {!empty && header ? (
              <AnalyticsRegion
                analyticsId={PROFILE.header.song}
                interactive={canEdit}
                className="gap-1"
              >
                <View className="flex-row items-center gap-1.5">
                  <MusicIcon size={14} color={c.inkMute} strokeWidth={2.6} />
                  <Text numberOfLines={1} className="shrink font-sans-sb text-[12px] text-ink-mute">
                    {header.song.title} · {header.song.artist}
                  </Text>
                  {canEdit ? <PencilIcon size={12} color={c.inkMute} strokeWidth={2.6} /> : null}
                </View>
                {header.book ? (
                  <View className="flex-row items-center gap-1.5">
                    <BookOpenIcon size={14} color={c.inkMute} strokeWidth={2.6} />
                    <Text numberOfLines={1} className="shrink font-sans-sb text-[12px] text-ink-mute">
                      {header.book.title} · {header.book.author}
                    </Text>
                    {canEdit ? <PencilIcon size={12} color={c.inkMute} strokeWidth={2.6} /> : null}
                  </View>
                ) : null}
              </AnalyticsRegion>
            ) : null}
          </View>
        </View>
      </View>

      {editingBio ? (
        <TextInput
          autoFocus
          multiline
          value={bioDraft}
          onChangeText={setBioDraft}
          onBlur={() => {
            setEditingBio(false);
            onEditHeader?.({ bio: bioDraft });
          }}
          accessibilityLabel="Your bio"
          placeholder="A line about you"
          className="w-full rounded-card border border-ink-line bg-surface px-3.5 py-2.5 font-sans-sb text-[14px] text-ink"
        />
      ) : bio ? (
        <Pressable
          disabled={!canEdit}
          onPress={() => {
            setBioDraft(bio);
            setEditingBio(true);
          }}
          accessibilityRole={canEdit ? 'button' : 'text'}
          accessibilityLabel={canEdit ? `Edit bio, ${bio}` : bio}
          // The bio reads as writing, not as another boxed-in widget, so it
          // gets no container — just the words under their name.
          className="w-full px-0.5"
        >
          <Text className="font-sans-sb text-[15px] leading-relaxed text-ink-soft">{bio}</Text>
        </Pressable>
      ) : canEdit ? (
        <Pressable
          onPress={() => {
            setBioDraft('');
            setEditingBio(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Add a bio"
          className="w-full flex-row items-center gap-1.5 rounded-card border border-dashed border-ink-line px-3.5 py-2.5"
        >
          <PlusIcon size={16} color={c.inkMute} strokeWidth={2.8} />
          <Text className="font-sans-sb text-[13px] text-ink-mute">Add a bio</Text>
        </Pressable>
      ) : null}
    </AnalyticsRegion>
  );
}

/**
 * The dark "Currently" weekly check-in card.
 * Song + book already sit under the name in the header, so a filled card would
 * just repeat them. We only show the nudge when the check-in is stale (own),
 * or a friend's filled Currently when the header is not already showing them.
 * ALWAYS dark panel + white type — bg-ink flips light in dark mode and was
 * making this unreadable.
 */
function CurrentlyCard({
  currently,
  own,
  empty,
  headerHasSongBook,
  onCheckIn
}: {
  currently: Currently | null;
  own: boolean;
  empty: boolean;
  /** Header already lists song + book under the name */
  headerHasSongBook?: boolean;
  onCheckIn?: (on: boolean) => void;
}) {
  // PRIVACY: the check-in nudge is for YOU only — friends never see it empty.
  if (!own && !currently?.checkedIn) return null;

  const checkedIn = !empty && (currently?.checkedIn ?? false);
  const stale = !empty && !checkedIn;

  // Filled state already lives under the name — skip the duplicate card.
  if (checkedIn && headerHasSongBook) return null;

  // Fixed near-black so dark mode cannot wash the panel to eggshell.
  const panel = 'rounded-card p-4';
  const panelStyle = { backgroundColor: '#1C1B16' as const };

  if (!checkedIn || !currently) {
    if (!own) return null;
    return (
      <AnalyticsRegion
        analyticsId={PROFILE.card.currently}
        interactive={false}
        className={cn(panel, 'items-center p-5')}
        style={panelStyle}
      >
        <Text className="font-sans-b text-[11px] uppercase tracking-wide text-white/60">
          Currently
        </Text>
        <Text className="mt-2 text-center font-sans-b text-[15px] text-white">
          {stale ? 'Time for your weekly check-in' : 'What are you into right now?'}
        </Text>
        <Text className="mt-1 text-center font-sans-sb text-[12px] text-white/60">
          One song, one book. Takes a second.
        </Text>
        <Pressable
          onPress={withAnalyticsPress(PROFILE.card.currently, () => onCheckIn?.(true))}
          accessibilityRole="button"
          accessibilityLabel="Check in"
          className="mt-3 min-h-[36px] justify-center rounded-full bg-white px-4 py-2"
        >
          <Text className="font-sans-b text-[13px] text-[#1C1B16]">Check in</Text>
        </Pressable>
        <MusicConnect />
      </AnalyticsRegion>
    );
  }

  return (
    <AnalyticsRegion
      analyticsId={PROFILE.card.currently}
      interactive={false}
      className={panel}
      style={panelStyle}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-sans-b text-[11px] uppercase tracking-wide text-white/60">
          Currently · this week
        </Text>
        {own ? (
          <Pressable
            onPress={withAnalyticsPress(PROFILE.card.currently, () => onCheckIn?.(false))}
            accessibilityRole="button"
            accessibilityLabel="Update your check-in"
            className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1"
          >
            <RefreshCwIcon size={12} color="#FFFFFF" strokeWidth={2.8} />
            <Text className="font-sans-b text-[11px] text-white">Update</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <View accessible={false} className="h-12 w-12 items-center justify-center rounded-lg bg-blue">
          <Text className="text-[22px]">{currently.listening.emoji}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-sans-b text-[14px] text-white">
            {currently.listening.title}
          </Text>
          <Text numberOfLines={1} className="font-sans-sb text-[12px] text-white/70">
            {currently.listening.artist}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-3 border-t border-white/15 pt-3">
        <View accessible={false} className="h-12 w-10 items-center justify-center rounded-sm bg-amber">
          <Text className="text-[20px]">{currently.reading.emoji}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-sans-b text-[14px] text-white">
            {currently.reading.title}
          </Text>
          <Text numberOfLines={1} className="font-sans-sb text-[12px] text-white/70">
            {currently.reading.author}
          </Text>
        </View>
      </View>

      {own ? <MusicConnect /> : null}
    </AnalyticsRegion>
  );
}

/**
 * Pull Currently straight from a music service instead of typing it each week.
 * A stub for now — the real connect flow ships later, and any music keys stay
 * server-side (never in this client).
 */
function MusicConnect() {
  const [service, setService] = useState<'spotify' | 'apple' | null>(null);

  if (service) {
    return (
      <Text className="mt-3 border-t border-white/15 pt-3 font-sans-sb text-[11px] text-white/60">
        {service === 'spotify' ? 'Spotify' : 'Apple Music'} connected · updates on its own
      </Text>
    );
  }

  return (
    <View className="mt-3 flex-row gap-2 border-t border-white/15 pt-3">
      <Pressable
        onPress={() => setService('spotify')}
        accessibilityRole="button"
        accessibilityLabel="Connect Spotify"
        className="min-h-[36px] flex-1 items-center justify-center rounded-full bg-white/15 px-3 py-2"
      >
        <Text className="font-sans-b text-[12px] text-white">Connect Spotify</Text>
      </Pressable>
      <Pressable
        onPress={() => setService('apple')}
        accessibilityRole="button"
        accessibilityLabel="Connect Apple Music"
        className="min-h-[36px] flex-1 items-center justify-center rounded-full bg-white/15 px-3 py-2"
      >
        <Text className="font-sans-b text-[12px] text-white">Apple Music</Text>
      </Pressable>
    </View>
  );
}

function ModuleEmpty({
  emoji,
  line,
  cta,
  onPress,
  analyticsId
}: {
  emoji: string;
  line: string;
  cta?: string;
  onPress?: () => void;
  analyticsId?: string;
}) {
  return (
    <EmptyState
      emoji={emoji}
      line={line}
      className="py-7"
      action={
        cta && onPress ? (
          <ButtonSecondary
            size="sm"
            tone="solid"
            analyticsId={analyticsId}
            onPress={onPress}
            accessibilityLabel={cta}
          >
            {cta}
          </ButtonSecondary>
        ) : undefined
      }
    />
  );
}
