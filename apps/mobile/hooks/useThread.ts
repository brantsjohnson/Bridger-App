// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for one conversation. Loads the bubbles and remaining send
// quota, and exposes send / share-contact / heart. Cap enforcement lives
// in the data layer so the UI just asks.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import {
  getThread,
  sendMessage,
  shareContact,
  toggleHeart,
  type ThreadDetail
} from '../data/messages';
import { clearStoryReplyNotifications } from '../data/feed';

export function useThread(threadId: string) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getThread(threadId);
      setThread(next);
      // Opening the mirrored story-reply DM clears that alert (NOTIFICATIONS.md).
      if (next?.personId) {
        clearStoryReplyNotifications({ personId: next.personId });
      }
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSend = useCallback(
    async (text: string) => {
      const next = await sendMessage({ threadId, text });
      if (next) setThread(next);
      return next;
    },
    [threadId]
  );

  const onShareContact = useCallback(async () => {
    const next = await shareContact(threadId);
    if (next) setThread(next);
    return next;
  }, [threadId]);

  const onToggleHeart = useCallback(
    async (bubbleId: string, method: 'double_tap' | 'a11y' = 'double_tap') => {
      const next = await toggleHeart(threadId, bubbleId, method);
      if (next) setThread(next);
      return next;
    },
    [threadId]
  );

  return {
    thread,
    loading,
    refresh,
    onSend,
    onShareContact,
    onToggleHeart,
    myLeft: thread?.myLeft ?? 0,
    theirLeft: thread?.theirLeft ?? 0,
    atCap: (thread?.myLeft ?? 0) <= 0
  };
}
