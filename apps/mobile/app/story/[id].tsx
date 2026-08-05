// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen modal route for the Updates player. Opened from Home's story
// tray, Friends update taps, and the Profile stories calendar. Optional
// query params deep-open Catch-Up (?catchup=1) or comments (?comments=1),
// mark a profile entry (?from=profile), or pass the Home tray order
// (?sequence=me,jade,kelton) so finishing one friend opens the next.
// ============================================
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoryViewer } from '../../components/story/StoryViewer';

export default function StoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    catchup?: string;
    comments?: string;
    from?: string;
    sequence?: string;
  }>();

  const authorId = typeof params.id === 'string' ? params.id : 'maya';
  const startCatchUpOpen = params.catchup === '1';
  const startCommentsOpen = params.comments === '1';
  const fromProfile = params.from === 'profile';
  // Comma-separated author ids from the Home tray (preserves watch order).
  const sequence =
    typeof params.sequence === 'string' && params.sequence.length > 0
      ? params.sequence.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  return (
    <StoryViewer
      authorId={authorId}
      startCatchUpOpen={startCatchUpOpen}
      startCommentsOpen={startCommentsOpen}
      fromProfile={fromProfile}
      sequence={sequence}
      onClose={() => router.back()}
      onAdvanceAuthor={(nextId) => {
        // Keep the same sequence + entry flags while swapping the author.
        const qs = new URLSearchParams();
        if (sequence.length) qs.set('sequence', sequence.join(','));
        if (fromProfile) qs.set('from', 'profile');
        const q = qs.toString();
        router.replace(`/story/${nextId}${q ? `?${q}` : ''}`);
      }}
    />
  );
}
