// ============================================
// WHAT THIS FILE DOES (plain English):
// Opens when you tap "See who voted" on a poll. Shows every option, who picked
// it, and who has not answered yet. Polls among friends are never anonymous;
// the point is knowing your people, not a leaderboard. Matches Magic Patterns.
// ============================================
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Avatar, Sheet, cn } from '@bridger/ui';
import type { HomePoll } from '../../data/feed';
import { personById } from '../../data/people';

const BAR = ['bg-purple', 'bg-teal', 'bg-amber', 'bg-pink'] as const;

export function PollResultsSheet({
  poll,
  onClose
}: {
  poll: HomePoll | null;
  onClose: () => void;
}) {
  const open = Boolean(poll);
  const total = poll ? poll.options.reduce((n, o) => n + o.votes, 0) : 0;
  const voted = poll ? poll.options.flatMap((o) => o.voterIds ?? []) : [];
  const waiting = (poll?.askedIds ?? []).filter((id) => !voted.includes(id));

  return (
    <Sheet open={open} onClose={onClose} title={poll?.prompt ?? 'Results'}>
      {poll ? (
        <ScrollView className="max-h-[62vh]" showsVerticalScrollIndicator={false}>
          <Text className="mb-4 font-sans-sb text-[12px] text-ink-mute">
            {poll.kind === 'poll'
              ? `${total} ${total === 1 ? 'vote' : 'votes'} · shared with ${(poll.audience ?? 'friends').toLowerCase()}`
              : `${poll.replies ?? 0} replies · shared with ${(poll.audience ?? 'friends').toLowerCase()}`}
          </Text>

          {poll.kind === 'poll' ? (
            <View className="gap-3.5">
              {poll.options.map((o, i) => {
                const pct = total ? Math.round((o.votes / total) * 100) : 0;
                const mine = poll.myVote === o.id;
                const people = (o.voterIds ?? []).map(personById);

                return (
                  <View key={o.id}>
                    <View className="flex-row items-baseline justify-between gap-3">
                      <Text
                        className={cn(
                          'min-w-0 flex-1 font-sans-b text-[15px] text-ink',
                          mine && 'text-purple'
                        )}
                        numberOfLines={1}
                      >
                        {o.label}
                        {mine ? (
                          <Text className="font-sans-b text-[11px] uppercase tracking-wide text-purple">
                            {' '}
                            your pick
                          </Text>
                        ) : null}
                      </Text>
                      <Text className="shrink-0 font-sans-b text-[12px] text-ink-mute">
                        {o.votes} · {pct}%
                      </Text>
                    </View>

                    <View className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/10">
                      <View
                        className={cn('h-full rounded-full', BAR[i % BAR.length])}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </View>

                    {people.length > 0 ? (
                      <View className="mt-2 flex-row flex-wrap gap-1.5">
                        {people.map((p) => (
                          <View
                            key={p.id}
                            className="flex-row items-center gap-1.5 rounded-full border border-ink-line bg-surface py-1 pl-1 pr-2.5"
                          >
                            <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                            <Text className="font-sans-b text-[12px] text-ink">
                              {p.id === 'me' ? 'You' : p.name.split(' ')[0]}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text className="mt-1.5 font-sans-sb text-[12px] text-ink-mute">Nobody yet.</Text>
                    )}
                  </View>
                );
              })}

              {waiting.length > 0 ? (
                <View className="border-t border-ink-line pt-3">
                  <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                    Yet to answer
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {waiting.map((id) => {
                      const p = personById(id);
                      return (
                        <View
                          key={id}
                          className="flex-row items-center gap-1.5 rounded-full border border-dashed border-ink-line py-1 pl-1 pr-2.5 opacity-70"
                        >
                          <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                          <Text className="font-sans-b text-[12px] text-ink-soft">
                            {p.id === 'me' ? 'You' : p.name.split(' ')[0]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <Text className="font-sans-sb text-[13px] text-ink-mute">
              Replies will show here when the questions flow ships.
            </Text>
          )}
        </ScrollView>
      ) : null}
    </Sheet>
  );
}
