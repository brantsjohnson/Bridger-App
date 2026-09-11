// ============================================
// WHAT THIS FILE DOES (plain English):
// The five questions this Friend Pod week is answering, plus a box to suggest
// one for next week. Magic Patterns put these on the page instead of hiding
// them behind a sheet, so you can see what everyone is answering.
//
// PRIVACY: we never send question text to analytics.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowBigUpIcon } from 'lucide-react-native';
import { RECAP_PLAYER, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  PixelHeading,
  TextField,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { personById } from '../../data/people';
import { useFriendPod } from '../../hooks/useFriendPod';

export function ThisWeeksQuestions({
  weekOf,
  questions,
  canSuggest = true
}: {
  weekOf?: string;
  questions: string[];
  /** False on an older week: you only vote on next week's extras. */
  canSuggest?: boolean;
}) {
  const c = useThemeColors();
  const { questions: queue, onSubmitQuestion, onVoteQuestion } = useFriendPod();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [voted, setVoted] = useState<string[]>([]);

  const send = () => {
    if (!text.trim()) return;
    void onSubmitQuestion(text.trim());
    trackProduct('recap_question_submitted', {});
    setText('');
    setSent(true);
  };

  return (
    <View className="mt-7 gap-3">
      <AnalyticsRegion analyticsId={RECAP_PLAYER.questions.body} interactive={false}>
        <PixelHeading size="md">The questions</PixelHeading>
        <Text className="mt-1 font-sans-sb text-[13px] text-ink-mute">
          {weekOf ? `${weekOf} · ` : ''}
          {canSuggest
            ? 'everyone answers the same five, about 20 seconds each. Rose, thorn, and bud stay each week. Friends vote on the extras.'
            : 'everyone answered the same five that week.'}
        </Text>
      </AnalyticsRegion>

      <View className="gap-2">
        {questions.map((q, i) => (
          <AnalyticsRegion
            key={`${q}-${i}`}
            analyticsId={RECAP_PLAYER.questions.row}
            interactive={false}
          >
            <View className="flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-4 py-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-[#EDE6FF]">
                <Text className="font-pixel text-[12px] text-purple">{i + 1}</Text>
              </View>
              <Text className="min-w-0 flex-1 font-sans-sb text-[14px] text-ink">{q}</Text>
            </View>
          </AnalyticsRegion>
        ))}
      </View>

      {canSuggest ? (
        <View className="rounded-2xl border border-ink-line bg-surface p-4">
        <Text className="font-sans-b text-[14px] text-ink">Suggest one for next week</Text>
        <Text className="mt-0.5 font-sans-sb text-[12px] text-ink-mute">
          Friends vote. The top ones join next week's recap.
        </Text>

        {sent ? (
          <View className="mt-3 rounded-2xl bg-[#DFF3E4] px-3.5 py-2.5">
            <Text className="font-sans-b text-[13px] text-ink">
              Sent. Your friends can vote on it now.
            </Text>
          </View>
        ) : (
          <View className="mt-3 flex-row items-end gap-2">
            <View className="min-w-0 flex-1">
              <TextField
                label="Your question"
                value={text}
                onChange={setText}
                placeholder="What made you laugh this week?"
                analyticsId={RECAP_PLAYER.suggest.input}
              />
            </View>
            <Pressable
              onPress={withAnalyticsPress(RECAP_PLAYER.suggest.send, send)}
              disabled={!text.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send question"
              accessibilityState={{ disabled: !text.trim() }}
              className="h-11 shrink-0 items-center justify-center rounded-full bg-purple px-4"
              style={{ opacity: text.trim() ? 1 : 0.35 }}
            >
              <Text className="font-sans-b text-[13px] text-white">Send</Text>
            </Pressable>
          </View>
        )}

        {queue.length > 0 ? (
          <View className="mt-4 gap-2">
            <Text className="font-sans-b text-[12px]" style={{ color: c.inkSoft }}>
              In the queue
            </Text>
            {queue.map((q) => {
              const author = personById(q.authorId);
              const up = voted.includes(q.id);
              return (
                <View
                  key={q.id}
                  className="flex-row items-center gap-3 rounded-2xl bg-canvas px-3.5 py-3"
                >
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={2} className="font-sans-b text-[13px] text-ink">
                      {q.text}
                    </Text>
                    <Text className="font-sans-sb text-[12px] text-ink-mute">
                      {author.name.split(' ')[0]}
                    </Text>
                  </View>
                  <Pressable
                    onPress={withAnalyticsPress(RECAP_PLAYER.suggest.vote, () => {
                      const already = voted.includes(q.id);
                      setVoted((p) =>
                        already ? p.filter((x) => x !== q.id) : [...p, q.id]
                      );
                      if (!already) {
                        void onVoteQuestion(q.id);
                        trackProduct('recap_question_voted', {});
                      }
                    })}
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
        ) : null}
        </View>
      ) : null}
    </View>
  );
}
