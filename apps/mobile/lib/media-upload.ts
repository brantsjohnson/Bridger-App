// ============================================
// WHAT THIS FILE DOES (plain English):
// One shared way to put a photo, video, or audio clip into Supabase Storage
// and create the matching `media` row. Recap clips, story Updates, and circle
// video replies all call this so the path and ownership rules stay the same.
//
// PRIVACY: the file lands under your user id in the private `media` bucket;
// RLS only lets you insert a media row you own.
// ============================================
import { supabase } from './supabase';

export type MediaKind = 'photo' | 'video' | 'audio';

const CONTENT_TYPE: Record<MediaKind, string> = {
  photo: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/m4a'
};

const EXT: Record<MediaKind, string> = {
  photo: 'jpg',
  video: 'mp4',
  audio: 'm4a'
};

/**
 * Upload bytes from a local uri (or a remote https photo URL, e.g. Google
 * avatar prefill) and return the new media row id.
 * `pathSuffix` is everything after `{userId}/`, e.g. `stories/tmp-123.jpg`
 * or `recap/{weekId}/0-123.m4a`.
 */
export async function uploadMedia(
  uri: string,
  kind: MediaKind,
  pathSuffix: string
): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error('Not signed in');

  // THIS SECTION DOES: pull the file bytes. Works for file://, content://, and
  // https:// (OAuth profile photo). Fail loud if the URL is dead so onboarding
  // never "succeeds" with an empty avatar.
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Could not read photo (${res.status})`);
  }
  const bytes = await res.arrayBuffer();
  if (!bytes.byteLength) {
    throw new Error('Photo file was empty');
  }

  // Allow callers to pass a suffix with or without an extension.
  const hasExt = /\.[a-z0-9]+$/i.test(pathSuffix);
  const path = `${userId}/${hasExt ? pathSuffix : `${pathSuffix}.${EXT[kind]}`}`;

  const { error: upErr } = await supabase.storage
    .from('media')
    .upload(path, bytes, { contentType: CONTENT_TYPE[kind], upsert: true });
  if (upErr) throw upErr;

  const { data: media, error: mErr } = await supabase
    .from('media')
    .insert({ owner_id: userId, storage_path: path, kind })
    .select('id')
    .single();
  if (mErr) throw mErr;

  return media.id;
}
