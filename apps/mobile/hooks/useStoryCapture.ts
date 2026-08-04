// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the capture + compose flow. Loads how many posts you have
// left today and the themed-prompt squares, and posts a new update. Screens
// never import fixtures directly.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { ThemedPrompt } from '@bridger/shared';
import {
  createPost,
  getPostQuota,
  listThemedPrompts,
  type CreatePostInput
} from '../data/stories';

export function useStoryCapture() {
  const [left, setLeft] = useState(0);
  const [cap, setCap] = useState(3);
  const [prompts, setPrompts] = useState<ThemedPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [quota, themed] = await Promise.all([getPostQuota(), listThemedPrompts()]);
      setLeft(quota.left);
      setCap(quota.cap);
      setPrompts(themed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = useCallback(
    async (input: CreatePostInput) => {
      const post = await createPost(input);
      await refresh();
      return post;
    },
    [refresh]
  );

  return {
    left,
    cap,
    prompts,
    loading,
    refresh,
    onCreate,
    /** true when you cannot post another update today */
    atCap: left <= 0
  };
}
