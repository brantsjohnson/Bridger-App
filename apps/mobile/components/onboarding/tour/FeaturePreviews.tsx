// ============================================
// WHAT THIS FILE DOES (plain English):
// Educational pictures for each picked feature. These are tours, not setup.
// They do not open live sheets or save anything. Names here are stand-in
// people, never a real friend's data.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon, LockIcon, MapPinIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { ACCENT_HEX, AnalyticsRegion } from '@bridger/ui';
import { OB } from '../onboarding-theme';
import type { FeatureVisualKind } from '../onboarding-new-flow';

const card = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(28,27,22,0.12)',
  padding: 16
} as const;

export function FreeWeekPreview() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const free = [false, true, false, true, false, true, true];
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.plans.visual} interactive={false}>
      <View style={card}>
        <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
          When are you free this week?
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 6 }}>
          {days.map((d, i) => (
            <View
              key={`${d}-${i}`}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 4,
                borderRadius: 12,
                paddingVertical: 10,
                backgroundColor: free[i] ? OB.green : 'rgba(28,27,22,0.05)'
              }}
            >
              <Text
                className="font-sans-b text-[11px]"
                style={{ color: free[i] ? '#FFFFFF' : OB.inkSoft }}
              >
                {d}
              </Text>
              <Text style={{ fontSize: 13 }}>{free[i] ? '🌿' : '·'}</Text>
            </View>
          ))}
        </View>
        <View
          style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 999,
            backgroundColor: 'rgba(0,166,118,0.15)',
            paddingHorizontal: 12,
            paddingVertical: 8
          }}
        >
          <Text style={{ fontSize: 14 }}>🧑👩🧔</Text>
          <Text className="font-sans-b text-[12px]" style={{ color: OB.navy }}>
            3 friends are free Thursday too
          </Text>
        </View>
      </View>
    </AnalyticsRegion>
  );
}

export function FriendNotesPreview() {
  const notes = [
    { when: 'Last Sunday', body: 'Started the pottery class. Ask how the first firing went.' },
    { when: '2 weeks ago', body: 'Interview at Harlow on the 14th. Wish her luck the night before.' },
    { when: 'Last month', body: 'Hates coriander. Genuinely. Do not test this again.' }
  ];
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.friendsb.visual} interactive={false}>
      <View style={card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
            Your notes on Kit
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderRadius: 999,
              backgroundColor: 'rgba(28,27,22,0.06)',
              paddingHorizontal: 8,
              paddingVertical: 4
            }}
          >
            <LockIcon size={12} color={OB.inkSoft} strokeWidth={2.6} />
            <Text className="font-sans-b text-[10px]" style={{ color: OB.inkSoft }}>
              ONLY YOU
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 12, gap: 8 }}>
          {notes.map((n) => (
            <View
              key={n.when}
              style={{
                borderRadius: 12,
                backgroundColor: 'rgba(28,27,22,0.04)',
                paddingHorizontal: 12,
                paddingVertical: 10
              }}
            >
              <Text className="font-sans-b text-[10px]" style={{ color: OB.inkSoft }}>
                {n.when.toUpperCase()}
              </Text>
              <Text className="mt-1 font-sans-sb text-[13px]" style={{ color: OB.navy }}>
                {n.body}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </AnalyticsRegion>
  );
}

export function ScrapbookPreview() {
  const notes = [
    { emoji: '🚐', caption: 'The van that did not start', meta: 'Maya, Devon · Snowdonia' },
    { emoji: '🍜', caption: '3am noodles, again', meta: 'Kit · Chinatown' }
  ];
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.memories.visual} interactive={false}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {notes.map((n) => (
          <View key={n.caption} style={{ flex: 1, ...card, padding: 10 }}>
            <View
              style={{
                height: 96,
                borderRadius: 12,
                backgroundColor: 'rgba(28,27,22,0.06)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ fontSize: 34 }}>{n.emoji}</Text>
            </View>
            <Text className="mt-2 font-pixel text-[12px]" style={{ color: OB.navy }}>
              {n.caption}
            </Text>
            <Text className="mt-1 font-sans-b text-[10px]" style={{ color: OB.inkSoft }}>
              {n.meta.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </AnalyticsRegion>
  );
}

export function MutualFriendsPreview() {
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.discover.visual} interactive={false}>
      <View style={{ gap: 12 }}>
        <View style={{ ...card, alignItems: 'center', paddingVertical: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Node label="You" color={ACCENT_HEX.purple} />
            <View style={{ width: 28, height: 2, backgroundColor: ACCENT_HEX.purple }} />
            <Node label="Maya" color={ACCENT_HEX.amber} />
            <View style={{ width: 28, height: 2, backgroundColor: ACCENT_HEX.purple }} />
            <Node label="Nour" color={ACCENT_HEX.blue} />
          </View>
        </View>
        <View style={{ ...card, paddingVertical: 10 }}>
          <Text className="text-center font-sans-b text-[13px]" style={{ color: OB.navy }}>
            You both know Maya
          </Text>
        </View>
      </View>
    </AnalyticsRegion>
  );
}

function Node({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }}
      />
      <Text className="font-sans-b text-[11px]" style={{ color: OB.navy }}>
        {label}
      </Text>
    </View>
  );
}

export function ThingsToDoPreview() {
  const ideas = [
    { emoji: '🧗', title: 'Bouldering at The Depot', when: 'Thu 7pm', why: 'Maya and 2 others are into climbing' },
    { emoji: '🎬', title: 'Outdoor screening', when: 'Sat 8pm', why: '400m from you' },
    { emoji: '🥬', title: 'Sunday farmers market', when: 'Sun 10am', why: 'Devon goes every week' }
  ];
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.product.visual} interactive={false}>
      <View style={{ gap: 8 }}>
        {ideas.map((i) => (
          <View key={i.title} style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(28,27,22,0.06)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ fontSize: 20 }}>{i.emoji}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }} numberOfLines={1}>
                {i.title}
              </Text>
              <Text className="font-sans-b text-[11px]" style={{ color: ACCENT_HEX.purple }}>
                {i.when}
              </Text>
              <Text className="font-sans-sb text-[11px]" style={{ color: OB.inkSoft }} numberOfLines={1}>
                {i.why}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </AnalyticsRegion>
  );
}

