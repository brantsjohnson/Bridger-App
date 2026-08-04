// ============================================
// WHAT THIS FILE DOES (plain English):
// "Know me better" at the top of Discover — short private modules that only
// feed introductions. Shows TWO widget tiles at a time (unfinished first);
// "See all" expands the rest. Opening one launches ModuleFlow in private mode.
// Answers never appear on a profile. (Avoids "match" dating-app wording.)
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  LockIcon
} from 'lucide-react-native';
import { ACCENTS, ModuleFlow, PixelHeading, cn, useThemeColors } from '@bridger/ui';
import type { MatchModule } from '../../data/discover';

/** How many module widgets show before "See all". */
const PREVIEW_COUNT = 2;

export function MatchModules({
  modules,
  completedIds,
  onComplete
}: {
  modules: MatchModule[];
  completedIds: string[];
  compact?: boolean;
  onComplete: (moduleId: string) => void | Promise<void>;
}) {
  const c = useThemeColors();
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const active = modules.find((m) => m.id === openId) ?? null;
  const done = completedIds.length;
  const all = modules.length;
  const complete = all > 0 && done === all;

  // Unfinished modules first, so the two visible tiles are always actionable.
  const ordered = [...modules].sort((a, b) => {
    const aDone = completedIds.includes(a.id) ? 1 : 0;
    const bDone = completedIds.includes(b.id) ? 1 : 0;
    return aDone - bDone;
  });
  const visible = expanded ? ordered : ordered.slice(0, PREVIEW_COUNT);
  const hasMore = ordered.length > PREVIEW_COUNT;

  return (
    <View>
      <View className="mb-2 flex-row items-baseline justify-between gap-3">
        <PixelHeading size="md">Know me better</PixelHeading>
        <Text className="font-sans-b text-[12px] text-ink-mute">
          {done}/{all} done
        </Text>
      </View>

      <View className="mb-3 flex-row items-start gap-1.5">
        <LockIcon size={14} color={c.inkMute} strokeWidth={2.6} style={{ marginTop: 2 }} />
        <Text className="flex-1 font-sans-sb text-[13px] leading-snug text-ink-mute">
          Answers are never shared. They only connect you to more relevant friends.
        </Text>
      </View>

      <View className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <View
          className={cn('h-full rounded-full', complete ? 'bg-success' : 'bg-ink')}
          style={{ width: all ? `${(done / all) * 100}%` : '0%' }}
        />
      </View>

      <View className="gap-2.5">
        {visible.map((m) => (
          <ModuleWidget
            key={m.id}
            module={m}
            done={completedIds.includes(m.id)}
            onOpen={() => setOpenId(m.id)}
          />
        ))}
      </View>

      {hasMore ? (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={expanded ? 'Show fewer modules' : `See all ${all} modules`}
          className="mt-2.5 min-h-[44px] w-full flex-row items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-line bg-surface/60 px-4 py-3 active:bg-[#F1ECFF]"
        >
          <Text className="font-sans-b text-[13px] text-ink-soft">
            {expanded ? 'Show less' : `See all ${all}`}
          </Text>
          {expanded ? (
            <ChevronUpIcon size={16} color={c.inkSoft} strokeWidth={2.6} />
          ) : (
            <ChevronDownIcon size={16} color={c.inkSoft} strokeWidth={2.6} />
          )}
        </Pressable>
      ) : null}

      {active ? (
        <ModuleFlow
          open
          mode="private"
          title={active.kind === 'quiz' ? `${active.title} · quiz` : active.title}
          intro={active.blurb}
          questions={active.questions}
          onClose={() => setOpenId(null)}
          onDone={() => {
            void onComplete(active.id);
            setOpenId(null);
          }}
        />
      ) : null}
    </View>
  );
}

/** One module as a rectangular widget tile: big emoji square, title, blurb. */
function ModuleWidget({
  module: m,
  done,
  onOpen
}: {
  module: MatchModule;
  done: boolean;
  onOpen: () => void;
}) {
  const c = useThemeColors();
  const token = ACCENTS[m.accent];

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${m.title}${done ? ', done' : ''}. ${m.blurb}`}
      className={cn(
        // bg-surface (not bg-white) so dark mode gets a raised dark card —
        // otherwise text-ink goes light on pure white and the titles vanish.
        'w-full flex-row items-center gap-3.5 rounded-2xl border bg-surface p-4',
        done ? 'border-ink-line opacity-70' : 'border-ink-line active:border-purple/40'
      )}
    >
      <View
        accessible={false}
        className={cn(
          'h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          token.tintSolid
        )}
      >
        <Text className="text-[22px]">{m.emoji}</Text>
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="font-sans-b text-[15px] tracking-tight text-ink">
            {m.title}
          </Text>
          {m.kind === 'quiz' ? (
            <Text className="shrink-0 rounded-full bg-ink/5 px-1.5 py-0.5 font-sans-b text-[9px] uppercase tracking-wide text-ink-mute">
              quiz
            </Text>
          ) : null}
        </View>
        <Text numberOfLines={2} className="mt-0.5 font-sans-sb text-[12px] leading-snug text-ink-mute">
          {m.blurb}
        </Text>
      </View>

      {done ? (
        <CheckIcon size={18} color="#2FA85B" strokeWidth={2.8} />
      ) : (
        <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.5} />
      )}
    </Pressable>
  );
}
