// ============================================
// WHAT THIS FILE DOES (plain English):
// Cut a photo so only the subject (or a clean shape) stays. We ask the
// phone's own subject-lift tools first (Vision on iOS). If those are not
// there, we use a circle / heart / flower / scallop. No hand-drawn lasso.
// ============================================
import React, { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { COLLAGE_CUTOUT, type CollageClip } from '@bridger/shared';
import { ButtonPrimary, Sheet, cn, withAnalyticsPress } from '@bridger/ui';
import { canLiftSubject, liftSubject } from '../../lib/subject-cutout';

const SHAPES: Array<{ id: CollageClip; label: string }> = [
  { id: 'circle', label: 'Circle' },
  { id: 'heart', label: 'Heart' },
  { id: 'flower', label: 'Flower' },
  { id: 'scallop', label: 'Scallop' },
  { id: 'square', label: 'Square' }
];

export function CutoutTool({
  open,
  onClose,
  uri,
  onAdd
}: {
  open: boolean;
  onClose: () => void;
  uri: string | null;
  onAdd: (next: { uri: string; clip: CollageClip; maskUri?: string }) => void;
}) {
  const [clip, setClip] = useState<CollageClip>('circle');
  const [maskUri, setMaskUri] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const trySubject = async () => {
    if (!uri) return;
    if (!canLiftSubject()) {
      Alert.alert(
        'Use a shape',
        'Subject lift uses your phone\'s tools after a native rebuild. Until then, pick a shape. It stays clean, not a hand-cut path.'
      );
      return;
    }
    setBusy(true);
    const result = await liftSubject(uri);
    setBusy(false);
    if (!result.ok) {
      Alert.alert('Could not lift that', 'Pick a shape instead.');
      return;
    }
    setMaskUri(result.uri);
    setClip('blob');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Cut out"
      surface="collage_cutout"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_CUTOUT.chrome.dismiss}
      footer={
        <ButtonPrimary
          analyticsId={COLLAGE_CUTOUT.tools.add}
          disabled={!uri}
          onPress={() => {
            if (!uri) return;
            onAdd({ uri, clip, maskUri });
            setMaskUri(undefined);
            onClose();
          }}
        >
          Add
        </ButtonPrimary>
      }
    >
      {uri ? (
        <Image
          source={{ uri: maskUri ?? uri }}
          style={{ width: '100%', height: 220, borderRadius: 22, marginBottom: 12 }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Photo to cut out"
        />
      ) : (
        <Text className="py-6 text-center font-sans-md text-ink/55">
          Take or pick a photo first.
        </Text>
      )}
      <Pressable
        onPress={withAnalyticsPress(COLLAGE_CUTOUT.tools.subject, () => void trySubject())}
        disabled={busy || !uri}
        accessibilityRole="button"
        accessibilityLabel="Lift the subject with the phone"
        className="mb-3 min-h-[44px] items-center justify-center rounded-full bg-ink"
      >
        <Text className="font-sans-b text-white">
          {busy ? 'Lifting…' : 'Lift subject (on this phone)'}
        </Text>
      </Pressable>
      <Text className="mb-2 font-pixel text-[10px] uppercase tracking-widest text-ink/55">
        Or a shape
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {SHAPES.map((s) => (
          <Pressable
            key={s.id}
            onPress={withAnalyticsPress(COLLAGE_CUTOUT.tools.shape, () => {
              setClip(s.id);
              setMaskUri(undefined);
            }, { analyticsProps: { clip: s.id } })}
            accessibilityRole="button"
            accessibilityState={{ selected: clip === s.id }}
            accessibilityLabel={s.label}
            className={cn(
              'h-11 min-w-[44px] items-center justify-center rounded-xl px-3',
              clip === s.id ? 'bg-ink' : 'bg-eggshell'
            )}
          >
            <Text className={cn('font-sans-md', clip === s.id ? 'text-white' : 'text-ink')}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
