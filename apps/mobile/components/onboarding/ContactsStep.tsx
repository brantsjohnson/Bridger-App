// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 5 - Bridger only works with friends on it. Two things here:
//   1. Connect contacts (Apple / Android permission, read on-device only).
//   2. Invite 3 friends with three separate slots (Invite friends #1, #2, #3)
//      so each invite goes to a different person.
//
// LOOK: white boxes with a hard navy outline on tan paper, one row for the
// contacts permission and one row per invite link. All the paint comes from
// the shared onboarding parts.
//
// PRIVACY (load-bearing): contacts stay on your phone. Bridger never uploads
// them. Permission is asked here, in context, never at app launch.
// ============================================
import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { OnboardingStep } from './OnboardingStep';
import { OB } from './onboarding-theme';
import { OBTile } from './onboarding-ui';
import {
  ContactInviteSheet,
  type ContactPick
} from '../invite/ContactInviteSheet';
import {
  loadInviteContacts,
  sendInviteToContact,
  shareInviteForAccess
} from '../../lib/invite-from-contacts';

/** One of the three invite slots (#1 / #2 / #3). */
export type InviteSlot = {
  sent: boolean;
  /** Contact name, or "Shared link" when they used the system share sheet. */
  label: string | null;
};

/**
 * The small all-caps line that sits above the three link slots, with the
 * "1/3 invited" count on the right. It is a label, not a button, so a tap on it
 * is recorded as a dead click by the frame it lives in.
 */
function SlotsLabel({ sentCount }: { sentCount: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text
        className="font-sans-b text-[12px]"
        style={{ letterSpacing: 1.2, textTransform: 'uppercase', color: OB.navy }}
      >
        Invite 3 friends
      </Text>
      <Text className="font-sans-sb text-[12px]" style={{ color: OB.navy }}>
        {sentCount}/3 invited
      </Text>
    </View>
  );
}

/**
 * The right-hand side of one invite link row: what happened to this link, plus a
 * tick once it has been sent (so the state never depends on color alone).
 */
function SlotStatus({ slot }: { slot: InviteSlot }) {
  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}
    >
      <Text
        numberOfLines={1}
        className="font-sans-sb text-[13px]"
        style={{ color: OB.navy, maxWidth: 150 }}
      >
        {slot.sent ? (slot.label ? `Sent to ${slot.label}` : 'Invite sent') : 'Tap to invite'}
      </Text>
      {slot.sent ? (
        <Text className="font-sans-b text-[15px]" style={{ color: OB.navy }}>
          ✓
        </Text>
      ) : null}
    </View>
  );
}

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
  // On the web there is no contacts book to read, so we say so plainly instead
  // of pretending it worked.
  const handleSync = () => {
    void (async () => {
      setSyncing(true);
      setSyncNote(null);
      try {
        if (Platform.OS === 'web') {
          setSyncNote(
            'Contacts need the Bridger app on your phone. Here on the web you can still send the three invites below.'
          );
          return;
        }
        const { contacts: list, permission } = await loadInviteContacts('onboarding');
        if (permission === 'granted') {
          setContacts(list);
          onSynced();
          setSyncNote(
            list.length > 0
              ? 'Contacts connected. Tap an invite below to pick who gets it.'
              : 'Contacts connected, but none had phone numbers. You can still share links.'
          );
        } else {
          setSyncNote('Contacts were not allowed. You can still send the three invites below.');
        }
      } finally {
        setSyncing(false);
      }
    })();
  };

  // THIS SECTION DOES: open the contact picker, or fall back to share sheet. If
  // sharing isn't possible (a desktop browser, say) we show a plain sentence
  // rather than letting the failure bubble up as a red error page.
  const handleSlotPress = (index: number) => {
    void (async () => {
      const slotNum = index + 1;
      setSyncNote(null);

      // Already filled: allow re-send with share sheet (does not change the count).
      if (slots[index]?.sent) {
        const again = await shareInviteForAccess('onboarding', { slot: slotNum });
        if (!again.ok && !again.cancelled) setSyncNote(again.message);
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
      } else if (!result.cancelled) {
        setSyncNote(result.message);
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
      } else if (!result.cancelled) {
        setSyncNote(result.message);
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
        onContinue={onNext}
        onSkip={onSkip}
        onBack={onBack}
      >
        <View style={{ gap: 12 }}>
          {/* SYNC: Apple / Android contacts permission, on-device only. */}
          <OBTile
            label={
              syncing ? 'Connecting contacts' : synced ? 'Contacts connected' : 'Connect contacts'
            }
            selected={synced}
            mark={synced ? '✓' : '+'}
            disabled={syncing}
            analyticsId={ONBOARDING.contacts.sync}
            onPress={handleSync}
            accessibilityLabel={synced ? 'Contacts connected' : 'Connect contacts'}
          />

          {/* THIS SECTION DOES: tell them what just happened with permission. */}
          {syncNote ? (
            <Text className="font-sans-sb text-[12.5px]" style={{ color: OB.navy, lineHeight: 18 }}>
              {syncNote}
            </Text>
          ) : null}

          {/* THIS SECTION DOES: three separate invites, one friend each. */}
          <View style={{ gap: 9 }}>
            <SlotsLabel sentCount={sentCount} />
            {slots.map((slot, index) => (
              <OBTile
                key={index}
                label={`Invite friends #${index + 1}`}
                selected={slot.sent}
                right={<SlotStatus slot={slot} />}
                analyticsId={ONBOARDING.contacts.invite_slot}
                analyticsProps={{ slot: index + 1 }}
                onPress={() => handleSlotPress(index)}
                accessibilityLabel={
                  slot.sent
                    ? `Invite ${index + 1} sent to ${slot.label ?? 'a friend'}`
                    : `Send invite ${index + 1}`
                }
              />
            ))}
          </View>
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
          activeSlot != null ? `Pick someone for invite #${activeSlot + 1}` : 'Pick someone to invite'
        }
        surface="onboarding_invite_contacts_sheet"
        parentScreen="onboarding"
        pickAnalyticsId={ONBOARDING.contacts.contact_row}
        cancelAnalyticsId={ONBOARDING.contacts.contacts_cancel}
      />
    </>
  );
}
