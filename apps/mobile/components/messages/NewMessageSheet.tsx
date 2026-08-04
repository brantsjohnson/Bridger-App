// ============================================
// WHAT THIS FILE DOES (plain English):
// "New message" sheet — search your friends roster and tap one to open (or
// start) a conversation. Only connected friends appear. Own analytics surface
// so open/bail dwell is measured separately from the Messages tab.
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronRightIcon } from 'lucide-react-native';
import { NEW_MESSAGE_SHEET } from '@bridger/shared';
import {
  Avatar,
  SearchField,
  Sheet,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { listFriends, type FriendRow } from '../../data/friends';

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (personId: string) => void;
};

export function NewMessageSheet({ open, onClose, onPick }: Props) {
  const c = useThemeColors();
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState<FriendRow[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    void listFriends().then(setFriends);
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((p) => p.name.toLowerCase().includes(q));
  }, [friends, query]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New message"
      surface="new_message_sheet"
      parentScreen="messages"
      dismissAnalyticsId={NEW_MESSAGE_SHEET.dismiss}
    >
      <View className="gap-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search friends"
          analyticsId={NEW_MESSAGE_SHEET.search}
        />

        <ScrollView className="max-h-[300px]" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            {matches.map((p) => (
              <Pressable
                key={p.id}
                onPress={withAnalyticsPress(NEW_MESSAGE_SHEET.friend_row, () =>
                  onPick(p.id)
                )}
                accessibilityRole="button"
                accessibilityLabel={`Message ${p.name}`}
                className="min-h-[44px] flex-row items-center gap-3 rounded-2xl border border-ink-line bg-white px-3.5 py-3 active:bg-[#F1ECFF]"
              >
                <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="sm" />
                <Text
                  numberOfLines={1}
                  className="min-w-0 flex-1 font-sans-b text-[15px] text-ink"
                >
                  {p.name}
                </Text>
                <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.6} />
              </Pressable>
            ))}

            {matches.length === 0 ? (
              <Text className="py-6 text-center font-sans-sb text-[13px] text-ink-mute">
                No friends found
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Sheet>
  );
}
