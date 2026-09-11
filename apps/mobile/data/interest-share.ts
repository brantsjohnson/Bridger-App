// ============================================
// WHAT THIS FILE DOES (plain English):
// The phone-side helper for the opt-in "share my interests to my own website"
// switch in Profile Settings. It reads and saves the setting through the Nest
// API (/me/share/interests). Demo mode keeps the choice on the device only.
//
// PRIVACY: this only flips an opt-in switch and picks which taste categories
// may leave the app. The actual export (hobbies, movies, books, current book)
// is assembled server-side from your existing profile facts, never here.
// ============================================
import type {
  InterestShareSettings,
  InterestShareUpdateInput
} from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';

/** Demo fallback so the toggle still moves when there is no live API. */
let demoSettings: InterestShareSettings = {
  enabled: false,
  slug: null,
  shareToken: null,
  fields: { hobbies: true, movies: true, books: true, currentlyReading: true },
  slugUrl: null,
  updatedAt: new Date(0).toISOString()
};

/** Read my current interests-share settings (safe OFF defaults on any error). */
export async function getInterestShare(): Promise<InterestShareSettings> {
  if (isDemoMode()) return { ...demoSettings };
  try {
    const res = await apiFetch<InterestShareSettings>('/me/share/interests');
    return res;
  } catch {
    return { ...demoSettings, enabled: false };
  }
}

/** Save my interests-share settings (opt in/out + which fields + rotate token). */
export async function saveInterestShare(
  input: InterestShareUpdateInput
): Promise<InterestShareSettings> {
  if (isDemoMode()) {
    demoSettings = {
      ...demoSettings,
      enabled: input.enabled ?? demoSettings.enabled,
      fields: {
        hobbies: input.hobbies ?? demoSettings.fields.hobbies,
        movies: input.movies ?? demoSettings.fields.movies,
        books: input.books ?? demoSettings.fields.books,
        currentlyReading:
          input.currentlyReading ?? demoSettings.fields.currentlyReading
      },
      slug: (input.enabled ?? demoSettings.enabled) ? 'demo-preview' : demoSettings.slug,
      updatedAt: new Date().toISOString()
    };
    return { ...demoSettings };
  }
  return apiFetch<InterestShareSettings>('/me/share/interests', {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}
