// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared profile card — the Hinge-style scroll a friend sees when they
// open your page. Header (photo, name, city, song, bio), the dark "Currently"
// weekly check-in, About me, Hobbies, List of favs, Places traveled, This or
// that, and (in edit mode) the "Add to your profile" module list that opens
// the one-question-at-a-time flow. `asTier` filters exactly the way a friend
// in that circle would see it.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  CameraIcon,
  EyeIcon,
  MusicIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon
} from 'lucide-react-native';
import type { Person, Tier } from '@bridger/shared';
import { TIER_LABEL } from '@bridger/shared';
import {
  ACCENTS,
  Avatar,
  ButtonSecondary,
  CollapsibleSection,
  EmptyState,
  ModuleFlow,
  ShowAllList,
  cn,
  useThemeColors,
  type Accent,
  type ModuleQuestion
} from '@bridger/ui';
import type {
  AboutField,
  Currently,
  FavGroup,
  Interest,
  MyProfileHeader,
  ThisOrThatRow,
  TravelPlace
} from '../../data/profile';
import { TIER_RANK } from '../../data/profile';
import { HobbiesWidget } from './HobbiesWidget';
import { TravelModule } from './TravelModule';

const TOT_ACCENTS: Accent[] = ['purple', 'coral', 'teal', 'amber', 'pink', 'blue'];

/**
 * Modules a person can add to their profile. Each one is optional, and every
 * one is answered through the same one-question-per-screen flow as onboarding.
 */
const MODULES: Array<{
  id: string;
  label: string;
  emoji: string;
  line: string;
  questions: ModuleQuestion[];
}> = [
  {
    id: 'tot',
    label: 'This or that',
    emoji: '⚖️',
    line: '12 quick picks',
    questions: [
      { id: 'tot1', ask: 'Coffee or tea?', type: 'thisOrThat', a: 'Coffee', b: 'Tea', emoji: '☕' },
      { id: 'tot2', ask: 'Beach or mountain?', type: 'thisOrThat', a: 'Beach', b: 'Mountain', emoji: '⛰' },
      { id: 'tot3', ask: 'Early bird or night owl?', type: 'thisOrThat', a: 'Early', b: 'Late', emoji: '🌙' },
      { id: 'tot4', ask: 'Call or text?', type: 'thisOrThat', a: 'Call', b: 'Text', emoji: '💬' }
    ]
  },
  {
    id: 'places',
    label: 'Places traveled',
    emoji: '🗺',
    line: 'Pin where you have been',
    questions: [
      { id: 'p1', ask: 'Where have you been lately?', type: 'text', placeholder: 'Lisbon', emoji: '✈️' },
      { id: 'p2', ask: 'What do you remember most?', type: 'text', placeholder: 'Custard tarts, daily' },
      { id: 'p3', ask: 'Where next?', type: 'text', placeholder: 'Anywhere with trains' }
    ]
  },
  {
    id: 'favs',
    label: 'List of favs',
    emoji: '⭐️',
    line: 'Food, films, everyday',
    questions: [
      { id: 'f1', ask: 'Pick your food groups', type: 'multi', options: ['Ramen', 'Tacos', 'Curry', 'Pastry', 'Dumplings'], emoji: '🍜' },
      { id: 'f2', ask: 'A film you rewatch?', type: 'text', placeholder: 'Paddington 2', emoji: '🎬' },
      { id: 'f3', ask: 'Everyday favorite?', type: 'text', placeholder: 'The 7am walk' }
    ]
  },
  {
    id: 'deeper',
    label: 'Discover Me',
    emoji: '🔮',
    line: 'Deeper questions',
    questions: [
      { id: 'd1', ask: 'How do you recharge?', type: 'single', options: ['Alone, quietly', 'With one person', 'In a crowd'], emoji: '🔋' },
      { id: 'd2', ask: 'What makes a good friend?', type: 'text', placeholder: 'Shows up' }
    ]
  }
];

