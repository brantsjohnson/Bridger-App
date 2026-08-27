// ============================================
// WHAT THIS FILE DOES (plain English):
// Horizontal strip of photos guests posted and tagged to this event. Shows on
// the event detail page after someone captures mems from a party nudge.
// ============================================
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { StoryPost } from '@bridger/shared';
import { EVENTS } from '@bridger/shared';
import { AnalyticsRegion, PixelHeading } from '@bridger/ui';
import { listEventStoryPosts } from '../../data/stories';

type Props = {
  eventId: string;
};

export function EventPhotoAlbum({ eventId }: Props) {
  const [photos, setPhotos] = useState<StoryPost[]>([]);

  useEffect(() => {
    let alive = true;
    void listEventStoryPosts(eventId).then((rows) => {
      if (alive) setPhotos(rows);
    });
    return () => {
      alive = false;
    };
  }, [eventId]);

  if (photos.length === 0) return null;

  return (
    <View>
      <AnalyticsRegion
        analyticsId={EVENTS.detail.photo_album_header}
        interactive={false}
      >
        <PixelHeading size="md" className="mb-1.5">
          Photo album
        </PixelHeading>
      </AnalyticsRegion>
      <Text className="mb-2.5 font-sans-sb text-[12px] text-ink-mute">
        Updates tagged to this event
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2.5"
        accessibilityLabel="Event photo album"
      >
        {photos.map((post) => (
          <AnalyticsRegion
            key={post.id}
            analyticsId={EVENTS.detail.photo_album_tile}
            interactive={false}
            className="h-24 w-24 items-center justify-center rounded-card bg-purple/20"
          >
            <Text accessible={false} className="text-[40px]">
              {post.emoji}
            </Text>
          </AnalyticsRegion>
        ))}
      </ScrollView>
    </View>
  );
}
