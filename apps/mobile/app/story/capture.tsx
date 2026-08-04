// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen modal route for capturing + composing a new Update. Opened from
// the "Your story" tile on Home. Capture is in-app only (no camera roll).
// ============================================
import { useRouter } from 'expo-router';
import { CaptureCompose } from '../../components/story/CaptureCompose';

export default function StoryCaptureScreen() {
  const router = useRouter();

  return (
    <CaptureCompose
      onClose={() => router.back()}
      onPosted={() => router.back()}
      isCoopMember={false}
    />
  );
}
