// ============================================
// WHAT THIS FILE DOES (plain English):
// Contacts permission + local picker + share invite link. Used by the demo-week
// access gate and the three onboarding invite slots (#1 / #2 / #3), and the
// Co-op "Invite 3 friends" path.
//
// If the device has no share sheet at all (a desktop browser), we copy the
// invite link to the clipboard instead of throwing, so a tap never turns into
// an error page.
//
// PRIVACY: contacts are read on-device only and never uploaded.
// ============================================
import {
  Contact,
  ContactField,
  ContactsSortOrder,
  requestPermissionsAsync
} from 'expo-contacts';
import { Linking, Platform, Share } from 'react-native';
import { trackProduct } from '@bridger/shared';
import { createShareInvite } from '../data/invites';
import { markDemoInviteSent } from '../data/access';
import { upsertPendingPerson } from '../data/pending-people';
import type { ContactPick } from '../components/invite/ContactInviteSheet';

export type InviteFromContactsResult =
  | { ok: true; method: 'sms' | 'share' | 'clipboard'; url: string }
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

  // THIS SECTION DOES: ask for contacts permission, then read names + phones
  // with the new class-based expo-contacts API (legacy getContactsAsync throws).
  const perm = await requestPermissionsAsync();
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

  const rows = await Contact.getAllDetails(
    [ContactField.FULL_NAME, ContactField.PHONES] as const,
    { limit: 300, sortOrder: ContactsSortOrder.GivenName }
  );

  const contacts: ContactPick[] = [];
  for (const row of rows) {
    const phone = row.phones?.[0]?.number?.trim();
    const name = row.fullName?.trim();
    if (!row.id || !name || !phone) continue;
    contacts.push({ id: row.id, name, phone });
  }
  return { contacts, permission: 'granted' };
}

function messageFor(context: InviteContext): string {
  return context === 'onboarding' ? ONBOARDING_INVITE_MESSAGE : DEMO_INVITE_MESSAGE;
}

/** Build the full share body so every app gets the link in the text. */
function shareBody(context: InviteContext, url: string): string {
  return `${messageFor(context)} ${url}`;
}

/**
 * THIS SECTION DOES: open the phone's share sheet (or Messages), and never blow
 * up if there isn't one. Desktop browsers have no share sheet, so instead of
 * throwing we copy the link to the clipboard.
 */
async function shareOrCopy(
  body: string,
  url: string
): Promise<InviteFromContactsResult> {
  // Web: prefer the browser share sheet when it exists, else copy the link.
  if (Platform.OS === 'web') {
    const nav = (globalThis as {
      navigator?: {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
        clipboard?: { writeText?: (t: string) => Promise<void> };
      };
    }).navigator;

    if (typeof nav?.share === 'function') {
      try {
        await nav.share({ title: 'Join me on Bridger', text: body, url });
        return { ok: true, method: 'share', url };
      } catch (err) {
        // User cancelled the browser sheet: AbortError. Anything else → copy.
        const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
        if (name === 'AbortError') {
          return { ok: false, message: 'Share cancelled', cancelled: true };
        }
      }
    }

    const copied = await copyLinkToClipboard(body);
    if (copied) return { ok: true, method: 'clipboard', url };
    return {
      ok: false,
      message: 'Sharing is not available here. Open Bridger on your phone to send the invite.'
    };
  }

  try {
    // Put the URL in the message so Messages / WhatsApp / Mail always get it.
    // Also pass `url` for iOS targets that prefer a link attachment.
    const share = await Share.share(
      Platform.OS === 'ios' ? { message: body, url } : { message: body }
    );
    if (share.action === Share.dismissedAction) {
      return { ok: false, message: 'Share cancelled', cancelled: true };
    }
    return { ok: true, method: 'share', url };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not open the share sheet.'
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
  method: 'sms' | 'share' | 'clipboard',
  opts?: ShareInviteOpts
): Promise<void> {
  trackProduct('invite_link_shared', {
    method: method === 'clipboard' ? 'share' : method,
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
    const invite = await createShareInvite(
      context === 'onboarding' ? { forOnboarding: true } : undefined
    );
    const body = shareBody(context, invite.url);

    const digits = contact.phone.replace(/[^\d+]/g, '');
    if (digits && Platform.OS !== 'web') {
      const encoded = encodeURIComponent(body);
      const smsUrl =
        Platform.OS === 'ios' ? `sms:${digits}&body=${encoded}` : `sms:${digits}?body=${encoded}`;
      const can = await Linking.canOpenURL(smsUrl);
      if (can) {
        await Linking.openURL(smsUrl);
        await afterInviteSent(context, 'sms', opts);
        // PRIVACY: one private card for this picked contact only (never the whole book).
        void upsertPendingPerson({
          phone: contact.phone,
          displayName: contact.name
        });
        return { ok: true, method: 'sms', url: invite.url };
      }
    }

    const result = await shareOrCopy(body, invite.url);
    if (result.ok) {
      await afterInviteSent(context, result.method, opts);
      void upsertPendingPerson({
        phone: contact.phone,
        displayName: contact.name
      });
    }
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
    const invite = await createShareInvite(
      context === 'onboarding' ? { forOnboarding: true } : undefined
    );
    const body = shareBody(context, invite.url);
    const result = await shareOrCopy(body, invite.url);
    if (result.ok) await afterInviteSent(context, result.method, opts);
    return result;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not open the invite right now.'
    };
  }
}
