// ============================================
// WHAT THIS FILE DOES (plain English):
// "Wait, you were there too?" When you and a friend have both been somewhere,
// your photos from that place sit side by side on the In common tab.
// Demo uses emoji stand-ins; live will use capture-only media.
// ============================================
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SparklesIcon } from 'lucide-react-native';
import { ACCENTS, cn } from '@bridger/ui';
import { getSharedPlaces, type SharedPlace } from '../../data/reveal';

export function SharedPlacePhotos({
  personId,
  theirName = 'Them'
}: {
  personId: string;
  theirName?: string;
}) {
  const [places, setPlaces] = useState<SharedPlace[]>([]);

  useEffect(() => {
    void getSharedPlaces(personId).then(setPlaces);
  }, [personId]);

  if (places.length === 0) return null;

  return (
    <View>
      <View className="mb-2.5 flex-row items-center gap-1.5">
        <SparklesIcon size={14} color="#7C5CFF" strokeWidth={2.8} />
        <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
          You have both been here
        </Text>
      </View>

      <View className="gap-3">
        {places.map((s) => (
          <View
            key={s.id}
            className="rounded-2xl border border-ink-line bg-surface p-3"
          >
            <Text className="font-sans-b text-[14px] text-ink">{s.place}</Text>
            <View className="mt-2.5 flex-row gap-2.5">
              {[
                { who: 'You', shot: s.yours },
                { who: theirName, shot: s.theirs }
              ].map(({ who, shot }) => (
                <View
                  key={who}
                  className="min-w-0 flex-1 rounded-none border border-ink-line bg-surface p-1.5 pb-2"
                >
                  <View
                    accessible={false}
                    className={cn(
                      'h-[92px] items-center justify-center',
                      ACCENTS[shot.accent].tintSolid
                    )}
                  >
                    <Text className="text-[36px]">{shot.emoji}</Text>
                  </View>
                  <View className="mt-1.5 px-0.5">
                    <Text className="font-sans-b text-[11px] text-ink" numberOfLines={1}>
                      {who}
                    </Text>
                    <Text
                      className="font-sans-md text-[11px] text-ink-mute"
                      numberOfLines={1}
                    >
                      {shot.caption}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
