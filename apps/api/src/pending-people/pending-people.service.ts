// ============================================
// WHAT THIS FILE DOES (plain English):
// Private "this person is not on Bridger yet" cards, keyed to a phone number.
// Only the author can create or read them. When that number later signs up,
// we merge the card into a real friend connection.
//
// SECURITY: author_id is always the signed-in user. Merge uses the service
// role and only matches the new account's own Auth phone.
// ============================================
import { BadRequestException, Injectable } from '@nestjs/common';
import { PosthogService } from '../posthog/posthog.service';
import { SupabaseService } from '../supabase/supabase.service';

const E164 = /^\+[1-9]\d{7,14}$/;

export type PendingPersonDto = {
  id: string;
  phoneE164: string;
  displayName: string | null;
  mergedUserId: string | null;
};

function toDto(row: {
  id: string;
  phone_e164: string;
  display_name: string | null;
  merged_user_id: string | null;
}): PendingPersonDto {
  return {
    id: row.id,
    phoneE164: row.phone_e164,
    displayName: row.display_name,
    mergedUserId: row.merged_user_id
  };
}

@Injectable()
export class PendingPeopleService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly posthog: PosthogService
  ) {}

  // THIS SECTION DOES: create or update your private card for this phone.
  // THIS SECTION DOES: list the cards you still own (not merged yet).
  async list(authorId: string): Promise<PendingPersonDto[]> {
    const { data, error } = await this.supabase.admin
      .from('pending_people')
      .select('id, phone_e164, display_name, merged_user_id')
      .eq('author_id', authorId)
      .is('merged_user_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  // THIS SECTION DOES: open one of your cards, even after it merged (so we
  // can send you to their real profile).
  async getById(authorId: string, id: string): Promise<PendingPersonDto | null> {
    const { data, error } = await this.supabase.admin
      .from('pending_people')
      .select('id, phone_e164, display_name, merged_user_id')
      .eq('author_id', authorId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toDto(data) : null;
  }

  // THIS SECTION DOES: create or update your private card for this phone.
  async upsert(
    authorId: string,
    body: { phoneE164: string; displayName?: string | null }
  ): Promise<PendingPersonDto> {
    const phoneE164 = (body.phoneE164 ?? '').trim();
    if (!E164.test(phoneE164)) {
      throw new BadRequestException('phoneE164 must be an E.164 number');
    }
    const displayName = (body.displayName ?? '').trim() || null;

    const { data: existing } = await this.supabase.admin
      .from('pending_people')
      .select('id, merged_user_id')
      .eq('author_id', authorId)
      .eq('phone_e164', phoneE164)
      .is('merged_user_id', null)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await this.supabase.admin
        .from('pending_people')
        .update({ display_name: displayName })
        .eq('id', existing.id)
        .eq('author_id', authorId)
        .select('id, phone_e164, display_name, merged_user_id')
        .single();
      if (error) throw error;
      return {
        id: data.id,
        phoneE164: data.phone_e164,
        displayName: data.display_name,
        mergedUserId: data.merged_user_id
      };
    }

    // THIS SECTION DOES: cap how many open cards one person can keep so a
    // runaway client cannot dump a whole address book.
    const { count } = await this.supabase.admin
      .from('pending_people')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', authorId)
      .is('merged_user_id', null);
    if ((count ?? 0) >= 100) {
      throw new BadRequestException('Too many pending people for this account');
    }

    const { data, error } = await this.supabase.admin
      .from('pending_people')
      .insert({
        author_id: authorId,
        phone_e164: phoneE164,
        display_name: displayName
      })
      .select('id, phone_e164, display_name, merged_user_id')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      phoneE164: data.phone_e164,
      displayName: data.display_name,
      mergedUserId: data.merged_user_id
    };
  }

  /**
   * Match this account's phone to pending cards other people already made.
   * Idempotent. Never takes a phone from the client: it reads user_contacts
   * (or Auth) for this user id.
   */
  async mergeForUser(userId: string): Promise<{ merged: number }> {
    const { data: contact } = await this.supabase.admin
      .from('user_contacts')
      .select('phone')
      .eq('user_id', userId)
      .maybeSingle();

    let phone = typeof contact?.phone === 'string' ? contact.phone : null;
    if (!phone) {
      const { data: authData } = await this.supabase.admin.auth.admin.getUserById(
        userId
      );
      phone = authData.user?.phone ?? null;
      if (phone) {
        await this.supabase.admin.from('user_contacts').upsert(
          { user_id: userId, phone },
          { onConflict: 'user_id' }
        );
      }
    }
    if (!phone) return { merged: 0 };

    const { data, error } = await this.supabase.admin.rpc(
      'merge_pending_people_for_user',
      { p_user: userId, p_phone: phone }
    );
    if (error) throw error;
    const merged = typeof data === 'number' ? data : 0;
    if (merged > 0) {
      await this.posthog.captureProduct(userId, 'pending_person_merged', {
        count: merged
      });
    }
    return { merged };
  }
}
