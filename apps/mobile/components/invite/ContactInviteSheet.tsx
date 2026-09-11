// ============================================
// WHAT THIS FILE DOES (plain English):
// After contacts permission, this sheet lists people on-device so you can tap
// one to text them your invite link. Nothing is uploaded to Bridger servers.
// Used by the demo-week access gate and by onboarding (Invite Link 1 / 2 / 3).
// Search finds a name fast in a long book; Cancel stays pinned under the list.
// ============================================
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { INVITE_ACCESS, ONBOARDING } from '@bridger/shared';
import { SearchField, Sheet, withAnalyticsPress } from '@bridger/ui';

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
  cancelAnalyticsId = INVITE_ACCESS.contacts_cancel,
  searchAnalyticsId
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
  /** Focus analytics for the search box (never logs the query text). */
  searchAnalyticsId?: string;
}) {
  const [query, setQuery] = useState('');
  const searchId =
    searchAnalyticsId ??
    (parentScreen === 'onboarding'
      ? ONBOARDING.contacts.contact_search
      : INVITE_ACCESS.contact_search);

  // THIS SECTION DOES: filter the on-device list by name or phone digits.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    const digits = q.replace(/\D/g, '');
    return contacts.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (digits.length >= 2 && c.phone.replace(/\D/g, '').includes(digits)) {
        return true;
      }
      return false;
    });
  }, [contacts, query]);

  // Reset search whenever the sheet closes so the next open starts clean.
  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      surface={surface}
      parentScreen={parentScreen}
    >
      {/* THIS SECTION DOES: search, then scroll names, keep Cancel in reach. */}
      <View className="gap-2 pb-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search contacts"
          analyticsId={searchId}
        />
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          style={{ maxHeight: 360 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          ListEmptyComponent={
            <Text className="px-1 py-4 text-center font-sans-sb text-[14px] text-ink-mute">
              {contacts.length === 0
                ? 'No contacts with phone numbers found. You can still share a link from the screen behind this.'
                : 'No contacts match that search.'}
            </Text>
          }
          renderItem={({ item: c }) => (
            <Pressable
              onPress={withAnalyticsPress(pickAnalyticsId, () => onPick(c))}
              accessibilityRole="button"
              accessibilityLabel={`Invite ${c.name}`}
              className="mb-2 rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90"
            >
              <Text className="font-sans-b text-[15px] text-ink">{c.name}</Text>
              <Text className="font-sans-sb text-[12px] text-ink-mute">{c.phone}</Text>
            </Pressable>
          )}
        />
        <Pressable
          onPress={withAnalyticsPress(cancelAnalyticsId, onClose)}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          className="mt-1 items-center py-3"
        >
          <Text className="font-sans-b text-[14px] text-ink-mute">Cancel</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}
