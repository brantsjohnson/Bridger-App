// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen modal route for the Updates player. Opened from Home's story
// tray, Friends update taps, and the Profile stories calendar. Optional
// query params deep-open Catch-Up (?catchup=1) or comments (?comments=1).
// ============================================
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoryViewer } from '../../components/story/StoryViewer';

export default function StoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    catchup?: string;
    comments?: string;
  }>();

  const authorId = typeof params.id === 'string' ? params.id : 'maya';
  const startCatchUpOpen = params.catchup === '1';
  const startCommentsOpen = params.comments === '1';

  return (
    <StoryViewer
      authorId={authorId}
      startCatchUpOpen={startCatchUpOpen}
      startCommentsOpen={startCommentsOpen}
      onClose={() => router.back()}
    />
  );
}
