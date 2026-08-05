// ============================================
// WHAT THIS FILE DOES (plain English):
// Ask the group — Create a poll | Ask a question (co-op only), your live poll
// results underneath, and a link to previous polls. Non-members see nothing
// here; the co-op card elsewhere sells itself.
// Analytics: create_poll, ask_question, see_previous_polls from HOME.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  BarChart3Icon,
  ChevronRightIcon,
  HistoryIcon,
  MessageCircleIcon
} from 'lucide-react-native';
import { HOME } from '@bridger/shared';
import { Avatar, ORGANIC, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import type { HomePoll } from '../../data/feed';
import { personById } from '../../data/people';
import { PollResultsSheet } from './PollResultsSheet';

const BAR = ['bg-purple', 'bg-teal', 'bg-amber', 'bg-pink'];

export function AskWidget({
  onAsk,
  member = false,
  initialPolls = [],
  onSeePrevious
}: {
  onAsk: (kind: 'poll' | 'question') => void;
  member?: boolean;
  initialPolls?: HomePoll[];
  onSeePrevious?: () => void;
}) {
  const c = useThemeColors();
  const [polls, setPolls] = useState(initialPolls);
  const [openPoll, setOpenPoll] = useState<HomePoll | null>(null);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  if (!member) return null;

  function vote(pollId: string, optionId: string) {
    setPolls((p) =>
      p.map((poll) =>
        poll.id === pollId && !poll.myVote
          ? {
              ...poll,
              myVote: optionId,
              options: poll.options.map((o) =>
                o.id === optionId
                  ? { ...o, votes: o.votes + 1, voterIds: [...(o.voterIds ?? []), 'me'] }
                  : o
              )
            }
          : poll
      )
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        {/* Analytics: open the create-poll sheet. */}
        <Pressable
          onPress={withAnalyticsPress(HOME.ask_the_group.create_poll, () => onAsk('poll'))}
          accessibilityRole="button"
          accessibilityLabel="Create a poll"
          style={ORGANIC.bold}
          className="flex-1 items-center gap-2 bg-[#D5C2FF] px-4 py-5 active:opacity-90"
        >
          <BarChart3Icon size={24} color="#1C1B16" strokeWidth={2.4} />
          {/* onaccent = always-dark type, safe on the pale purple fill in both themes */}
          <Text className="font-sans-b text-[14px] text-onaccent">Create a poll</Text>
        </Pressable>
        {/* Analytics: open the ask-a-question sheet. */}
        <Pressable
          onPress={withAnalyticsPress(HOME.ask_the_group.ask_question, () => onAsk('question'))}
          accessibilityRole="button"
          accessibilityLabel="Ask a question"
          style={ORGANIC.flip}
          className="flex-1 items-center gap-2 bg-[#9FE7CE] px-4 py-5 active:opacity-90"
        >
          <MessageCircleIcon size={24} color="#1C1B16" strokeWidth={2.4} />
          <Text className="font-sans-b text-[14px] text-onaccent">Ask a question</Text>
        </Pressable>
      </View>

      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          onVote={vote}
          onOpen={() => setOpenPoll(polls.find((p) => p.id === poll.id) ?? poll)}
        />
      ))}

      {/* Analytics: previous polls archive link. */}
      <Pressable
        onPress={withAnalyticsPress(HOME.ask_the_group.see_previous_polls, onSeePrevious)}
        accessibilityRole="button"
        accessibilityLabel="See previous polls"
        className="w-full flex-row items-center gap-2 rounded-card border border-ink-line bg-surface px-3.5 py-3 active:opacity-90"
      >
        <View className="h-8 w-8 items-center justify-center rounded-full bg-surface">
          <HistoryIcon size={16} color={c.inkSoft} strokeWidth={2.5} />
        </View>
        <Text className="min-w-0 flex-1 font-sans-b text-[13px] text-ink">See previous polls</Text>
        <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.6} />
      </Pressable>

      <PollResultsSheet poll={openPoll} onClose={() => setOpenPoll(null)} />
    </View>
  );
}

function PollCard({
  poll,
  onVote,
  onOpen
}: {
  poll: HomePoll;
  onVote: (pollId: string, optionId: string) => void;
  onOpen: () => void;
}) {
  const total = poll.options.reduce((n, o) => n + o.votes, 0) || 1;
  const voters = poll.options.flatMap((o) => o.voterIds ?? []).slice(0, 4);
  const c = useThemeColors();

  return (
    <View className="rounded-card border border-ink-line bg-surface p-4">
      <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">Your poll</Text>
      <Text className="mt-1 font-sans-b text-[16px] leading-snug tracking-tight text-ink">
        {poll.prompt}
      </Text>

      {poll.kind === 'poll' ? (
        <View className="mt-3 gap-2">
          {poll.options.map((o, i) => {
            const pct = Math.round((o.votes / total) * 100);
            const mine = poll.myVote === o.id;
            return (
              <Pressable key={o.id} onPress={() => onVote(poll.id, o.id)} accessibilityRole="button">
                <View className="flex-row items-baseline justify-between">
                  <Text className={cn('font-sans-b text-[14px]', mine ? 'text-purple' : 'text-ink')}>
                    {o.label}
                  </Text>
                  <Text className="font-sans-b text-[12px] text-ink-mute">{o.votes}</Text>
                </View>
                <View className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink/10">
                  <View
                    className={cn('h-full rounded-full', BAR[i % BAR.length])}
                    style={{ width: `${Math.max(6, pct)}%` }}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* the whole card's payoff: who actually answered */}
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={poll.kind === 'poll' ? 'See who voted' : 'See replies'}
        className="mt-3 flex-row items-center gap-2 rounded-full border border-ink-line bg-canvas-raised py-1.5 pl-1.5 pr-3 active:opacity-90"
      >
        {poll.kind === 'poll' ? (
          <View className="flex-row">
            {voters.map((id, i) => {
              const p = personById(id);
              return (
                <View key={id} className={cn(i > 0 && '-ml-2')}>
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="xs" />
                </View>
              );
            })}
          </View>
        ) : (
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#DFF3E4]">
            <Text className="text-[14px]">💬</Text>
          </View>
        )}
        <Text className="min-w-0 flex-1 font-sans-b text-[13px] text-ink">
          {poll.kind === 'poll' ? 'See who voted' : `${poll.replies ?? 0} replies`}
        </Text>
        <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}
