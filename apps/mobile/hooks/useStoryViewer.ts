// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for the story ("Updates") player. Loads one author's posts, the
// Catch-Up sheet, and replies for the current post. Screens call this instead
// of touching fixtures or the API directly.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { CatchUpItem, Reaction, StoryPost } from '@bridger/shared';
import { personById } from '../data/people';
import {
  addReply,
  answerCatchUpItem,
  getCatchUp,
  listPosts,
  listReplies,
  type AddReplyInput,
  type CatchUpBundle
} from '../data/stories';

export function useStoryViewer(authorId: string) {
  const [posts, setPosts] = useState<StoryPost[]>([]);
  const [index, setIndex] = useState(0);
  const [catchUp, setCatchUp] = useState<CatchUpBundle | null>(null);
  const [replies, setReplies] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);

  const resolvedId = authorId === 'mine' ? 'me' : authorId;
  const author = personById(resolvedId);
  const post = posts[index] ?? null;

  const refreshCatchUp = useCallback(async () => {
    const bundle = await getCatchUp(resolvedId);
    setCatchUp(bundle);
  }, [resolvedId]);

  const refreshReplies = useCallback(async (postId: string) => {
    const list = await listReplies(postId);
    setReplies(list);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listPosts(resolvedId);
      setPosts(list);
      setIndex(0);
      await refreshCatchUp();
      if (list[0]) await refreshReplies(list[0].id);
    } finally {
      setLoading(false);
    }
  }, [resolvedId, refreshCatchUp, refreshReplies]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (post) void refreshReplies(post.id);
  }, [post?.id, refreshReplies]);

  const goNext = useCallback(() => {
    setIndex((i) => (posts.length ? (i + 1) % posts.length : 0));
  }, [posts.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (posts.length ? (i - 1 + posts.length) % posts.length : 0));
  }, [posts.length]);

  const onAnswerCatchUp = useCallback(
    async (itemId: string, choice: string) => {
      await answerCatchUpItem(itemId, choice);
      await refreshCatchUp();
    },
    [refreshCatchUp]
  );

  const onAddReply = useCallback(
    async (input: Omit<AddReplyInput, 'postId'> & { postId?: string }) => {
      if (!post && !input.postId) return null;
      const created = await addReply({
        ...input,
        postId: input.postId ?? post!.id
      });
      await refreshReplies(created.postId);
      return created;
    },
    [post, refreshReplies]
  );

  return {
    author,
    posts,
    post,
    index,
    setIndex,
    goNext,
    goPrev,
    catchUp,
    replies,
    loading,
    refresh,
    onAnswerCatchUp,
    onAddReply,
    /** Convenience: live + answered items for rendering */
    liveItems: (catchUp?.live ?? []) as CatchUpItem[],
    answeredItems: (catchUp?.answered ?? []) as CatchUpItem[]
  };
}
