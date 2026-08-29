// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 5 - Bridger only works with friends on it. Two things here:
//   1. Connect contacts (Apple / Android permission, read on-device only).
//      After it works the row turns green with a check, and we celebrate with
//      "AWESOME! We'll notify you when friends join."
//   2. Invite 3 friends with three separate slots (Invite friends #1, #2, #3)
//      so each invite goes to a different person. A sent slot turns green with
//      a checkmark too.
//
// LOOK: white boxes with a hard navy outline on the page canvas, one row for
// contacts and one row per invite link. Labels that sit on the canvas follow
// light/dark ink so they stay readable. Done rows use a soft green wash.
//
// PRIVACY (load-bearing): contacts stay on your phone. Bridger never uploads
// them. Permission is asked here, in context, never at app launch. Demo / web
// uses a few stand-in names so the picker still works without a real address
// book.
// ============================================
import React, { useRef, useState } from 'react';
import { Modal, Platform, Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, HobbyEmojiBurst, useReduceMotion, useThemeColors } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB } from './onboarding-theme';
import { OBTile } from './onboarding-ui';
import {
  ContactInviteSheet,
  type ContactPick
} from '../invite/ContactInviteSheet';
import { fireEmojiBurstHaptics } from '../../lib/celebration-haptics';
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

/** Party emojis when contacts load or an invite goes out. */
const CELEBRATE_EMOJIS = ['🎉', '✨', '💚', '🙌'];

/** The big "done" line after contacts load or an invite is sent. */
const AWESOME_NOTE = "AWESOME! We'll notify you when friends join.";

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
 * Turn a raw contacts error into a short human sentence. Never show library
 * deprecation URLs or stack jargon on the screen.
 */
