// ============================================
// WHAT THIS FILE DOES (plain English):
// Sheet where anyone can suggest a question for the group's next Friend Pod
// week, and upvote other suggestions. Demo keeps votes local for the session.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowBigUpIcon } from 'lucide-react-native';
import { FRIENDS, trackProduct } from '@bridger/shared';
import { ButtonPrimary, Sheet, TextField, cn } from '@bridger/ui';
import { personById } from '../../data/people';
import { useFriendPod } from '../../hooks/useFriendPod';

export function SubmitQuestion({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { questions, onSubmitQuestion, onVoteQuestion } = useFriendPod();
  const [text, setText] = useState('');
  const [voted, setVoted] = useState<string[]>([]);

  useEffect(() => {
    if (!open) setText('');
  }, [open]);

  const submit = () => {
    if (!text.trim()) return;
    void onSubmitQuestion(text.trim());
    // Product outcome: a question was suggested for a future week.
    trackProduct('recap_question_submitted', {});
    setText('');
    onClose();
  };

  const vote = (id: string) => {
    const already = voted.includes(id);
    setVoted((p) => (already ? p.filter((x) => x !== id) : [...p, id]));
    if (!already) {
      void onVoteQuestion(id);
      trackProduct('recap_question_voted', {});
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Submit a question"
      footer={
        <ButtonPrimary full size="md" disabled={!text.trim()} onPress={submit}>
          Submit
        </ButtonPrimary>
      }
    >
      <View className="gap-4">
        <TextField
          label="Question"
          value={text}
          onChange={setText}
          placeholder="What made you laugh this week?"
        />

        <View>
          <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">Up next</Text>
          <View className="gap-2">
            {questions.map((q) => {
              const author = personById(q.authorId);
              const up = voted.includes(q.id);
              return (
                <View
                  key={q.id}
                  className="flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-3.5 py-3"
                >
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={2} className="font-sans-b text-[14px] text-ink">
                      {q.text}
                    </Text>
                    <Text className="font-sans-sb text-[12px] text-ink-mute">
                      {author.name.split(' ')[0]}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => vote(q.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: up }}
                    accessibilityLabel={up ? 'Remove upvote' : 'Upvote question'}
                    className={cn(
                      'min-h-[36px] shrink-0 flex-row items-center gap-1 rounded-full px-2.5 py-1.5',
                      up ? 'bg-success' : 'bg-[#EDE6FF]'
                    )}
                  >
                    <ArrowBigUpIcon
                      size={16}
                      color={up ? '#FFFFFF' : '#6B2FEA'}
                      strokeWidth={2.4}
                    />
                    <Text className={cn('font-sans-b text-[12px]', up ? 'text-white' : 'text-purple')}>
                      {q.votes + (up ? 1 : 0)}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Sheet>
  );
}
