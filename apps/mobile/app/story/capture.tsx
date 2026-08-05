// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen modal route for capturing + composing a new Update. Opened from
// the "Your story" tile on Home. Capture is in-app only (no camera roll).
// Video posting is a co-op perk — we load real membership before compose mounts.
// ============================================
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { CaptureCompose } from '../../components/story/CaptureCompose';
import { getMembership } from '../../data/coop';

export default function StoryCaptureScreen() {
  const router = useRouter();
  const [isCoopMember, setIsCoopMember] = useState(false);

  useEffect(() => {
    void getMembership().then((m) => setIsCoopMember(!!m.member));
  }, []);

  return (
    <CaptureCompose
      onClose={() => router.back()}
      onPosted={() => router.back()}
      isCoopMember={isCoopMember}
    />
  );
}
