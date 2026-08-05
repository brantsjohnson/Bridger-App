// ============================================
// WHAT THIS FILE DOES (plain English):
// Idea detail — public when approved. Comments show as "A member" only.
// Support without tallies. Section titles open short explainers.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { CoopIdea, CoopIdeaComment } from '@bridger/shared';
import { COOP } from '@bridger/shared';
import {
  ButtonPrimary,
  ButtonSecondary,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader,
  useThemeColors
} from '@bridger/ui';
import { PortalPanel } from '../../../../components/coop/PortalPanel';
import {
  addIdeaComment,
  getIdea,
  getMembership,
  toggleIdeaSupport
} from '../../../../data/coop';

export default function CoopIdeaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const [member, setMember] = useState(false);
  const [idea, setIdea] = useState<(CoopIdea & { comments: CoopIdeaComment[] }) | null>(
    null
  );
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [m, detail] = await Promise.all([getMembership(), getIdea(id)]);
    setMember(m.member);
    setIdea(detail);
  }, [id]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  if (!idea) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Idea" onBack={() => router.back()} hideProfile />
        <ScreenBody>
          <Text className="font-sans-sb text-ink-mute">Loading…</Text>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Idea"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
      />
      <ScreenBody>
        <PortalPanel accent="amber" fill="solid" shape="banner" className="mb-3">
          <Text className="font-sans-b text-[11px] uppercase text-onaccent/80">
            {idea.category} · {idea.status.replace(/_/g, ' ')}
          </Text>
          <Text className="mt-1 font-sans-b text-[20px] text-onaccent">{idea.title}</Text>
          {idea.body ? (
            <Text className="mt-2 font-sans-sb text-[15px] leading-snug text-onaccent/90">
              {idea.body}
            </Text>
          ) : null}
        </PortalPanel>

        {idea.evidence ? (
          <PortalPanel accent="teal" fill="surface" shape="soft" className="mb-2">
            <Text className="font-sans-b text-[13px] text-ink">Evidence</Text>
            <Text className="mt-1 font-sans-sb text-[13px] text-ink-soft">
              {idea.evidence}
            </Text>
          </PortalPanel>
        ) : null}
        {idea.drawbacks ? (
          <PortalPanel accent="coral" fill="surface" shape="flip" className="mb-2">
            <Text className="font-sans-b text-[13px] text-ink">Risks</Text>
            <Text className="mt-1 font-sans-sb text-[13px] text-ink-soft">
              {idea.drawbacks}
            </Text>
          </PortalPanel>
        ) : null}

        <View className="mt-3">
          {member && !idea.supportedByMe ? (
            <ButtonPrimary
              size="sm"
              analyticsId={COOP.ideas.support}
              onPress={async () => {
                const supported = await toggleIdeaSupport(idea.id);
                setIdea({ ...idea, supportedByMe: supported });
              }}
            >
              Support
            </ButtonPrimary>
          ) : (
            <ButtonSecondary
              size="sm"
              tone={idea.supportedByMe ? 'positive' : 'outline'}
              analyticsId={COOP.ideas.support}
              onPress={async () => {
                if (!member) {
                  router.push('/coop');
                  return;
                }
                const supported = await toggleIdeaSupport(idea.id);
                setIdea({ ...idea, supportedByMe: supported });
              }}
            >
              {member
                ? idea.supportedByMe
                  ? 'Supported'
                  : 'Support'
                : 'Join to support'}
            </ButtonSecondary>
          )}
        </View>

        <View className="mb-8 mt-6">
          <SectionTitle
            title="Comments"
            description="Members can leave notes. Everyone sees them as “A member” — no names or usernames on the portal."
            infoAnalyticsId={COOP.ideas.info}
            parentScreen="coop"
            section="ideas"
            className="mb-3"
          />
          <View className="gap-2">
            {(idea.comments ?? []).map((cm, i) => (
              <PortalPanel
                key={cm.id}
                accent={i % 2 === 0 ? 'purple' : 'blue'}
                fill="solid"
                shape={i % 2 === 0 ? 'soft' : 'flip'}
              >
                <Text className="font-sans-b text-[12px] text-white/75">
                  {cm.authorLabel ?? 'A member'}
                </Text>
                <Text className="mt-1 font-sans-sb text-[14px] text-white">
                  {cm.body}
                </Text>
              </PortalPanel>
            ))}
          </View>
          {member ? (
            <PortalPanel accent="green" fill="surface" shape="bold" className="mt-3">
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment"
                placeholderTextColor={c.inkMute}
                className="min-h-[60px] font-sans-sb text-[14px] text-ink"
                multiline
              />
              <View className="mt-2">
                <ButtonPrimary
                  size="sm"
                  analyticsId={COOP.ideas.comment}
                  onPress={async () => {
                    const text = comment.trim();
                    if (!text) return;
                    const created = await addIdeaComment(idea.id, text);
                    setIdea({
                      ...idea,
                      comments: [...(idea.comments ?? []), created]
                    });
                    setComment('');
                  }}
                >
                  Post comment
                </ButtonPrimary>
              </View>
            </PortalPanel>
          ) : null}
        </View>
      </ScreenBody>
    </Screen>
  );
}
