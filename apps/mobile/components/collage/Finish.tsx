// ============================================
// WHAT THIS FILE DOES (plain English):
// After a page is posted: a tilted preview, save to the camera roll, share,
// and Done back to the camera.
// ============================================
import React, { useRef } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { COLLAGE_FINISH, type ScrapbookPage } from '@bridger/shared';
import { ButtonPrimary, ButtonSecondary, SurfaceHost } from '@bridger/ui';
import { collageDayLabel } from '../../data/collage';
import { savePageViewToCameraRoll } from '../../lib/save-to-camera-roll';
import { CollagePage } from './Page';

export function Finish({
  page,
  onDone,
  insetsTop,
  insetsBottom
}: {
  page: ScrapbookPage;
  onDone: () => void;
  insetsTop: number;
  insetsBottom: number;
}) {
  const ref = useRef<View>(null);

  const sharePage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Share on your phone', 'Sharing a page works in the Bridger phone app.');
      return;
    }
    try {
      const { captureRef } = await import('react-native-view-shot');
      const uri = await captureRef(ref, { format: 'jpg', quality: 0.9, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch {
      Alert.alert('Could not share', 'Try again in a moment.');
    }
  };
  return (
    <SurfaceHost surface="collage_finish" parentScreen="collage_editor" open>
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E0E',
          paddingTop: Math.max(insetsTop, 16),
          paddingBottom: Math.max(insetsBottom, 16)
        }}
        className="px-6"
      >
        <Text
          accessibilityRole="header"
          className="font-sans-b text-[22px] text-white"
        >
          On the calendar
        </Text>
        <Text className="mt-1 font-sans-md text-[13px] text-white/55">
          {collageDayLabel()} · prints at 8.5×11
        </Text>
        <View className="flex-1 items-center justify-center">
          <View ref={ref} collapsable={false} style={{ transform: [{ rotate: '-2deg' }] }}>
            <CollagePage page={page} width={260} mode="view" radius={6} />
          </View>
        </View>
        <View className="gap-2">
          <ButtonSecondary
            analyticsId={COLLAGE_FINISH.actions.save_roll}
            onPress={() => void savePageViewToCameraRoll(ref)}
          >
            Camera roll
          </ButtonSecondary>
          <ButtonSecondary analyticsId={COLLAGE_FINISH.actions.share} onPress={() => void sharePage()}>
            Share
          </ButtonSecondary>
          <ButtonPrimary analyticsId={COLLAGE_FINISH.actions.done} onPress={onDone}>
            Done
          </ButtonPrimary>
        </View>
      </View>
    </SurfaceHost>
  );
}
