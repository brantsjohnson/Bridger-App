// ============================================
// WHAT THIS FILE DOES (plain English):
// Opens when you tap "N going" or "N invited" on an event. Hosts get both
// tabs; guests only see the friends-going list (no invited totals — vanity).
// When friends-can-invite is on, each row can show who invited that person
// ("invited by Jade" / "brought by Sam"). Host-invited people get no tag.
// Analytics: event_people_sheet.*; never logs names.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EVENTS } from '@bridger/shared';
import { Avatar, Badge, ListRow, Sheet, cn, withAnalyticsPress } from '@bridger/ui';
import { personById } from '../../data/people';

type Tab = 'going' | 'invited';

/** Build the short attribution line for one guest (host view only). */
function attributionLine(
  personId: string,
  inviteByIds: Record<string, string> | undefined,
  goingIds: string[]
): string | undefined {
  const inviterId = inviteByIds?.[personId];
  if (!inviterId) return undefined;
  const inviter = personById(inviterId);
  const first = inviter.name.split(' ')[0] || inviter.name;
  // Going + invited-by-someone = they were brought; still invited = not yet answered.
  if (goingIds.includes(personId)) return `Brought by ${first}`;
  return `Invited by ${first}`;
}

export function EventPeopleSheet({
  open,
  initialTab = 'going',
  goingIds,
  invitedIds,
  coHostIds = [],
  /** When false, hide the Invited tab (guest view). */
  showInvited = true,
  /**
   * When true and inviteByIds is set, show who invited each person.
   * Off when the host disabled friends-can-invite (everyone is host-invited).
   */
  showAttribution = false,
  /** personId → who invited them (host-invited people are omitted). */
  inviteByIds,
  title = "Who's coming",
  onClose
}: {
  open: boolean;
  initialTab?: Tab;
  goingIds: string[];
  invitedIds: string[];
  coHostIds?: string[];
  showInvited?: boolean;
  showAttribution?: boolean;
  inviteByIds?: Record<string, string>;
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
              const attr =
                showAttribution
                  ? attributionLine(id, inviteByIds, goingIds)
                  : undefined;
              // Prefer attribution over mutuals when friends-can-invite is on.
              const sublabel =
                attr ??
                (p.tier === 'none'
                  ? 'Worth meeting'
                  : p.mutuals
                    ? `${p.mutuals} mutual friends`
                    : undefined);
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
                  sublabel={sublabel}
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
