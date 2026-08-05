// ============================================
// WHAT THIS FILE DOES (plain English):
// The event page for hosts and guests. Same layout either way: cover + title
// on a clear surface (not a pastel tint), equal count tiles, details with the
// date chip + Add to calendar next to when/where, assignments, then host-only
// Introductions and Reminders at the bottom. Share lives only in the top-right.
// Guests never see invited totals or guest caps.
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarPlusIcon,
  HandCoinsIcon,
  MapPinIcon,
  ShareIcon,
  UsersIcon
} from 'lucide-react-native';
import type { EventAssignment, EventItem, Introduction, Person } from '@bridger/shared';
import { EVENTS, openSurface, trackProduct } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  Avatar,
  AvatarStack,
  Badge,
  ButtonSecondary,
  Card,
  CoverArt,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  TextField,
  Toggle,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import { DetailAssignmentRow } from '../../components/event/DetailAssignmentRow';
import { EventDateChip } from '../../components/event/EventDateChip';
import { EventPeopleSheet } from '../../components/event/EventPeopleSheet';
import {
  assignItem,
  getEvent,
  introductionsForEvent,
  meetSuggestionsForEvent,
  notifyEventIntroductions,
  notifyHostAssignmentChange,
  rsvpEvent,
  setAssignmentDone,
  updateEvent
} from '../../data/events';
import { listPeople, personById } from '../../data/people';
import { addEventToCalendar } from '../../lib/event-calendar';

const ME_ID = 'me';
/** Demo: only fan out introduction pings once per event per session */
const notifiedIntroEvents = new Set<string>();

/** Demo share link. Live: a real deep link / web URL for the event. */
function shareLink(id: string): string {
  return `https://bridger.app/e/${id}`;
}

/** People in your book who are going (guests never see a raw headcount). */
function friendsGoing(event: EventItem): Person[] {
  const book = new Set(listPeople().map((p) => p.id));
  return event.goingIds
    .filter((id) => id !== ME_ID && book.has(id))
    .map(personById);
}