export function ProfileCard({
  person,
  header,
  currently,
  about,
  hobbies,
  favs,
  thisOrThat,
  places,
  editable = false,
  own = false,
  asTier = 'close',
  empty = false,
  onCheckIn,
  onEditHeader
}: {
  person: Person;
  header: MyProfileHeader | null;
  currently: Currently | null;
  about: AboutField[];
  hobbies: Interest[];
  favs: FavGroup[];
  thisOrThat: ThisOrThatRow[];
  places: TravelPlace[];
  editable?: boolean;
  /** your own profile: Currently is always updatable, edit mode or not */
  own?: boolean;
  asTier?: Tier;
  empty?: boolean;
  onCheckIn?: (on: boolean) => void;
  onEditHeader?: (patch: Partial<MyProfileHeader>) => void;
}) {
  // PRIVACY: only fields shared at or below the viewing tier are shown
  const visible = empty ? [] : about.filter((f) => TIER_RANK[f.tier] <= TIER_RANK[asTier]);
  const showHobbies = empty ? [] : hobbies;
  const picks = empty ? [] : thisOrThat;
  const favGroups = empty ? [] : favs;

  /** every module opens the same one-question-per-screen flow */
  const [module, setModule] = useState<string | null>(null);
  const activeModule = MODULES.find((m) => m.id === module);

  return (
    <View className="gap-4">
      <ProfileHeader
        person={person}
        header={header}
        own={own}
        editing={editable}
        empty={empty}
        onEditHeader={onEditHeader}
      />

      <CurrentlyCard currently={currently} own={own} empty={empty} onCheckIn={onCheckIn} />

      <CollapsibleSection title="About me" count={visible.length}>
        {visible.length > 0 ? (
          <View>
            {visible.map((f, i) => (
              <View
                key={f.id}
                className={cn(
                  'flex-row items-center gap-3 py-2.5',
                  i > 0 && 'border-t border-ink-line'
                )}
              >
                <Text className="w-[104px] shrink-0 font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                  {f.key}
                </Text>
                <Text numberOfLines={1} className="min-w-0 flex-1 font-sans-sb text-[14px] text-ink">
                  {f.value}
                </Text>
                {editable ? (
                  <VisibilityPill tier={f.tier} />
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <ModuleEmpty
            emoji="🪪"
            line={editable ? 'Add the basics. Hometown, work, birthday.' : 'Nothing shared at this level.'}
            cta={editable ? 'Add details' : undefined}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Hobbies" count={showHobbies.length}>
        {showHobbies.length > 0 ? (
          <HobbiesWidget hobbies={showHobbies} />
        ) : (
          <ModuleEmpty
            emoji="🎛"
            line={editable ? 'Pick a few things you like.' : 'No hobbies yet.'}
            cta={editable ? 'Add hobbies' : undefined}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="List of favs"
        count={favGroups.reduce((n, f) => n + f.total, 0)}
        defaultOpen={empty}
      >
        {favGroups.length > 0 ? (
          <View className="gap-4">
            {favGroups.map((group) => (
              <View key={group.group}>
                <Text className="mb-2 font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                  {group.emoji} {group.group} · {group.total}
                </Text>
                <ShowAllList items={group.items} total={group.total} />
              </View>
            ))}
          </View>
        ) : (
          <ModuleEmpty
            emoji="⭐️"
            line={editable ? 'Start a list. Food, films, everyday.' : 'No favs yet.'}
            cta={editable ? 'Add favs' : undefined}
          />
        )}
      </CollapsibleSection>

      {/* polls live on Home now — one place to ask, one place to read results */}

      <CollapsibleSection title="Places traveled" count={empty ? 0 : places.length}>
        {empty || places.length === 0 ? (
          <ModuleEmpty
            emoji="🗺"
            line={editable ? 'Pin the places you have been.' : 'No places yet.'}
            cta={editable ? 'Add places' : undefined}
          />
        ) : (
          <TravelModule places={places} />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="This or that" count={picks.length}>
        {picks.length > 0 ? (
          /* one row per question, two columns — you read the choice, not a tile */
          <View className="overflow-hidden rounded-card border border-ink-line bg-surface">
            {picks.map((t, i) => {
              const token = ACCENTS[TOT_ACCENTS[i % TOT_ACCENTS.length]];
              const both = t.pick === 'both';
              return (
                <View key={t.id} className={cn(i > 0 && 'border-t border-ink-line')}>
                  <View className="flex-row">
                    {(['a', 'b'] as const).map((side) => {
                      const label = side === 'a' ? t.a : t.b;
                      const chosen = both || t.pick === side;
                      return (
                        <Pressable
                          key={side}
                          onPress={editable ? () => setModule('tot') : undefined}
                          disabled={!editable}
                          accessibilityRole={editable ? 'button' : 'text'}
                          accessibilityState={{ selected: chosen }}
                          accessibilityLabel={`${label}${chosen ? ', picked' : ''}`}
                          className={cn(
                            'min-h-[44px] flex-1 flex-row items-center gap-2 px-3.5 py-3',
                            side === 'a' && 'border-r border-ink-line',
                            chosen ? token.bg : 'bg-surface'
                          )}
                        >
                          {side === 'a' ? (
                            <Text accessible={false} className="shrink-0 text-[15px]">
                              {t.emoji}
                            </Text>
                          ) : null}
                          <Text
                            numberOfLines={1}
                            className={cn(
                              'min-w-0 flex-1 text-[14px]',
                              chosen ? cn('font-sans-b', token.text) : 'font-sans-sb text-ink-mute'
                            )}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {both ? (
                    <Text className="bg-surface px-3.5 py-1 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                      Honestly, both
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <ModuleEmpty
            emoji="⚖️"
            line={editable ? '12 quick picks, one tap each.' : 'Not taken yet.'}
            cta={editable ? 'Take it' : undefined}
          />
        )}
      </CollapsibleSection>

      {editable ? (
        <View className="rounded-card border border-ink-line bg-surface p-4">
          <Text className="font-pixel text-[15px] text-ink">Add to your profile</Text>
          <View className="mt-3 gap-2">
            {MODULES.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setModule(m.id)}
                accessibilityRole="button"
                accessibilityLabel={`${m.label}. ${m.line}`}
                className="min-h-[44px] w-full flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3 active:border-purple/40 active:bg-[#F1ECFF]"
              >
                <Text accessible={false} className="text-[20px]">
                  {m.emoji}
                </Text>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="font-sans-b text-[14px] text-ink">
                    {m.label}
                  </Text>
                  <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
                    {m.line}
                  </Text>
                </View>
                <PlusIcon size={16} color="#6B2FEA" strokeWidth={3} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <ModuleFlow
        open={Boolean(activeModule)}
        title={activeModule?.label ?? ''}
        questions={activeModule?.questions ?? []}
        onClose={() => setModule(null)}
        onDone={() => setModule(null)}
      />
    </View>
  );
}

/** Small pill showing which circle can see a field (edit mode only). */
function VisibilityPill({ tier }: { tier: Tier }) {
  const c = useThemeColors();
  return (
    <View className="shrink-0 flex-row items-center gap-1 rounded-full border border-ink-line px-2 py-0.5">
      <EyeIcon size={12} color={c.inkSoft} strokeWidth={2.6} />
      <Text className="font-sans-b text-[10px] text-ink-soft">{TIER_LABEL[tier]}</Text>
    </View>
  );
}

/**
 * Photo, name, city, bio and profile song. On your own profile these become
 * editable in place once you tap Edit in the header — otherwise you see your
 * profile exactly the way your friends do.
 */
function ProfileHeader({
  person,
  header,
  own,
  editing,
  empty,
  onEditHeader
}: {
  person: Person;
  header: MyProfileHeader | null;
  own: boolean;
  /** Edit is on, so the photo, city, song and bio can be changed */
  editing: boolean;
  empty: boolean;
  onEditHeader?: (patch: Partial<MyProfileHeader>) => void;
}) {
  const c = useThemeColors();
  const canEdit = own && editing;
  const city = empty ? 'Add your city' : header?.city ?? '';
  const bio = empty ? '' : header?.bio ?? '';
  const [editingCity, setEditingCity] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [cityDraft, setCityDraft] = useState(city);
  const [bioDraft, setBioDraft] = useState(bio);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-4">
        <View className="shrink-0">
          <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="xl" />
          {canEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-ink"
            >
              <CameraIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>

        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-sans-b text-[20px] tracking-tight text-ink">
            {person.name}
          </Text>

          {editingCity ? (
            <TextInput
              autoFocus
              value={cityDraft}
              onChangeText={setCityDraft}
              onBlur={() => {
                setEditingCity(false);
                onEditHeader?.({ city: cityDraft });
              }}
              accessibilityLabel="Your city"
              className="mt-0.5 w-full rounded-md border border-ink-line bg-surface px-2 py-1 font-sans-sb text-[13px] text-ink"
            />
          ) : (
            <Pressable
              disabled={!canEdit}
              onPress={() => {
                setCityDraft(city);
                setEditingCity(true);
              }}
              accessibilityRole={canEdit ? 'button' : 'text'}
              accessibilityLabel={canEdit ? `Edit city, ${city}` : city}
              className="flex-row items-center gap-1.5"
            >
              <Text numberOfLines={1} className="shrink font-sans-sb text-[13px] text-ink-soft">
                {city}
              </Text>
              {canEdit ? <PencilIcon size={12} color={c.inkMute} strokeWidth={2.6} /> : null}
            </Pressable>
          )}

          {!empty && header ? (
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <MusicIcon size={14} color={c.inkMute} strokeWidth={2.6} />
              <Text numberOfLines={1} className="shrink font-sans-sb text-[12px] text-ink-mute">
                {header.song.title} · {header.song.artist}
              </Text>
              {canEdit ? <PencilIcon size={12} color={c.inkMute} strokeWidth={2.6} /> : null}
            </View>
          ) : null}
        </View>
      </View>

      {editingBio ? (
        <TextInput
          autoFocus
          multiline
          value={bioDraft}
          onChangeText={setBioDraft}
          onBlur={() => {
            setEditingBio(false);
            onEditHeader?.({ bio: bioDraft });
          }}
          accessibilityLabel="Your bio"
          placeholder="A line about you"
          className="w-full rounded-card border border-ink-line bg-surface px-3.5 py-2.5 font-sans-sb text-[14px] text-ink"
        />
      ) : bio ? (
        <Pressable
          disabled={!canEdit}
          onPress={() => {
            setBioDraft(bio);
            setEditingBio(true);
          }}
          accessibilityRole={canEdit ? 'button' : 'text'}
          accessibilityLabel={canEdit ? `Edit bio, ${bio}` : bio}
          className="w-full rounded-card border border-ink-line bg-surface px-3.5 py-2.5"
        >
          <Text className="font-sans-sb text-[14px] leading-snug text-ink">{bio}</Text>
        </Pressable>
      ) : canEdit ? (
        <Pressable
          onPress={() => {
            setBioDraft('');
            setEditingBio(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Add a bio"
          className="w-full flex-row items-center gap-1.5 rounded-card border border-dashed border-ink-line px-3.5 py-2.5"
        >
          <PlusIcon size={16} color={c.inkMute} strokeWidth={2.8} />
          <Text className="font-sans-sb text-[13px] text-ink-mute">Add a bio</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** The dark "Currently" card — a weekly check-in that goes stale on purpose. */
function CurrentlyCard({
  currently,
  own,
  empty,
  onCheckIn
}: {
  currently: Currently | null;
  own: boolean;
  empty: boolean;
  onCheckIn?: (on: boolean) => void;
}) {
  const checkedIn = !empty && (currently?.checkedIn ?? false);
  const stale = !empty && !checkedIn;

  if (!checkedIn || !currently) {
    return (
      <View className="items-center rounded-card bg-ink p-5">
        <Text className="font-sans-b text-[11px] uppercase tracking-wide text-white/60">
          Currently
        </Text>
        <Text className="mt-2 text-center font-sans-b text-[15px] text-white">
          {stale ? 'Time for your weekly check-in' : 'What are you into right now?'}
        </Text>
        <Text className="mt-1 text-center font-sans-sb text-[12px] text-white/60">
          One song, one book. Takes a second.
        </Text>
        {own ? (
          <>
            <Pressable
              onPress={() => onCheckIn?.(true)}
              accessibilityRole="button"
              accessibilityLabel="Check in"
              className="mt-3 min-h-[36px] justify-center rounded-full bg-surface px-4 py-2"
            >
              <Text className="font-sans-b text-[13px] text-ink">Check in</Text>
            </Pressable>
            <MusicConnect />
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View className="rounded-card bg-ink p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-sans-b text-[11px] uppercase tracking-wide text-white/60">
          Currently · this week
        </Text>
        {own ? (
          <Pressable
            onPress={() => onCheckIn?.(false)}
            accessibilityRole="button"
            accessibilityLabel="Update your check-in"
            className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1"
          >
            <RefreshCwIcon size={12} color="#FFFFFF" strokeWidth={2.8} />
            <Text className="font-sans-b text-[11px] text-white">Update</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <View accessible={false} className="h-12 w-12 items-center justify-center rounded-lg bg-blue">
          <Text className="text-[22px]">{currently.listening.emoji}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-sans-b text-[14px] text-white">
            {currently.listening.title}
          </Text>
          <Text numberOfLines={1} className="font-sans-sb text-[12px] text-white/70">
            {currently.listening.artist}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-3 border-t border-white/15 pt-3">
        <View accessible={false} className="h-12 w-10 items-center justify-center rounded-sm bg-amber">
          <Text className="text-[20px]">{currently.reading.emoji}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-sans-b text-[14px] text-white">
            {currently.reading.title}
          </Text>
          <Text numberOfLines={1} className="font-sans-sb text-[12px] text-white/70">
            {currently.reading.author}
          </Text>
        </View>
      </View>

      {own ? <MusicConnect /> : null}
    </View>
  );
}

/**
 * Pull Currently straight from a music service instead of typing it each week.
 * A stub for now — the real connect flow ships later, and any music keys stay
 * server-side (never in this client).
 */
function MusicConnect() {
  const [service, setService] = useState<'spotify' | 'apple' | null>(null);

  if (service) {
    return (
      <Text className="mt-3 border-t border-white/15 pt-3 font-sans-sb text-[11px] text-white/60">
        {service === 'spotify' ? 'Spotify' : 'Apple Music'} connected · updates on its own
      </Text>
    );
  }

  return (
    <View className="mt-3 flex-row gap-2 border-t border-white/15 pt-3">
      <Pressable
        onPress={() => setService('spotify')}
        accessibilityRole="button"
        accessibilityLabel="Connect Spotify"
        className="min-h-[36px] flex-1 items-center justify-center rounded-full bg-white/15 px-3 py-2"
      >
        <Text className="font-sans-b text-[12px] text-white">Connect Spotify</Text>
      </Pressable>
      <Pressable
        onPress={() => setService('apple')}
        accessibilityRole="button"
        accessibilityLabel="Connect Apple Music"
        className="min-h-[36px] flex-1 items-center justify-center rounded-full bg-white/15 px-3 py-2"
      >
        <Text className="font-sans-b text-[12px] text-white">Apple Music</Text>
      </Pressable>
    </View>
  );
}

function ModuleEmpty({ emoji, line, cta }: { emoji: string; line: string; cta?: string }) {
  return (
    <EmptyState
      emoji={emoji}
      line={line}
      className="py-7"
      action={
        cta ? (
          <ButtonSecondary size="sm" tone="solid">
            {cta}
          </ButtonSecondary>
        ) : undefined
      }
    />
  );
}
