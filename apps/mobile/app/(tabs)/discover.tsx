// ============================================
// WHAT THIS FILE DOES (plain English):
// The Discover tab — friends of friends worth meeting. Opt-in gate first,
// then private match modules, "Wants to connect" approvals, and Bridger's
// picks (overlap-first cards). Synth grid behind everything. Data comes from
// useDiscover so demo fixtures and the live API use the same screen.
// Analytics: surface=discover; cards and settings gear use DISCOVER.* IDs.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SettingsIcon } from 'lucide-react-native';
import { DISCOVER, openSurface } from '@bridger/shared';
import {
  Avatar,
  Badge,
  EmptyState,
  ListRow,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  SectionTitle,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { ConnectionDetail } from '../../components/discover/ConnectionDetail';
import { DiscoverGate } from '../../components/discover/DiscoverGate';
import { DiscoverSettingsSheet } from '../../components/discover/DiscoverSettingsSheet';
import { MatchModules } from '../../components/discover/MatchModules';
import { SuggestionCard } from '../../components/discover/SuggestionCard';
import type { Commonality } from '../../data/discover';
import { personById } from '../../data/people';
import { useDiscover } from '../../hooks/useDiscover';

type DiscoverView = 'gate' | 'main' | 'detail';

type Selection = {
  personId: string;
  viaId: string;
  kind: 'request' | 'suggestion';
  suggestionId?: string;
  requestId?: string;
};

export default function DiscoverScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const {
    settings,
    suggestions,
    requests,
    modules,
    completedModuleIds,
    onSetDiscoverable,
    onSetSources,
    onAcceptRequest,
    onDeclineRequest,
    onAddSuggestion,
    onDontSuggest,
    onCompleteModule,
    loadCommonalities
  } = useDiscover();

  const [view, setView] = useState<DiscoverView>('main');
  const [selected, setSelected] = useState<Selection | null>(null);
  const [commonalities, setCommonalities] = useState<Commonality[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mark Discover as the active analytics surface.
  useEffect(() => {
    openSurface('discover');
  }, []);

  // Gate when matching is off; otherwise stay on main (or detail).
  useEffect(() => {
    if (!settings) return;
    if (!settings.discoverable && view !== 'gate') {
      setView('gate');
      setSelected(null);
    }
    if (settings.discoverable && view === 'gate') {
      // stay on gate until Get started — unless we just turned it on from gate
    }
  }, [settings, view]);

  // First paint: if demo settings say discoverable, show main.
  useEffect(() => {
    if (settings && !settings.discoverable) setView('gate');
  }, [settings?.discoverable]);

  const openDetail = async (sel: Selection) => {
    setSelected(sel);
    setCommonalities(await loadCommonalities(sel.personId));
    setView('detail');
  };

  if (!settings) {
    return (
      <Screen tone="synth">
        <ScreenHeader title="Discover" analyticsSurface="discover" />
        <ScreenBody>
          <Text className="font-sans-sb text-[14px] text-ink-mute">Loading…</Text>
        </ScreenBody>
      </Screen>
    );
  }

  if (view === 'gate' || !settings.discoverable) {
    return (
      <DiscoverGate
        onStart={() => {
          void onSetDiscoverable(true);
          setView('main');
        }}
      />
    );
  }

  if (view === 'detail' && selected) {
    return (
      <ConnectionDetail
        personId={selected.personId}
        viaId={selected.viaId}
        kind={selected.kind}
        commonalities={commonalities}
        onBack={() => {
          setView('main');
          setSelected(null);
        }}
        onAccept={() => {
          if (selected.kind === 'request' && selected.requestId) {
            // Both sides are connected — play the celebratory reveal.
            void onAcceptRequest(selected.requestId);
            const personId = selected.personId;
            const via = selected.viaId;
            setView('main');
            setSelected(null);
            router.push({
              pathname: '/reveal/[id]',
              params: { id: personId, via }
            });
            return;
          }
          if (selected.suggestionId) {
            // Reveal only plays once both sides connect; for now confirm the ask.
            void onAddSuggestion(selected.suggestionId);
            Alert.alert(
              'Request sent',
              'When they accept, you both get the connection reveal.'
            );
          }
          setView('main');
          setSelected(null);
        }}
        onDecline={() => {
          if (selected.kind === 'request' && selected.requestId) {
            void onDeclineRequest(selected.requestId);
          } else if (selected.suggestionId) {
            void onDontSuggest(selected.suggestionId);
          }
          setView('main');
          setSelected(null);
        }}
      />
    );
  }

  return (
    <Screen tone="synth">
      <ScreenHeader
        title="Discover"
        analyticsSurface="discover"
        trailing={
          <Pressable
            onPress={withAnalyticsPress(DISCOVER.top_nav.settings_icon, () =>
              setSettingsOpen(true)
            )}
            accessibilityRole="button"
            accessibilityLabel="Discover settings"
            className="h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-surface active:bg-[#F1ECFF]"
          >
            <SettingsIcon size={18} color={c.ink} strokeWidth={2.2} />
          </Pressable>
        }
      />

      <ScreenBody>
        {/* first thing: what you want to be matched on */}
        <View>
          <MatchModules
            modules={modules}
            completedIds={completedModuleIds}
            onComplete={onCompleteModule}
            previewLimit={2}
            onSeeMore={() => router.push('/discover/connect-over')}
          />
        </View>

        {requests.length > 0 ? (
          <View className="mt-7">
            <View className="mb-2 flex-row items-center gap-2">
              <PixelHeading size="md">Wants to connect</PixelHeading>
              <Badge tone="new">{requests.length}</Badge>
            </View>
            <View className="gap-2.5">
              {requests.map((r) => {
                const p = personById(r.personId);
                const via = personById(r.viaFriendId ?? 'devon');
                return (
                  <ListRow
                    key={r.id}
                    leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} />}
                    label={p.name}
                    sublabel={`via ${via.name.split(' ')[0]}`}
                    trailing="chevron"
                    analyticsId={DISCOVER.wants_to_connect.card}
                    onPress={() =>
                      void openDetail({
                        personId: p.id,
                        viaId: via.id,
                        kind: 'request',
                        requestId: r.id
                      })
                    }
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        <View className="mt-7">
          {/* Subtitle moved into the info bubble so the title stays clean */}
          <SectionTitle
            title="People to meet"
            description="Friends of your friends that Bridger thinks you'd click with. Suggestions only, never a public list."
            infoAnalyticsId={DISCOVER.people_to_meet.info}
            parentScreen="discover"
            section="people_to_meet"
            className="mb-3"
          />
          <View className="gap-2.5">
            {suggestions.length === 0 ? (
              <EmptyState
                emoji="🌱"
                line="Answer a module or two above, then add a few friends. Bridger only introduces you through people you already know."
              />
            ) : null}
            {suggestions.map((s, i) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                spotlight={i === 0}
                onOpen={() =>
                  void openDetail({
                    personId: s.personId,
                    viaId: s.viaFriendId,
                    kind: 'suggestion',
                    suggestionId: s.id
                  })
                }
                onAdd={() => {
                  // Reveal waits until they accept — just confirm the ask for now.
                  void onAddSuggestion(s.id);
                  Alert.alert(
                    'Request sent',
                    'When they accept, you both get the connection reveal.'
                  );
                }}
              />
            ))}
          </View>
        </View>
      </ScreenBody>

      <DiscoverSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSetDiscoverable={(on) => void onSetDiscoverable(on)}
        onSetSources={(patch) => void onSetSources(patch)}
        onTurnOff={() => {
          void onSetDiscoverable(false);
          setView('gate');
        }}
      />
    </Screen>
  );
}
