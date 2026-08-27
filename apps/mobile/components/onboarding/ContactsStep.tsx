// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 5 — Bridger only works with friends on it. Two things here:
//   1. Connect contacts (Apple / Android permission, read on-device only).
//   2. Invite 3 friends with three separate link slots (Link 1, Link 2, Link 3)
//      so each invite goes to a different person.
//
// PRIVACY (load-bearing): contacts stay on your phone. Bridger never uploads
// them. Permission is asked here, in context, never at app launch.
// ============================================
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { CheckIcon, LinkIcon, UsersIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { ButtonSecondary, Card, cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_BODY, WASH_MUTED } from './onboarding-wash';
import {
  ContactInviteSheet,
  type ContactPick
} from '../invite/ContactInviteSheet';
import {
  loadInviteContacts,
  sendInviteToContact,
  shareInviteForAccess
} from '../../lib/invite-from-contacts';

/** One of the three invite slots (Link 1 / 2 / 3). */
export type InviteSlot = {
  sent: boolean;
  /** Contact name, or "Shared link" when they used the system share sheet. */
  label: string | null;
};

export function ContactsStep({
  step,
  total,
  synced,
  slots,
  onSynced,
  onFillSlot,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  synced: boolean;
  slots: InviteSlot[];
  onSynced: () => void;
  onFillSlot: (index: number, slot: InviteSlot) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [contacts, setContacts] = useState<ContactPick[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const sentCount = slots.filter((s) => s.sent).length;

  // THIS SECTION DOES: ask for contacts permission and keep the list on-device.
  const handleSync = () => {
    void (async () => {
      setSyncing(true);
      setSyncNote(null);
      try {
        if (Platform.OS === 'web') {
          onSynced();
          setSyncNote('On web, use the three link slots below to share invites.');
          return;
        }
        const { contacts: list, permission } = await loadInviteContacts('onboarding');
        if (permission === 'granted') {
          setContacts(list);
          onSynced();
          setSyncNote(
            list.length > 0
              ? 'Contacts connected. Tap a link slot to pick who gets it.'
              : 'Contacts connected, but none had phone numbers. You can still share links.'
          );
        } else {
          setSyncNote(
            'Contacts were not allowed. You can still invite with the three link slots.'
          );
        }
      } finally {
        setSyncing(false);
      }
    })();
  };

  // THIS SECTION DOES: open the contact picker, or fall back to share sheet.
  const handleSlotPress = (index: number) => {
    void (async () => {
      const slotNum = index + 1;

      // Already filled: allow re-send with share sheet (does not change the count).
      if (slots[index]?.sent) {
        await shareInviteForAccess('onboarding', { slot: slotNum });
        return;
      }

      // Prefer the on-device picker when we already have contacts.
      if (contacts.length > 0) {
        setActiveSlot(index);
        setSheetOpen(true);
        return;
      }

      // Try loading contacts once if they synced but list is empty in memory.
      if (synced && Platform.OS !== 'web') {
        const { contacts: list, permission } = await loadInviteContacts('onboarding');
        if (permission === 'granted' && list.length > 0) {
          setContacts(list);
          setActiveSlot(index);
          setSheetOpen(true);
          return;
        }
      }

      // No contacts: system share sheet still counts as filling this slot.
      const result = await shareInviteForAccess('onboarding', { slot: slotNum });
      if (result.ok) {
        onFillSlot(index, { sent: true, label: 'Shared link' });
      }
    })();
  };

  // THIS SECTION DOES: send the invite to the picked contact and fill the slot.
  const handlePick = (contact: ContactPick) => {
    if (activeSlot == null) return;
    const index = activeSlot;
    setSheetOpen(false);
    setActiveSlot(null);
    void (async () => {
      const result = await sendInviteToContact(contact, 'onboarding', {
        slot: index + 1
      });
      if (result.ok) {
        onFillSlot(index, { sent: true, label: contact.name });
      }
    })();
  };

  return (
    <>
      <OnboardingStep
        step={step}
        total={total}
        purpose="Bridger only works with a friend on it."
        ask="Bridger's a group chat on steroids"
        accent="teal"
        onContinue={onNext}
        onSkip={onSkip}
        onBack={onBack}
      >
        <View className="gap-3">
          <Text className={cn('px-1 font-sans-sb text-[14px] leading-snug', WASH_BODY)}>
            Connect your contacts, then invite three friends with separate links.
          </Text>

          {/* SYNC: Apple / Android contacts permission, on-device only. */}
          <ButtonSecondary
            full
            size="lg"
            tone={synced ? 'positive' : 'solid'}
            loading={syncing}
            icon={<UsersIcon size={18} strokeWidth={2.5} color="#FFFFFF" />}
            analyticsId={ONBOARDING.contacts.sync}
            onPress={handleSync}
            accessibilityLabel={synced ? 'Contacts connected' : 'Connect contacts'}
          >
            {synced ? 'Contacts connected' : 'Connect contacts'}
          </ButtonSecondary>

          {syncNote ? (
            <Text className={cn('px-1 font-sans-sb text-[12px] leading-snug', WASH_MUTED)}>
              {syncNote}
            </Text>
          ) : null}

          {/* THIS SECTION DOES: three separate invite slots (Link 1, 2, 3). */}
          <View className="gap-1.5">
            <View className="flex-row items-baseline justify-between px-1">
              <Text className={cn('font-sans-b text-[12px] uppercase tracking-wide', WASH_MUTED)}>
                Invite 3 friends
              </Text>
              <Text className={cn('font-sans-sb text-[12px]', WASH_MUTED)}>
                {sentCount}/3 invited
              </Text>
            </View>

            {slots.map((slot, index) => (
              <Pressable
                key={index}
                onPress={withAnalyticsPress(
                  ONBOARDING.contacts.invite_slot,
                  () => handleSlotPress(index),
                  { analyticsProps: { slot: index + 1 } }
                )}
                accessibilityRole="button"
                accessibilityLabel={
                  slot.sent
                    ? `Link ${index + 1} sent to ${slot.label ?? 'a friend'}`
                    : `Invite link ${index + 1}`
                }
                accessibilityState={{ selected: slot.sent }}
                className={cn(
                  'min-h-[48px] flex-row items-center justify-between rounded-card border px-4',
                  slot.sent ? 'border-teal bg-teal/15' : 'border-ink-line bg-surface'
                )}
              >
                <View className="min-w-0 flex-1 flex-row items-center gap-3">
                  <LinkIcon
                    size={18}
                    strokeWidth={2.4}
                    color={slot.sent ? '#00A676' : '#1C1B16'}
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-b text-[14px] text-ink">
                      Link {index + 1}
                    </Text>
                    <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
                      {slot.sent
                        ? slot.label
                          ? `Sent to ${slot.label}`
                          : 'Invite sent'
                        : 'Tap to invite one friend'}
                    </Text>
                  </View>
                </View>
                {slot.sent ? (
                  <CheckIcon size={18} color="#00A676" strokeWidth={3} />
                ) : null}
              </Pressable>
            ))}
          </View>

          <Card>
            <Text className="font-sans-sb text-[13px] leading-snug text-ink-soft">
              Your contacts stay on your phone. Bridger never uploads them, and you can skip this
              and still use everything.
            </Text>
          </Card>
        </View>
      </OnboardingStep>

      <ContactInviteSheet
        open={sheetOpen}
        contacts={contacts}
        onPick={handlePick}
        onClose={() => {
          setSheetOpen(false);
          setActiveSlot(null);
        }}
        title={
          activeSlot != null ? `Pick someone for Link ${activeSlot + 1}` : 'Pick someone to invite'
        }
        surface="onboarding_invite_contacts_sheet"
        parentScreen="onboarding"
        pickAnalyticsId={ONBOARDING.contacts.contact_row}
        cancelAnalyticsId={ONBOARDING.contacts.contacts_cancel}
      />
    </>
  );
}
