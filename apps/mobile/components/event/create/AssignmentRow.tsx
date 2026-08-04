// ============================================
// WHAT THIS FILE DOES (plain English):
// One line of the "who's bringing what" sign-up list. It shows the item (e.g.
// "chips") and a dropdown of guests. Pick a guest and the item is claimed —
// their face + first name and last initial show, and the item text gets crossed
// off. You can re-open it by choosing "Open it back up". There is also an
// optional handle so a guest can chip in money instead of bringing the thing.
//
// PAYMENT: the chip-in handle is a plain Venmo / Cash App handle. Bridger never
// moves the money.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
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
  onAssign,
  onChangeHandle
}: {
  item: EventAssignment;
  /** everyone who could claim it (host + invited guests) */
  candidates: Person[];
  onAssign: (personId?: string) => void;
  onChangeHandle: (handle: string) => void;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  const assignee = candidates.find((p) => p.id === item.assigneeId);
  const taken = !!assignee;

  return (
    <View className="rounded-card border border-ink-line bg-surface px-3.5 py-3">
      <View className="flex-row items-center gap-3">
        <Text
          numberOfLines={1}
          className={cn(
            'min-w-0 flex-1 font-sans-b text-[14px] text-ink',
            taken && 'text-ink-mute line-through'
          )}
        >
          {item.label}
        </Text>

        {/* The name dropdown: shows the claimer, or "Add name" when open */}
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
              <Avatar name={assignee.name} emoji={assignee.emoji} accent={assignee.accent} personId={assignee.id} size="xs" />
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
          {/* Clear / open it back up */}
          <Pressable
            onPress={() => {
              onAssign(undefined);
              setOpen(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Open it back up"
            className="border-b border-ink-line px-3.5 py-2.5 active:bg-ink/5"
          >
            <Text className="font-sans-sb text-[13px] text-ink-mute">Open it back up</Text>
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

      {/* Optional: chip in money instead of bringing the item */}
      <View className="mt-2.5 flex-row items-center gap-2 rounded-full border border-ink-line bg-canvas-raised px-3.5 h-10">
        <Text className="font-sans-sb text-[12px] text-ink-mute">or chip in</Text>
        <TextInput
          value={item.chipInHandle ?? ''}
          onChangeText={onChangeHandle}
          placeholder="@handle"
          placeholderTextColor={c.inkMute}
          accessibilityLabel={`Chip-in handle for ${item.label}`}
          className="min-w-0 flex-1 font-sans-sb text-[13px] text-ink"
          style={{ padding: 0 }}
        />
      </View>
    </View>
  );
}
