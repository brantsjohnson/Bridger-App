// ============================================
// WHAT THIS FILE DOES (plain English):
// Right after the shutter (or a camera-roll pick). The photo is already on
// today's page as a draft. Done posts it with the last audience you used.
// Make it a collage opens the editor. Retake throws this take away.
// ============================================
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { DownloadIcon } from 'lucide-react-native';
import { POST_COMPOSER } from '@bridger/shared';
import { AnalyticsRegion, ButtonPrimary, ButtonSecondary, withAnalyticsPress } from '@bridger/ui';
import { collageDayLabel } from '../../data/collage';

export function JustShot({
  uri,
  onRetake,
  onSaveRoll,
  onDone,
  onMakeCollage,
  posting,
  insetsTop,
  insetsBottom
}: {
  uri: string;
  onRetake: () => void;
  onSaveRoll: () => void;
  onDone: () => void;
  onMakeCollage: () => void;
  posting?: boolean;
  insetsTop: number;
  insetsBottom: number;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0E0E',
        paddingTop: Math.max(insetsTop, 12),
        paddingBottom: Math.max(insetsBottom, 16)
      }}
      className="px-4"
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={withAnalyticsPress(POST_COMPOSER.actions.retake, onRetake)}
          accessibilityRole="button"
          accessibilityLabel="Retake"
          className="h-11 items-center justify-center rounded-full px-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
        >
          <Text className="font-sans-md text-white">Retake</Text>
        </Pressable>
        <Pressable
          onPress={withAnalyticsPress(POST_COMPOSER.actions.save_roll, onSaveRoll)}
          accessibilityRole="button"
          accessibilityLabel="Save to camera roll"
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
        >
          <DownloadIcon size={18} color="#FFFFFF" />
        </Pressable>
      </View>
      <View className="mt-3 flex-1 overflow-hidden rounded-2xl bg-black">
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Just shot"
        />
      </View>
      <AnalyticsRegion analyticsId={POST_COMPOSER.just_shot.on_page} interactive={false}>
        <View className="mt-3 flex-row items-center">
          <Text accessible={false} className="mr-2 text-[16px]">
            ✓
          </Text>
          <Text
            accessibilityRole="text"
            className="font-sans-md text-[14px] text-white/80"
          >
            On today's page. {collageDayLabel()}
          </Text>
        </View>
      </AnalyticsRegion>
      <View className="mt-4 gap-2">
        <ButtonPrimary
          analyticsId={POST_COMPOSER.actions.done}
          onPress={onDone}
          loading={posting}
          disabled={posting}
        >
          Done
        </ButtonPrimary>
        <ButtonSecondary analyticsId={POST_COMPOSER.actions.make_collage} onPress={onMakeCollage}>
          Make it a collage
        </ButtonSecondary>
      </View>
    </View>
  );
}