function friendlyContactsError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (/deprecated|getContactsAsync|expo-contacts|migration guide/i.test(msg)) {
    return 'Could not open contacts. You can still send the three invites below.';
  }
  if (msg.trim().length > 0 && msg.length < 160 && !/^Error:/.test(msg)) {
    return msg;
  }
  return 'Could not open contacts. You can still send the three invites below.';
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
        style={{ color: slot.sent ? OB.green : OB.navy, maxWidth: 150 }}
      >
        {slot.sent ? (slot.label ? `Sent to ${slot.label}` : 'Invite sent') : 'Tap to invite'}
      </Text>
      {slot.sent ? (
        <Text className="font-sans-b text-[16px]" style={{ color: OB.green }}>
          ✓
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The loud "AWESOME!" banner under Connect contacts / after an invite. Green
 * wash + check so it reads as a win, not a quiet footnote.
 */
function AwesomeBanner({ note }: { note: string }) {
  const isAwesome = note.startsWith('AWESOME!');
  if (!isAwesome) {
    return (
      <Text
        className="font-sans-sb text-[12.5px]"
        style={{ color: OB.navy, lineHeight: 18 }}
      >
        {note}
      </Text>
    );
  }
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={note}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: OB.greenWash,
        borderWidth: 2,
        borderColor: OB.navy
      }}
    >
      <View
        accessible={false}
        style={{
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: OB.green,
          borderWidth: 2,
          borderColor: OB.navy
        }}
      >
        <Text className="font-sans-b text-[15px]" style={{ color: OB.onColor }}>
          ✓
        </Text>
      </View>
      <Text
        className="font-sans-b text-[14px]"
        style={{ color: OB.navy, flex: 1, lineHeight: 20 }}
      >
        {note}
      </Text>
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
  const reduce = useReduceMotion();
  const syncRef = useRef<View>(null);
  const slotRefs = useRef<Array<View | null>>([null, null, null]);
  const [syncing, setSyncing] = useState(false);
  const [contacts, setContacts] = useState<ContactPick[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(synced ? AWESOME_NOTE : null);
  const [loadedCount, setLoadedCount] = useState<number | null>(null);
  const [burst, setBurst] = useState<{
    key: number;
    origin: { x: number; y: number };
  } | null>(null);

  const sentCount = slots.filter((s) => s.sent).length;
  const contactsReady = synced || contacts.length > 0;

  // THIS SECTION DOES: spray a little party from a measured row (respects Reduce Motion).
  const celebrateFrom = (anchor: View | null) => {
    if (reduce || !anchor) {
      fireEmojiBurstHaptics();
      return;
    }
    anchor.measureInWindow((x, y, width, height) => {
      setBurst({
        key: Date.now(),
        origin: { x: x + width / 2, y: y + height / 2 }
      });
    });
  };

  // THIS SECTION DOES: finish a successful load. Mark synced, stash the list,
  // turn the row green, and show the AWESOME banner.
  const finishLoaded = (list: ContactPick[]) => {
    setContacts(list);
    setLoadedCount(list.length);
    onSynced();
    setSyncNote(AWESOME_NOTE);
    celebrateFrom(syncRef.current);
  };

  // THIS SECTION DOES: ask for contacts permission and keep the list on-device.
  // Demo and web use stand-in names so the picker still opens. A timeout stops
  // the row from sitting on "Connecting contacts" forever.
  const handleSync = () => {
    if (syncing || contactsReady) return;
    void (async () => {
      setSyncing(true);
      setSyncNote(null);
      try {
        // Demo / web: no real address book. Load stand-ins so invite slots work.
        if (isDemoMode() || Platform.OS === 'web') {
          finishLoaded(DEMO_CONTACTS);
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
        setSyncNote(friendlyContactsError(err));
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
      if (!syncNote?.startsWith('AWESOME!')) setSyncNote(null);

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
          setSyncNote(AWESOME_NOTE);
          celebrateFrom(slotRefs.current[index] ?? null);
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
          setSyncNote(AWESOME_NOTE);
          celebrateFrom(slotRefs.current[index] ?? null);
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
        {/* Emoji shower when contacts load or an invite goes out. */}
        <Modal visible={burst != null} transparent animationType="none" pointerEvents="none">
          <View style={{ flex: 1 }} pointerEvents="none">
            {burst ? (
              <HobbyEmojiBurst
                key={burst.key}
                play
                emoji={CELEBRATE_EMOJIS}
                origin={burst.origin}
                count={18}
                power="boom"
                onPlayStart={fireEmojiBurstHaptics}
                onDone={() => setBurst(null)}
              />
            ) : null}
          </View>
        </Modal>

        <View style={{ gap: 12 }}>
          {/* SYNC: Apple / Android contacts permission, on-device only. */}
          <View ref={syncRef} collapsable={false}>
            <OBTile
              label={syncLabel}
              selected={contactsReady}
              selectedTone="success"
              mark={syncing ? '…' : contactsReady ? '✓' : '+'}
              disabled={syncing || contactsReady}
              analyticsId={ONBOARDING.contacts.sync}
              onPress={handleSync}
              accessibilityLabel={
                contactsReady
                  ? AWESOME_NOTE
                  : 'Connect contacts'
              }
            />
          </View>

          {/* THIS SECTION DOES: the loud win banner after load / invite. */}
          {syncNote ? (
            syncNote.startsWith('AWESOME!') ? (
              <AnalyticsRegion
                analyticsId={ONBOARDING.contacts.awesome_banner}
                interactive={false}
              >
                <AwesomeBanner note={syncNote} />
              </AnalyticsRegion>
            ) : (
              <AwesomeBanner note={syncNote} />
            )
          ) : null}

          {/* THIS SECTION DOES: three separate invites, one friend each. */}
          <View style={{ gap: 9 }}>
            <SlotsLabel sentCount={sentCount} />
            {slots.map((slot, index) => (
              <View
                key={index}
                ref={(el) => {
                  slotRefs.current[index] = el;
                }}
                collapsable={false}
              >
                <OBTile
                  label={`Invite friends #${index + 1}`}
                  selected={slot.sent}
                  selectedTone="success"
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
              </View>
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
