// ============================================
// WHAT THIS FILE DOES (plain English):
// The Discover tab — friends of friends worth meeting. Opt-in gate first,
// then private match modules, "Wants to connect" approvals, and Bridger's
// picks (overlap-first cards). Synth grid behind everything. Data comes from
// useDiscover so demo fixtures and the live API use the same screen.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SettingsIcon } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  EmptyState,
  ListRow,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  useThemeColors
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
        <ScreenHeader title="Discover" messagesDormant />
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
            void onAcceptRequest(selected.requestId);
            Alert.alert('Connected', 'The full connection reveal ships next.');
          } else if (selected.suggestionId) {
            void onAddSuggestion(selected.suggestionId);
            Alert.alert('Request sent', 'The full connection reveal ships next.');
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
        messagesDormant
        trailing={
          <Pressable
            onPress={() => setSettingsOpen(true)}
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
            compact={requests.length + suggestions.length > 0}
            onComplete={onCompleteModule}
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
                    leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} />}
                    label={p.name}
                    sublabel={`via ${via.name.split(' ')[0]}`}
                    trailing="chevron"
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
          <PixelHeading size="md">People to meet</PixelHeading>
          <Text className="mb-3 mt-0.5 font-sans-sb text-[13px] text-ink-mute">
            Bridger's picks · friends of your friends
          </Text>
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
                  void onAddSuggestion(s.id);
                  Alert.alert('Request sent', 'The full connection reveal ships next.');
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
