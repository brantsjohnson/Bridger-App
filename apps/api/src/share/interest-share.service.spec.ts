// ============================================
// WHAT THIS FILE DOES (plain English):
// Fast checks for the opt-in interests-share export (run with tsx, no Jest).
// It proves the two rules the feature promises:
//   1) opt-in OFF  -> the public link is a clean 404 (nothing leaks),
//   2) opt-in ON   -> the site gets ONLY the sanitized taste DTO (hobbies,
//      movies, books, currentlyReading) and nothing else (no places, About,
//      top 5, messages, or matching internals).
// It also checks that unchecking a field removes just that field, and that
// grouped favorites are split into movies vs books by their per-answer entries.
// ============================================
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  MeInterestShareController,
  PublicInterestShareController
} from './interest-share.controller';
import { InterestShareService } from './interest-share.service';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// --- A tiny fake of the Supabase admin client the service talks to. ---
// It only supports the exact query chains the service uses.
type ShareRow = {
  user_id: string;
  enabled: boolean;
  slug: string | null;
  share_token: string;
  share_hobbies: boolean;
  share_movies: boolean;
  share_books: boolean;
  share_currently_reading: boolean;
  updated_at: string;
};
type AttrRow = { key: string; value: unknown; updated_at: string };

function makeSupabase(fixtures: {
  shares: ShareRow[];
  attributes: Record<string, AttrRow[]>;
}) {
  return {
    admin: {
      from(table: string) {
        const filters: Record<string, unknown> = {};
        const builder: any = {
          select() {
            return builder;
          },
          eq(col: string, val: unknown) {
            filters[col] = val;
            return builder;
          },
          or() {
            // Terminal for the attributes read (owner_id already recorded).
            const owner = String(filters['owner_id'] ?? '');
            return Promise.resolve({
              data: fixtures.attributes[owner] ?? [],
              error: null
            });
          },
          maybeSingle() {
            if (table === 'interest_shares') {
              const row =
                fixtures.shares.find((s) =>
                  'slug' in filters
                    ? s.slug === filters['slug']
                    : 'share_token' in filters
                      ? s.share_token === filters['share_token']
                      : s.user_id === filters['user_id']
                ) ?? null;
              return Promise.resolve({ data: row, error: null });
            }
            if (table === 'user_identity') {
              return Promise.resolve({
                data: { display_name: 'Brant Johnson' },
                error: null
              });
            }
            return Promise.resolve({ data: null, error: null });
          }
        };
        return builder;
      }
    }
  } as never;
}

const fakeConfig = { get: () => undefined } as never;

// --- Fixtures: one person's tastes and both share states. ---
const OWNER = 'user-1';
const attributes: AttrRow[] = [
  { key: 'hobby:climbing', value: { label: 'Climbing' }, updated_at: '2026-01-02T00:00:00Z' },
  { key: 'hobby:baking', value: { label: 'Baking' }, updated_at: '2026-01-03T00:00:00Z' },
  {
    key: 'fav:entertainment',
    value: {
      group: 'Entertainment',
      items: ['Paddington 2', 'Dune'],
      entries: [
        { id: 'fav-movie', label: 'Movie', value: 'Paddington 2' },
        { id: 'fav-book', label: 'Book', value: 'Dune' }
      ]
    },
    updated_at: '2026-01-05T00:00:00Z'
  },
  { key: 'currently_book', value: { title: 'The Overstory', author: 'Richard Powers' }, updated_at: '2026-01-06T00:00:00Z' },
  // Sensitive rows that must NEVER appear in the export:
  { key: 'place:lisbon', value: { label: 'Lisbon' }, updated_at: '2026-01-01T00:00:00Z' },
  { key: 'about:secret', value: { text: 'private' }, updated_at: '2026-01-01T00:00:00Z' },
  { key: 'top5:1', value: { label: 'secret pick' }, updated_at: '2026-01-01T00:00:00Z' }
];

function shareRow(overrides: Partial<ShareRow>): ShareRow {
  return {
    user_id: OWNER,
    enabled: true,
    slug: 'brant-abc123',
    share_token: 'tok-123',
    share_hobbies: true,
    share_movies: true,
    share_books: true,
    share_currently_reading: true,
    updated_at: '2026-01-06T00:00:00Z',
    ...overrides
  };
}

