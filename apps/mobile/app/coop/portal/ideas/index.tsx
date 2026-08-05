// ============================================
// WHAT THIS FILE DOES (plain English):
// Public ideas list — no support counts, no author names. Members can support
// or submit. Section title opens a short explainer bubble.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CoopIdea } from '@bridger/shared';
import { COOP } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  Chip,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader,
  ACCENTS,
  cn,
  useThemeColors
} from '@bridger/ui';
import { PortalNav } from '../../../../components/coop/PortalNav';
import {
  PortalPanel,
  portalAccentForIndex,
  portalShapeForIndex
} from '../../../../components/coop/PortalPanel';
import {
  createIdea,
  getMembership,
  listIdeas,
  toggleIdeaSupport
} from '../../../../data/coop';

const CATEGORIES = [
  'connection',
  'activities',
  'events',
  'friends',
  'safety',
  'privacy',
  'accessibility',
  'other'
] as const;

export default function CoopIdeasScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const [member, setMember] = useState(false);
  const [ideas, setIdeas] = useState<CoopIdea[]>([]);
  const [composing, setComposing] = useState(false);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [category, setCategory] = useState('other');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, list] = await Promise.all([getMembership(), listIdeas()]);
    setMember(m.member);
    setIdeas(list);
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function onSupport(id: string) {
    if (!member) {
      router.push('/coop');
      return;
    }
    const supported = await toggleIdeaSupport(id);
    setIdeas((prev) =>
      prev.map((i) => (i.id === id ? { ...i, supportedByMe: supported } : i))
    );
  }

  async function onSubmit() {
    if (!title.trim()) {
      Alert.alert('Idea', 'Add a short title.');
      return;
    }
    setBusy(true);
    try {
      await createIdea({
        title: title.trim(),
        problem: problem.trim() || undefined,
        category
      });
      setComposing(false);
      setStep(0);
      setTitle('');
      setProblem('');
      await load();
      Alert.alert(
        'Sent',
        'Thanks. It stays private until reviewed (or auto-approves in 48 hours).'
      );
    } catch (e) {
      Alert.alert('Could not send', String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Ideas"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={COOP.ideas.section_header}
      />
      <ScreenBody>
        <PortalNav />
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <SectionTitle
              title="What we build next"
              description="Browse public ideas without vote counts or author names. Members can support an idea or submit a new one for review."
              infoAnalyticsId={COOP.ideas.info}
              parentScreen="coop"
              section="ideas"
            />
          </View>
          <ButtonPrimary
            size="sm"
            analyticsId={COOP.ideas.open_submit}
            onPress={() => {
              if (!member) {
                router.push('/coop');
                return;
              }
              setComposing(true);
              setStep(0);
            }}
            accessibilityLabel="Submit an idea"
          >
            Submit
          </ButtonPrimary>
        </View>

        {composing ? (
          <PortalPanel accent="amber" fill="surface" shape="bold" className="mb-4">
            {step === 0 ? (
              <>
                <Text className="font-sans-b text-[14px] text-ink">The idea</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Short title"
                  placeholderTextColor={c.inkMute}
                  className="mt-2 font-sans-sb text-[15px] text-ink"
                />
                <View className="mt-3">
                  <ButtonPrimary size="sm" onPress={() => setStep(1)}>
                    Next
                  </ButtonPrimary>
                </View>
              </>
            ) : null}
            {step === 1 ? (
              <>
                <Text className="font-sans-b text-[14px] text-ink">
                  What problem does it solve?
                </Text>
                <TextInput
                  value={problem}
                  onChangeText={setProblem}
                  multiline
                  placeholder="A few sentences"
                  placeholderTextColor={c.inkMute}
                  className="mt-2 min-h-[80px] font-sans-sb text-[14px] text-ink"
                />
                <View className="mt-3 flex-row gap-2">
                  <ButtonSecondary size="sm" onPress={() => setStep(0)}>
                    Back
                  </ButtonSecondary>
                  <ButtonPrimary size="sm" onPress={() => setStep(2)}>
                    Next
                  </ButtonPrimary>
                </View>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <Text className="font-sans-b text-[14px] text-ink">Category</Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {CATEGORIES.map((cat, i) => (
                    <Chip
                      key={cat}
                      label={cat}
                      accent={portalAccentForIndex(i)}
                      selected={category === cat}
                      onPress={() => setCategory(cat)}
                      size="sm"
                    />
                  ))}
                </View>
                <View className="mt-3 flex-row gap-2">
                  <ButtonSecondary size="sm" onPress={() => setStep(1)}>
                    Back
                  </ButtonSecondary>
                  <ButtonPrimary
                    size="sm"
                    analyticsId={COOP.ideas.submit}
                    loading={busy}
                    onPress={() => void onSubmit()}
                  >
                    Send
                  </ButtonPrimary>
                </View>
              </>
            ) : null}
          </PortalPanel>
        ) : null}

        <View className="mb-8 gap-2.5">
          {ideas.map((idea, i) => {
            const accent = portalAccentForIndex(i);
            return (
            <AnalyticsRegion
              key={idea.id}
              analyticsId={COOP.ideas.idea_card}
              interactive={false}
            >
              <PortalPanel
                accent={accent}
                fill="solid"
                shape={portalShapeForIndex(i)}
              >
                <Text
                  className={cn(
                    'font-sans-b text-[11px] uppercase',
                    ACCENTS[accent].text
                  )}
                  style={{ opacity: 0.75 }}
                >
                  {idea.category} · {idea.status.replace(/_/g, ' ')}
                </Text>
                <Text
                  className={cn(
                    'mt-1 font-sans-b text-[16px]',
                    ACCENTS[accent].text
                  )}
                  onPress={() =>
                    router.push(`/coop/portal/ideas/${idea.id}` as never)
                  }
                >
                  {idea.title}
                </Text>
                {idea.body ? (
                  <Text
                    className={cn(
                      'mt-1 font-sans-sb text-[13px]',
                      ACCENTS[accent].text
                    )}
                    style={{ opacity: 0.88 }}
                  >
                    {idea.body}
                  </Text>
                ) : null}
                <View className="mt-3 flex-row gap-2">
                  {member && !idea.supportedByMe ? (
                    <ButtonPrimary
                      size="sm"
                      analyticsId={COOP.ideas.support}
                      onPress={() => void onSupport(idea.id)}
                    >
                      Support
                    </ButtonPrimary>
                  ) : (
                    <ButtonSecondary
                      size="sm"
                      tone={idea.supportedByMe ? 'light' : 'outline'}
                      analyticsId={COOP.ideas.support}
                      onPress={() => void onSupport(idea.id)}
                    >
                      {member
                        ? idea.supportedByMe
                          ? 'Supported'
                          : 'Support'
                        : 'Join to support'}
                    </ButtonSecondary>
                  )}
                  <ButtonSecondary
                    size="sm"
                    tone="ghost"
                    onPress={() =>
                      router.push(`/coop/portal/ideas/${idea.id}` as never)
                    }
                  >
                    Open
                  </ButtonSecondary>
                </View>
              </PortalPanel>
            </AnalyticsRegion>
            );
          })}
          {ideas.length === 0 ? (
            <PortalPanel accent="teal" fill="solid" shape="soft">
              <Text className="font-sans-sb text-[14px] text-onaccent">
                No public ideas yet. Members can submit the first one.
              </Text>
            </PortalPanel>
          ) : null}
        </View>
      </ScreenBody>
    </Screen>
  );
}
