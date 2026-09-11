// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared Spotify-style profile card for own and friend pages. Header is
// usually rendered by the screen (above tabs); this file composes the content
// sections in PROFILE.md order and opens ModuleFlow for fill modules.
// Analytics: PROFILE.card.* / PROFILE.module.*; product events on module done.
// ============================================
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import type {
  AboutFieldView,
  FavoriteModule,
  ObsessionSquare,
  Person,
  PhotoBlock,
  Tier,
  Top5Item,
  WhereMetView
} from '@bridger/shared';
import { PROFILE, trackProduct } from '@bridger/shared';
import {
  ModuleFlow,
  type ModuleAnswer,
  type ModuleMatchable,
  type ModuleVisibility
} from '@bridger/ui';
import { PROFILE_MODULES, type ProfileModuleId } from '../../data/profile-modules';
import { fireEmojiBurstHaptics } from '../../lib/celebration-haptics';
import type {
  AboutField,
  FavGroup,
  Interest,
  MyProfileHeader,
  ThisOrThatRow,
  TravelPlace
} from '../../data/profile';
import {
  reorderAboutFields,
  saveAboutFields,
  saveCustomNotes,
  saveFavs,
  saveHobbies,
  saveObsession,
  savePlaces,
  saveThisOrThat,
  saveTop5,
  TIER_RANK
} from '../../data/profile';
import { savePhoto } from '../../data/onboarding';
import { avatarPhotoFor } from '../../lib/avatar-photo';
import { searchPlaces } from '../../lib/geocode';
import {
  pickProfilePhoto,
  type PhotoSource
} from '../../lib/pick-image';
import { FavoriteAnswersSheet } from './FavoriteAnswersSheet';
import { ProfileHeaderBlock } from './ProfileHeaderBlock';
import { ProfilePageShell } from './ProfilePageShell';
import type { UpcomingEventRow } from './UpcomingEventsSection';
import { PROFILE_HEADER_TO_TABS } from './profileSpacing';

/** Re-export header block under the old name so friend screens keep working. */
export { ProfileHeaderBlock as ProfileHeader };

/**
 * PRIVACY: can this viewing circle see a field at `itemTier`?
 * `none` is owner-only and only on your full own view (not View as).
 */
function visibleToViewer(
  itemTier: Tier | undefined,
  asTier: Tier,
  own: boolean,
  fallback: Tier = 'friend'
): boolean {
  const tier = itemTier ?? fallback;
  if (tier === 'none') return own && asTier === 'close';
  const rank = TIER_RANK[tier];
  if (rank == null) return own && asTier === 'close';
  return rank <= TIER_RANK[asTier];
}

