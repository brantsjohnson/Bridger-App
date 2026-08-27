// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen modal route for the Updates player. Opened from Home's story
// tray, Friends update taps, and the Profile stories calendar. Optional
// query params deep-open Catch-Up (?catchup=1) or comments (?comments=1),
// mark a profile entry (?from=profile), or pass the Home tray order
// (?sequence=me,jade,kelton) so finishing one friend opens the next.
// Advancing friends keeps the same StoryViewer mounted so Catch-Up stays
// parked at the peek instead of remounting open-then-closed.
// ============================================
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoryViewer } from '../../components/story/StoryViewer';
import { clearStoryReplyNotifications } from '../../data/feed';

export default function StoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    catchup?: string;
    comments?: string;
    from?: string;
    sequence?: string;
    /** When set, only clear that person's story-reply chip — not the whole row. */
    replyAuthor?: string;
  }>();

  const routeAuthorId = typeof params.id === 'string' ? params.id : 'maya';
  // Local author so tray advances do not remount the player (and Catch-Up).
  const [activeAuthorId, setActiveAuthorId] = useState(routeAuthorId);
  const startCatchUpOpen = params.catchup === '1';
  const startCommentsOpen = params.comments === '1';
  const fromProfile = params.from === 'profile';
  const replyAuthor =
    typeof params.replyAuthor === 'string' && params.replyAuthor.length > 0
      ? params.replyAuthor
      : undefined;
  // Comma-separated author ids from the Home tray (preserves watch order).
  const sequence =
    typeof params.sequence === 'string' && params.sequence.length > 0
      ? params.sequence.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  // Deep link / fresh open: sync local author to the route id.
  useEffect(() => {
    setActiveAuthorId(routeAuthorId);
  }, [routeAuthorId]);

  // Opening your own replies clears story-reply alerts (NOTIFICATIONS.md).
  // A specific chip pass replyAuthor so the rest of the Home row stays.
  useEffect(() => {
    if (activeAuthorId === 'me' && startCommentsOpen) {
      clearStoryReplyNotifications(replyAuthor ? { personId: replyAuthor } : undefined);
    }
  }, [activeAuthorId, startCommentsOpen, replyAuthor]);

  return (
    <StoryViewer
      authorId={activeAuthorId}
      startCatchUpOpen={startCatchUpOpen}
      startCommentsOpen={startCommentsOpen}
      fromProfile={fromProfile}
      sequence={sequence}
      onClose={() => router.back()}
      onAdvanceAuthor={(nextId) => {
        // Same player instance — only the author prop changes.
        setActiveAuthorId(nextId);
      }}
    />
  );
}