export function BirthdayReminderPreview() {
  const rows = [
    { name: 'Maya', away: 'in 4 days', lead: true },
    { name: 'Devon', away: 'in 2 weeks', lead: false },
    { name: 'Kit', away: 'in 3 weeks', lead: false }
  ];
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.product.visual} interactive={false}>
      <View style={card}>
        <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
          Coming up
        </Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {rows.map((b) => (
            <View key={b.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: '#BBD6FB'
                }}
              />
              <View style={{ flex: 1 }}>
                <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
                  {b.name}'s birthday
                </Text>
                <Text className="font-sans-sb text-[11px]" style={{ color: OB.inkSoft }}>
                  {b.away}
                </Text>
              </View>
              {b.lead ? (
                <View
                  style={{
                    backgroundColor: ACCENT_HEX.amber,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 6
                  }}
                >
                  <Text className="font-sans-b text-[11px]" style={{ color: OB.navy }}>
                    Plan something
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </AnalyticsRegion>
  );
}

export function EventInvitePreview() {
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.product.visual} interactive={false}>
      <View style={{ overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(28,27,22,0.12)' }}>
        <View
          style={{
            height: 96,
            backgroundColor: ACCENT_HEX.purple,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text style={{ fontSize: 38 }}>🎉</Text>
        </View>
        <View style={{ backgroundColor: '#FFFFFF', padding: 16 }}>
          <Text className="font-sans-b text-[11px]" style={{ color: ACCENT_HEX.purple }}>
            SAT 8 MAR · 7PM
          </Text>
          <Text className="mt-1 font-sans-b text-[16px]" style={{ color: OB.navy }}>
            Sam's birthday dinner
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <MapPinIcon size={14} color={OB.inkSoft} strokeWidth={2.6} />
            <Text className="font-sans-sb text-[12px]" style={{ color: OB.inkSoft }}>
              Address shown once you're on the list
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <View style={{ flex: 1, backgroundColor: OB.navy, borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
              <Text className="font-sans-b text-[13px]" style={{ color: '#FFFFFF' }}>
                I'm in
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: 'rgba(28,27,22,0.12)',
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center'
              }}
            >
              <Text className="font-sans-b text-[13px]" style={{ color: OB.inkSoft }}>
                Can't make it
              </Text>
            </View>
          </View>
        </View>
      </View>
    </AnalyticsRegion>
  );
}

export function FriendLikesPreview() {
  const likes = [
    { label: 'Climbing', emoji: '🧗' },
    { label: 'Vinyl', emoji: '🎵' },
    { label: 'Ramen', emoji: '🍜' },
    { label: 'Ceramics', emoji: '🏺' },
    { label: 'Sci-fi', emoji: '🛸' },
    { label: 'Cold water', emoji: '🌊' }
  ];
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.product.visual} interactive={false}>
      <View style={card}>
        <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
          What Maya's into
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {likes.map((l) => (
            <View
              key={l.label}
              style={{
                width: '30%',
                flexGrow: 1,
                alignItems: 'center',
                gap: 4,
                paddingVertical: 12,
                backgroundColor: '#F1ECFF'
              }}
            >
              <Text style={{ fontSize: 20 }}>{l.emoji}</Text>
              <Text className="font-sans-b text-[11px]" style={{ color: OB.navy }}>
                {l.label}
              </Text>
            </View>
          ))}
        </View>
        <Text className="mt-3 font-sans-sb text-[11px]" style={{ color: OB.inkSoft }}>
          She chose all of these herself, at the audience she picked.
        </Text>
      </View>
    </AnalyticsRegion>
  );
}

export function ImportantDatesPreview() {
  const dates = [
    { who: 'Nour', what: 'Moves to Lisbon', when: 'Fri 14th', away: 'in 3 days', soon: true },
    { who: 'Kit & Sam', what: 'Anniversary', when: 'Mar 2', away: 'in 3 weeks', soon: false },
    { who: 'Devon', what: 'Finishes chemo', when: 'Apr 19', away: 'in 2 months', soon: false }
  ];
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.friendsb.visual} interactive={false}>
      <View style={card}>
        <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
          Dates you're keeping
        </Text>
        <View style={{ marginTop: 12 }}>
          {dates.map((d) => (
            <View
              key={d.what}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(28,27,22,0.08)'
              }}
            >
              <View style={{ flex: 1 }}>
                <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
                  {d.who} · {d.what}
                </Text>
                <Text className="font-sans-sb text-[11px]" style={{ color: OB.inkSoft }}>
                  {d.when}
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  backgroundColor: d.soon ? OB.pink : 'rgba(28,27,22,0.06)'
                }}
              >
                <Text
                  className="font-sans-b text-[11px]"
                  style={{ color: d.soon ? '#FFFFFF' : OB.inkSoft }}
                >
                  {d.away}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Text className="mt-3 font-sans-sb text-[11px]" style={{ color: OB.inkSoft }}>
          Nudged a few days ahead, never the morning of.
        </Text>
      </View>
    </AnalyticsRegion>
  );
}

