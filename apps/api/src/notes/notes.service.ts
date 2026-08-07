// ============================================
// WHAT THIS FILE DOES (plain English):
// Your private notes on friends: text, calendar dates, and check-in nudges.
// Only the author can read or write them. Never sent to matching.
//
// --- SECURITY / PRIVACY ---
// author_id is always the signed-in user. Another person's notes are invisible.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import type { FriendNote, FriendNoteCadence } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

type NoteKind = FriendNote['kind'];

@Injectable()
export class NotesService {
  constructor(private readonly supabase: SupabaseService) {}

  // THIS SECTION DOES: list your notes for one friend (or all friends).
  async list(authorId: string, personId?: string): Promise<FriendNote[]> {
    let query = this.supabase.admin
      .from('friend_notes')
      .select('*')
      .eq('author_id', authorId)
      .order('updated_at', { ascending: false });
    if (personId) query = query.eq('person_id', personId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  // THIS SECTION DOES: save a new private note.
  async create(
    authorId: string,
    body: {
      personId: string;
      kind: NoteKind;
      text?: string;
      date?: string;
      remind?: boolean;
      cadence?: FriendNoteCadence;
    }
  ): Promise<FriendNote> {
    if (!body?.personId) throw new BadRequestException('personId is required');
    const kind = body.kind;
    if (kind !== 'text' && kind !== 'date' && kind !== 'check_in') {
      throw new BadRequestException('kind must be text, date, or check_in');
    }
    const text = (body.text ?? '').trim();
    if (!text && kind !== 'date') {
      throw new BadRequestException('text is required');
    }

    const cadence =
      kind === 'check_in' ? body.cadence ?? 'biweek' : null;
    const nextRemindAt =
      kind === 'check_in' ? nextRemindAfter(cadence ?? 'biweek') : null;

    const { data, error } = await this.supabase.admin
      .from('friend_notes')
      .insert({
        author_id: authorId,
        person_id: body.personId,
        kind,
        text: text || body.date?.trim() || null,
        date: kind === 'date' ? body.date?.trim() || text || null : null,
        remind: kind === 'date' ? body.remind !== false : false,
        cadence,
        next_remind_at: nextRemindAt
      })
      .select('*')
      .single();
    if (error) throw error;
    return toDto(data);
  }

  // THIS SECTION DOES: change one of your notes.
  async update(
    authorId: string,
    id: string,
    body: {
      text?: string;
      date?: string;
      remind?: boolean;
      cadence?: FriendNoteCadence;
      nextRemindAt?: string | null;
    }
  ): Promise<FriendNote> {
    const patch: Record<string, unknown> = {};
    if (typeof body.text === 'string') patch.text = body.text.trim();
    if (typeof body.date === 'string') patch.date = body.date.trim();
    if (typeof body.remind === 'boolean') patch.remind = body.remind;
    if (body.cadence) patch.cadence = body.cadence;
    if (body.nextRemindAt !== undefined) patch.next_remind_at = body.nextRemindAt;

    const { data, error } = await this.supabase.admin
      .from('friend_notes')
      .update(patch as never)
      .eq('id', id)
      .eq('author_id', authorId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Note not found');
    return toDto(data);
  }

  // THIS SECTION DOES: delete one of your notes forever.
  async remove(authorId: string, id: string): Promise<void> {
    const { error, count } = await this.supabase.admin
      .from('friend_notes')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('author_id', authorId);
    if (error) throw error;
    if (!count) throw new NotFoundException('Note not found');
  }
}

function toDto(row: {
  id: string;
  person_id: string;
  kind: string;
  text: string | null;
  date: string | null;
  remind: boolean;
  cadence: string | null;
  next_remind_at: string | null;
}): FriendNote {
  return {
    id: row.id,
    personId: row.person_id,
    kind: row.kind as NoteKind,
    body: row.text ?? '',
    date: row.date ?? undefined,
    remind: row.remind,
    cadence: (row.cadence as FriendNoteCadence) ?? undefined,
    nextRemindAt: row.next_remind_at ?? undefined
  };
}

function nextRemindAfter(cadence: FriendNoteCadence, from = new Date()): string {
  const days = cadence === 'week' ? 7 : cadence === 'month' ? 30 : 14;
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
