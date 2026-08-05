// ============================================
// WHAT THIS FILE DOES (plain English):
// The Co-op benefits screen. Shows what is always free vs what members unlock,
// the $24/year price, and Join / Open portal. From Magic Patterns coop/index.
// Connecting is never behind a paywall.
// ============================================
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckIcon } from 'lucide-react-native';
import {
  FREE_BENEFITS,
  HOME,
  MEMBER_BENEFITS,
  type Accent
} from '@bridger/shared';
import { COOP } from '../../lib/analytics-ids';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ListRow,
  ORGANIC,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader,
  ACCENTS,
  cn
} from '@bridger/ui';
import { PortalPanel } from '../../components/coop/PortalPanel';
import { getMembership, joinCoop } from '../../data/coop';

const ALWAYS_FREE = [
  'Meet people in Discover',
  'Add anyone, unlimited acquaintances',
  'Messages, touch grass, quizzes',
  'Answering any poll or question you are sent',
  'Photos, text, voice, stickers',
  'Watch every video, read every profile',
  'Attend events, host up to 35',
  'Your weekly recap'
];

const UNLOCKS: {
  key: string;
  title: string;
  line: string;
  emoji: string;
  accent: Accent;
}[] = [
  {
    key: 'personalization',
    title: 'Make it yours',
    line: 'Widgets, photos, backgrounds, colors.',
    emoji: '🎨',
    accent: 'purple'
  },
  {
    key: 'circles',
    title: 'Bigger circles',
    line: 'No caps, plus your own named groups.',
    emoji: '👥',
    accent: 'teal'
  },
  {
    key: 'video',
    title: 'Post video',
    line: 'Video updates and video replies.',
    emoji: '🎥',
    accent: 'coral'
  },
  {
    key: 'ask',
    title: 'Ask the group',
    line: 'Create polls and open questions.',
    emoji: '📊',
    accent: 'purple'
  },
  {
    key: 'recaps',
    title: 'Daily recaps',
    line: 'Every day, not just the week.',
    emoji: '📅',
    accent: 'amber'
  },
  {
    key: 'storage',
    title: 'Keep everything',
    line: 'No 30 day rolling window.',
    emoji: '📦',
    accent: 'blue'
  },
  {
    key: 'events',
    title: 'Host up to 100',
    line: 'Plus member activities and drops.',
    emoji: '🎉',
    accent: 'pink'
  }
];

const PORTAL_LINKS = [
  { label: 'Vote on what gets built', line: 'One member, one vote' },
  { label: 'Where the money goes', line: 'Open books, every quarter' },
  { label: 'Send feedback', line: 'Straight to the people building it' }
];

