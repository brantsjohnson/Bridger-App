// ============================================
// WHAT THIS FILE DOES (plain English):
// Album-style Favorites grid. Own profile: "to start" unfilled modules on
// top, filled modules below (2-up, top 4 + See all pill under the four).
// Friends never see empties. This-or-that lives among the filled modules.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import type { FavoriteModule } from '@bridger/shared';
import { PROFILE } from '@bridger/shared';
import { ACCENTS, AnalyticsRegion, cn, withAnalyticsPress, type Accent } from '@bridger/ui';
import {
  PROFILE_GRID_GAP,
  PROFILE_META_GAP,
  PROFILE_SECTION_TITLE_SIZE,
  PROFILE_SEE_ALL_SIZE,
  PROFILE_TITLE_TO_BODY
} from './profileSpacing';

// THIS SECTION DOES: the color order for empty "To start" tiles so each one
// gets a distinct, lively accent as we lay them out left to right, top to bottom.
const TO_START_ACCENTS: Accent[] = ['purple', 'coral', 'teal', 'amber', 'pink', 'blue', 'green'];

export function FavoritesSection({
  modules,
  own,
  showEmptyCtas,
  onOpenModule
}: {
  modules: FavoriteModule[];
  own: boolean;
  /**
   * When false (friend view or View as Friends/Everyone), hide empty "To
   * start" tiles and the whole Favorites block if nothing is filled.
   */
  showEmptyCtas?: boolean;
  onOpenModule?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // THIS SECTION DOES: only your full own profile sees unfilled "To start" tiles.
  const showToStart = showEmptyCtas ?? own;
  const toStart = showToStart ? modules.filter((m) => m.empty) : [];
  const filled = modules.filter((m) => !m.empty);
  const visibleFilled = expanded ? filled : filled.slice(0, 4);
  const hasMore = filled.length > 4;

  // PRIVACY / UX: no empty Favorites header for viewers.
  if (!showToStart && filled.length === 0) return null;

  return (
    <View>
      <AnalyticsRegion analyticsId={PROFILE.card.favorites} interactive={false}>
        <Text
          className="font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          Favorites
        </Text>
      </AnalyticsRegion>

      {toStart.length > 0 ? (
        <View style={{ marginTop: PROFILE_TITLE_TO_BODY }}>
          <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
            To start
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: PROFILE_GRID_GAP }}>
            {toStart.map((m, i) => {
              // THIS SECTION DOES: rotate through the accent palette so each
              // empty tile is colorful and clearly tappable (not a gray box).
              const token = ACCENTS[TO_START_ACCENTS[i % TO_START_ACCENTS.length]];
              return (
                <Pressable
                  key={m.id}
                  onPress={withAnalyticsPress(PROFILE.card.favorites_to_start, () =>
                    onOpenModule?.(m.id)
                  )}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${m.label}`}
                  className={cn(
                    'items-center justify-center rounded-card px-2 py-4 active:opacity-90',
                    token.tint
                  )}
                  style={{ width: '47.5%', aspectRatio: 1 }}
                >
                  <Text className="text-[28px]">{m.emoji}</Text>
                  <Text
                    numberOfLines={2}
                    className="mt-2 text-center font-sans-b text-[13px] text-ink"
                    style={{ marginTop: PROFILE_META_GAP + 4 }}
                  >
                    {m.label}
                  </Text>
                  {/* THE BADGE: a bright round "+" so it clearly means "add this". */}
                  <View
                    className="mt-2 h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: token.hex, marginTop: 8 }}
                  >
                    <PlusIcon size={16} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {filled.length > 0 ? (
        <View style={{ marginTop: toStart.length > 0 ? 20 : PROFILE_TITLE_TO_BODY }}>
          {showToStart && toStart.length > 0 ? (
            <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
              Filled
            </Text>
          ) : null}
          <View className="flex-row flex-wrap" style={{ gap: PROFILE_GRID_GAP }}>
            {visibleFilled.map((m) => (
              <Pressable
                key={m.id}
                onPress={withAnalyticsPress(PROFILE.card.favorites_tile, () =>
                  onOpenModule?.(m.id)
                )}
                accessibilityRole="button"
                accessibilityLabel={
                  own
                    ? `${m.label}, ${m.answeredCount} answers`
                    : `View ${m.label} answers, ${m.answeredCount} answers`
                }
                className="overflow-hidden rounded-card border border-ink-line bg-canvas"
                style={{ width: '47.5%', aspectRatio: 1 }}
              >
                <View className="flex-1 items-center justify-center bg-coral/15">
                  <Text className="text-[36px]">{m.emoji}</Text>
                </View>
                <View className="px-2.5 py-2" style={{ gap: PROFILE_META_GAP }}>
                  <Text numberOfLines={1} className="font-sans-b text-[14px] text-ink">
                    {m.label}
                  </Text>
                  <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
                    {m.answeredCount} answers
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* THIS SECTION DOES: pill under the four titles for See all. */}
          {hasMore ? (
            <View className="mt-3 items-center">
              <Pressable
                onPress={withAnalyticsPress(PROFILE.card.see_all, () => setExpanded((e) => !e))}
                accessibilityRole="button"
                accessibilityLabel={expanded ? 'Show fewer favorites' : 'See all favorites'}
                className="min-h-[36px] items-center justify-center rounded-full border border-ink-line bg-canvas px-5 active:opacity-90"
              >
                <Text
                  className="font-sans-b text-ink"
                  style={{ fontSize: PROFILE_SEE_ALL_SIZE }}
                >
                  {expanded ? 'Show less' : 'See all'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
