// ============================================
// WHAT THIS FILE DOES (plain English):
// Opens when you tap "N going" or "N invited" on an event. Hosts get both
// tabs; guests only see the friends-going list (no invited totals — vanity).
// Analytics: event_people_sheet.*; never logs names.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EVENTS } from '@bridger/shared';
import { Avatar, Badge, ListRow, Sheet, cn, withAnalyticsPress } from '@bridger/ui';
import { personById } from '../../data/people';

type Tab = 'going' | 'invited';

export function EventPeopleSheet({
  open,
  initialTab = 'going',
  goingIds,
  invitedIds,
  coHostIds = [],
  /** When false, hide the Invited tab (guest view). */
  showInvited = true,
  title = "Who's coming",
  onClose
}: {
  open: boolean;
  initialTab?: Tab;
  goingIds: string[];
  invitedIds: string[];
  coHostIds?: string[];
  showInvited?: boolean;
  title?: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (open) setTab(showInvited ? initialTab : 'going');
  }, [open, initialTab, showInvited]);

  const yetToAnswer = invitedIds.filter((id) => !goingIds.includes(id));
  const list = tab === 'going' ? goingIds : invitedIds;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      surface="event_people_sheet"
      parentScreen="events.detail"
      dismissAnalyticsId={EVENTS.people_sheet.dismiss}
    >
      <View className="gap-4">
        {showInvited ? (
          <View accessibilityRole="tablist" className="flex-row gap-2">
            {(
              [
                ['going', `${goingIds.length} going`],
                ['invited', `${invitedIds.length} invited`]
              ] as Array<[Tab, string]>
            ).map(([key, label]) => {
              const on = tab === key;
              return (
                <Pressable
                  key={key}
                  onPress={withAnalyticsPress(
                    key === 'going'
                      ? EVENTS.people_sheet.tab_going
                      : EVENTS.people_sheet.tab_invited,
                    () => setTab(key)
                  )}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={label}
                  className={cn(
                    'min-h-[44px] flex-1 items-center justify-center rounded-full px-3 py-2.5',
                    on ? 'bg-ink' : 'border border-ink-line bg-surface'
                  )}
                >
                  <Text
                    className={cn(
                      'font-sans-b text-[13px]',
                      on ? 'text-canvas' : 'text-ink'
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {tab === 'invited' && yetToAnswer.length > 0 ? (
          <Text className="font-sans-sb text-[12px] text-ink-mute">
            {yetToAnswer.length} {yetToAnswer.length === 1 ? 'person has' : 'people have'} not
            answered yet.
          </Text>
        ) : null}

        {list.length === 0 ? (
          <Text className="py-6 text-center font-sans-sb text-[13px] text-ink-mute">
            Nobody here yet.
          </Text>
        ) : (
          <View className="gap-2.5">
            {list.map((id) => {
              const p = personById(id);
              const isCoHost = coHostIds.includes(id);
              const answered = goingIds.includes(id);
              return (
                <ListRow
                  key={id}
                  leading={
                    <Avatar
                      name={p.name}
                      emoji={p.emoji}
                      accent={p.accent}
                      personId={p.id}
                      size="sm"
                    />
                  }
                  label={p.name}
                  sublabel={
                    p.tier === 'none'
                      ? 'Worth meeting'
                      : p.mutuals
                        ? `${p.mutuals} mutual friends`
                        : undefined
                  }
                  analyticsId={EVENTS.people_sheet.row}
                  interactive={false}
                  action={
                    isCoHost ? (
                      <Badge tone="active">Co-host</Badge>
                    ) : tab === 'invited' && !answered ? (
                      <Badge tone="neutral">No answer</Badge>
                    ) : (
                      <Badge tone="active">Going</Badge>
                    )
                  }
                />
              );
            })}
          </View>
        )}
      </View>
    </Sheet>
  );
}
