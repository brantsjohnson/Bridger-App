// ============================================
// WHAT THIS FILE DOES (plain English):
// One Assignments row. Shows the item label and a dropdown of guests. Picking
// a guest claims the item (no strikethrough — checking off happens later on
// the event page, where the assignee or host can do it). No per-item chip-in.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDownIcon } from 'lucide-react-native';
import type { EventAssignment, Person } from '@bridger/shared';
import { CREATE_EVENT } from '@bridger/shared';
import { Avatar, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';

/** "Maya O." — first name plus last initial, per the spec. */
function shortName(p: Person): string {
  const [first, ...rest] = p.name.split(' ');
  const lastInitial = rest.length ? `${rest[rest.length - 1][0]}.` : '';
  return lastInitial ? `${first} ${lastInitial}` : first;
}

export function AssignmentRow({
  item,
  candidates,
  onAssign
}: {
  item: EventAssignment;
  /** everyone who could claim it (host + invited guests) */
  candidates: Person[];
  onAssign: (personId?: string) => void;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  const assignee = candidates.find((p) => p.id === item.assigneeId);
  const taken = !!assignee;

  return (
    <View className="rounded-card border border-ink-line bg-surface px-3.5 py-3">
      <View className="flex-row items-center gap-3">
        {/* Assigned does NOT cross the label off — only "done" does that later */}
        <Text numberOfLines={1} className="min-w-0 flex-1 font-sans-b text-[14px] text-ink">
          {item.label}
        </Text>

        <Pressable
          onPress={withAnalyticsPress(CREATE_EVENT.extras.assign_name, () => setOpen((v) => !v))}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={taken ? `Assigned to ${assignee?.name}. Change` : `Assign ${item.label}`}
          className={cn(
            'min-h-[40px] flex-row items-center gap-2 rounded-full border py-1 pl-1 pr-2.5',
            taken ? 'border-green bg-green/15' : 'border-ink-line bg-canvas-raised'
          )}
        >
          {assignee ? (
            <>
              <Avatar
                name={assignee.name}
                emoji={assignee.emoji}
                accent={assignee.accent}
                personId={assignee.id}
                size="xs"
              />
              <Text className="font-sans-b text-[13px] text-ink">{shortName(assignee)}</Text>
            </>
          ) : (
            <Text className="pl-2 font-sans-b text-[13px] text-ink-soft">Add name</Text>
          )}
          <ChevronDownIcon size={16} color={c.inkMute} strokeWidth={2.6} />
        </Pressable>
      </View>

      {open ? (
        <View className="mt-2.5 overflow-hidden rounded-2xl border border-ink-line">
          <Pressable
            onPress={() => {
              onAssign(undefined);
              setOpen(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear assignment"
            className="border-b border-ink-line px-3.5 py-2.5 active:bg-ink/5"
          >
            <Text className="font-sans-sb text-[13px] text-ink-mute">Leave open</Text>
          </Pressable>
          {candidates.map((p) => {
            const on = p.id === item.assigneeId;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  onAssign(p.id);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={p.name}
                className={cn(
                  'flex-row items-center gap-2.5 border-b border-ink-line px-3.5 py-2.5 last:border-b-0 active:bg-ink/5',
                  on && 'bg-green/10'
                )}
              >
                <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="sm" />
                <Text className="font-sans-b text-[13px] text-ink">{shortName(p)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
