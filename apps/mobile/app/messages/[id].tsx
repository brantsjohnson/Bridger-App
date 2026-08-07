// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen route for one conversation. Opened from the Messages list,
// New-message sheet, or a friend's profile Message button. Optional ?seed=
// pre-sends a message (touch-grass "I'm in"). Optional ?draft= prefills the
// composer without sending (Assistant only — never auto-send).
// ============================================
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThreadScreen } from '../../components/messages/ThreadScreen';

export default function MessageThreadRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    seed?: string;
    draft?: string;
  }>();
  const threadId = typeof params.id === 'string' ? params.id : 't1';
  const seed = typeof params.seed === 'string' ? params.seed : undefined;
  const draft = typeof params.draft === 'string' ? params.draft : undefined;

  return (
    <ThreadScreen
      threadId={threadId}
      seedMessage={seed}
      draftMessage={draft}
      onBack={() => router.back()}
    />
  );
}
