// ============================================
// WHAT THIS FILE DOES (plain English):
// The "Blocked people" sheet in Settings. Undoing a block is as easy as
// making one, and nobody is told either way — that promise is written right
// on the sheet.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Person } from '@bridger/shared';
import { Avatar, Sheet } from '@bridger/ui';

export function BlockedPeopleSheet({
  open,
  people,
  onClose,
  onUnblock
}: {
  open: boolean;
  people: Person[];
  onClose: () => void;
  onUnblock: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Blocked people">
      {people.length === 0 ? (
        <Text className="py-6 text-center font-sans-sb text-[14px] text-ink-mute">
          Nobody is blocked.
        </Text>
      ) : (
        <>
          <Text className="mb-3 font-sans-sb text-[13px] leading-snug text-ink-mute">
            They cannot find you, message you, or see anything you post. They were not told, and
            they will not be told if you unblock them.
          </Text>
          <ScrollView style={{ maxHeight: 360 }}>
            <View className="gap-2">
              {people.map((p) => (
                <View
                  key={p.id}
                  className="flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-2.5"
                >
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />
                  <Text numberOfLines={1} className="min-w-0 flex-1 font-sans-b text-[14px] text-ink">
                    {p.name}
                  </Text>
                  <Pressable
                    onPress={() => onUnblock(p.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Unblock ${p.name}`}
                    className="min-h-[36px] shrink-0 justify-center rounded-full border border-ink-line bg-surface px-3.5 py-1.5 active:bg-[#F1ECFF]"
                  >
                    <Text className="font-sans-b text-[12px] text-ink">Unblock</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}
    </Sheet>
  );
}
