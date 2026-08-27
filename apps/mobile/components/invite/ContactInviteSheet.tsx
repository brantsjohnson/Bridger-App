// ============================================
// WHAT THIS FILE DOES (plain English):
// After contacts permission, this sheet lists people on-device so you can tap
// one to text them your invite link. Nothing is uploaded to Bridger servers.
// Used by the demo-week access gate and by onboarding (Invite Link 1 / 2 / 3).
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { INVITE_ACCESS } from '@bridger/shared';
import { Sheet, withAnalyticsPress } from '@bridger/ui';

export type ContactPick = {
  id: string;
  name: string;
  phone: string;
};

export function ContactInviteSheet({
  open,
  contacts,
  onPick,
  onClose,
  title = 'Pick someone to invite',
  surface = 'invite_contacts_sheet',
  parentScreen = 'invite_access',
  pickAnalyticsId = INVITE_ACCESS.contact_row,
  cancelAnalyticsId = INVITE_ACCESS.contacts_cancel
}: {
  open: boolean;
  contacts: ContactPick[];
  onPick: (contact: ContactPick) => void;
  onClose: () => void;
  title?: string;
  surface?: string;
  parentScreen?: string;
  pickAnalyticsId?: string;
  cancelAnalyticsId?: string;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      surface={surface}
      parentScreen={parentScreen}
    >
      <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
        <View className="gap-2 pb-2">
          {contacts.length === 0 ? (
            <Text className="px-1 py-4 text-center font-sans-sb text-[14px] text-ink-mute">
              No contacts with phone numbers found. You can still share a link from the screen
              behind this.
            </Text>
          ) : null}
          {contacts.map((c) => (
            <Pressable
              key={c.id}
              onPress={withAnalyticsPress(pickAnalyticsId, () => onPick(c))}
              accessibilityRole="button"
              accessibilityLabel={`Invite ${c.name}`}
              className="rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90"
            >
              <Text className="font-sans-b text-[15px] text-ink">{c.name}</Text>
              <Text className="font-sans-sb text-[12px] text-ink-mute">{c.phone}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={withAnalyticsPress(cancelAnalyticsId, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            className="mt-2 items-center py-3"
          >
            <Text className="font-sans-b text-[14px] text-ink-mute">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Sheet>
  );
}