export default function CoopBenefitsScreen() {
  const router = useRouter();
  const [member, setMember] = useState(false);
  const [since, setSince] = useState<string | undefined>();
  const [renews, setRenews] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getMembership().then((m) => {
      setMember(m.member);
      setSince(m.since);
      setRenews(m.renews);
    });
  }, []);

  const caps = member ? MEMBER_BENEFITS : FREE_BENEFITS;

  async function onJoin() {
    if (busy) return;
    setBusy(true);
    try {
      const m = await joinCoop('soft');
      setMember(m.member);
      setSince(m.since);
      setRenews(m.renews);
      router.push('/coop/portal');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Co-op"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={COOP.benefits.page_title}
      />
      <ScreenBody>
        <AnalyticsRegion analyticsId={COOP.benefits.hero} interactive={false}>
          <View style={ORGANIC.banner} className="mb-4 overflow-hidden bg-teal p-5">
            <Text className="font-pixel text-[17px] leading-tight text-onaccent">
              You are not the product.
            </Text>
            <Text className="mt-1.5 font-sans-sb text-[14px] text-onaccent/80">
              {member
                ? `Member${since ? ` since ${since}` : ''}${renews ? ` · renews ${renews}` : ''}`
                : '$24 a year · members keep it running'}
            </Text>
          </View>
        </AnalyticsRegion>

        <View className="mb-5">
          <SectionTitle
            title="Always free"
            description="Connecting is never behind a paywall. Everyone can meet people, message friends, and use the core of Bridger without joining the co-op."
            infoAnalyticsId={COOP.benefits.free_info}
            parentScreen="coop"
            section="benefits"
            className="mb-3"
          />
          <PortalPanel accent="green" fill="solid" shape="soft">
            <View className="gap-2">
              {ALWAYS_FREE.map((line) => (
                <View key={line} className="flex-row items-start gap-2.5">
                  <View className="mt-0.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white/30">
                    <CheckIcon size={12} color="#1C1B16" strokeWidth={3.5} />
                  </View>
                  <Text className="flex-1 font-sans-sb text-[14px] text-onaccent">
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </PortalPanel>
        </View>

        <View className="mb-5">
          <SectionTitle
            title="Members get"
            description="Member perks are about room to customize and host — never about who you are allowed to connect with."
            infoAnalyticsId={COOP.benefits.unlocks_info}
            parentScreen="coop"
            section="benefits"
            className="mb-3"
          />
          <View className="flex-row flex-wrap gap-2.5">
            {UNLOCKS.map((u, i) => (
              <View key={u.key} className="w-[47%] min-w-[140px] flex-1">
                <PortalPanel
                  accent={u.accent}
                  fill="solid"
                  shape={i % 2 === 0 ? 'soft' : 'flip'}
                  className="p-4"
                >
                  <Text className="text-[18px]">{u.emoji}</Text>
                  <Text
                    className={cn(
                      'mt-2 font-sans-b text-[15px] leading-tight',
                      ACCENTS[u.accent].text
                    )}
                  >
                    {u.title}
                  </Text>
                  <Text
                    className={cn(
                      'mt-0.5 font-sans-sb text-[12px] leading-snug',
                      ACCENTS[u.accent].text
                    )}
                    style={{ opacity: 0.88 }}
                  >
                    {u.line}
                  </Text>
                </PortalPanel>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-5">
          <SectionTitle
            title="Your circles"
            description="Acquaintances stay unlimited for everyone. Member plans remove caps on close friends and friends."
            infoAnalyticsId={COOP.benefits.info}
            parentScreen="coop"
            section="benefits"
            className="mb-3"
          />
          <PortalPanel accent="purple" fill="solid" shape="bold">
            {(
              [
                ['Close friends', caps.circleCaps.close],
                ['Friends', caps.circleCaps.friends],
                ['Acquaintances', 'Unlimited']
              ] as const
            ).map(([label, value]) => (
              <View
                key={String(label)}
                className="flex-row items-center justify-between py-1.5"
              >
                <Text className="font-sans-sb text-[14px] text-white">{label}</Text>
                <Text className="font-sans-b text-[14px] text-white/85">
                  {value === Infinity ? 'Unlimited' : value}
                </Text>
              </View>
            ))}
          </PortalPanel>
        </View>

        <PortalPanel accent="amber" fill="solid" shape="flip" className="mb-5">
          <Text className="font-sans-sb text-[13px] leading-snug text-onaccent/90">
            <Text className="font-sans-b text-onaccent">Always readable. </Text>
            Any profile can be switched to the plain view in one tap, however it
            is decorated.
          </Text>
        </PortalPanel>

        <View className="mb-8">
          <SectionTitle
            title="Member portal"
            description="The public governance hub: mission, model, ideas, beta votes, and open books. Anyone can read; members can participate."
            infoAnalyticsId={COOP.portal.info}
            parentScreen="coop"
            section="benefits"
            className="mb-3"
          />

          <View className="gap-2.5">
            {PORTAL_LINKS.map((l) => (
              <ListRow
                key={l.label}
                label={l.label}
                sublabel={l.line}
                trailing="chevron"
                onPress={() => router.push('/coop/portal')}
                analyticsId={HOME.coop.open_portal}
              />
            ))}

            {member ? (
              <ButtonPrimary
                full
                size="lg"
                analyticsId={COOP.benefits.open_portal}
                onPress={() => router.push('/coop/portal')}
                accessibilityLabel="Open the member portal"
              >
                Open the portal
              </ButtonPrimary>
            ) : (
              <>
                <PortalPanel accent="coral" fill="solid" shape="soft">
                  <Text className="font-sans-sb text-[13px] leading-snug text-onaccent/90">
                    <Text className="font-sans-b text-onaccent">Members only. </Text>
                    Joining opens the portal, where members vote on what gets
                    built and see where the money goes.
                  </Text>
                </PortalPanel>
                <ButtonPrimary
                  full
                  size="lg"
                  analyticsId={COOP.benefits.join}
                  onPress={() => void onJoin()}
                  loading={busy}
                  accessibilityLabel="Join the co-op for twenty four dollars a year"
                >
                  Join · $24 a year
                </ButtonPrimary>
              </>
            )}
          </View>
        </View>

      </ScreenBody>
    </Screen>
  );
}
