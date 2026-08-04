// ============================================
// WHAT THIS FILE DOES (plain English):
// The replies sheet on a story — full thread with nested replies, plus a
// composer row (record / sticker / text). Posting a reply fires the
// response_posted product event (method = video | comment | sticker).
// ============================================
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDownIcon,
  SmileIcon,
  VideoIcon,
  XIcon
} from 'lucide-react-native';
import {
  CATCH_UP,
  STORY,
  trackClick,
  trackProduct,
  type Reaction
} from '@bridger/shared';
import { PixelHeading, useThemeColors } from '@bridger/ui';
import { personById } from '../../data/people';
import { ReplyRow } from './ReplyRow';

type Props = {
  open: boolean;
  onClose: () => void;
  replies: Reaction[];
  onAddReply: (input: {
    kind: Reaction['kind'];
    text?: string;
    stickerId?: string;
    parentReactionId?: string;
  }) => Promise<unknown>;
  /** hand off to the emoji strip on the story behind this sheet */
  onOpenStickers?: () => void;
  /** hand off to the 10-second round recorder */
  onRecordVideo?: () => void;
};

export function CommentSheet({
  open,
  onClose,
  replies,
  onAddReply,
  onOpenStickers,
  onRecordVideo
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ name: string; id?: string } | null>(
    null
  );
  const [sending, setSending] = useState(false);

  const roots = replies.filter((r) => !r.parentReactionId);

  const submitText = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      trackClick(CATCH_UP.bottom.reply, { method: 'comment' });
      await onAddReply({
        kind: 'text',
        text,
        parentReactionId: replyTo?.id
      });
      trackProduct('response_posted', { method: 'comment' });
      setDraft('');
      setReplyTo(null);
    } finally {
      setSending(false);
    }
  };

  // Stickers and video replies are made with the same tools as on the story
  // itself, so the sheet steps out of the way and hands off to them.
  const openStickers = () => {
    trackClick(STORY.reaction_rail.sticker, { method: 'sticker' });
    onClose();
    onOpenStickers?.();
  };

  const openRecorder = () => {
    trackClick(STORY.reaction_rail.record, { method: 'video' });
    onClose();
    onRecordVideo?.();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close comments"
          onPress={onClose}
          className="absolute inset-0 bg-ink/40"
        />
        <View
          accessibilityViewIsModal
          style={{ paddingBottom: Math.max(insets.bottom, 12), maxHeight: '80%' }}
          className="rounded-t-3xl bg-white"
        >
            <View className="flex-row items-center justify-between px-5 pb-3 pt-4">
              <PixelHeading size="md">Replies</PixelHeading>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-full bg-ink/5"
              >
                <ChevronDownIcon size={20} color={c.inkSoft} strokeWidth={2.6} />
              </Pressable>
            </View>

            <ScrollView className="max-h-[46vh] px-5 pb-4" keyboardShouldPersistTaps="handled">
              <View className="gap-4">
                {roots.map((r) => {
                  const person = personById(r.authorId);
                  const children = replies.filter((c) => c.parentReactionId === r.id);
                  return (
                    <View key={r.id}>
                      <ReplyRow
                        reaction={r}
                        name={person.name}
                        emoji={person.emoji}
                        accent={person.accent}
                        onReply={(name) => setReplyTo({ name, id: r.id })}
                      />
                      {children.length > 0 ? (
                        <View className="mt-3 gap-3 border-l border-ink-line pl-4">
                          {children.map((child) => {
                            const cp = personById(child.authorId);
                            return (
                              <ReplyRow
                                key={child.id}
                                reaction={child}
                                name={cp.name}
                                emoji={cp.emoji}
                                accent={cp.accent}
                                onReply={(name) => setReplyTo({ name, id: child.id })}
                              />
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                {roots.length === 0 ? (
                  <Text className="py-6 text-center font-sans-sb text-[13px] text-ink-mute">
                    No replies yet. Be the first.
                  </Text>
                ) : null}
              </View>
            </ScrollView>

            {replyTo ? (
              <View className="flex-row items-center gap-2 border-t border-ink-line bg-surface px-5 py-2">
                <Text
                  numberOfLines={1}
                  className="min-w-0 flex-1 font-sans-b text-[12px] text-ink-soft"
                >
                  Replying to {replyTo.name}
                </Text>
                <Pressable
                  onPress={() => setReplyTo(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel reply"
                  className="h-8 w-8 items-center justify-center rounded-full"
                >
                  <XIcon size={14} color={c.inkMute} strokeWidth={2.8} />
                </Pressable>
              </View>
            ) : null}

            <View className="flex-row items-center gap-2 border-t border-ink-line px-5 py-3">
              <Pressable
                onPress={openRecorder}
                accessibilityRole="button"
                accessibilityLabel="Record a 10 second video reply"
                className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink"
              >
                <VideoIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>
              <Pressable
                onPress={openStickers}
                accessibilityRole="button"
                accessibilityLabel="Stickers"
                className="h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-line"
              >
                <SmileIcon size={20} color={c.ink} strokeWidth={2.4} />
              </Pressable>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => void submitText()}
                returnKeyType="send"
                placeholder={replyTo ? `Reply to ${replyTo.name}` : 'Reply'}
                accessibilityLabel="Reply"
                placeholderTextColor={c.inkMute}
                className="h-10 min-w-0 flex-1 rounded-full border border-ink-line px-4 font-sans-sb text-[14px] text-ink"
              />
            </View>
          </View>
        </View>
    </Modal>
  );
}