export function ProfileCard({
  person,
  header,
  about,
  hobbies,
  favs,
  thisOrThat,
  places,
  top5 = [],
  obsession = [],
  favorites,
  upcoming = [],
  greatestHits = [],
  mutuals = [],
  whereMet = null,
  editable = false,
  own = false,
  showHeader = true,
  asTier = 'close',
  empty = false,
  hobbyFollowUps,
  hasRecap = false,
  onToggleEdit,
  onViewAs,
  onRetier,
  onPlayRecap,
  onSearch,
  onOpenMutuals,
  onAnswered,
  onOpenStory,
  onAddStory,
  onOpenEvent
}: {
  person: Person;
  header: MyProfileHeader | null;
  about: AboutField[];
  hobbies: Interest[];
  favs: FavGroup[];
  thisOrThat: ThisOrThatRow[];
  places: TravelPlace[];
  top5?: Top5Item[];
  obsession?: ObsessionSquare[];
  favorites?: FavoriteModule[];
  upcoming?: UpcomingEventRow[];
  /** Co-op Greatest hits (tier-filtered by caller). */
  greatestHits?: PhotoBlock[];
  mutuals?: Person[];
  whereMet?: WhereMetView | null;
  editable?: boolean;
  own?: boolean;
  showHeader?: boolean;
  asTier?: Tier;
  empty?: boolean;
  hobbyFollowUps?: Record<string, { question: string; answer: string }>;
  hasRecap?: boolean;
  onToggleEdit?: () => void;
  onViewAs?: (tier: Tier) => void;
  onRetier?: (tier: Tier) => void;
  onPlayRecap?: () => void;
  onSearch?: () => void;
  onOpenMutuals?: () => void;
  onAnswered?: () => void;
  onOpenStory?: () => void;
  /** Own profile: empty dashed story tile → capture. */
  onAddStory?: () => void;
  onOpenEvent?: (id: string) => void;
}) {
  // THIS SECTION DOES: only your full own profile shows "Add …" empty cards.
  // View as Friends / Everyone (and friend pages) hide empty sections entirely.
  const showEmptyCtas = Boolean(own && asTier === 'close' && !empty);

  // PRIVACY: only fields shared at or below the viewing tier are shown.
  // Missing tier used to make TIER_RANK[undefined] fail the compare, so saved
  // hometown/work/birthday vanished and "Add details" came back (TestFlight).
  const visibleAbout: AboutFieldView[] = empty
    ? []
    : about
        .filter((f) => {
          if (!f.value || typeof f.value !== 'string' || !f.value.trim()) return false;
          return visibleToViewer(f.tier, asTier, own);
        })
        .map((f) => ({
          attributeId: f.id,
          key: f.key,
          value: f.value,
          visibleToTier: f.tier
        }));

  const visibleTop5 = empty
    ? []
    : top5.filter((t) => visibleToViewer(t.visibleToTier, asTier, own));
  const visibleObsession = empty
    ? []
    : obsession.filter((o) => visibleToViewer(o.visibleToTier, asTier, own));
  const visibleGreatestHits = empty
    ? []
    : greatestHits.filter((p) => visibleToViewer(p.visibleToTier, asTier, own));
  const visibleHobbies = empty
    ? []
    : hobbies.filter((h) => visibleToViewer(h.tier, asTier, own));
  const visiblePlaces = empty
    ? []
    : places.filter((p) => visibleToViewer(p.tier, asTier, own));
  const visibleThisOrThat = empty
    ? []
    : thisOrThat.filter((t) => visibleToViewer(t.tier, asTier, own));

  const favModules = useMemo(() => {
    if (favorites) {
      // View-as / friend: drop empty "to start" tiles so Favorites does not
      // hint at modules the viewer is not meant to know about.
      if (!showEmptyCtas) return favorites.filter((m) => !m.empty);
      return favorites;
    }
    // Fallback from fav groups when caller did not pass composed modules.
    return (empty ? [] : favs).map((g) => ({
      id: g.group.toLowerCase(),
      label: g.group,
      emoji: g.emoji,
      answeredCount: g.total,
      empty: g.total === 0
    }));
  }, [favorites, favs, empty, showEmptyCtas]);

  const [module, setModule] = useState<ProfileModuleId | null>(null);
  /** Friend view: which Favorites album answers sheet is open. */
  const [viewFavoriteId, setViewFavoriteId] = useState<string | null>(null);
  const activeModule = PROFILE_MODULES.find((m) => m.id === module);
  const moduleStartedAt = useRef<number | null>(null);

  // THIS SECTION DOES: prefill ModuleFlow from About Me rows already saved
  // (birthday, hometown, …) so people are not asked to type them again.
  const moduleInitialAnswers = useMemo(() => {
    if (!activeModule) return undefined;
    const next: Record<string, ModuleAnswer> = {};
    for (const q of activeModule.questions) {
      const field = about.find((f) => f.id === q.id);
      if (field?.value?.trim()) next[q.id] = field.value.trim();
    }
    return Object.keys(next).length > 0 ? next : undefined;
  }, [activeModule, about]);

  const openModule = (id: ProfileModuleId | string) => {
    // SECURITY: only the owner fills modules; friends only view answers.
    if (!own) return;
    const mid = id as ProfileModuleId;
    if (!PROFILE_MODULES.some((m) => m.id === mid)) return;
    setModule(mid);
    moduleStartedAt.current = Date.now();
    trackProduct('module_started', { module: mid });
  };

  const viewFavoriteLabel =
    favModules.find((m) => m.id === viewFavoriteId)?.label ??
    (viewFavoriteId === 'this_or_that' ? 'This or that' : undefined);

  const finishModule = async (
    answers: Record<string, ModuleAnswer>,
    visibility?: ModuleVisibility,
    matchable?: ModuleMatchable
  ) => {
    const id = module;
    const started = moduleStartedAt.current;
    const vis = visibility ?? {};
    const match = matchable ?? {};

    if (id) {
      switch (id) {
        case 'hobbies':
          await saveHobbies(answers, vis);
          break;
        case 'about_basics':
        case 'about_deeper':
        case 'about':
          await saveAboutFields(answers, vis);
          break;
        case 'food_drinks':
        case 'entertainment':
        case 'everyday':
        case 'sports':
        case 'favs':
          await saveFavs(answers, vis);
          break;
        case 'places':
          await savePlaces(answers, vis);
          break;
        case 'this_or_that':
        case 'tot':
          await saveThisOrThat(answers, vis);
          break;
        case 'top5':
          await saveTop5(answers, vis, match);
          break;
        case 'obsession':
          await saveObsession(answers, vis, match);
          break;
        case 'notes':
          await saveCustomNotes(answers, vis);
          break;
        default:
          // timeline / recommendations / goals persist via about-style keys later
          await saveAboutFields(answers, vis);
          break;
      }
      if (started != null) {
        trackProduct('module_completed', {
          module: id,
          items_added: Object.keys(answers).filter((k) => {
            const v = answers[k];
            return Array.isArray(v) ? v.length > 0 : Boolean(v) && v !== 'skip';
          }).length,
          time_to_complete_ms: Date.now() - started
        });
      }
    }
    moduleStartedAt.current = null;
    setModule(null);
    onAnswered?.();
  };

  // THIS SECTION DOES: About Me photo = their real profile pic (live URL), not
  // the stock demo fixture. Demo still falls back to the dropped-in face file.
  const aboutPhoto = avatarPhotoFor(
    person.id,
    header?.avatarUrl?.trim() || person.avatarUrl?.trim() || ''
  );

  // THIS SECTION DOES: let them swap the About Me (and header) photo while
  // editing. Same one-upload exception as onboarding: camera or library.
  const changeAboutPhoto = (source: PhotoSource) => {
    void (async () => {
      const picked = await pickProfilePhoto(source);
      if (!picked) return;
      try {
        await savePhoto({ source, uri: picked.uri });
        trackProduct('profile_photo_updated', { method: source });
        onAnswered?.();
      } catch (err) {
        console.warn('[profile] about-me photo save failed', err);
        Alert.alert(
          'Could not save photo',
          'Try again in a moment. Your other profile details are fine.'
        );
      }
    })();
  };

  const openAboutPhotoSheet = () => {
    if (Platform.OS === 'web') {
      changeAboutPhoto('library');
      return;
    }
    Alert.alert('Change photo', 'This updates your profile photo everywhere.', [
      { text: 'Take a photo', onPress: () => changeAboutPhoto('camera') },
      { text: 'Upload', onPress: () => changeAboutPhoto('library') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  return (
    <View>
      {showHeader ? (
        <View style={{ marginBottom: PROFILE_HEADER_TO_TABS }}>
          <ProfileHeaderBlock
            person={person}
            header={header}
            own={own}
            editing={editable}
            empty={empty}
            asTier={asTier}
            hasRecap={hasRecap}
            onToggleEdit={onToggleEdit}
            onViewAs={onViewAs}
            onRetier={onRetier}
            onPlayRecap={onPlayRecap}
            onOpenStory={onOpenStory}
            onAddStory={onAddStory}
            onSearch={onSearch}
          />
        </View>
      ) : null}

      <ProfilePageShell
        own={own}
        editable={editable}
        showEmptyCtas={showEmptyCtas}
        personName={person.name}
        personPhoto={aboutPhoto}
        personEmoji={person.emoji}
        city={header?.city}
        bio={header?.bio}
        mutuals={mutuals}
        top5={visibleTop5}
        about={visibleAbout}
        upcoming={upcoming}
        obsession={visibleObsession}
        favorites={favModules}
        hobbies={visibleHobbies}
        hobbyFollowUps={hobbyFollowUps}
        places={visiblePlaces}
        thisOrThat={visibleThisOrThat}
        whereMet={whereMet}
        greatestHits={visibleGreatestHits}
        onOpenMutuals={onOpenMutuals}
        onOpenTop5={() => openModule('top5')}
        onOpenAbout={() => openModule('about_basics')}
        onEditAboutField={() => openModule('about_basics')}
        onEditBio={() => {
          // Bio lives on the header; open About basics so they can update it there.
          openModule('about_basics');
        }}
        onChangeAboutPhoto={own ? openAboutPhotoSheet : undefined}
        onReorderAboutFields={(next) => {
          void reorderAboutFields(
            next.map((f) => ({
              id: f.attributeId,
              key: f.key,
              value: f.value,
              tier: f.visibleToTier
            }))
          ).then(() => onAnswered?.());
        }}
        onOpenObsession={() => openModule('obsession')}
        onOpenFavoritesModule={(id) => openModule(id)}
        onViewFavoriteAnswers={(id) => setViewFavoriteId(id)}
        onOpenHobbies={() => openModule('hobbies')}
        onOpenPlaces={() => openModule('places')}
        onOpenTot={() => openModule('this_or_that')}
        onOpenEvent={onOpenEvent}
      />

      {/* Empty Favorites / About / Obsession / Top 5 already have their own
          "add" cards in each section, so we do not show a separate
          "Add to your profile" block at the bottom. */}

      <FavoriteAnswersSheet
        open={Boolean(viewFavoriteId)}
        moduleId={viewFavoriteId}
        moduleLabel={viewFavoriteLabel}
        favs={empty ? [] : favs}
        thisOrThat={visibleThisOrThat}
        theirName={person.name.split(' ')[0] ?? person.name}
        onClose={() => setViewFavoriteId(null)}
      />

      <ModuleFlow
        open={Boolean(activeModule) && own}
        title={activeModule?.label ?? ''}
        questions={activeModule?.questions ?? []}
        mode="share"
        defaultTier={activeModule?.defaultTier ?? 'friend'}
        sensitiveKeys={activeModule?.sensitiveKeys ?? []}
        audienceSetAllAnalyticsId={PROFILE.module.audience_set_all}
        audienceRowAnalyticsId={PROFILE.module.audience_row}
        matchableToggleAnalyticsId={PROFILE.module.matchable_toggle}
        matchableRowAnalyticsId={PROFILE.module.matchable_row}
        searchPlaces={searchPlaces}
        placeSearchAnalyticsId={PROFILE.module.place_search}
        placeResultAnalyticsId={PROFILE.module.place_result}
        onBurstStart={fireEmojiBurstHaptics}
        initialAnswers={moduleInitialAnswers}
        onClose={() => {
          moduleStartedAt.current = null;
          setModule(null);
        }}
        onDone={(answers, visibility, matchable) => {
          void finishModule(answers, visibility, matchable).catch((e) => {
            const raw = e instanceof Error ? e.message : '';
            Alert.alert(
              'Could not save',
              /internal server error/i.test(raw) || !raw
                ? 'Something went wrong. Try again in a moment.'
                : raw
            );
          });
        }}
      />
    </View>
  );
}
