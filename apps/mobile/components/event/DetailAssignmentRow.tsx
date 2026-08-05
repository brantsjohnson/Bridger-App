// ============================================
// WHAT THIS FILE DOES (plain English):
// One Assignments row on the event detail page. Same colorful name dropdown as
// create (assign / reassign / leave open). The assignee (or host viewing) can
// see the check-off; only the assignee can toggle done. No "Snag" label.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon, ChevronDownIcon } from 'lucide-react-native';
import type { EventAssignment, Person } from '@bridger/shared';
import { EVENTS } from '@bridger/shared';
import { Avatar, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';

/** "Maya O." — first name plus last initial. */
function shortName(p: Person): string {
  const [first, ...rest] = p.name.split(' ');
  const lastInitial = rest.length ? `${rest[rest.length - 1]![0]}.` : '';
  return lastInitial ? `${first} ${lastInitial}` : first!;
}

export function DetailAssignmentRow({
  item,
  candidates,
  canToggleDone,
  showDoneState,
  onAssign,
  onToggleDone
}: {
  item: EventAssignment;
  candidates: Person[];
  /** Only the assignee may check it off */
  canToggleDone: boolean;
  /** Host (and assignee) see the done mark even when they cannot toggle */
  showDoneState: boolean;
  onAssign: (personId?: string) => void;
  onToggleDone: () => void;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  const assignee = candidates.find((p) => p.id === item.assigneeId) ?? null;
  const taken = !!assignee;

  return (
    <View className="rounded-card border border-ink-line bg-surface px-3.5 py-3">
      <View className="flex-row items-center gap-3">
        {canToggleDone ? (
          <Pressable
            onPress={withAnalyticsPress(EVENTS.detail.assignment_row, onToggleDone)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!item.done }}
            accessibilityLabel={item.done ? 'Mark not done' : 'Check off'}
            className={cn(
              'h-7 w-7 items-center justify-center rounded-full border',
              item.done ? 'border-green bg-green' : 'border-ink-line'
            )}
          >
            {item.done ? <CheckIcon size={14} color="#1C1B16" strokeWidth={3} /> : null}
          </Pressable>
        ) : (
          <View
            className={cn(
              'h-7 w-7 items-center justify-center rounded-full border',
              showDoneState && item.done ? 'border-green bg-green' : 'border-ink-line'
            )}
            accessibilityLabel={
              showDoneState && item.done ? 'Done' : 'Not checked off yet'
            }
          >
            {showDoneState && item.done ? (
              <CheckIcon size={14} color="#1C1B16" strokeWidth={3} />
            ) : null}
          </View>
        )}

        <Text
          numberOfLines={1}
          className={cn(
            'min-w-0 flex-1 font-sans-b text-[14px] text-ink',
            item.done && 'text-ink-mute line-through'
          )}
        >
          {item.label}
        </Text>

        <Pressable
          onPress={withAnalyticsPress(EVENTS.detail.assign_name, () => setOpen((v) => !v))}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={
            taken ? `Assigned to ${assignee?.name}. Change` : `Assign ${item.label}`
          }
          className={cn(
            'min-h-[40px] flex-row items-center gap-2 rounded-full border py-1 pl-1 pr-2.5',
            taken ? 'border-green bg-green/15' : 'border-ink-line bg-canvas'
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
            <Text className="pl-2 font-sans-b text-[13px] text-ink-soft">Open</Text>
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
            accessibilityLabel="Leave open"
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
                <Avatar
                  name={p.name}
                  emoji={p.emoji}
                  accent={p.accent}
                  personId={p.id}
                  size="sm"
                />
                <Text className="font-sans-b text-[13px] text-ink">{shortName(p)}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
