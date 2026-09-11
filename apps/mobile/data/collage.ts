// ============================================
// WHAT THIS FILE DOES (plain English):
// Extra collage helpers that sit on top of stories.ts: save a finished page
// to the camera roll, transcribe a voice note, and a couple of copy helpers
// (today's date line). Packs and papers live in @bridger/shared so the
// server and the phone share the same ids.
// ============================================
import type { ScrapbookPage } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { recordingToUpload } from '../lib/assistant-voice';
import { personById } from './people';

/** "Tue 09 Sep" style line under a just-shot photo. */
export function collageDayLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
}

/**
 * Send a recorded voice note to the server and get the words back.
 * Demo mode returns a stand-in sentence so the editor still works offline.
 * PRIVACY: the words are never written to analytics.
 */
export async function transcribeCollageAudio(uri: string): Promise<string> {
  if (isDemoMode()) {
    return 'A voice note on this page';
  }
  const { base64, filename } = await recordingToUpload(uri);
  const res = await apiFetch<{ text: string }>('/stories/transcribe', {
    method: 'POST',
    body: JSON.stringify({ audioBase64: base64, filename })
  });
  return (res.text ?? '').trim();
}

/**
 * Put friend names on person chips for drawing. Names come from the phone
 * book. We never store names on the page itself.
 */
export function withFriendNames(page: ScrapbookPage): ScrapbookPage {
  return {
    ...page,
    elements: page.elements.map((e) => {
      if (e.type !== 'person') return e;
      const ids = (e.data.personIds as string[] | undefined) ?? [];
      return {
        ...e,
        data: {
          ...e.data,
          displayNames: ids.map((id) => personById(id).name).filter(Boolean)
        }
      };
    })
  };
}