export function GroupAudiencePreview() {
  const groups = [
    { name: 'Climbing crew', emoji: '🧗', count: 6 },
    { name: 'College friends', emoji: '🎓', count: 14 },
    { name: 'Sunday roast', emoji: '🍗', count: 4 }
  ];
  const [selected, setSelected] = useState(groups[0]!.name);
  return (
    <AnalyticsRegion analyticsId={ONBOARDING.groups.visual} interactive={false}>
      <View style={card}>
        <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
          Who is this for?
        </Text>
        <View style={{ marginTop: 12, gap: 8 }}>
          {groups.map((g) => {
            const on = g.name === selected;
            return (
              <Pressable
                key={g.name}
                onPress={() => setSelected(g.name)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${g.name}, ${g.count} people`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: on ? ACCENT_HEX.purple : 'rgba(28,27,22,0.04)'
                }}
              >
                <Text style={{ fontSize: 18 }}>{g.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text className="font-sans-b text-[13px]" style={{ color: on ? '#FFFFFF' : OB.navy }}>
                    {g.name}
                  </Text>
                  <Text
                    className="font-sans-sb text-[11px]"
                    style={{ color: on ? 'rgba(255,255,255,0.75)' : OB.inkSoft }}
                  >
                    {g.count} people
                  </Text>
                </View>
                {on ? <CheckIcon size={16} color="#FFFFFF" strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
        </View>
        <Text className="mt-3 font-sans-sb text-[11px]" style={{ color: OB.inkSoft }}>
          Only the {selected} sees this. Nobody else on Bridger does.
        </Text>
      </View>
    </AnalyticsRegion>
  );
}

export function FeatureVisual({ kind }: { kind: FeatureVisualKind }) {
  switch (kind) {
    case 'availability':
      return <FreeWeekPreview />;
    case 'notes':
      return <FriendNotesPreview />;
    case 'scrapbook':
      return <ScrapbookPreview />;
    case 'mutuals':
      return <MutualFriendsPreview />;
    case 'suggestions':
      return <ThingsToDoPreview />;
    case 'birthdays':
      return <BirthdayReminderPreview />;
    case 'event':
      return <EventInvitePreview />;
    case 'dates':
      return <ImportantDatesPreview />;
    case 'interests':
      return <FriendLikesPreview />;
    case 'group':
      return <GroupAudiencePreview />;
  }
}
