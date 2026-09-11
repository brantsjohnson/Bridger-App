// ============================================
// WHAT THIS FILE DOES (plain English):
// The server brain for the opt-in "share my interests to my own website"
// feature. It can:
//   1) read the owner's share settings (on/off + which fields + slug/token),
//   2) save those settings (turning it on mints a friendly slug + a secret
//      token the first time),
//   3) build the read-only, sanitized taste export a website receives, either
//      by public slug or by a secret Bearer token.
//
// WHERE THE TASTES COME FROM: the existing `attributes` table only. We read
// hobbies (hobby:*), favorite movies/books (fav:*), and the current book
// (currently_book). We never copy facts into a parallel store, and we never
// expose messages, friends, places, About answers, top 5, or matching internals.
//
// PRIVACY: opt-in default OFF. A person who has not opted in (or whose slug is
// unknown) gets a clean 404. Only the field categories they checked come back.
// ============================================
import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  InterestShareDto,
  InterestShareSettings,
  InterestShareUpdateInput,
  Json
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * The exact attribute keys / prefixes this export is allowed to read. Keeping
 * this list tiny is the privacy guarantee: nothing outside it can ever leak.
 */
const HOBBY_PREFIX = 'hobby:';
const FAV_PREFIX = 'fav:';
const CURRENTLY_BOOK_KEY = 'currently_book';

/** How many items we return per list, so a huge profile can't bloat the export. */
const MAX_ITEMS = 50;

/** One attribute row shape we care about when building the export. */
type AttrRow = { key: string; value: Json; updated_at: string };

/** One favorite answer once we have pulled it apart (id + label + text). */
type FavEntry = { id: string; label: string; value: string };

