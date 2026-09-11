// ============================================
// WHAT THIS FILE DOES (plain English):
// Friends-tab "Connect your contacts": ask first (Not now / Continue), then
// read names + phones on this device, let you pick one person, save that one
// number as a private card, and optionally text them an invite.
//
// PRIVACY: the address book never leaves the phone. We only save the number
// for the person you tap.
// ============================================
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { ContactPick } from '../components/invite/ContactInviteSheet';
import { upsertPendingPerson, type PendingPerson } from '../data/pending-people';
import { isDemoMode } from '../lib/demo';
import {
  DEMO_INVITE_CONTACTS,
  loadInviteContacts,
  sendInviteToContact
} from '../lib/invite-from-contacts';

const SYNC_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Contacts took too long. You can still share a link.')),
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

export function useConnectContacts() {
  const [contacts, setContacts] = useState<ContactPick[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // THIS SECTION DOES: load the on-device list (or demo names) and open the picker.
  const openPicker = useCallback(async () => {
    setBusy(true);
    try {
      if (isDemoMode() || Platform.OS === 'web') {
        setContacts(DEMO_INVITE_CONTACTS);
        setSheetOpen(true);
        return;
      }
      const { contacts: list, permission } = await withTimeout(
        loadInviteContacts('friends'),
        SYNC_TIMEOUT_MS
      );
      if (permission !== 'granted') {
        Alert.alert(
          'Contacts were not allowed',
          'You can still add someone with a link or QR. Nothing from your address book was saved.'
        );
        return;
      }
      setContacts(list);
      setSheetOpen(true);
    } catch (err) {
      Alert.alert(
        'Could not open contacts',
        err instanceof Error ? err.message : 'You can still share a link.'
      );
    } finally {
      setBusy(false);
    }
  }, []);

  // THIS SECTION DOES: explain why we need contacts before the phone's own sheet.
  const startConnect = useCallback(() => {
    if (busy) return;
    if (isDemoMode() || Platform.OS === 'web') {
      void openPicker();
      return;
    }
    Alert.alert(
      'Connect contacts?',
      'Bridger reads names and phone numbers only on your phone so you can pick a friend. We save that one number on a private card you made. We never upload your address book.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Continue', onPress: () => void openPicker() }
      ]
    );
  }, [busy, openPicker]);

  // THIS SECTION DOES: save the picked number, try to text an invite, return the card.
  const pickContact = useCallback(
    async (contact: ContactPick): Promise<PendingPerson | null> => {
      setSheetOpen(false);
      const card = await upsertPendingPerson({
        phone: contact.phone,
        displayName: contact.name
      });
      if (!card) {
        Alert.alert(
          'Could not save that number',
          'Try a contact with a full phone number, or share a link instead.'
        );
        return null;
      }
      const invite = await sendInviteToContact(contact, 'friends');
      if (!invite.ok && !invite.cancelled) {
        Alert.alert(
          'Card saved',
          'We saved their number. You can invite them from the card, or write notes now.'
        );
      }
      return card;
    },
    []
  );

  return {
    contacts,
    sheetOpen,
    setSheetOpen,
    busy,
    startConnect,
    pickContact
  };
}
