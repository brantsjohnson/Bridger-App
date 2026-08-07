// ============================================
// WHAT THIS FILE DOES (plain English):
// The Spotify-order profile body shared by own and friend profiles. Each
// section sits in a clear widget box. Own Edit mode can rearrange movable
// modules (layoutOrder) and edit each box's contents. Header + tabs stay
// anchored above this shell.
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
  trackClick
} from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import type { Interest, ThisOrThatRow, TravelPlace } from '../../data/profile';
import {
  defaultLayoutOrder,
  getProfilePresentation,
  saveProfilePresentation
} from '../../data/profile-presentation';
import { AboutMeSection } from './AboutMeSection';
import { CurrentObsessionSection } from './CurrentObsessionSection';
import { FavoritesSection } from './FavoritesSection';
import { HobbiesWidget } from './HobbiesWidget';
import { MutualsRow } from './MutualsRow';
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
    normalizeOrder(DEFAULT_PROFILE_LAYOUT.order)
  );

  useEffect(() => {
    let alive = true;
    void getProfilePresentation().then((p) => {
      if (!alive) return;
      setLayoutOrder(normalizeOrder(p?.layoutOrder));
    });
    return () => {
      alive = false;
    };
  }, []);

  const persistOrder = useCallback(async (next: MovableModule[]) => {
    setLayoutOrder(next);
    const current = await getProfilePresentation();
    await saveProfilePresentation({
      accent: current?.accent ?? 'purple',
      background: current?.background ?? 'default',
      font: current?.font,
      mode: current?.mode,
      layoutOrder: next
    });
    trackClick(CUSTOMIZE.layout.reorder, {});
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

  const visibleModules = useMemo(() => {
    return layoutOrder.filter((m) => {
      if (m === 'mutuals') return !own && mutuals.length > 0;
      if (m === 'whereMet') return !own && !!whereMet;
      if (m === 'greatestHits') return !!(greatestHits && greatestHits.length > 0);
      // Not shipped as live widgets yet — skip until content exists.
      if (m === 'recommendations' || m === 'timeline') return false;
      if (m === 'upcoming') return upcoming.length > 0;
      return true;
    });
  }, [layoutOrder, own, mutuals.length, whereMet, greatestHits, upcoming.length]);

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
        return wrap(onOpenTop5, <Top5Section items={top5} editable={editable} onAdd={onOpenTop5} />);
      case 'aboutMe':
        return wrap(
          onOpenAbout,
          <AboutMeSection
            name={personName}
            city={city}
            bio={bio}
            photo={personPhoto}
            emoji={personEmoji}
            fields={about}
            editable={editable}
            onAdd={onOpenAbout}
            onEditField={onEditAboutField}
            onEditBio={onEditBio}
            onReorderFields={onReorderAboutFields}
          />
        );
      case 'upcoming':
        if (upcoming.length === 0) return null;
        return wrap(undefined, <UpcomingEventsSection events={upcoming} onOpenEvent={onOpenEvent} />);
      case 'obsession':
        return wrap(
          onOpenObsession,
          <CurrentObsessionSection
            items={obsession}
            editable={editable}
            onAdd={onOpenObsession}
          />
        );
      case 'greatestHits':
        return wrap(
          undefined,
          <GreatestHitsBlock photos={greatestHits ?? []} />,
          { skipEmpty: !greatestHits?.length }
        );
      case 'favorites':
        return wrap(undefined, (
          <FavoritesSection
            modules={favModules}
            own={own}
            onOpenModule={(mid) => {
              // Friend profiles: only show their answers, never start a quiz.
              if (!own) {
                onViewFavoriteAnswers?.(mid);
                return;
              }
              if (mid === 'this_or_that') onOpenTot?.();
              else if (mid === 'hobbies') onOpenHobbies?.();
              else if (mid === 'places') onOpenPlaces?.();
              else onOpenFavoritesModule?.(mid);
            }}
          />
        ));
      case 'hobbies':
        return wrap(
          onOpenHobbies,
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
            ) : editable ? (
              <Pressable
                onPress={withAnalyticsPress(PROFILE.card.add_hobbies, () => onOpenHobbies?.())}
                accessibilityRole="button"
                accessibilityLabel="Add hobbies"
                className="min-h-[44px] items-center justify-center rounded-card border border-dashed border-ink-line px-4 py-4"
              >
                <Text className="font-sans-b text-[14px] text-ink">Add hobbies</Text>
              </Pressable>
            ) : (
              <Text className="font-sans-sb text-[14px] text-ink-mute">No hobbies yet.</Text>
            )}
          </View>
        );
      case 'places':
        return wrap(
          onOpenPlaces,
          <View>
            <Text
              className="font-pixel text-ink"
              style={{ fontSize: PROFILE_SECTION_TITLE_SIZE, marginBottom: PROFILE_TITLE_TO_BODY }}
            >
              Places traveled
            </Text>
            <AnalyticsRegion analyticsId={placesId} interactive={false}>
              {places.length === 0 ? (
                editable ? (
                  <Pressable
                    onPress={withAnalyticsPress(PROFILE.card.add_places, () => onOpenPlaces?.())}
                    accessibilityRole="button"
                    accessibilityLabel="Add places"
                    className="min-h-[44px] items-center justify-center rounded-card border border-dashed border-ink-line px-4 py-4"
                  >
                    <Text className="font-sans-b text-[14px] text-ink">Add places</Text>
                  </Pressable>
                ) : (
                  <Text className="font-sans-sb text-[14px] text-ink-mute">No places yet.</Text>
                )
              ) : (
                <TravelModule places={places} analyticsId={placesId} />
              )}
            </AnalyticsRegion>
            <Text className="mt-2 font-sans-sb text-[11px] text-ink-mute">
              Photos for each place are coming soon.
            </Text>
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

      {visibleModules.map((id) => renderModule(id))}
    </View>
  );
}
