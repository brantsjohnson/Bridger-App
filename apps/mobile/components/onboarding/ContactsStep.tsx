// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 5 - Bridger only works with friends on it. Two things here:
//   1. Connect contacts (Apple / Android permission, read on-device only).
//      After it works we show "Contacts loaded" and promise we'll notify them
//      when a friend joins from their invite.
//   2. Invite 3 friends with three separate slots (Invite friends #1, #2, #3)
//      so each invite goes to a different person.
//
// LOOK: white boxes with a hard navy outline on the page canvas, one row for
// contacts and one row per invite link. Labels that sit on the canvas follow
// light/dark ink so they stay readable.
//
// PRIVACY (load-bearing): contacts stay on your phone. Bridger never uploads
// them. Permission is asked here, in context, never at app launch. Demo / web
// uses a few stand-in names so the picker still works without a real address
// book.
// ============================================
import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { useThemeColors } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB } from './onboarding-theme';
import { OBTile } from './onboarding-ui';
import {
  ContactInviteSheet,
  type ContactPick
} from '../invite/ContactInviteSheet';
import { isDemoMode } from '../../lib/demo';
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

/** How long we wait for the phone's contacts permission before we stop spinning. */
const SYNC_TIMEOUT_MS = 20000;

/** Stand-in people for demo / web so "Connect contacts" still feels real. */
const DEMO_CONTACTS: ContactPick[] = [
  { id: 'demo-1', name: 'Alex Chen', phone: '+15555550101' },
  { id: 'demo-2', name: 'Jordan Lee', phone: '+15555550102' },
  { id: 'demo-3', name: 'Sam Rivera', phone: '+15555550103' },
  { id: 'demo-4', name: 'Riley Quinn', phone: '+15555550104' },
  { id: 'demo-5', name: 'Casey Morgan', phone: '+15555550105' }
];

/** Promise that rejects after ms so a stuck permission dialog cannot freeze the row. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Contacts took too long. You can still send the three invites below.')),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * The small all-caps line that sits above the three link slots, with the
 * "1/3 invited" count on the right. It is a label, not a button, so a tap on it
 * is recorded as a dead click by the frame it lives in.
 */