@Injectable()
export class InterestShareService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService
  ) {}

  // --- Where public links live (used to build the ready-to-fetch URL). ---
  private apiBase(): string {
    const base =
      this.config.get<string>('PUBLIC_API_URL') ??
      this.config.get<string>('APP_WEB_URL') ??
      'https://bridger.app';
    return base.replace(/\/$/, '');
  }

  private linkFor(slug: string): string {
    return `${this.apiBase()}/public/share/interests/${slug}`;
  }

  // --- READ the owner's share settings (safe defaults if no row yet). ---
  async getSettings(userId: string): Promise<InterestShareSettings> {
    const { data, error } = await this.supabase.admin
      .from('interest_shares')
      .select(
        'enabled, slug, share_token, share_hobbies, share_movies, share_books, share_currently_reading, updated_at'
      )
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      // No row yet = never opted in. Report the OFF defaults without creating one.
      return {
        enabled: false,
        slug: null,
        shareToken: null,
        fields: {
          hobbies: true,
          movies: true,
          books: true,
          currentlyReading: true
        },
        slugUrl: null,
        updatedAt: new Date(0).toISOString()
      };
    }

    return this.rowToSettings(data);
  }

  // --- SAVE the owner's share settings (opt-in / field checkboxes / rotate). ---
  async updateSettings(
    userId: string,
    input: InterestShareUpdateInput
  ): Promise<InterestShareSettings> {
    // Read any existing row so we can keep untouched fields as they were.
    const { data: existing, error: exErr } = await this.supabase.admin
      .from('interest_shares')
      .select(
        'enabled, slug, share_token, share_hobbies, share_movies, share_books, share_currently_reading'
      )
      .eq('user_id', userId)
      .maybeSingle();
    if (exErr) throw exErr;

    // Build the next row, defaulting from the existing one (or OFF defaults).
    const next: {
      user_id: string;
      enabled: boolean;
      slug: string | null;
      share_token?: string;
      share_hobbies: boolean;
      share_movies: boolean;
      share_books: boolean;
      share_currently_reading: boolean;
    } = {
      user_id: userId,
      enabled: existing?.enabled ?? false,
      slug: existing?.slug ?? null,
      share_hobbies: existing?.share_hobbies ?? true,
      share_movies: existing?.share_movies ?? true,
      share_books: existing?.share_books ?? true,
      share_currently_reading: existing?.share_currently_reading ?? true
    };

    if (typeof input?.enabled === 'boolean') next.enabled = input.enabled;
    if (typeof input?.hobbies === 'boolean') next.share_hobbies = input.hobbies;
    if (typeof input?.movies === 'boolean') next.share_movies = input.movies;
    if (typeof input?.books === 'boolean') next.share_books = input.books;
    if (typeof input?.currentlyReading === 'boolean') {
      next.share_currently_reading = input.currentlyReading;
    }

    // Turning it on for the first time mints a friendly slug so a site can link.
    if (next.enabled && !next.slug) {
      next.slug = await this.mintUniqueSlug(userId);
    }

    // Rotate the secret token on request (invalidates any old Bearer link).
    if (input?.rotateToken) {
      next.share_token = randomUUID();
    }

    const { data: saved, error: upErr } = await this.supabase.admin
      .from('interest_shares')
      .upsert(next, { onConflict: 'user_id' })
      .select(
        'enabled, slug, share_token, share_hobbies, share_movies, share_books, share_currently_reading, updated_at'
      )
      .single();
    if (upErr) throw upErr;

    return this.rowToSettings(saved);
  }

  // --- PUBLIC: the sanitized taste export, found by friendly slug. ---
  async getPublicBySlug(slug: string): Promise<InterestShareDto> {
    const { data, error } = await this.supabase.admin
      .from('interest_shares')
      .select(
        'user_id, enabled, share_hobbies, share_movies, share_books, share_currently_reading'
      )
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    // Not found OR opted out both look identical (never reveal a private slug).
    if (!data || !data.enabled) {
      throw new NotFoundException('That interests link is not available.');
    }
    return this.buildDto(data);
  }

  // --- PUBLIC: the same export, found by the secret Bearer token. ---
  async getPublicByToken(token: string): Promise<InterestShareDto> {
    const { data, error } = await this.supabase.admin
      .from('interest_shares')
      .select(
        'user_id, enabled, share_hobbies, share_movies, share_books, share_currently_reading'
      )
      .eq('share_token', token)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.enabled) {
      throw new NotFoundException('That interests token is not available.');
    }
    return this.buildDto(data);
  }

  // --- Owner preview: what the public would see with the current settings. ---
  // Used by the owner GET so they can check the export before sharing the link.
  async previewFor(userId: string): Promise<InterestShareDto> {
    const settings = await this.getSettings(userId);
    return this.buildDto({
      user_id: userId,
      share_hobbies: settings.fields.hobbies,
      share_movies: settings.fields.movies,
      share_books: settings.fields.books,
      share_currently_reading: settings.fields.currentlyReading
    });
  }

  // ============================================================
  // Internals
  // ============================================================

  // THIS SECTION DOES: turn a DB row into the owner-facing settings shape.
  private rowToSettings(row: {
    enabled: boolean;
    slug: string | null;
    share_token: string;
    share_hobbies: boolean;
    share_movies: boolean;
    share_books: boolean;
    share_currently_reading: boolean;
    updated_at: string;
  }): InterestShareSettings {
    return {
      enabled: row.enabled,
      slug: row.slug,
      shareToken: row.share_token,
      fields: {
        hobbies: row.share_hobbies,
        movies: row.share_movies,
        books: row.share_books,
        currentlyReading: row.share_currently_reading
      },
      slugUrl: row.slug ? this.linkFor(row.slug) : null,
      updatedAt: row.updated_at
    };
  }

  // THIS SECTION DOES: read the person's attributes and assemble the sanitized
  // export, honoring exactly which field checkboxes are ON.
  private async buildDto(row: {
    user_id: string;
    share_hobbies: boolean;
    share_movies: boolean;
    share_books: boolean;
    share_currently_reading: boolean;
  }): Promise<InterestShareDto> {
    // PRIVACY: only ever read the tiny allow-list of interest keys.
    const { data: attrs, error } = await this.supabase.admin
      .from('attributes')
      .select('key, value, updated_at')
      .eq('owner_id', row.user_id)
      .or(
        `key.like.${HOBBY_PREFIX}%,key.like.${FAV_PREFIX}%,key.eq.${CURRENTLY_BOOK_KEY}`
      );
    if (error) throw error;

    const rows: AttrRow[] = (attrs ?? []) as AttrRow[];

    // Freshness hint: newest update among the interest rows we read.
    let updatedAt = new Date(0).toISOString();
    for (const r of rows) {
      if (r.updated_at && r.updated_at > updatedAt) updatedAt = r.updated_at;
    }

    const hobbies = row.share_hobbies ? this.extractHobbies(rows) : [];
    const { movies, books } = this.extractFavMoviesBooks(rows);
    const currentlyReading = row.share_currently_reading
      ? this.extractCurrentBook(rows)
      : undefined;

    const dto: InterestShareDto = {
      hobbies,
      movies: row.share_movies ? movies : [],
      books: row.share_books ? books : [],
      updatedAt
    };
    if (currentlyReading) dto.currentlyReading = currentlyReading;
    return dto;
  }

  // THIS SECTION DOES: pull hobby labels from hobby:* rows (clean strings only).
  private extractHobbies(rows: AttrRow[]): string[] {
    const out: string[] = [];
    for (const r of rows) {
      if (!r.key.startsWith(HOBBY_PREFIX)) continue;
      const label = readLabel(r.value);
      if (label) out.push(label);
    }
    return dedupeCap(out);
  }

  // THIS SECTION DOES: pull favorite movies and books from fav:* rows.
  // Favorites are grouped in the app, so we support three shapes safely:
  //   (a) granular keys like fav:movie / fav:book,
  //   (b) a per-answer `entries` list (id + label + value) on the group value,
  //   (c) a group whose own label is "Movies"/"Books".
  // Anything we cannot confidently classify is left out (never guessed).
  private extractFavMoviesBooks(rows: AttrRow[]): {
    movies: string[];
    books: string[];
  } {
    const movies: string[] = [];
    const books: string[] = [];

    for (const r of rows) {
      if (!r.key.startsWith(FAV_PREFIX)) continue;
      const keySuffix = r.key.slice(FAV_PREFIX.length).toLowerCase();
      const value = r.value as Record<string, unknown> | null;
      const groupLabel =
        value && typeof value.group === 'string' ? value.group : '';
      const items = readStringList(value?.items);
      const entries = readEntries(value?.entries);

      // (a) whole row is movies/books by its key or group label.
      const keyKind = classifyText(`${keySuffix} ${groupLabel}`);
      if (keyKind === 'movie') {
        movies.push(...items);
        continue;
      }
      if (keyKind === 'book') {
        books.push(...items);
        continue;
      }

      // (b) mixed group: classify each answer by its own id/label.
      for (const e of entries) {
        const kind = classifyText(`${e.id} ${e.label}`);
        if (kind === 'movie' && e.value) movies.push(e.value);
        else if (kind === 'book' && e.value) books.push(e.value);
      }
    }

    return { movies: dedupeCap(movies), books: dedupeCap(books) };
  }

  // THIS SECTION DOES: read the single current-book attribute, if any.
  private extractCurrentBook(
    rows: AttrRow[]
  ): { title: string; author?: string } | undefined {
    const row = rows.find((r) => r.key === CURRENTLY_BOOK_KEY);
    if (!row) return undefined;
    const value = row.value as Record<string, unknown> | null;
    const title =
      value && typeof value.title === 'string' ? value.title.trim() : '';
    if (!title) return undefined;
    const author =
      value && typeof value.author === 'string' ? value.author.trim() : '';
    return author ? { title, author } : { title };
  }

  // THIS SECTION DOES: make a short, friendly, unique slug (e.g. "brant-7f3a").
  private async mintUniqueSlug(userId: string): Promise<string> {
    // Start from the person's first name when we have one (nicer link).
    const { data: identity } = await this.supabase.admin
      .from('user_identity')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle();
    const first = (identity?.display_name ?? '').trim().split(/\s+/)[0] ?? '';
    const base =
      first
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 20) || 'friend';

    // Try a few times with a random suffix; the unique index is the real guard.
    for (let attempt = 0; attempt < 6; attempt++) {
      const suffix = Math.random().toString(36).slice(2, 8);
      const candidate = `${base}-${suffix}`;
      const { data: clash } = await this.supabase.admin
        .from('interest_shares')
        .select('user_id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!clash) return candidate;
    }
    // Extremely unlikely fallback: a full random id, guaranteed unique enough.
    return `${base}-${randomUUID().slice(0, 12)}`;
  }
}

// --- helper: read a display label from an attribute value (string or object) ---
function readLabel(value: Json): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const k of ['label', 'title', 'name', 'text', 'value']) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return '';
}

// --- helper: read a plain string[] from an unknown JSON value ---
function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((s) => s.length > 0);
}

// --- helper: read a list of {id,label,value} favorite entries, if present ---
function readEntries(value: unknown): FavEntry[] {
  if (!Array.isArray(value)) return [];
  const out: FavEntry[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : '';
    const label = typeof o.label === 'string' ? o.label : '';
    const val = typeof o.value === 'string' ? o.value.trim() : '';
    if (val) out.push({ id, label, value: val });
  }
  return out;
}

// --- helper: decide whether some text names a movie or a book (or neither) ---
function classifyText(text: string): 'movie' | 'book' | null {
  const t = text.toLowerCase();
  if (/\bbook|\bnovel|reading|\bread\b/.test(t)) return 'book';
  if (/\bmovie|\bfilm|cinema/.test(t)) return 'movie';
  return null;
}

// --- helper: trim, drop blanks/dupes, and cap the list length ---
function dedupeCap(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const s = raw.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}
