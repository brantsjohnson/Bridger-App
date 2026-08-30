// ============================================
// WHAT THIS FILE DOES (plain English):
// Bottom sheet to create a poll (with options) or ask an open question.
// Visuals match Magic Patterns AskSheet; poll posts now use the signed-in API.
// Analytics: own surface (ask_sheet) so open/dismiss dwell is separate from Home.
// PRIVACY: never log the prompt or option text in analytics.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PlusIcon, XIcon } from 'lucide-react-native';
import { ASK_SHEET, trackClick, trackProduct } from '@bridger/shared';
import { ButtonPrimary, ButtonSecondary, Sheet, TextField, useThemeColors } from '@bridger/ui';
import { getMembership } from '../../data/coop';
import { createPoll } from '../../data/polls';

export function AskSheet({
  open,
  kind,
  onClose
}: {
  open: boolean;
  kind: 'poll' | 'question';
  onClose: () => void;
}) {
  const router = useRouter();
  const c = useThemeColors();
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPrompt('');
      setOptions(['', '']);
    }
  }, [open]);

  const ready =
    prompt.trim().length > 0 &&
    (kind === 'question' || options.filter((o) => o.trim()).length >= 2);

  async function onPost() {
    if (!ready || posting) return;

    // Co-op creation gate is checked here for a friendly route and again by the API.
    if (kind === 'poll') {
      setPosting(true);
      try {
        const membership = await getMembership();
        if (!membership.member) {
          onClose();
          router.push('/coop');
          return;
        }
        await createPoll({
          question: prompt.trim(),
          options: options.map((option) => option.trim()).filter(Boolean),
          audience: 'friend'
        });
        // Product outcome only after the server confirms creation. No content logged.
        trackProduct('poll_created', { count: options.filter((option) => option.trim()).length });
        onClose();
      } catch {
        Alert.alert('Could not post poll', 'Please try again in a moment.');
      } finally {
        setPosting(false);
      }
      return;
    }

    // Open questions keep their existing MVP behavior until a question route ships.
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
        <ButtonPrimary
          full
          size="md"
          disabled={!ready}
          loading={posting}
          onPress={() => void onPost()}
          analyticsId={ASK_SHEET.actions.post}
        >
          Post
        </ButtonPrimary>
      }
    >
      <ScrollView
        className="max-h-[70vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View className="gap-3">
        <TextField
          label={kind === 'poll' ? 'Poll' : 'Question'}
          value={prompt}
          onChange={setPrompt}
          placeholder={kind === 'poll' ? 'Best taco spot?' : 'Anyone got a good dentist?'}
          analyticsId={ASK_SHEET.fields.prompt}
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
                    analyticsId={ASK_SHEET.fields.option}
                  />
                </View>
                {options.length > 2 ? (
                  <Pressable
                    onPress={() => {
                      trackClick(ASK_SHEET.actions.remove_option);
                      setOptions((p) => p.filter((_, j) => j !== i));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Remove option"
                    className="mb-1 h-11 w-11 items-center justify-center rounded-full"
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
                analyticsId={ASK_SHEET.actions.add_option}
              >
                Add option
              </ButtonSecondary>
            ) : null}
          </View>
        ) : null}
      </View>
      </ScrollView>
    </Sheet>
  );
}
