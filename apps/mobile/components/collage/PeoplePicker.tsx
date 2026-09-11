// ============================================
// WHAT THIS FILE DOES (plain English):
// Pick friends to tag on this page. We store their ids on the page. Names
// are looked up here from the roster so the chip can say "With Maya".
// Analytics only records that a tag happened, never who.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { COLLAGE_PEOPLE } from '@bridger/shared';
import { AnalyticsRegion, ButtonPrimary, Sheet, cn, withAnalyticsPress } from '@bridger/ui';
import { listFriends, type FriendRow } from '../../data/friends';

export function PeoplePicker({
  open,
  onClose,
  selectedIds,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSave: (ids: string[]) => void;
}) {
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [picked, setPicked] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (!open) return;
    setPicked(selectedIds);
    void listFriends()
      .then(setFriends)
      .catch(() => setFriends([]));
  }, [open, selectedIds]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Tag a friend"
      surface="collage_people"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_PEOPLE.chrome.dismiss}
      footer={
        <ButtonPrimary
          analyticsId={COLLAGE_PEOPLE.chrome.done}
          onPress={() => {
            onSave(picked);
            onClose();
          }}
        >
          Done
        </ButtonPrimary>
      }
    >
      {friends.length === 0 ? (
        <AnalyticsRegion analyticsId={COLLAGE_PEOPLE.list.empty} interactive={false}>
          <Text
            accessibilityRole="text"
            className="py-6 text-center font-sans-md text-ink/55"
          >
            Add friends first, then you can tag them here.
          </Text>
        </AnalyticsRegion>
      ) : (
        <ScrollView style={{ maxHeight: 360 }}>
          {friends.map((f) => {
            const on = picked.includes(f.id);
            return (
              <Pressable
                key={f.id}
                onPress={withAnalyticsPress(COLLAGE_PEOPLE.list.friend, () => {
                  setPicked((cur) => (on ? cur.filter((id) => id !== f.id) : [...cur, f.id]));
                })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={f.name}
                className={cn(
                  'mb-2 min-h-[44px] flex-row items-center rounded-2xl px-3',
                  on ? 'bg-[#D9E7F7]' : 'bg-eggshell'
                )}
              >
                <Text className="font-sans-sb text-[15px] text-ink">
                  {f.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Sheet>
  );
}
