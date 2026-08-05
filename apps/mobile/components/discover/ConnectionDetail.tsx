// ============================================
// WHAT THIS FILE DOES (plain English):
// One request or suggestion opened full-screen: their face, Accept/Decline
// (or Add / Not now), Map A of how you're linked, and what you have in common.
// Full connection reveal ships later (REVEAL.md); this is the decision surface.
// Analytics: approve/decline use DISCOVER.wants_to_connect.*; Add uses people_to_meet.add.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { DISCOVER } from '@bridger/shared';
import {
  ButtonSecondary,
  NotFoundScreen,
  Screen,
  ScreenBody,
  ScreenHeader,
  SectionTitle
} from '@bridger/ui';
import type { Commonality } from '../../data/discover';
import { PersonAvatar } from '../PersonAvatar';
import { personById, personExists } from '../../data/people';
import { reportNotFoundHit } from '../../lib/route-trail';
import { CommonalityList } from './CommonalityList';
import { ConnectionMap } from './ConnectionMap';

export function ConnectionDetail({
  personId,
  viaId,
  kind,
  commonalities,
  onBack,
  onAccept,
  onDecline
}: {
  personId: string;
  viaId: string;
  kind: 'request' | 'suggestion';
  commonalities: Commonality[];
  onBack: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const person = personById(personId);
  const via = personById(viaId);
  const [decision, setDecision] = useState<'accepted' | 'declined' | null>(null);
  const reportedMissing = useRef(false);

  useEffect(() => {
    setDecision(null);
  }, [personId, kind]);

  // Broken connection path → Magic Patterns 404 + trail for admin.
  useEffect(() => {
    if (personExists(personId) || reportedMissing.current) return;
    reportedMissing.current = true;
    void reportNotFoundHit({
      missingPath: `/discover/connect/${personId}`,
      reason: 'connection_error'
    });
  }, [personId]);

  if (!personExists(personId)) {
    return (
      <NotFoundScreen
        title="Error 404"
        onDismiss={onBack}
      />
    );
  }

  // Requests use approve/decline; suggestions reuse add / dismiss ids.
  const acceptId =
    kind === 'request' ? DISCOVER.wants_to_connect.approve : DISCOVER.people_to_meet.add;
  const declineId =
    kind === 'request' ? DISCOVER.wants_to_connect.decline : DISCOVER.people_to_meet.dismiss;

  return (
    <Screen tone="synth">
      <ScreenHeader title="Connect" onBack={onBack} hideProfile analyticsSurface="discover" />
      <ScreenBody>
        <View className="items-center">
          <PersonAvatar id={person.id} size="xl" />
          <Text className="mt-3 font-sans-b text-[20px] tracking-tight text-ink">
            {person.name}
          </Text>
          <Text className="font-sans-sb text-[13px] text-ink-mute">
            via {via.name} · {person.label}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1">
            <ButtonSecondary
              full
              size="lg"
              tone={decision === 'declined' ? 'solid' : 'outline'}
              analyticsId={declineId}
              onPress={() => {
                setDecision('declined');
                onDecline();
              }}
              accessibilityLabel={kind === 'request' ? 'Decline' : 'Not now'}
            >
              {kind === 'request' ? 'Decline' : 'Not now'}
            </ButtonSecondary>
          </View>
          <View className="flex-1">
            <ButtonSecondary
              full
              size="lg"
              tone="positive"
              analyticsId={acceptId}
              onPress={() => {
                setDecision('accepted');
                onAccept();
              }}
              accessibilityLabel={
                decision === 'accepted'
                  ? 'Accepted'
                  : kind === 'request'
                    ? 'Accept'
                    : 'Add'
              }
            >
              {decision === 'accepted' ? 'Accepted ✓' : kind === 'request' ? 'Accept' : 'Add'}
            </ButtonSecondary>
          </View>
        </View>

        <View className="mt-5">
          <ConnectionMap person={person} via={via} />
        </View>

        <View className="mt-6">
          <SectionTitle
            title="In common"
            description="What you and they already share — the reason Bridger thinks you'd click. The same list lives on their profile under In common."
            infoAnalyticsId={DISCOVER.in_common.info}
            parentScreen="discover"
            section="in_common"
            className="mb-2"
          />
          {/* Discover shows the shared hobbies only — the answers live in the reveal / In common. */}
          <CommonalityList
            items={commonalities}
            theirName={person.name.split(' ')[0]}
            showAnswers={false}
          />
        </View>
      </ScreenBody>
    </Screen>
  );
}
