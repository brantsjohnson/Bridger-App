// ============================================
// WHAT THIS FILE DOES (plain English):
// Search the visible fields on this profile (e.g. type "drink" → jump to
// favorite drink). Never logs the query text. Own and friend both use it.
// ============================================
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'lucide-react-native';
import { PROFILE, dismissSurface, openSurface, trackClick } from '@bridger/shared';
import { useThemeColors, withAnalyticsPress } from '@bridger/ui';

export type ProfileSearchHit = {
  id: string;
  label: string;
  value: string;
  section: string;
};

export function ProfileSearchSheet({
  open,
  hits,
  onClose,
  onJump
}: {
  open: boolean;
  hits: ProfileSearchHit[];
  onClose: () => void;
  onJump: (hit: ProfileSearchHit) => void;
}) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const [q, setQ] = useState('');

  React.useEffect(() => {
    if (!open) {
      setQ('');
      return;
    }
    openSurface('profile_search_sheet', 'profile');
    return () => dismissSurface('profile_search_sheet');
  }, [open]);

  // PRIVACY: filter locally; never send query to analytics or a server log.
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return hits.slice(0, 12);
    return hits.filter(
      (h) =>
        h.label.toLowerCase().includes(needle) ||
        h.value.toLowerCase().includes(needle) ||
        h.section.toLowerCase().includes(needle)
    );
  }, [hits, q]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
        className="flex-1 bg-canvas"
      >
        <View className="flex-row items-center gap-3 px-4">
          <Pressable
            onPress={withAnalyticsPress(PROFILE.top_nav.back, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close search"
            className="h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-surface"
          >
            <XIcon size={18} color={c.ink} strokeWidth={2.4} />
          </Pressable>
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            onFocus={() => trackClick(PROFILE.top_nav.search)}
            placeholder="Search this profile"
            placeholderTextColor={c.inkMute}
            accessibilityLabel="Search this profile"
            className="min-h-[44px] min-w-0 flex-1 rounded-2xl border border-ink-line bg-surface px-4 font-sans-sb text-[16px] text-ink"
          />
        </View>
        <ScrollView className="mt-3 flex-1 px-4">
          {filtered.map((h) => (
            <Pressable
              key={h.id}
              onPress={() => {
                onJump(h);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${h.label}: ${h.value}`}
              className="min-h-[52px] justify-center border-b border-ink-line py-3"
            >
              <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                {h.section}
              </Text>
              <Text numberOfLines={1} className="font-sans-b text-[15px] text-ink">
                {h.label}
              </Text>
              <Text numberOfLines={1} className="font-sans-sb text-[13px] text-ink-soft">
                {h.value}
              </Text>
            </Pressable>
          ))}
          {filtered.length === 0 ? (
            <Text className="mt-8 text-center font-sans-sb text-[14px] text-ink-mute">
              No matches on this profile.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
