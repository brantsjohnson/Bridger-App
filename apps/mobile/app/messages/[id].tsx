// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen route for one conversation. Opened from the Messages list,
// New-message sheet, or a friend's profile Message button. Optional ?seed=
// pre-sends a message (touch-grass "I'm in").
// ============================================
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThreadScreen } from '../../components/messages/ThreadScreen';

export default function MessageThreadRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; seed?: string }>();
  const threadId = typeof params.id === 'string' ? params.id : 't1';
  const seed = typeof params.seed === 'string' ? params.seed : undefined;

  return (
    <ThreadScreen
      threadId={threadId}
      seedMessage={seed}
      onBack={() => router.back()}
    />
  );
}
