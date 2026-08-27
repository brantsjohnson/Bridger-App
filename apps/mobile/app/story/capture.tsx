// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen modal route for capturing + composing a new Update. Opened from
// the "Your story" tile on Home, or from a party capture notification that
// passes ?eventId= so the post tags the event photo album.
// Video posting is a co-op perk — we load real membership before compose mounts.
// ============================================
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CaptureCompose } from '../../components/story/CaptureCompose';
import { getMembership } from '../../data/coop';
import { getEvent } from '../../data/events';

export default function StoryCaptureScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const [isCoopMember, setIsCoopMember] = useState(false);
  const [eventTitle, setEventTitle] = useState<string | undefined>();

  useEffect(() => {
    void getMembership().then((m) => setIsCoopMember(!!m.member));
  }, []);

  useEffect(() => {
    if (!eventId || typeof eventId !== 'string') {
      setEventTitle(undefined);
      return;
    }
    let alive = true;
    void getEvent(eventId).then((e) => {
      if (alive) setEventTitle(e?.title);
    });
    return () => {
      alive = false;
    };
  }, [eventId]);

  const tagEventId = typeof eventId === 'string' ? eventId : undefined;

  return (
    <CaptureCompose
      onClose={() => router.back()}
      onPosted={() => router.back()}
      isCoopMember={isCoopMember}
      initialEventId={tagEventId}
      initialEventTitle={eventTitle}
    />
  );
}
