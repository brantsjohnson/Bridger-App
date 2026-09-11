// ============================================
// WHAT THIS FILE DOES (plain English):
// Deep link into the collage editor. The camera-first flow owns the draft,
// so this route just opens capture in editor mode (today's page).
// ============================================
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function CollageEditorRoute() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const q = typeof postId === 'string' ? `?postId=${encodeURIComponent(postId)}` : '';
  return <Redirect href={`/story/capture${q}`} />;
}