async function run() {
  // 1) OPT-IN OFF -> 404 by slug and by token, nothing leaks.
  {
    const svc = new InterestShareService(
      makeSupabase({ shares: [shareRow({ enabled: false })], attributes: { [OWNER]: attributes } }),
      fakeConfig
    );
    let threw = false;
    try {
      await svc.getPublicBySlug('brant-abc123');
    } catch (e) {
      threw = e instanceof NotFoundException;
    }
    assert(threw, 'opt-in OFF must 404 by slug');

    let threwTok = false;
    try {
      await svc.getPublicByToken('tok-123');
    } catch (e) {
      threwTok = e instanceof NotFoundException;
    }
    assert(threwTok, 'opt-in OFF must 404 by token');
  }

  // 2) OPT-IN ON -> only the sanitized DTO, split correctly.
  {
    const svc = new InterestShareService(
      makeSupabase({ shares: [shareRow({})], attributes: { [OWNER]: attributes } }),
      fakeConfig
    );
    const dto = await svc.getPublicBySlug('brant-abc123');

    // Exactly the allowed keys, nothing else.
    const keys = Object.keys(dto).sort();
    assert(
      JSON.stringify(keys) ===
        JSON.stringify(['books', 'currentlyReading', 'hobbies', 'movies', 'updatedAt']),
      `unexpected DTO keys: ${keys.join(',')}`
    );

    assert(dto.hobbies.includes('Climbing') && dto.hobbies.includes('Baking'), 'hobbies missing');
    assert(dto.movies.length === 1 && dto.movies[0] === 'Paddington 2', 'movie split wrong');
    assert(dto.books.length === 1 && dto.books[0] === 'Dune', 'book split wrong');
    assert(dto.currentlyReading?.title === 'The Overstory', 'current book missing');
    assert(dto.currentlyReading?.author === 'Richard Powers', 'current author missing');

    // Sanitization: no sensitive values anywhere in the JSON.
    const blob = JSON.stringify(dto);
    assert(!/Lisbon/.test(blob), 'place leaked into export');
    assert(!/private/.test(blob), 'about answer leaked into export');
    assert(!/secret pick/.test(blob), 'top5 leaked into export');
  }

  // 3) Field checkbox OFF removes just that field (books off -> empty books).
  {
    const svc = new InterestShareService(
      makeSupabase({ shares: [shareRow({ share_books: false, share_currently_reading: false })], attributes: { [OWNER]: attributes } }),
      fakeConfig
    );
    const dto = await svc.getPublicBySlug('brant-abc123');
    assert(dto.books.length === 0, 'books should be empty when unchecked');
    assert(dto.currentlyReading === undefined, 'currentlyReading should be omitted when unchecked');
    assert(dto.movies.length === 1, 'movies should still be present');
    assert(dto.hobbies.length === 2, 'hobbies should still be present');
  }

  // 4) No row at all -> owner settings default to OFF (never auto-opts in).
  {
    const svc = new InterestShareService(
      makeSupabase({ shares: [], attributes: { [OWNER]: attributes } }),
      fakeConfig
    );
    const settings = await svc.getSettings(OWNER);
    assert(settings.enabled === false, 'default settings must be opt-in OFF');
    assert(settings.slug === null, 'no slug before opt-in');
    assert(settings.shareToken === null, 'no token before opt-in');
  }

  // 5) Controller layer: owner GET returns settings + a live preview.
  {
    const svc = new InterestShareService(
      makeSupabase({ shares: [shareRow({})], attributes: { [OWNER]: attributes } }),
      fakeConfig
    );
    const owner = new MeInterestShareController(svc);
    const res = await owner.get({ id: OWNER } as never);
    assert(res.enabled === true, 'owner GET should report enabled');
    assert(res.slug === 'brant-abc123', 'owner GET should return slug');
    assert(res.preview.movies[0] === 'Paddington 2', 'owner preview should include tastes');
    // The owner GET exposes settings + preview only (no raw DB columns).
    assert('fields' in res && 'preview' in res, 'owner GET shape wrong');
  }

  // 6) Controller layer: public token route needs a token (else 400), and a
  // valid token returns the DTO.
  {
    const svc = new InterestShareService(
      makeSupabase({ shares: [shareRow({})], attributes: { [OWNER]: attributes } }),
      fakeConfig
    );
    const pub = new PublicInterestShareController(svc);

    let badReq = false;
    try {
      await pub.byToken(undefined, undefined);
    } catch (e) {
      badReq = e instanceof BadRequestException;
    }
    assert(badReq, 'missing token should be a 400');

    const viaHeader = await pub.byToken('Bearer tok-123', undefined);
    assert(viaHeader.hobbies.length === 2, 'token via header should return DTO');

    const viaQuery = await pub.byToken(undefined, 'tok-123');
    assert(viaQuery.movies[0] === 'Paddington 2', 'token via query should return DTO');
  }

  console.log('interest-share.service.spec.ts: ok');
}

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});
