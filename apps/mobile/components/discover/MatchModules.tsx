// ============================================
// WHAT THIS FILE DOES (plain English):
// Personality quizzes at the top of Discover (analytics ids stay
// connect_over). Short private quizzes that only feed introductions
// (answers never appear on a profile). Each quiz is a big colored card.
// Behind the Scenes is archived (flow kept, not listed). Analytics:
// opening emits module_started; finishing emits module_completed
// (module id only — never answer text).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRightIcon } from 'lucide-react-native';
import {
  DISCOVER,
  type DisclosureSaveInput,
  trackProduct
} from '@bridger/shared';
import {
  ACCENTS,
  Reveal,
  SectionTitle,
  Wiggle,
  cn,
  funShape,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import type { MatchModule } from '../../data/discover';
import { skipTabEnterAnimation } from '../../lib/tab-snapshots';
import {
  saveAttachmentResult,
  saveDisclosure,
  saveHumorResult,
  savePersonalityResult,
  saveValuesResult
} from '../../data/discover';
import { AttachmentFlow } from '../../quizzes/discover/attachment/AttachmentFlow';
import type { AttachmentScoreResult } from '../../quizzes/discover/attachment/score';
import {
  draftProgressPercent,
  loadDiscoverDraft
} from '../../quizzes/discover/_shared/discover-draft';
import { DisclosureFlow } from '../../quizzes/discover/disclosure/DisclosureFlow';
import { HumorFlow } from '../../quizzes/discover/humor/HumorFlow';
import type { HumorScoreResult } from '../../quizzes/discover/humor/score';
import { PersonalityFlow } from '../../quizzes/discover/personality/PersonalityFlow';
import type { PersonalityScoreResult } from '../../quizzes/discover/personality/score';
import { ValuesFlow } from '../../quizzes/discover/values/ValuesFlow';
import type { ValuesScoreResult } from '../../quizzes/discover/values/score';

/** Modules with a custom take UI (not ModuleFlow). */
const CUSTOM_FLOWS = new Set([
  'disclosure',
  'personality',
  'attachment',
  'values',
  'humor'
]);

/** MatchModule ids that use on-device draft save (slug === module id). */
const DRAFT_MODULE_IDS = ['humor', 'personality', 'values', 'attachment'] as const;

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
  /** show the "Personality quizzes" pixel heading (off when a screen already titles it) */
  showHeader?: boolean;
  /** when set with onSeeMore, only this many cards show before "See more" */
  previewLimit?: number;
  /** tapped "See more" — usually navigates to the full Personality quizzes screen */
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
  /** unfinished quiz progress % from on-device drafts (module id → 0–99) */
  const [draftPercents, setDraftPercents] = useState<Record<string, number>>({});

  // THIS SECTION DOES: load resume % for unfinished humor / personality / values / attachment.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Record<string, number> = {};
      await Promise.all(
        DRAFT_MODULE_IDS.map(async (id) => {
          if (completedIds.includes(id)) return;
          const draft = await loadDiscoverDraft(id);
          const percent = draftProgressPercent(draft);
          if (percent > 0) next[id] = percent;
        })
      );
      if (!cancelled) setDraftPercents(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [completedIds, openId]);


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

  const finishDisclosure = async (input: DisclosureSaveInput) => {
    await saveDisclosure(input);
    const started = startedAt.current;
    trackProduct('module_completed', {
      module: 'disclosure',
      time_to_complete_ms: started != null ? Date.now() - started : undefined
    });
    startedAt.current = null;
    void onComplete('disclosure');
    setOpenId(null);
  };

  const finishPersonality = async (result: PersonalityScoreResult) => {
    await savePersonalityResult(result);
    const started = startedAt.current;
    trackProduct('module_completed', {
      module: 'personality',
      time_to_complete_ms: started != null ? Date.now() - started : undefined
    });
    startedAt.current = null;
    void onComplete('personality');
    setOpenId(null);
  };

  const finishAttachment = async (result: AttachmentScoreResult) => {
    await saveAttachmentResult(result);
    const started = startedAt.current;
    trackProduct('module_completed', {
      module: 'attachment',
      time_to_complete_ms: started != null ? Date.now() - started : undefined
    });
    startedAt.current = null;
    void onComplete('attachment');
    setOpenId(null);
  };

  const finishValues = async (result: ValuesScoreResult) => {
    await saveValuesResult(result);
    const started = startedAt.current;
    trackProduct('module_completed', {
      module: 'values',
      time_to_complete_ms: started != null ? Date.now() - started : undefined
    });
    startedAt.current = null;
    void onComplete('values');
    setOpenId(null);
  };

  const finishHumor = async (result: HumorScoreResult) => {
    await saveHumorResult(result);
    const started = startedAt.current;
    trackProduct('module_completed', {
      module: 'humor',
      time_to_complete_ms: started != null ? Date.now() - started : undefined
    });
    startedAt.current = null;
    void onComplete('humor');
    setOpenId(null);
  };

  return (
    <View>
      {showHeader ? (
        <SectionTitle
          title="Personality quizzes"
          description="Answer a few private questions. They never appear on your profile. After you connect, In common uses what each of you shares with that circle."
          infoAnalyticsId={DISCOVER.connect_over.info}
          parentScreen="discover"
          section="connect_over"
          className="mb-3"
        />
      ) : null}

      <View className="gap-3">
        {visible.map((m, i) => (
          <Reveal key={m.id} index={i} instant={skipTabEnterAnimation('discover')}>
            <ModuleCard
              module={m}
              done={completedIds.includes(m.id)}
              resumePercent={draftPercents[m.id] ?? 0}
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
          accessibilityLabel="See more personality quizzes"
          className="mt-3 min-h-[44px] w-full flex-row items-center justify-center gap-1 py-2 active:opacity-70"
        >
          <Text className="font-sans-b text-[13px] text-ink-soft">See more</Text>
          <ChevronRightIcon size={15} color={c.inkSoft} strokeWidth={2.6} />
        </Pressable>
      ) : null}

      {active?.id === 'disclosure' ? (
        <DisclosureFlow
          open
          parentScreen="discover"
          onClose={() => {
            startedAt.current = null;
            setOpenId(null);
          }}
          onSave={finishDisclosure}
        />
      ) : null}

      {active?.id === 'personality' ? (
        <PersonalityFlow
          open
          parentScreen="discover"
          onClose={() => {
            startedAt.current = null;
            setOpenId(null);
          }}
          onComplete={finishPersonality}
        />
      ) : null}

      {active?.id === 'attachment' ? (
        <AttachmentFlow
          open
          parentScreen="discover"
          onClose={() => {
            startedAt.current = null;
            setOpenId(null);
          }}
          onComplete={finishAttachment}
        />
      ) : null}

      {active?.id === 'values' ? (
        <ValuesFlow
          open
          parentScreen="discover"
          onClose={() => {
            startedAt.current = null;
            setOpenId(null);
          }}
          onComplete={finishValues}
        />
      ) : null}

      {active?.id === 'humor' ? (
        <HumorFlow
          open
          parentScreen="discover"
          onClose={() => {
            startedAt.current = null;
            setOpenId(null);
          }}
          onComplete={finishHumor}
        />
      ) : null}
    </View>
  );
}

/**
 * One module, built like the Touch Grass button: a VIVID full-color block with
 * a hand-cut shape, a big emoji you can see across the room, the title, a short
 * line about it, and a tag that reads "To do" (or "Done"). An unfinished card
 * with a saved draft shows percent done instead. An unfinished card gives its
 * tag a little wiggle every few seconds to keep asking for you.
 *
 * The shape is picked from the module's own id, so a card always looks the same
 * but the stack down the page leans different ways.
 */
function ModuleCard({
  module: m,
  done,
  resumePercent = 0,
  onOpen,
  analyticsId
}: {
  module: MatchModule;
  done: boolean;
  /** 0–99 from on-device draft; only used when not done */
  resumePercent?: number;
  onOpen: () => void;
  analyticsId: string;
}) {
  const token = ACCENTS[m.accent];
  // THIS SECTION DOES: pick badge copy for done / in-progress / not started.
  const badgeLabel = done
    ? 'Done'
    : resumePercent > 0
      ? `${resumePercent}%`
      : 'To do';
  const statusForA11y = done
    ? 'done'
    : resumePercent > 0
      ? `${resumePercent} percent complete, finish`
      : 'to do';

  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onOpen, { analyticsProps: { module: m.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${m.title}, ${statusForA11y}. ${m.blurb}`}
      style={funShape(m.id)}
      className={cn(
        'w-full flex-row items-center gap-4 px-5 py-5 active:opacity-90',
        token.bg,
        done && 'opacity-60'
      )}
    >
      {/* THIS SECTION DOES: hold the big emoji in a tall enough box. leading-none
          plus the card's rounded corners was chopping the top of tall glyphs. */}
      <View
        accessible={false}
        className="h-[52px] w-[52px] shrink-0 items-center justify-center"
      >
        <Text
          accessible={false}
          style={{ fontSize: 40, lineHeight: 52, textAlign: 'center' }}
        >
          {m.emoji}
        </Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={2}
          className={cn('font-sans-b text-[18px] leading-snug tracking-tight', token.text)}
        >
          {m.title}
        </Text>
        <Text
          numberOfLines={3}
          className={cn('mt-1 font-sans-sb text-[13px] leading-snug opacity-85', token.text)}
        >
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
            {badgeLabel}
          </Text>
        </View>
      </Wiggle>
    </Pressable>
  );
}
