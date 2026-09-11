// ============================================
// WHAT THIS FILE DOES (plain English):
// The Spotify-order profile body shared by own and friend profiles:
// Mutuals → Top 5 → About me → Upcoming → Obsession → Favorites → Hobbies →
// Places → Where you met. Co-op Greatest hits photos insert after a section
// via afterModule. Own Edit mode can rearrange movable modules.
// Empty sections: only your full own profile shows "Add …" cards. Friend
// pages and View as Friends/Everyone hide empty sections entirely so the
// page does not hint that something is missing.
// ============================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import type {
  AboutFieldView,
  FavoriteModule,
  MovableModule,
  ObsessionSquare,
  Person,
  PhotoBlock,
  Top5Item,
  WhereMetView
} from '@bridger/shared';
import {
  CUSTOMIZE,
  DEFAULT_PROFILE_LAYOUT,
  MOVABLE_MODULE_ORDER,
  PROFILE,
  trackClick,
  trackProduct
} from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import type { Interest, ThisOrThatRow, TravelPlace } from '../../data/profile';
import {
  defaultLayoutOrder,
  getProfilePresentation,
  saveProfilePresentation
} from '../../data/profile-presentation';
import { getTabSnapshot, setTabSnapshot } from '../../lib/tab-snapshots';
import { AboutMeSection } from './AboutMeSection';
import { CurrentObsessionSection } from './CurrentObsessionSection';
import { FavoritesSection } from './FavoritesSection';
import { HobbiesWidget } from './HobbiesWidget';
import { MutualsRow } from './MutualsRow';
import { ProfileAddCard } from './ProfileAddCard';
import { TravelModule } from './TravelModule';
import { Top5Section } from './Top5Section';
import {
  UpcomingEventsSection,
  type UpcomingEventRow
} from './UpcomingEventsSection';
import { GreatestHitsBlock } from './GreatestHitsBlock';
import { WhereYouMetRow } from './WhereYouMetRow';
import { ProfileWidgetCard } from './ProfileWidgetCard';
import {
  PROFILE_SECTION_GAP,
  PROFILE_SECTION_TITLE_SIZE,
  PROFILE_TITLE_TO_BODY
} from './profileSpacing';

