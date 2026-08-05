// ============================================
// WHAT THIS FILE DOES (plain English):
// "Connect Over" at the top of Discover — short private modules that only feed
// introductions (answers never appear on a profile). Each module is a big,
// colored, rectangular card: emoji next to the title, a one-line description,
// and a little "To do" / "Done" tag. On Discover we show a couple of cards with
// a "See more" link that opens the full Connect Over screen; that screen reuses
// this same component to show every module.
// Analytics: opening one emits module_started; finishing emits module_completed
// (module id only — never answer text).
// ============================================
import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRightIcon } from 'lucide-react-native';
import { DISCOVER, trackProduct } from '@bridger/shared';
import {
  ACCENTS,
  ModuleFlow,
  Reveal,
  SectionTitle,
  Wiggle,
  cn,
  funShape,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import type { MatchModule } from '../../data/discover';

export function MatchModules({
  modules,
  completedIds,
  onComplete,
  showHeader = true,
  previewLimit,
  onSeeMore,
  tileAnalyticsId,
  seeMoreAnalyticsId
}: {
  modules: MatchModule[];
  completedIds: string[];
  onComplete: (moduleId: string) => void | Promise<void>;
  /** show the "Connect Over" pixel heading (off when a screen already titles it) */
  showHeader?: boolean;
  /** when set with onSeeMore, only this many cards show before "See more" */
  previewLimit?: number;
  /** tapped "See more" — usually navigates to the full Connect Over screen */
  onSeeMore?: () => void;
  /** analytics id for a card tap (defaults to the Discover preview id) */
  tileAnalyticsId?: string;
  /** analytics id for the "See more" link */
  seeMoreAnalyticsId?: string;
}) {
  const c = useThemeColors();
  const [openId, setOpenId] = useState<string | null>(null);
  const active = modules.find((m) => m.id === openId) ?? null;
  /** when the open module started — for time_to_complete_ms */
  const startedAt = useRef<number | null>(null);

  // Unfinished modules first, so the top cards are always actionable.
  const ordered = [...modules].sort((a, b) => {
    const aDone = completedIds.includes(a.id) ? 1 : 0;
    const bDone = completedIds.includes(b.id) ? 1 : 0;
    return aDone - bDone;
  });

  // Preview mode = a limit + a "See more" handler. Otherwise show everything.
  const isPreview = previewLimit != null && !!onSeeMore;
  const visible = isPreview ? ordered.slice(0, previewLimit) : ordered;
  const hasMore = isPreview && ordered.length > (previewLimit ?? 0);
  const tileId = tileAnalyticsId ?? DISCOVER.connect_over.module_tile;

  const openModule = (id: string) => {
    setOpenId(id);
    startedAt.current = Date.now();
    trackProduct('module_started', { module: id });
  };

  const finishModule = () => {
    if (!active) return;
    const started = startedAt.current;
    trackProduct('module_completed', {
      module: active.id,
      time_to_complete_ms: started != null ? Date.now() - started : undefined
    });
    startedAt.current = null;
    void onComplete(active.id);
    setOpenId(null);
  };

  return (
    <View>
      {showHeader ? (
        <SectionTitle
          title="Connect Over"
          description="Answer a few private questions. They are never shared and only help connect you to more relevant friends."
          infoAnalyticsId={DISCOVER.connect_over.info}
          parentScreen="discover"
          section="connect_over"
          className="mb-3"
        />
      ) : null}

      <View className="gap-3">
        {visible.map((m, i) => (
          <Reveal key={m.id} index={i}>
            <ModuleCard
              module={m}
              done={completedIds.includes(m.id)}
              analyticsId={tileId}
              onOpen={() => openModule(m.id)}
            />
          </Reveal>
        ))}
      </View>

      {hasMore ? (
        <Pressable
          onPress={withAnalyticsPress(
            seeMoreAnalyticsId ?? DISCOVER.connect_over.see_more,
            onSeeMore
          )}
          accessibilityRole="button"
          accessibilityLabel="See more Connect Over modules"
          className="mt-3 min-h-[44px] w-full flex-row items-center justify-center gap-1 py-2 active:opacity-70"
        >
          <Text className="font-sans-b text-[13px] text-ink-soft">See more</Text>
          <ChevronRightIcon size={15} color={c.inkSoft} strokeWidth={2.6} />
        </Pressable>
      ) : null}

      {active ? (
        <ModuleFlow
          open
          mode="private"
          title={active.kind === 'quiz' ? `${active.title} · quiz` : active.title}
          intro={active.blurb}
          questions={active.questions}
          onClose={() => {
            startedAt.current = null;
            setOpenId(null);
          }}
          onDone={finishModule}
        />
      ) : null}
    </View>
  );
}

/**
 * One module, built like the Touch Grass button: a VIVID full-color block with
 * a hand-cut shape, a big emoji you can see across the room, the title, a short
 * line about it, and a tag that reads "To do" (or "Done"). An unfinished card
 * gives its tag a little wiggle every few seconds to keep asking for you.
 *
 * The shape is picked from the module's own id, so a card always looks the same
 * but the stack down the page leans different ways.
 */
function ModuleCard({
  module: m,
  done,
  onOpen,
  analyticsId
}: {
  module: MatchModule;
  done: boolean;
  onOpen: () => void;
  analyticsId: string;
}) {
  const token = ACCENTS[m.accent];

  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onOpen, { analyticsProps: { module: m.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${m.title}, ${done ? 'done' : 'to do'}. ${m.blurb}`}
      style={funShape(m.id)}
      className={cn(
        'w-full flex-row items-center gap-4 px-5 py-5 active:opacity-90',
        token.bg,
        done && 'opacity-60'
      )}
    >
      {/* The emoji is the loudest thing on the card, on purpose. */}
      <Text accessible={false} className="text-[42px] leading-none">
        {m.emoji}
      </Text>

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className={cn('font-sans-b text-[18px] tracking-tight', token.text)}
        >
          {m.title}
        </Text>
        <Text numberOfLines={2} className={cn('mt-1 font-sans-sb text-[13px] leading-snug opacity-85', token.text)}>
          {m.blurb}
        </Text>
      </View>

      <Wiggle active={!done} everyMs={5000}>
        <View
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1',
            done ? 'bg-white/25' : 'bg-white'
          )}
        >
          <Text
            className={cn(
              'font-sans-b text-[10px] uppercase tracking-wide',
              // Always near-black on the white pill — text-ink goes light in dark mode and disappears.
              done ? token.text : 'text-[#1C1B16]'
            )}
          >
            {done ? 'Done' : 'To do'}
          </Text>
        </View>
      </Wiggle>
    </Pressable>
  );
}
