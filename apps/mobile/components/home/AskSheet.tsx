// ============================================
// WHAT THIS FILE DOES (plain English):
// Bottom sheet to create a poll (with options) or ask an open question.
// Visuals match Magic Patterns AskSheet; posting is stubbed until polls API.
// Analytics: own surface (ask_sheet) so open/dismiss dwell is separate from Home.
// PRIVACY: never log the prompt or option text in analytics.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { PlusIcon, XIcon } from 'lucide-react-native';
import { trackProduct } from '@bridger/shared';
import { ButtonPrimary, ButtonSecondary, Sheet, TextField, useThemeColors } from '@bridger/ui';

export function AskSheet({
  open,
  kind,
  onClose
}: {
  open: boolean;
  kind: 'poll' | 'question';
  onClose: () => void;
}) {
  const c = useThemeColors();
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    if (!open) {
      setPrompt('');
      setOptions(['', '']);
    }
  }, [open]);

  const ready =
    prompt.trim().length > 0 &&
    (kind === 'question' || options.filter((o) => o.trim()).length >= 2);

  function onPost() {
    // Product outcome when a poll posts (stub until API). No prompt text logged.
    if (kind === 'poll') trackProduct('poll_created');
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={kind === 'poll' ? 'Create a poll' : 'Ask a question'}
      // Analytics: sheet is its own surface; parent is Home.
      surface="ask_sheet"
      parentScreen="home"
      footer={
        <ButtonPrimary full size="md" disabled={!ready} onPress={onPost}>
          Post
        </ButtonPrimary>
      }
    >
      <View className="gap-3">
        <TextField
          label={kind === 'poll' ? 'Poll' : 'Question'}
          value={prompt}
          onChange={setPrompt}
          placeholder={kind === 'poll' ? 'Best taco spot?' : 'Anyone got a good dentist?'}
        />

        {kind === 'poll' ? (
          <View className="gap-2">
            {options.map((o, i) => (
              <View key={i} className="flex-row items-end gap-2">
                <View className="min-w-0 flex-1">
                  <TextField
                    label={`Option ${i + 1}`}
                    value={o}
                    onChange={(v) => setOptions((p) => p.map((x, j) => (j === i ? v : x)))}
                    placeholder={i === 0 ? 'El Rey' : 'La Playa'}
                  />
                </View>
                {options.length > 2 ? (
                  <Pressable
                    onPress={() => setOptions((p) => p.filter((_, j) => j !== i))}
                    accessibilityRole="button"
                    accessibilityLabel="Remove option"
                    className="mb-1 h-8 w-8 items-center justify-center rounded-full"
                  >
                    <XIcon size={16} color={c.inkMute} strokeWidth={2.6} />
                  </Pressable>
                ) : null}
              </View>
            ))}

            {options.length < 4 ? (
              <ButtonSecondary
                full
                size="sm"
                icon={<PlusIcon size={16} color={c.ink} strokeWidth={2.6} />}
                onPress={() => setOptions((p) => [...p, ''])}
              >
                Add option
              </ButtonSecondary>
            ) : null}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
