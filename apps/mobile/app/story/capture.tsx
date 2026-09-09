// ============================================
// WHAT THIS FILE DOES (plain English):
// Full-screen modal route for making a Scrapbook page (camera, then the page).
// Opened from the "Your scrapbook" tile on Home, from a party capture
// notification that passes ?eventId= so the post tags the event photo album,
// or with ?postId= to open one of today's pages straight away to add to it.
// Video posting is a co-op perk: we load real membership before compose mounts.
// ============================================
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CaptureCompose } from '../../components/story/CaptureCompose';
import { getMembership } from '../../data/coop';
import { getEvent } from '../../data/events';

export default function StoryCaptureScreen() {
  const router = useRouter();
  const { eventId, postId } = useLocalSearchParams<{ eventId?: string; postId?: string }>();
  const [isCoopMember, setIsCoopMember] = useState(false);
  const [eventTitle, setEventTitle] = useState<string | undefined>();

  // THIS SECTION DOES: learn if they have co-op (video unlock). API hiccups
  // leave them on free so capture still opens without a red error banner.
  useEffect(() => {
    let alive = true;
    void getMembership()
      .then((m) => {
        if (alive) setIsCoopMember(!!m.member);
      })
      .catch(() => {
        if (alive) setIsCoopMember(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // THIS SECTION DOES: when opened from a party nudge, resolve the event title.
  useEffect(() => {
    if (!eventId || typeof eventId !== 'string') {
      setEventTitle(undefined);
      return;
    }
    let alive = true;
    void getEvent(eventId)
      .then((e) => {
        if (alive) setEventTitle(e?.title);
      })
      .catch(() => {
        if (alive) setEventTitle(undefined);
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
      initialPostId={typeof postId === 'string' ? postId : undefined}
    />
  );
}
