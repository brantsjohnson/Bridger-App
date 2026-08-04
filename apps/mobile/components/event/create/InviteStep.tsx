// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 2 of Create event: choosing who to invite. You search a single merged
// list of your acquaintances plus (if you picked a co-host) their acquaintances,
// and tap to add or remove people. There is a 35-guest cap.
//
// PRIVACY: the list is de-identified. Every entry looks the same and the list
// is sorted A-Z, so you can never tell whose acquaintance a person is — you
// just see people you could invite.
// ============================================
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { CREATE_EVENT } from '@bridger/shared';
import { Avatar, SearchField, cn, withAnalyticsPress } from '@bridger/ui';
import { listInvitePool } from '../../../data/people';
import type { CreateEventDraft } from './types';

const GUEST_CAP = 35;

export function InviteStep({
  draft,
  onChange
}: {
  draft: CreateEventDraft;
  onChange: (patch: Partial<CreateEventDraft>) => void;
}) {
  const [query, setQuery] = useState('');

  // Merged, de-identified, alphabetical pool (recomputed if the co-host changes).
  const pool = useMemo(() => listInvitePool(draft.coHostId), [draft.coHostId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((p) => p.name.toLowerCase().includes(q));
  }, [pool, query]);

  const atCap = draft.invitedIds.length >= GUEST_CAP;

  function toggle(id: string) {
    const has = draft.invitedIds.includes(id);
    if (!has && atCap) return; // don't add past the cap
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
        {draft.invitedIds.length} invited · up to {GUEST_CAP}
      </Text>

      <ScrollView
        className="mt-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2 pb-8">
          {filtered.length === 0 ? (
            <Text className="py-8 text-center font-sans-sb text-[13px] text-ink-mute">
              No one matches that search.
            </Text>
          ) : null}

          {filtered.map((p) => {
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
                  on ? 'border-purple bg-purple/10' : 'border-ink-line bg-surface',
                  blocked && 'opacity-40'
                )}
              >
                <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="md" />
                <Text className="min-w-0 flex-1 font-sans-b text-[14px] text-ink">{p.name}</Text>
                <View
                  className={cn(
                    'h-6 w-6 items-center justify-center rounded-full border',
                    on ? 'border-purple bg-purple' : 'border-ink-line'
                  )}
                >
                  {on ? <CheckIcon size={14} color="#fff" strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
