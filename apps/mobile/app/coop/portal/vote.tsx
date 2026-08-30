// ============================================
// WHAT THIS FILE DOES (plain English):
// Beta voting — public can read notes; members verify a code then vote.
// Never show tallies. Section title opens a short explainer.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CoopBetaVersion } from '@bridger/shared';
import { COOP } from '../../../lib/analytics-ids';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader,
  useThemeColors
} from '@bridger/ui';
import { PortalNav } from '../../../components/coop/PortalNav';
import { PortalPanel } from '../../../components/coop/PortalPanel';
import {
  getBetaCurrent,
  getMembership,
  verifyBeta,
  voteBeta
} from '../../../data/coop';

export default function CoopVoteScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const [member, setMember] = useState(false);
  const [beta, setBeta] = useState<CoopBetaVersion | null>(null);
  const [code, setCode] = useState('');

  const load = useCallback(async () => {
    const [m, b] = await Promise.all([getMembership(), getBetaCurrent()]);
    setMember(m.member);
    setBeta(b);
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Vote"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={COOP.vote.section_header}
      />
      {/* KEYBOARD: vote note field needs room while typing. */}
      <ScreenBody adjustKeyboardInsets>
        <PortalNav />
        <SectionTitle
          title="Current beta"
          description="Read the release notes, then members unlock voting with a code. You can say yes, no, or extend. Live tallies stay with operators — not on this screen."
          infoAnalyticsId={COOP.vote.info}
          parentScreen="coop"
          section="vote"
          className="mb-3"
        />

        {!beta ? (
          <PortalPanel accent="coral" fill="solid" shape="soft">
            <Text className="font-sans-sb text-[14px] text-onaccent">
              No open beta round right now.
            </Text>
          </PortalPanel>
        ) : (
          <AnalyticsRegion analyticsId={COOP.vote.section_header} interactive={false}>
            <PortalPanel accent="coral" fill="solid" shape="banner" className="mb-4">
              <Text className="font-sans-b text-[18px] text-onaccent">{beta.label}</Text>
              {beta.releaseNotes ? (
                <Text className="mt-2 font-sans-sb text-[14px] text-onaccent/90">
                  {beta.releaseNotes}
                </Text>
              ) : null}
              {beta.knownIssues ? (
                <Text className="mt-3 font-sans-sb text-[13px] text-onaccent/80">
                  Known issues: {beta.knownIssues}
                </Text>
              ) : null}
              {beta.unfinished ? (
                <Text className="mt-2 font-sans-sb text-[13px] text-onaccent/80">
                  Still unfinished:{'\n'}
                  {beta.unfinished}
                </Text>
              ) : null}
            </PortalPanel>

            {!member ? (
              <ButtonPrimary
                full
                analyticsId={COOP.portal.join_cta}
                onPress={() => router.push('/coop')}
              >
                Join to vote
              </ButtonPrimary>
            ) : !beta.unlocked ? (
              <PortalPanel accent="amber" fill="surface" shape="bold">
                <Text className="font-sans-b text-[14px] text-ink">
                  Access code
                </Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  placeholder="BRIDGER-BETA"
                  placeholderTextColor={c.inkMute}
                  className="mt-2 font-sans-sb text-[15px] text-ink"
                />
                <View className="mt-3">
                  <ButtonPrimary
                    size="sm"
                    analyticsId={COOP.vote.verify}
                    onPress={async () => {
                      try {
                        await verifyBeta(code);
                        await load();
                      } catch {
                        Alert.alert('Code', 'That access code did not work.');
                      }
                    }}
                  >
                    Unlock voting
                  </ButtonPrimary>
                </View>
              </PortalPanel>
            ) : (
              <View className="gap-2.5">
                {(
                  [
                    ['yes', 'Yes, approve it', 'teal'],
                    ['no', "No, don't like it", 'coral'],
                    ['extend', 'Extend deliberation', 'amber']
                  ] as const
                ).map(([choice, label, accent]) => {
                  const selected = beta.myVote === choice;
                  return (
                    <PortalPanel
                      key={choice}
                      accent={accent}
                      fill="solid"
                      shape="soft"
                    >
                      {selected ? (
                        <ButtonSecondary
                          full
                          tone="light"
                          analyticsId={COOP.vote.beta_vote}
                          onPress={async () => {
                            await voteBeta(choice);
                            setBeta({ ...beta, myVote: choice });
                          }}
                        >
                          {label} · your vote
                        </ButtonSecondary>
                      ) : (
                        <ButtonPrimary
                          full
                          size="md"
                          analyticsId={COOP.vote.beta_vote}
                          onPress={async () => {
                            await voteBeta(choice);
                            setBeta({ ...beta, myVote: choice });
                          }}
                        >
                          {label}
                        </ButtonPrimary>
                      )}
                    </PortalPanel>
                  );
                })}
              </View>
            )}
          </AnalyticsRegion>
        )}
      </ScreenBody>
    </Screen>
  );
}