function SlotsLabel({ sentCount }: { sentCount: number }) {
  const theme = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text
        className="font-sans-b text-[12px]"
        style={{ letterSpacing: 1.2, textTransform: 'uppercase', color: theme.ink }}
      >
        Invite 3 friends
      </Text>
      <Text className="font-sans-sb text-[12px]" style={{ color: theme.ink }}>
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
  const theme = useThemeColors();
  const [syncing, setSyncing] = useState(false);
  const [contacts, setContacts] = useState<ContactPick[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(
    synced
      ? 'Contacts loaded. We will notify you if a friend joins from your invite.'
      : null
  );
  const [loadedCount, setLoadedCount] = useState<number | null>(null);

  const sentCount = slots.filter((s) => s.sent).length;
  const contactsReady = synced || contacts.length > 0;

  // THIS SECTION DOES: finish a successful load. Mark synced, stash the list,
  // and show the "loaded + we'll notify you" line so the row never looks stuck.
  const finishLoaded = (list: ContactPick[], note?: string) => {
    setContacts(list);
    setLoadedCount(list.length);
    onSynced();
    setSyncNote(
      note ??
        (list.length > 0
          ? `Contacts loaded (${list.length}). We will notify you if a friend joins from your invite.`
          : 'Contacts loaded. We will notify you if a friend joins from your invite. You can still share links below.')
    );
  };

  // THIS SECTION DOES: ask for contacts permission and keep the list on-device.
  // Demo and web use stand-in names so the picker still opens. A timeout stops
  // the row from sitting on "Connecting contacts" forever.
  const handleSync = () => {
    if (syncing) return;
    void (async () => {
      setSyncing(true);
      setSyncNote(null);
      try {
        // Demo / web: no real address book. Load stand-ins so invite slots work.
        if (isDemoMode() || Platform.OS === 'web') {
          finishLoaded(
            DEMO_CONTACTS,
            `Contacts loaded (${DEMO_CONTACTS.length}). We will notify you if a friend joins from your invite.`
          );
          return;
        }

        const { contacts: list, permission } = await withTimeout(
          loadInviteContacts('onboarding'),
          SYNC_TIMEOUT_MS
        );
        if (permission === 'granted') {
          finishLoaded(list);
        } else {
          setSyncNote(
            'Contacts were not allowed. You can still send the three invites below. We will notify you if a friend joins from your invite.'
          );
        }
      } catch (err) {
        setSyncNote(
          err instanceof Error
            ? err.message
            : 'Could not open contacts. You can still send the three invites below.'
        );
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

      // Synced earlier but list left memory (navigated away): reload once.
      if (synced && Platform.OS !== 'web' && !isDemoMode()) {
        try {
          const { contacts: list, permission } = await withTimeout(
            loadInviteContacts('onboarding'),
            SYNC_TIMEOUT_MS
          );
          if (permission === 'granted' && list.length > 0) {
            setContacts(list);
            setActiveSlot(index);
            setSheetOpen(true);
            return;
          }
        } catch {
          // Fall through to share sheet.
        }
      }

      // Demo / web with synced but empty memory: restore stand-ins.
      if (synced && (isDemoMode() || Platform.OS === 'web')) {
        setContacts(DEMO_CONTACTS);
        setActiveSlot(index);
        setSheetOpen(true);
        return;
      }

      // No contacts: system share sheet still counts as filling this slot.
      try {
        const result = await shareInviteForAccess('onboarding', { slot: slotNum });
        if (result.ok) {
          onFillSlot(index, { sent: true, label: 'Shared link' });
          setSyncNote('Invite sent. We will notify you if a friend joins from your invite.');
        } else if (!result.cancelled) {
          setSyncNote(result.message);
        }
      } catch (err) {
        setSyncNote(
          err instanceof Error ? err.message : 'Could not open the invite right now.'
        );
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
      try {
        const result = await sendInviteToContact(contact, 'onboarding', {
          slot: index + 1
        });
        if (result.ok) {
          onFillSlot(index, { sent: true, label: contact.name });
          setSyncNote('Invite sent. We will notify you if a friend joins from your invite.');
        } else if (!result.cancelled) {
          setSyncNote(result.message);
        }
      } catch (err) {
        setSyncNote(
          err instanceof Error ? err.message : 'Could not send that invite right now.'
        );
      }
    })();
  };

  const syncLabel = syncing
    ? 'Connecting contacts'
    : contactsReady
      ? loadedCount != null && loadedCount > 0
        ? `Contacts loaded · ${loadedCount}`
        : 'Contacts loaded'
      : 'Connect contacts';

  return (
    <>
      <OnboardingStep
        step={step}
        total={total}
        purpose="Bridger only works with a friend on it."
        ask="Bridger's a group chat on steroids"
        scrollBody
        onContinue={onNext}
        onSkip={onSkip}
        onBack={onBack}
      >
        <View style={{ gap: 12 }}>
          {/* SYNC: Apple / Android contacts permission, on-device only. */}
          <OBTile
            label={syncLabel}
            selected={contactsReady}
            mark={syncing ? '…' : contactsReady ? '✓' : '+'}
            disabled={syncing}
            analyticsId={ONBOARDING.contacts.sync}
            onPress={handleSync}
            accessibilityLabel={
              contactsReady
                ? 'Contacts loaded. We will notify you if a friend joins from your invite.'
                : 'Connect contacts'
            }
          />

          {/* THIS SECTION DOES: confirm load + the join-notify promise. */}
          {syncNote ? (
            <Text
              className="font-sans-sb text-[12.5px]"
              style={{ color: theme.ink, lineHeight: 18 }}
            >
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
