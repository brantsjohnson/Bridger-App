// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 2 of Create event: invite people. First your full connections list,
// then a "Might be a good fit" section of friends-of-friends with a mutual
// first name (never a tier label). Selected rows turn green with a check.
// ============================================
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { CREATE_EVENT } from '@bridger/shared';
import { Avatar, SearchField, cn, withAnalyticsPress } from '@bridger/ui';
import { listInvitePool, listSuggestedInvites } from '../../../data/people';
import type { CreateEventDraft } from './types';

export function InviteStep({
  draft,
  onChange
}: {
  draft: CreateEventDraft;
  onChange: (patch: Partial<CreateEventDraft>) => void;
}) {
  const [query, setQuery] = useState('');
  const cap = draft.guestCap ?? 35;

  // All of your connections, A–Z.
  const pool = useMemo(() => listInvitePool(draft.coHostIds), [draft.coHostIds]);
  // FoF suggestions with mutual names (no tier words).
  const suggested = useMemo(
    () => listSuggestedInvites(draft.coHostIds),
    [draft.coHostIds]
  );

  const filteredPool = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((p) => p.name.toLowerCase().includes(q));
  }, [pool, query]);

  const filteredSuggested = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggested;
    return suggested.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.mutualName.toLowerCase().includes(q)
    );
  }, [suggested, query]);

  const atCap = draft.invitedIds.length >= cap;

  function toggle(id: string) {
    const has = draft.invitedIds.includes(id);
    if (!has && atCap) return;
    onChange({
      invitedIds: has
        ? draft.invitedIds.filter((x) => x !== id)
        : [...draft.invitedIds, id]
    });
  }

  return (
    <View className="flex-1">
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search people to invite"
        analyticsId={CREATE_EVENT.invite.search}
      />

      <Text className="mt-2 font-sans-sb text-[12px] text-ink-mute">
        {draft.invitedIds.length} invited · up to {cap}
      </Text>

      <ScrollView
        className="mt-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4 pb-8">
          {/* --- YOUR CONNECTIONS --- */}
          <View className="gap-2">
            <Text className="font-sans-b text-[13px] text-ink">Your connections</Text>
            {filteredPool.length === 0 ? (
              <Text className="py-4 text-center font-sans-sb text-[13px] text-ink-mute">
                No one matches that search.
              </Text>
            ) : null}
            {filteredPool.map((p) => {
              const on = draft.invitedIds.includes(p.id);
              const blocked = !on && atCap;
              return (
                <Pressable
                  key={p.id}
                  onPress={withAnalyticsPress(
                    CREATE_EVENT.invite.invite_row,
                    () => toggle(p.id),
                    { analyticsProps: { method: on ? 'off' : 'on' } }
                  )}
                  disabled={blocked}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, disabled: blocked }}
                  accessibilityLabel={`${on ? 'Remove' : 'Invite'} ${p.name}`}
                  className={cn(
                    'min-h-[56px] flex-row items-center gap-3 rounded-card border px-3 py-2',
                    on ? 'border-green bg-green/15' : 'border-ink-line bg-surface',
                    blocked && 'opacity-40'
                  )}
                >
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="md" />
                  <Text className="min-w-0 flex-1 font-sans-b text-[14px] text-ink">{p.name}</Text>
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-full border',
                      on ? 'border-green bg-green' : 'border-ink-line'
                    )}
                  >
                    {on ? <CheckIcon size={14} color="#fff" strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* --- MIGHT BE A GOOD FIT (friends of friends) --- */}
          <View className="gap-2">
            <Text className="font-sans-b text-[13px] text-ink">Might be a good fit</Text>
            <Text className="font-sans-sb text-[12px] leading-snug text-ink-mute">
              People your friends know who would vibe here.
            </Text>
            {filteredSuggested.map((p) => {
              const on = draft.invitedIds.includes(p.id);
              const blocked = !on && atCap;
              return (
                <Pressable
                  key={p.id}
                  onPress={withAnalyticsPress(
                    CREATE_EVENT.invite.suggest_row,
                    () => toggle(p.id),
                    { analyticsProps: { method: on ? 'off' : 'on' } }
                  )}
                  disabled={blocked}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, disabled: blocked }}
                  accessibilityLabel={`${on ? 'Remove' : 'Invite'} ${p.name}, mutual ${p.mutualName}`}
                  className={cn(
                    'min-h-[56px] flex-row items-center gap-3 rounded-card border px-3 py-2',
                    on ? 'border-green bg-green/15' : 'border-ink-line bg-surface',
                    blocked && 'opacity-40'
                  )}
                >
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="md" />
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-b text-[14px] text-ink">{p.name}</Text>
                    <Text className="font-sans-sb text-[12px] text-ink-mute">
                      Mutual: {p.mutualName}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-full border',
                      on ? 'border-green bg-green' : 'border-ink-line'
                    )}
                  >
                    {on ? <CheckIcon size={14} color="#fff" strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
