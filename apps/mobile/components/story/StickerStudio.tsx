// ============================================
// WHAT THIS FILE DOES (plain English):
// "Make your own sticker." You take a photo, we show it punched out into a
// circle, and if you like it we save it to your sticker strip so you can send
// it as a reply. Your stickers are yours — they live with your account, not on
// anyone else's screen until you send one.
//
// MEDIA: capture only, same as updates. There is deliberately no "pick from
// your library" button here — the profile photo is the app's one upload
// exception (DATA.md).
// TODO (needs a native module): true iMessage-style subject cut-out, where the
// background is removed and only the person/object is left. That needs on-device
// segmentation (Vision on iOS / ML Kit on Android). Until then the sticker is a
// clean circular crop, which is a real sticker, just not a cut-out one.
// ACCESSIBILITY: every control is labelled; the preview is described in words.
// ============================================
import React, { useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { RotateCcwIcon, SwitchCameraIcon, XIcon } from 'lucide-react-native';
import { STICKER_STUDIO, trackProduct } from '@bridger/shared';
import { PixelHeading, SurfaceHost, withAnalyticsPress } from '@bridger/ui';
import { addCustomSticker } from '../../data/stickers';

const CIRCLE = 250;

type Props = {
  open: boolean;
  onClose: () => void;
  /** called once the sticker is saved, so the strip can refresh */
  onSaved: () => void;
};

export function StickerStudio({ open, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [shot, setShot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canCapture = Platform.OS !== 'web' || Boolean(permission?.granted);

  const takeShot = async () => {
    // Ask for the camera at the moment they tap the shutter, not before.
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) setShot(photo.uri);
  };

  const save = async () => {
    if (!shot || saving) return;
    setSaving(true);
    try {
      await addCustomSticker(shot);
      // Product outcome: they made a sticker. No image, no caption — just that.
      trackProduct('sticker_created', { method: 'photo' });
      onSaved();
      setShot(null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <SurfaceHost surface="sticker_studio" parentScreen="sticker_tray" open={open}>
        <View
          accessibilityViewIsModal
          style={{
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 20)
          }}
          className="flex-1 items-center justify-center gap-6 bg-ink/95 px-6"
        >
          <Pressable
            onPress={withAnalyticsPress(STICKER_STUDIO.capture.dismiss, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ top: Math.max(insets.top, 16) }}
            className="absolute right-5 h-10 w-10 items-center justify-center rounded-full bg-white/15"
          >
            <XIcon size={20} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>

          <PixelHeading size="lg" className="text-white">
            {shot ? 'Use this sticker?' : 'Make a sticker'}
          </PixelHeading>

          {/* --- THE STICKER SHAPE: what you take, punched into a circle --- */}
          <View
            style={{
              width: CIRCLE,
              height: CIRCLE,
              borderRadius: CIRCLE / 2,
              overflow: 'hidden',
              borderWidth: 5,
              borderColor: '#FFFFFF',
              backgroundColor: '#000'
            }}
          >
            {shot ? (
              <Image
                source={{ uri: shot }}
                accessibilityLabel="Your new sticker"
                accessibilityIgnoresInvertColors
                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
              />
            ) : canCapture ? (
              <CameraView
                ref={cameraRef}
                facing={facing}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-center font-sans-sb text-[13px] leading-snug text-white/70">
                  Allow the camera and we'll turn your shot into a sticker.
                </Text>
              </View>
            )}
          </View>

          <Text className="max-w-[280px] text-center font-sans-sb text-[12px] leading-snug text-white/60">
            Line something up in the circle. Your stickers stay yours until you
            send one.
          </Text>

          {/* --- THE CONTROLS --- */}
          {shot ? (
            <View className="w-full flex-row items-center justify-center gap-3">
              <Pressable
                onPress={withAnalyticsPress(STICKER_STUDIO.capture.retake, () => setShot(null))}
                accessibilityRole="button"
                accessibilityLabel="Retake"
                className="h-12 flex-row items-center gap-2 rounded-full bg-white/15 px-5 active:opacity-90"
              >
                <RotateCcwIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
                <Text className="font-sans-b text-[14px] text-white">Retake</Text>
              </Pressable>
              <Pressable
                onPress={withAnalyticsPress(STICKER_STUDIO.capture.use_it, () => void save())}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save this sticker"
                className="h-12 flex-1 items-center justify-center rounded-full bg-white active:opacity-90"
              >
                <Text className="font-sans-b text-[15px] text-ink">
                  {saving ? 'Saving…' : 'Use it'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center gap-8">
              <Pressable
                onPress={withAnalyticsPress(STICKER_STUDIO.capture.switch_camera, () =>
                  setFacing((f) => (f === 'front' ? 'back' : 'front'))
                )}
                accessibilityRole="button"
                accessibilityLabel="Switch camera"
                className="h-12 w-12 items-center justify-center rounded-full bg-white/15 active:opacity-90"
              >
                <SwitchCameraIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>

              <Pressable
                onPress={withAnalyticsPress(STICKER_STUDIO.capture.shutter, () => void takeShot(), {
                  analyticsProps: { method: 'photo' }
                })}
                accessibilityRole="button"
                accessibilityLabel="Take the photo"
                className="h-[76px] w-[76px] items-center justify-center rounded-full border-[5px] border-white active:opacity-90"
              >
                <View className="h-14 w-14 rounded-full bg-white" />
              </Pressable>

              {/* keeps the shutter centred */}
              <View className="h-12 w-12" />
            </View>
          )}
        </View>
      </SurfaceHost>
    </Modal>
  );
}
