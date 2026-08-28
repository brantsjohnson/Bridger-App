// ============================================
// WHAT THIS FILE DOES (plain English):
// Contacts permission + local picker + share invite link. Used by the demo-week
// access gate and the three onboarding invite slots (#1 / #2 / #3).
//
// If the device has no share sheet at all (a desktop browser), we copy the
// invite link to the clipboard instead of throwing, so a tap never turns into
// an error page.
//
// PRIVACY: contacts are read on-device only and never uploaded.
// ============================================
import * as Contacts from 'expo-contacts';
import { Linking, Platform, Share } from 'react-native';
import { trackProduct } from '@bridger/shared';
import { createShareInvite } from '../data/invites';
import { markDemoInviteSent } from '../data/access';
import type { ContactPick } from '../components/invite/ContactInviteSheet';

export type InviteFromContactsResult =
  | { ok: true; method: 'sms' | 'share' }
  | { ok: false; message: string; cancelled?: boolean };

const DEMO_INVITE_MESSAGE =
  'I am trying Bridger on TestFlight. Join me with this link:';
const ONBOARDING_INVITE_MESSAGE = 'Join me on Bridger:';

export type InviteContext = 'invite_access' | 'onboarding';

export type ShareInviteOpts = {
  /** 1-based Link slot when sharing from onboarding Link 1 / 2 / 3. */
  slot?: number;
};

/** Load contacts locally after permission (never uploaded). */
export async function loadInviteContacts(
  context: InviteContext = 'invite_access'
): Promise<{
  contacts: ContactPick[];
  permission: 'granted' | 'denied' | 'dismissed';
}> {
  if (Platform.OS === 'web') {
    return { contacts: [], permission: 'denied' };
  }

  const perm = await Contacts.requestPermissionsAsync();
  const granted = perm.status === 'granted';
  trackProduct('permission_result', {
    permission: 'contacts',
    outcome: granted ? 'granted' : perm.status === 'denied' ? 'denied' : 'dismissed',
    context
  });

  if (!granted) {
    return {
      contacts: [],
      permission: perm.status === 'denied' ? 'denied' : 'dismissed'
    };
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    pageSize: 300,
    sort: Contacts.SortTypes.FirstName
  });

  const contacts: ContactPick[] = [];
  for (const row of data ?? []) {
    const phone = row.phoneNumbers?.[0]?.number?.trim();
    if (!row.id || !row.name || !phone) continue;
    contacts.push({ id: row.id, name: row.name, phone });
  }
  return { contacts, permission: 'granted' };
}

function messageFor(context: InviteContext): string {
  return context === 'onboarding' ? ONBOARDING_INVITE_MESSAGE : DEMO_INVITE_MESSAGE;
}

/**
 * THIS SECTION DOES: open the phone's share sheet, and never blow up if there
 * isn't one. Desktop browsers have no share sheet, so instead of throwing (which
 * used to paint a red error over the screen) we quietly copy the link to the
 * clipboard, which still counts as the invite going out.
 */
async function shareOrCopy(
  message: string,
  url: string
): Promise<InviteFromContactsResult> {
  try {
    const share = await Share.share({ message, url });
    if (share.action === Share.dismissedAction) {
      return { ok: false, message: 'Share cancelled', cancelled: true };
    }
    return { ok: true, method: 'share' };
  } catch {
    const copied = await copyLinkToClipboard(message);
    if (copied) return { ok: true, method: 'share' };
    return {
      ok: false,
      message: 'Sharing is not available here. Open Bridger on your phone to send the invite.'
    };
  }
}

/** Put the invite text on the clipboard when there is no share sheet (web). */
async function copyLinkToClipboard(text: string): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  try {
    const clip = (globalThis as { navigator?: { clipboard?: { writeText?: (t: string) => Promise<void> } } })
      .navigator?.clipboard;
    if (!clip?.writeText) return false;
    await clip.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** After a confirmed share/SMS open, unlock demo access only for that gate. */
async function afterInviteSent(
  context: InviteContext,
  method: 'sms' | 'share',
  opts?: ShareInviteOpts
): Promise<void> {
  trackProduct('invite_link_shared', {
    method,
    context,
    ...(opts?.slot != null ? { slot: opts.slot } : {})
  });
  if (context === 'invite_access') {
    await markDemoInviteSent();
  }
}

/** Text or share the invite to one picked contact. */
export async function sendInviteToContact(
  contact: ContactPick,
  context: InviteContext = 'invite_access',
  opts?: ShareInviteOpts
): Promise<InviteFromContactsResult> {
  try {
    const invite = await createShareInvite();
    const message = `${messageFor(context)} ${invite.url}`;

    const digits = contact.phone.replace(/[^\d+]/g, '');
    if (digits && Platform.OS !== 'web') {
      const body = encodeURIComponent(message);
      const smsUrl =
        Platform.OS === 'ios' ? `sms:${digits}&body=${body}` : `sms:${digits}?body=${body}`;
      const can = await Linking.canOpenURL(smsUrl);
      if (can) {
        await Linking.openURL(smsUrl);
        await afterInviteSent(context, 'sms', opts);
        return { ok: true, method: 'sms' };
      }
    }

    const result = await shareOrCopy(message, invite.url);
    if (result.ok) await afterInviteSent(context, result.method, opts);
    return result;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not send that invite right now.'
    };
  }
}

/** Fallback when contacts are denied or empty: system share sheet only. */
export async function shareInviteForAccess(
  context: InviteContext = 'invite_access',
  opts?: ShareInviteOpts
): Promise<InviteFromContactsResult> {
  try {
    const invite = await createShareInvite();
    const message = `${messageFor(context)} ${invite.url}`;
    const result = await shareOrCopy(message, invite.url);
    if (result.ok) await afterInviteSent(context, result.method, opts);
    return result;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not open the invite right now.'
    };
  }
}