function normalizeOrder(order?: MovableModule[] | null): MovableModule[] {
  const base = defaultLayoutOrder();
  if (!order?.length) return base;
  const seen = new Set<MovableModule>();
  const next: MovableModule[] = [];
  for (const id of order) {
    if ((MOVABLE_MODULE_ORDER as readonly string[]).includes(id) && !seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }
  for (const id of base) {
    if (!seen.has(id)) next.push(id);
  }
  return next;
}

export function ProfilePageShell({
  own,
  editable,
  showEmptyCtas = false,
  personName,
  personPhoto,
  personEmoji,
  city,
  bio,
  mutuals,
  top5,
  about,
  upcoming,
  obsession,
  favorites,
  hobbies,
  hobbyFollowUps,
  places,
  thisOrThat,
  whereMet,
  greatestHits,
  onOpenMutuals,
  onOpenTop5,
  onOpenAbout,
  onEditAboutField,
  onEditBio,
  onChangeAboutPhoto,
  onReorderAboutFields,
  onOpenObsession,
  onOpenFavoritesModule,
  onViewFavoriteAnswers,
  onOpenHobbies,
  onOpenPlaces,
  onOpenEvent,
  onOpenTot
}: {
  own: boolean;
  editable?: boolean;
  /**
   * True only on your full own profile (not View as Friends/Everyone, not a
   * friend page). Empty sections then show "Add …" cards. When false, empty
   * sections disappear entirely (no header, no "nothing shared").
   */
  showEmptyCtas?: boolean;
  personName?: string;
  personPhoto?: ImageSourcePropType;
  personEmoji?: string;
  city?: string;
  bio?: string;
  mutuals: Person[];
  top5: Top5Item[];
  about: AboutFieldView[];
  upcoming: UpcomingEventRow[];
  obsession: ObsessionSquare[];
  favorites: FavoriteModule[];
  hobbies: Interest[];
  hobbyFollowUps?: Record<string, { question: string; answer: string }>;
  places: TravelPlace[];
  thisOrThat: ThisOrThatRow[];
  whereMet?: WhereMetView | null;
  greatestHits?: PhotoBlock[];
  onOpenMutuals?: () => void;
  onOpenTop5?: () => void;
  onOpenAbout?: () => void;
  onEditAboutField?: (field: AboutFieldView) => void;
  onEditBio?: () => void;
  /** Own profile: open Take / Upload to change the About Me (profile) photo. */
  onChangeAboutPhoto?: () => void;
  onReorderAboutFields?: (next: AboutFieldView[]) => void;
  onOpenObsession?: () => void;
  onOpenFavoritesModule?: (id: string) => void;
  /** Friend profiles: open read-only answers (never the fill quiz). */
  onViewFavoriteAnswers?: (id: string) => void;
  onOpenHobbies?: () => void;
  onOpenPlaces?: () => void;
  onOpenEvent?: (id: string) => void;
  onOpenTot?: () => void;
}) {
  const router = useRouter();
  const hobbiesId = own ? PROFILE.card.hobbies_widget : PROFILE.about_them.hobbies_widget;
  const placesId = own ? PROFILE.card.places_map : PROFILE.about_them.places_map;

  const favModules = useMemo(() => {
    const hasTot = favorites.some((f) => f.id === 'this_or_that');
    if (thisOrThat.length === 0 || hasTot) return favorites;
    return [
      ...favorites,
      {
        id: 'this_or_that',
        label: 'This or that',
        emoji: '⚖️',
        answeredCount: thisOrThat.length,
        empty: false
      }
    ];
  }, [favorites, thisOrThat]);

  // THIS SECTION DOES: load the saved module order (or the Spotify default).
  const [layoutOrder, setLayoutOrder] = useState<MovableModule[]>(() =>
    normalizeOrder(
      getTabSnapshot<MovableModule[]>('profileLayout') ?? DEFAULT_PROFILE_LAYOUT.order
    )
  );

  useEffect(() => {
    let alive = true;
    void getProfilePresentation().then((p) => {
      if (!alive) return;
      const next = normalizeOrder(p?.layoutOrder);
      setLayoutOrder(next);
      setTabSnapshot('profileLayout', next);
    });
    return () => {
      alive = false;
    };
  }, []);

  const persistOrder = useCallback(async (next: MovableModule[]) => {
    setLayoutOrder(next);
    setTabSnapshot('profileLayout', next);
    const current = await getProfilePresentation();
    await saveProfilePresentation({
      accent: current?.accent ?? 'purple',
      background: current?.background ?? 'default',
      backgroundSpec: current?.backgroundSpec,
      palette: current?.palette ?? current?.accent ?? 'purple',
      fontId: current?.fontId ?? current?.font,
      font: current?.fontId ?? current?.font,
      mode: current?.mode,
      layoutOrder: next
    });
    trackClick(CUSTOMIZE.layout.reorder, {});
    trackProduct('profile_layout_saved', {
      module_count: next.length
    });
  }, []);

  const moveModule = useCallback(
    (id: MovableModule, dir: -1 | 1) => {
      setLayoutOrder((prev) => {
        const visible = prev.filter((m) => {
          if (m === 'mutuals') return !own && mutuals.length > 0;
          if (m === 'whereMet') return !own && !!whereMet;
          if (m === 'greatestHits') return !!(greatestHits && greatestHits.length > 0);
          if (m === 'recommendations' || m === 'timeline') return false;
          return true;
        });
        const idx = visible.indexOf(id);
        if (idx < 0) return prev;
        const swapWith = visible[idx + dir];
        if (!swapWith) return prev;
        const a = prev.indexOf(id);
        const b = prev.indexOf(swapWith);
        if (a < 0 || b < 0) return prev;
        const next = [...prev];
        next[a] = swapWith;
        next[b] = id;
        void persistOrder(next);
        return next;
      });
    },
    [own, mutuals.length, whereMet, greatestHits, persistOrder]
  );

  // THIS SECTION DOES: Spotify scroll order. Greatest hits inject after a module.
  // PRIVACY / UX: when View as or a friend is looking, skip sections with no
  // visible answers so the page does not hint that something is missing.
  const visibleModules = useMemo(() => {
    const filledFavorites = favorites.some((f) => !f.empty) || thisOrThat.length > 0;
    return layoutOrder.filter((m) => {
      if (m === 'mutuals') return !own && mutuals.length > 0;
      if (m === 'whereMet') return !own && !!whereMet;
      // Photos insert via afterModule; do not render a lone end-of-page block.
      if (m === 'greatestHits') return false;
      // Not shipped as live widgets yet — skip until content exists.
      if (m === 'recommendations' || m === 'timeline') return false;
      if (m === 'upcoming') return upcoming.length > 0;
      if (!showEmptyCtas) {
        if (m === 'top5') return top5.length > 0;
        if (m === 'obsession') return obsession.length > 0;
        if (m === 'favorites') return filledFavorites;
        if (m === 'hobbies') return hobbies.length > 0;
        if (m === 'places') return places.length > 0;
        // About me stays: photo / name / city still belong on the card.
      }
      return true;
    });
  }, [
    layoutOrder,
    own,
    mutuals.length,
    whereMet,
    upcoming.length,
    showEmptyCtas,
    top5.length,
    obsession.length,
    favorites,
    thisOrThat.length,
    hobbies.length,
    places.length
  ]);

  /** Photos that sit after a given section (placement_index order). */
  const hitsAfter = useCallback(
    (moduleId: MovableModule): PhotoBlock[] => {
      const hits = greatestHits ?? [];
      return hits
        .filter((p) => (p.afterModule ?? 'aboutMe') === moduleId)
        .sort((a, b) => a.order - b.order);
    },
    [greatestHits]
  );

  /** Hits whose afterModule is missing from the visible list (show after aboutMe). */
  const orphanHits = useMemo(() => {
    const hits = greatestHits ?? [];
    const visible = new Set(visibleModules);
    return hits
      .filter((p) => {
        const after = (p.afterModule ?? 'aboutMe') as MovableModule;
        return !visible.has(after);
      })
      .sort((a, b) => a.order - b.order);
  }, [greatestHits, visibleModules]);

  const renderModule = (id: MovableModule) => {
    const idx = visibleModules.indexOf(id);
    const canMoveUp = editable && own && idx > 0;
    const canMoveDown = editable && own && idx >= 0 && idx < visibleModules.length - 1;

    const wrap = (
      editContent: (() => void) | undefined,
      child: React.ReactNode,
      opts?: { skipEmpty?: boolean }
    ) => {
      if (opts?.skipEmpty) return null;
      return (
        <ProfileWidgetCard
          key={id}
          editable={editable && own}
          rearranging={editable && own}
          onEditContent={editContent}
          onMoveUp={canMoveUp ? () => moveModule(id, -1) : undefined}
          onMoveDown={canMoveDown ? () => moveModule(id, 1) : undefined}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        >
          {child}
        </ProfileWidgetCard>
      );
    };

    switch (id) {
      case 'mutuals':
        return wrap(undefined, <MutualsRow mutuals={mutuals} onPress={onOpenMutuals} />);
      case 'top5':
        return wrap(
          showEmptyCtas ? onOpenTop5 : undefined,
          <Top5Section
            items={top5}
            editable={editable && showEmptyCtas}
            own={own}
            showEmptyCtas={showEmptyCtas}
            onAdd={onOpenTop5}
          />,
          { skipEmpty: !showEmptyCtas && top5.length === 0 }
        );
      case 'aboutMe':
        return wrap(
          showEmptyCtas ? onOpenAbout : undefined,
          <AboutMeSection
            name={personName}
            city={city}
            bio={bio}
            photo={personPhoto}
            emoji={personEmoji}
            fields={about}
            editable={editable && showEmptyCtas}
            own={own}
            showEmptyCtas={showEmptyCtas}
            onAdd={onOpenAbout}
            onEditField={onEditAboutField}
            onEditBio={onEditBio}
            onChangePhoto={showEmptyCtas ? onChangeAboutPhoto : undefined}
            onReorderFields={onReorderAboutFields}
          />
        );
      case 'upcoming':
        if (upcoming.length === 0) return null;
        return wrap(undefined, <UpcomingEventsSection events={upcoming} onOpenEvent={onOpenEvent} />);
      case 'obsession':
        return wrap(
          showEmptyCtas ? onOpenObsession : undefined,
          <CurrentObsessionSection
            items={obsession}
            editable={editable && showEmptyCtas}
            own={own}
            showEmptyCtas={showEmptyCtas}
            onAdd={onOpenObsession}
          />,
          { skipEmpty: !showEmptyCtas && obsession.length === 0 }
        );
      case 'greatestHits':
        return null;
      case 'favorites': {
        const hasFilled = favModules.some((f) => !f.empty);
        return wrap(
          undefined,
          <FavoritesSection
            modules={favModules}
            own={own}
            showEmptyCtas={showEmptyCtas}
            onOpenModule={(mid) => {
              // Friend / View-as: only show their answers, never start a quiz.
              if (!showEmptyCtas) {
                onViewFavoriteAnswers?.(mid);
                return;
              }
              if (mid === 'this_or_that') onOpenTot?.();
              else if (mid === 'hobbies') onOpenHobbies?.();
              else if (mid === 'places') onOpenPlaces?.();
              else onOpenFavoritesModule?.(mid);
            }}
          />,
          { skipEmpty: !showEmptyCtas && !hasFilled }
        );
      }
      case 'hobbies':
        if (!showEmptyCtas && hobbies.length === 0) return null;
        return wrap(
          showEmptyCtas ? onOpenHobbies : undefined,
          <View>
            <Text
              className="font-pixel text-ink"
              style={{ fontSize: PROFILE_SECTION_TITLE_SIZE, marginBottom: PROFILE_TITLE_TO_BODY }}
            >
              Hobbies
            </Text>
            {hobbies.length > 0 ? (
              <HobbiesWidget
                hobbies={hobbies}
                analyticsId={hobbiesId}
                followUps={hobbyFollowUps}
              />
            ) : (
              <ProfileAddCard
                label="Add hobbies"
                helper="Pick a few things you like."
                emoji="🎛️"
                accent="teal"
                analyticsId={PROFILE.card.add_hobbies}
                accessibilityLabel="Add hobbies"
                onPress={() => onOpenHobbies?.()}
              />
            )}
          </View>
        );
      case 'places':
        if (!showEmptyCtas && places.length === 0) return null;
        return wrap(
          showEmptyCtas ? onOpenPlaces : undefined,
          <View>
            <Text
              className="font-pixel text-ink"
              style={{ fontSize: PROFILE_SECTION_TITLE_SIZE, marginBottom: PROFILE_TITLE_TO_BODY }}
            >
              Places traveled
            </Text>
            <AnalyticsRegion analyticsId={placesId} interactive={false}>
              {places.length === 0 ? (
                <ProfileAddCard
                  label="Add places"
                  helper="Pin the places you have been."
                  emoji="🗺️"
                  accent="coral"
                  analyticsId={PROFILE.card.add_places}
                  accessibilityLabel="Add places"
                  onPress={() => onOpenPlaces?.()}
                />
              ) : (
                <TravelModule places={places} analyticsId={placesId} />
              )}
            </AnalyticsRegion>
            {places.length > 0 ? (
              <Text className="mt-2 font-sans-sb text-[11px] text-ink-mute">
                Photos for each place are coming soon.
              </Text>
            ) : null}
          </View>
        );
      case 'whereMet':
        return whereMet
          ? wrap(undefined, <WhereYouMetRow whereMet={whereMet} />)
          : null;
      default:
        return null;
    }
  };

  return (
    <View style={{ gap: PROFILE_SECTION_GAP, paddingBottom: 32 }}>
      {/* THIS SECTION DOES: while rearranging, offer a path to theme Customize. */}
      {editable && own ? (
        <View className="px-4">
          <Pressable
            onPress={withAnalyticsPress(PROFILE.header.customize_look, () =>
              router.push('/profile/customize')
            )}
            accessibilityRole="button"
            accessibilityLabel="Customize look and theme"
            className="min-h-[44px] items-center justify-center rounded-full border border-ink-line bg-surface px-4 active:opacity-90"
          >
            <Text className="font-sans-b text-[13px] text-ink">Customize look</Text>
          </Pressable>
          <Text className="mt-1.5 text-center font-sans-sb text-[11px] text-ink-mute">
            Use the arrows to move sections. The pencil edits that box.
          </Text>
        </View>
      ) : null}

      {/* THIS SECTION DOES: render each section, then any Greatest hits after it. */}
      {visibleModules.map((id) => {
        const moduleNode = renderModule(id);
        const after = hitsAfter(id);
        // Orphans (after a hidden module) land after About me.
        const extras =
          id === 'aboutMe' ? [...after, ...orphanHits.filter((p) => !after.includes(p))] : after;
        return (
          <React.Fragment key={id}>
            {moduleNode}
            {extras.length > 0 ? (
              <ProfileWidgetCard key={`${id}-hits`} editable={false}>
                <GreatestHitsBlock photos={extras} />
              </ProfileWidgetCard>
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}