/** Open the street address in the device maps app. */
function openMaps(event: EventItem) {
  const query = encodeURIComponent(event.address || event.place || '');
  if (!query) return;
  void Linking.openURL(`https://maps.apple.com/?q=${query}`);
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvp, setRsvp] = useState<'going' | 'cant' | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<EventItem>>({});
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleTab, setPeopleTab] = useState<'going' | 'invited'>('going');

  useEffect(() => {
    openSurface('events.detail', 'events');
  }, []);

  useEffect(() => {
    let alive = true;
    void getEvent(String(id)).then((e) => {
      if (!alive) return;
      setEvent(e);
      if (e?.role === 'going') setRsvp('going');
      if (e?.role === 'invited') setRsvp(null);
      // Host: nudge introduction pings once when opening a hosted event (demo)
      if (
        e &&
        (e.role === 'host' || e.hostId === ME_ID) &&
        !notifiedIntroEvents.has(e.id)
      ) {
        notifiedIntroEvents.add(e.id);
        void notifyEventIntroductions(e.id);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  async function refresh() {
    const e = await getEvent(String(id));
    setEvent(e);
  }

  async function onShare() {
    if (!event) return;
    const url = shareLink(event.id);
    try {
      await Share.share({
        message: `${event.title} · ${event.day} ${event.time}\n${url}`,
        url
      });
      trackProduct('event_shared', { method: 'share_sheet' });
    } catch {
      // User cancelled
    }
  }

  async function onRsvp(status: 'going' | 'cant') {
    if (!event) return;
    setRsvp(status);
    await rsvpEvent(event.id, status);
    trackProduct(status === 'going' ? 'rsvp_going' : 'rsvp_cant');
    await refresh();
  }

  async function onAssign(item: EventAssignment, personId?: string) {
    if (!event) return;
    const prev = item.assigneeId;
    await assignItem(event.id, item.id, personId);
    if (personId && personId !== prev) {
      await notifyHostAssignmentChange(event.id, item.id, 'snagged');
      trackProduct('event_assignment_taken');
    } else if (!personId && prev) {
      await notifyHostAssignmentChange(event.id, item.id, 'released');
      trackProduct('event_assignment_released');
    }
    if (editing) {
      setDraft((d) => ({
        ...d,
        assignments: (d.assignments ?? event.assignments ?? []).map((a) =>
          a.id === item.id ? { ...a, assigneeId: personId, done: personId ? a.done : false } : a
        )
      }));
    }
    await refresh();
  }

  async function onToggleDone(item: EventAssignment) {
    if (!event || item.assigneeId !== ME_ID) return;
    await setAssignmentDone(event.id, item.id, !item.done);
    trackProduct('event_assignment_done');
    await refresh();
  }

  /** Host reminders live at the bottom — save immediately, no Edit mode needed */
  async function onToggleReminder(
    key: 'remindDay' | 'remindHours',
    value: boolean
  ) {
    if (!event) return;
    setEvent({ ...event, [key]: value });
    await updateEvent(event.id, { [key]: value });
    await refresh();
  }

  function startEdit() {
    if (!event) return;
    setDraft({
      title: event.title,
      bio: event.bio,
      day: event.day,
      time: event.time,
      place: event.place,
      address: event.address,
      chipInAmount: event.chipInAmount,
      chipInMethod: event.chipInMethod,
      chipInHandle: event.chipInHandle,
      chipInNote: event.chipInNote,
      allowFriendsToInvite: event.allowFriendsToInvite,
      assignments: event.assignments?.map((a) => ({ ...a }))
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!event) return;
    await updateEvent(event.id, {
      title: draft.title?.trim() || event.title,
      bio: draft.bio,
      day: draft.day,
      time: draft.time,
      place: draft.place,
      address: draft.address,
      chipInAmount: draft.chipInAmount,
      chipInMethod: draft.chipInMethod,
      chipInHandle: draft.chipInHandle,
      chipInNote: draft.chipInNote,
      allowFriendsToInvite: draft.allowFriendsToInvite,
      assignments: draft.assignments
    });
    setEditing(false);
    await refresh();
  }

  const isHost = event?.role === 'host' || event?.hostId === ME_ID;
  const onTheList =
    isHost || rsvp === 'going' || event?.role === 'going' || event?.role === 'invited';

  const host = event ? personById(event.hostId) : null;
  const coHosts = useMemo(
    () => (event?.coHostIds ?? []).map(personById),
    [event?.coHostIds]
  );
  const knownGoing = useMemo(() => (event ? friendsGoing(event) : []), [event]);
  const meet = useMemo(() => {
    if (!event) return [];
    const book = new Set(listPeople().map((p) => p.id));
    // Guests: people at the event who are not already in your book
    return meetSuggestionsForEvent(event).filter((m) => !book.has(m.personId));
  }, [event]);
  const intros = useMemo(
    () => (event && isHost ? introductionsForEvent(event) : []),
    [event, isHost]
  );

  const assignmentCandidates = useMemo(() => {
    if (!event) return [];
    const ids = new Set<string>([
      event.hostId,
      ...(event.coHostIds ?? []),
      ...(event.invitedIds ?? []),
      ...event.goingIds
    ]);
    return [...ids].map(personById);
  }, [event]);

  const display = editing
    ? { ...event!, ...draft, assignments: draft.assignments ?? event?.assignments }
    : event;

  const accent = display?.accent ?? 'purple';

  const headerTrailing = event ? (
    <View className="flex-row items-center gap-2">
      {isHost ? (
        <ButtonSecondary
          size="sm"
          className="h-10"
          tone={editing ? 'solid' : 'light'}
          onPress={() => (editing ? void saveEdit() : startEdit())}
          accessibilityLabel={editing ? 'Done editing event' : 'Edit event'}
          analyticsId={EVENTS.host.edit}
        >
          {editing ? 'Done' : 'Edit'}
        </ButtonSecondary>
      ) : null}
      {/* Always-white circle so the share icon stays visible in dark mode */}
      <Pressable
        onPress={withAnalyticsPress(EVENTS.detail.share, () => void onShare())}
        accessibilityRole="button"
        accessibilityLabel="Share this event"
        className="h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-white active:opacity-80"
      >
        <ShareIcon size={18} color="#1C1B16" strokeWidth={2.4} />
      </Pressable>
    </View>
  ) : undefined;

  return (
    <Screen>
      <ScreenHeader
        title={isHost ? 'Hosting' : 'Event'}
        onBack={() => router.back()}
        hideProfile
        trailing={headerTrailing}
        analyticsSurface="events"
        backAnalyticsId={EVENTS.detail.back}
      />
      <ScreenBody tabBarInset={false}>
        {loading ? (
          <View className="items-center py-16">
            <Text className="font-sans-sb text-[13px] text-ink-mute">Loading…</Text>
          </View>
        ) : !display || !host ? (
          <View className="items-center px-8 py-16">
            <Text className="text-center font-sans-sb text-[14px] text-ink-mute">
              This event could not be found.
            </Text>
          </View>
        ) : (
          <View className="gap-6 pb-10">
            {/* --- HERO: colorful cover, then surface title (not lavender tint) --- */}
            <View className="overflow-hidden rounded-card border border-ink-line bg-surface">
              <AnalyticsRegion analyticsId={EVENTS.detail.cover_image} interactive={false}>
                <View className="h-32">
                  <CoverArt
                    cover={display.cover ?? { kind: 'emoji', value: display.emoji }}
                    accent={accent}
                  />
                </View>
              </AnalyticsRegion>
              <View className="gap-3 bg-surface p-4">
                {editing ? (
                  <TextField
                    label="Title"
                    value={draft.title ?? ''}
                    onChange={(title) => setDraft((d) => ({ ...d, title }))}
                  />
                ) : (
                  <Text className="font-sans-b text-[22px] leading-tight tracking-tight text-ink">
                    {display.title}
                  </Text>
                )}

                <View className="flex-row items-center gap-2">
                  <Avatar
                    name={host.name}
                    emoji={host.emoji}
                    accent={host.accent}
                    personId={host.id}
                    size="sm"
                  />
                  <Text className="min-w-0 flex-1 font-sans-sb text-[13px] text-ink">
                    Hosted by {host.name}
                    {coHosts.length > 0 ? (
                      <Text className="text-ink-mute">
                        {' '}
                        with {coHosts.map((p) => p.name.split(' ')[0]).join(' & ')}
                      </Text>
                    ) : null}
                  </Text>
                </View>

                {/* PRIVACY: guests see friends going + to meet; host sees going / invited / brought */}
                <View className="flex-row gap-2.5">
                  <CountButton
                    value={isHost ? display.goingIds.length : knownGoing.length}
                    label="going"
                    people={isHost ? display.goingIds.map(personById) : knownGoing}
                    analyticsId={
                      isHost ? EVENTS.host.going_count : EVENTS.detail.going_count
                    }
                    onPress={() => {
                      setPeopleTab('going');
                      setPeopleOpen(true);
                    }}
                  />
                  {isHost ? (
                    <CountButton
                      value={(display.invitedIds ?? []).length}
                      label="invited"
                      people={(display.invitedIds ?? []).map(personById)}
                      analyticsId={EVENTS.host.invited_count}
                      onPress={() => {
                        setPeopleTab('invited');
                        setPeopleOpen(true);
                      }}
                    />
                  ) : null}
                  {isHost && display.allowFriendsToInvite ? (
                    <CountButton
                      value={(display.broughtIds ?? []).length}
                      label="brought"
                      people={(display.broughtIds ?? []).map(personById)}
                      analyticsId={EVENTS.host.brought_count}
                      onPress={() => {
                        setPeopleTab('invited');
                        setPeopleOpen(true);
                      }}
                    />
                  ) : null}
                  {!isHost && meet.length > 0 ? (
                    <CountButton
                      value={meet.length}
                      label="to meet"
                      people={meet.map((m) => personById(m.personId))}
                      analyticsId={EVENTS.detail.to_meet_count}
                      onPress={() => router.push('/(tabs)/discover')}
                    />
                  ) : null}
                </View>
              </View>
            </View>

            {/* --- RSVP (guests only) --- */}
            {!isHost ? (
              <View className="flex-row gap-2.5">
                <ButtonSecondary
                  full
                  size="md"
                  tone="positive"
                  onPress={() => void onRsvp('going')}
                  analyticsId={EVENTS.detail.going}
                  accessibilityLabel="I'm going"
                  className={rsvp === 'going' ? 'bg-[#1F7A42]' : undefined}
                >
                  {rsvp === 'going' ? "You're going ✓" : "I'm going"}
                </ButtonSecondary>
                <ButtonSecondary
                  full
                  size="md"
                  tone={rsvp === 'cant' ? 'solid' : 'outline'}
                  onPress={() => void onRsvp('cant')}
                  analyticsId={EVENTS.detail.cant}
                  accessibilityLabel="Can't make it"
                >
                  Can't make it
                </ButtonSecondary>
              </View>
            ) : null}

            {/* --- THE DETAILS --- */}
            <View>
              <PixelHeading size="md" className="mb-3">
                The details
              </PixelHeading>
              <Card className="gap-3.5" analyticsId={EVENTS.detail.details_body} interactive={false}>
                {editing ? (
                  <View className="gap-3">
                    <TextField
                      label="Bio"
                      value={draft.bio ?? ''}
                      onChange={(bio) => setDraft((d) => ({ ...d, bio }))}
                      multiline
                    />
                    <TextField
                      label="When (day)"
                      value={draft.day ?? ''}
                      onChange={(day) => setDraft((d) => ({ ...d, day }))}
                    />
                    <TextField
                      label="Time"
                      value={draft.time ?? ''}
                      onChange={(time) => setDraft((d) => ({ ...d, time }))}
                    />
                    <TextField
                      label="Place"
                      value={draft.place ?? ''}
                      onChange={(place) => setDraft((d) => ({ ...d, place }))}
                    />
                    <TextField
                      label="Address"
                      value={draft.address ?? ''}
                      onChange={(address) => setDraft((d) => ({ ...d, address }))}
                    />
                    <TextField
                      label="Chip-in amount"
                      value={draft.chipInAmount ?? ''}
                      onChange={(chipInAmount) => setDraft((d) => ({ ...d, chipInAmount }))}
                    />
                    <TextField
                      label="Chip-in handle"
                      value={draft.chipInHandle ?? ''}
                      onChange={(chipInHandle) => setDraft((d) => ({ ...d, chipInHandle }))}
                    />
                    <View className="flex-row items-center justify-between rounded-card border border-ink-line px-3.5 py-3">
                      <Text className="font-sans-b text-[14px] text-ink">
                        Let friends invite friends
                      </Text>
                      <Toggle
                        checked={!!draft.allowFriendsToInvite}
                        onChange={(allowFriendsToInvite) =>
                          setDraft((d) => ({ ...d, allowFriendsToInvite }))
                        }
                        label="Let friends invite friends"
                      />
                    </View>
                  </View>
                ) : (
                  <>
                    {display.bio ? (
                      <Text className="font-sans-sb text-[14px] leading-relaxed text-ink">
                        {display.bio}
                      </Text>
                    ) : null}
                    <View
                      className={cn(
                        'gap-3',
                        display.bio ? 'border-t border-ink-line pt-3.5' : undefined
                      )}
                    >
                      {/* When: date chip + day/time (same chip as the Events list) */}
                      <View className="flex-row items-start gap-3">
                        <EventDateChip event={display} />
                        <View className="min-w-0 flex-1">
                          <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                            When
                          </Text>
                          <Text className="mt-0.5 font-sans-b text-[14px] leading-snug text-ink">
                            {display.day} at {display.time}
                          </Text>
                          {display.countdown ? (
                            <View className="mt-1 self-start">
                              <Badge tone="neutral">{display.countdown}</Badge>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <Pressable
                        onPress={withAnalyticsPress(EVENTS.detail.map, () => openMaps(display))}
                        accessibilityRole="link"
                        accessibilityLabel={`Open map for ${display.place || display.address || 'location'}`}
                      >
                        <DetailRow
                          iconBg="bg-teal/20"
                          icon={<MapPinIcon size={16} color={ACCENTS.teal.hex} strokeWidth={2.4} />}
                          label="Where"
                        >
                          <Text className="font-sans-b text-[14px] leading-snug text-ink">
                            {display.place || 'TBD'}
                          </Text>
                          {display.address ? (
                            onTheList ? (
                              <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft">
                                {display.address}
                              </Text>
                            ) : (
                              <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-mute">
                                Full address shows once you say you're going.
                              </Text>
                            )
                          ) : null}
                        </DetailRow>
                      </Pressable>

                      {/* Add to calendar sits with when/where, not alone at the bottom */}
                      <ButtonSecondary
                        full
                        size="md"
                        tone="solid"
                        icon={
                          <CalendarPlusIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
                        }
                        onPress={() => void addEventToCalendar(display)}
                        analyticsId={EVENTS.detail.add_to_calendar}
                        accessibilityLabel="Add to calendar"
                      >
                        Add to calendar
                      </ButtonSecondary>

                      {display.chipInAmount || display.chipInHandle ? (
                        <DetailRow
                          iconBg="bg-coral/20"
                          icon={
                            <HandCoinsIcon size={16} color={ACCENTS.coral.hex} strokeWidth={2.4} />
                          }
                          label="Chip in"
                        >
                          <Text className="font-sans-b text-[14px] leading-snug text-ink">
                            {display.chipInAmount ? `${display.chipInAmount} each` : 'Chip in'}
                          </Text>
                          <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft">
                            {display.chipInMethod === 'Cash in person'
                              ? 'Cash, in person'
                              : [display.chipInMethod, display.chipInHandle]
                                  .filter(Boolean)
                                  .join(' · ')}
                          </Text>
                          {display.chipInNote ? (
                            <Text className="mt-0.5 font-sans text-[12px] text-ink-mute">
                              {display.chipInNote}
                            </Text>
                          ) : null}
                        </DetailRow>
                      ) : null}

                      {display.allowFriendsToInvite ? (
                        <DetailRow
                          iconBg="bg-purple/20"
                          icon={<UsersIcon size={16} color={ACCENTS.purple.hex} strokeWidth={2.4} />}
                          label="Friends invite"
                        >
                          <Text className="font-sans-b text-[14px] leading-snug text-ink">
                            Friends can invite friends
                          </Text>
                          {isHost && display.cap ? (
                            <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-mute">
                              Cap {display.cap} (host only)
                            </Text>
                          ) : null}
                        </DetailRow>
                      ) : null}
                    </View>
                  </>
                )}
              </Card>
            </View>

            {/* --- ASSIGNMENTS --- */}
            {(display.assignments && display.assignments.length > 0) || editing ? (
              <View>
                <PixelHeading size="md" className="mb-1.5">
                  Assignments
                </PixelHeading>
                <Text className="mb-2.5 font-sans-sb text-[12px] text-ink-mute">
                  Tap Open to assign someone. Only the assignee can check it off.
                </Text>
                <View className="gap-2.5">
                  {(display.assignments ?? []).map((a) => (
                    <DetailAssignmentRow
                      key={a.id}
                      item={a}
                      candidates={assignmentCandidates}
                      canToggleDone={a.assigneeId === ME_ID}
                      showDoneState={isHost || a.assigneeId === ME_ID}
                      onAssign={(personId) => void onAssign(a, personId)}
                      onToggleDone={() => void onToggleDone(a)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* --- INTRODUCTIONS (host) — solid surface rows, not faint purple --- */}
            {isHost && intros.length > 0 ? (
              <View>
                <AnalyticsRegion
                  analyticsId={EVENTS.host.introductions_header}
                  interactive={false}
                >
                  <PixelHeading size="md" className="mb-1.5">
                    Introductions
                  </PixelHeading>
                </AnalyticsRegion>
                <Text className="mb-2.5 font-sans-sb text-[12px] text-ink-mute">
                  Bridger thinks these people should meet. They get a quiet nudge.
                </Text>
                <View className="gap-2.5">
                  {intros.map((pair) => (
                    <IntroductionCard key={`${pair.a}-${pair.b}`} pair={pair} />
                  ))}
                </View>
              </View>
            ) : null}

            {/* --- WHO YOU SHOULD MEET (guests) --- */}
            {!isHost && meet.length > 0 ? (
              <View>
                <PixelHeading size="md" className="mb-3">
                  Who you should meet
                </PixelHeading>
                <View className="gap-2.5">
                  {meet.map((s) => {
                    const p = personById(s.personId);
                    return (
                      <Pressable
                        key={s.personId}
                        onPress={withAnalyticsPress(EVENTS.detail.meet_row, () =>
                          router.push('/(tabs)/discover')
                        )}
                        accessibilityRole="button"
                        accessibilityLabel={`Meet ${p.name}`}
                        className="flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3 active:opacity-90"
                      >
                        <Avatar
                          name={p.name}
                          emoji={p.emoji}
                          accent={p.accent}
                          personId={p.id}
                          size="sm"
                        />
                        <View className="min-w-0 flex-1">
                          <Text className="font-sans-b text-[14px] text-ink">{p.name}</Text>
                          <Text className="font-sans-sb text-[12px] text-ink-mute">
                            {s.thread}
                          </Text>
                        </View>
                        <Badge tone={s.status === 'going' ? 'active' : 'neutral'}>
                          {s.status === 'going' ? 'Going' : 'Invited'}
                        </Badge>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* --- REMINDERS (host) — when to notify guests --- */}
            {isHost ? (
              <View>
                <AnalyticsRegion
                  analyticsId={EVENTS.host.reminders_header}
                  interactive={false}
                >
                  <PixelHeading size="md" className="mb-3">
                    Reminders
                  </PixelHeading>
                </AnalyticsRegion>
                <View className="gap-2.5">
                  <View className="flex-row items-center justify-between rounded-card border border-ink bg-surface px-3.5 py-3">
                    <Text className="font-sans-b text-[14px] text-ink">
                      Remind 2 days before
                    </Text>
                    <Toggle
                      checked={display.remindDay ?? true}
                      onChange={(v) => void onToggleReminder('remindDay', v)}
                      label="Remind 2 days before"
                      analyticsId={EVENTS.host.reminders_toggle}
                    />
                  </View>
                  <View className="flex-row items-center justify-between rounded-card border border-ink bg-surface px-3.5 py-3">
                    <Text className="font-sans-b text-[14px] text-ink">
                      Remind 2 hours before
                    </Text>
                    <Toggle
                      checked={display.remindHours ?? true}
                      onChange={(v) => void onToggleReminder('remindHours', v)}
                      label="Remind 2 hours before"
                      analyticsId={EVENTS.host.reminders_toggle}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            <EventPeopleSheet
              open={peopleOpen}
              initialTab={peopleTab}
              goingIds={
                isHost
                  ? display.goingIds
                  : knownGoing.map((p) => p.id)
              }
              invitedIds={display.invitedIds ?? []}
              coHostIds={display.coHostIds}
              showInvited={!!isHost}
              title={isHost ? "Who's coming" : 'Friends going'}
              onClose={() => setPeopleOpen(false)}
            />
          </View>
        )}
      </ScreenBody>
    </Screen>
  );
}

function IntroductionCard({ pair }: { pair: Introduction }) {
  const a = personById(pair.a);
  const b = personById(pair.b);
  return (
    <Pressable
      onPress={withAnalyticsPress(EVENTS.host.introduction_row, undefined, {
        interactive: false
      })}
      accessibilityRole="text"
      accessibilityLabel={`${a.name} and ${b.name}: ${pair.why}`}
      className="flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3"
    >
      <View className="flex-row">
        <Avatar name={a.name} emoji={a.emoji} accent={a.accent} personId={a.id} size="sm" />
        <View style={{ marginLeft: -10 }}>
          <Avatar name={b.name} emoji={b.emoji} accent={b.accent} personId={b.id} size="sm" />
        </View>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[14px] text-ink">
          {a.name.split(' ')[0]} & {b.name.split(' ')[0]}
        </Text>
        <Text className="font-sans-sb text-[12px] text-ink-mute">{pair.why}</Text>
      </View>
    </Pressable>
  );
}

/** Equal-width count tile — high contrast, no muted pastel fills */
function CountButton({
  value,
  label,
  people,
  onPress,
  analyticsId
}: {
  value: number;
  label: string;
  people: Person[];
  onPress: () => void;
  analyticsId: string;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      className="min-w-0 flex-1 flex-row items-center gap-2 rounded-card border border-ink bg-surface px-2.5 py-2.5 active:opacity-90"
    >
      <View className="min-w-0 flex-1">
        <Text className="font-pixel text-[16px] leading-none text-ink">
          {value}{' '}
          <Text className="font-sans-b italic text-[13px] text-ink">{label}</Text>
        </Text>
        {people.length > 0 ? (
          <View className="mt-1.5">
            <AvatarStack
              people={people.slice(0, 4).map((p) => ({
                name: p.name,
                emoji: p.emoji,
                accent: p.accent,
                personId: p.id
              }))}
            />
          </View>
        ) : null}
      </View>
      <Text className="font-sans-b text-[12px] text-ink-mute">›</Text>
    </Pressable>
  );
}

function DetailRow({
  icon,
  iconBg,
  label,
  children
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className={cn('mt-0.5 h-8 w-8 items-center justify-center rounded-full', iconBg)}>
        {icon}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
          {label}
        </Text>
        <View className="mt-0.5">{children}</View>
      </View>
    </View>
  );
}
