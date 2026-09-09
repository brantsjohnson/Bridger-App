// ============================================
// WHAT THIS FILE DOES (plain English):
// The brain behind the Scrapbook compose screen. It holds the page you are
// working on (photos, caption, layout, who can see it), saves it on the phone
// so a back-swipe never loses it, knows today's other pages and how many
// photos you have left, and does the posting. Screens call this hook instead
// of touching storage or the API.
//
// A "draft" is either a brand-new page (no postId yet) or a page you already
// posted today that you are adding to (postId set). Both post through the same
// `post()`.
//
// PRIVACY: the draft lives only on this phone (AsyncStorage) and is cleared
// after posting. Nothing here talks to AI.
// ============================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DAILY_SCRAPBOOK_MEDIA_LIMIT,
  applyLayout,
  countMediaElements,
  emptyPage,
  findLayout,
  layoutForFamily,
  layoutsFor,
  newElementId,
  pageHasVideo,
  relayoutForCount,
  type LayoutTemplate,
  type PendingMedia,
  type ScrapbookElement,
  type ScrapbookPage,
  type StoryPost
} from '@bridger/shared';
import {
  createPost,
  deletePost,
  getPostQuota,
  listTodayPosts,
  tierToAudience,
  updatePostPage,
  type PostAudience
} from '../data/stories';

/** Where the draft sleeps between opens. One key per calendar day. */
const DRAFT_KEY_PREFIX = 'bridger.scrapbook.draft.v1.';
/** How many page states Undo remembers. */
const UNDO_DEPTH = 20;

type StoredDraft = {
  date: string;
  page: ScrapbookPage;
  audience: PostAudience;
  postId?: string;
  themeSlug?: string;
  eventId?: string;
};

function todayKey(): string {
  return `${DRAFT_KEY_PREFIX}${new Date().toISOString().slice(0, 10)}`;
}

/** Who can see a page: remember the last choice so the default follows them. */
const LAST_AUDIENCE_KEY = 'bridger.scrapbook.lastAudience.v1';

export type MoveTarget = { postId: string } | 'new';

export function useScrapbookDraft() {
  // THIS SECTION DOES: the page itself + who sees it + which posted page (if any).
  const [page, setPage] = useState<ScrapbookPage>(() => emptyPage());
  const [audience, setAudienceState] = useState<PostAudience>('friend');
  const [postId, setPostId] = useState<string | undefined>(undefined);
  const [themeSlug, setThemeSlug] = useState<string | undefined>(undefined);
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);
  const undoStack = useRef<ScrapbookPage[]>([]);
  const [undoDepth, setUndoDepth] = useState(0);

  // THIS SECTION DOES: today's other pages + how many photos are already used.
  const [todayPosts, setTodayPosts] = useState<StoryPost[]>([]);
  const [quota, setQuota] = useState<{ left: number; cap: number }>({
    left: DAILY_SCRAPBOOK_MEDIA_LIMIT,
    cap: DAILY_SCRAPBOOK_MEDIA_LIMIT
  });

  const refreshToday = useCallback(async () => {
    try {
      const [posts, q] = await Promise.all([listTodayPosts(), getPostQuota()]);
      setTodayPosts(posts);
      setQuota(q);
    } catch {
      // Keep whatever we had; the compose screen must never die on a fetch.
    }
  }, []);

  // THIS SECTION DOES: wake up the saved draft (same day only) and today's pages.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [raw, lastAud] = await Promise.all([
          AsyncStorage.getItem(todayKey()),
          AsyncStorage.getItem(LAST_AUDIENCE_KEY)
        ]);
        if (!alive) return;
        if (lastAud === 'only_me' || lastAud === 'close' || lastAud === 'friend' || lastAud === 'everyone') {
          setAudienceState(lastAud);
        }
        if (raw) {
          const stored = JSON.parse(raw) as StoredDraft;
          if (stored.page && countMediaElements(stored.page) > 0) {
            setPage(stored.page);
            setAudienceState(stored.audience ?? 'friend');
            setPostId(stored.postId);
            setThemeSlug(stored.themeSlug);
            setEventId(stored.eventId);
          }
        }
      } catch {
        // A corrupt draft is not worth a crash; start fresh.
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    void refreshToday();
    return () => {
      alive = false;
    };
  }, [refreshToday]);

  // THIS SECTION DOES: save the draft whenever it changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    const hasMedia = countMediaElements(page) > 0;
    const key = todayKey();
    if (!hasMedia) {
      void AsyncStorage.removeItem(key);
      return;
    }
    const stored: StoredDraft = {
      date: new Date().toISOString().slice(0, 10),
      page,
      audience,
      postId,
      themeSlug,
      eventId
    };
    void AsyncStorage.setItem(key, JSON.stringify(stored));
  }, [page, audience, postId, themeSlug, eventId, hydrated]);

  // THIS SECTION DOES: change the page and remember the old one for Undo.
  const commit = useCallback((next: ScrapbookPage | ((prev: ScrapbookPage) => ScrapbookPage)) => {
    setPage((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      if (resolved === prev) return prev;
      undoStack.current = [...undoStack.current.slice(-(UNDO_DEPTH - 1)), prev];
      setUndoDepth(undoStack.current.length);
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    setUndoDepth(undoStack.current.length);
    if (prev) setPage(prev);
  }, []);

  // --- Derived numbers ---
  const mediaCount = countMediaElements(page);
  /** Photos used by OTHER pages today (this draft's own count is excluded). */
  const usedElsewhere = useMemo(() => {
    const usedTotal = quota.cap - quota.left;
    if (!postId) return usedTotal;
    const mine = todayPosts.find((p) => p.id === postId);
    const mineCount = mine?.page ? countMediaElements(mine.page) : mine ? 1 : 0;
    return Math.max(0, usedTotal - mineCount);
  }, [quota, todayPosts, postId]);
  const usedToday = usedElsewhere + mediaCount;
  const left = Math.max(0, quota.cap - usedToday);
  const atCap = left <= 0;
  const layouts = useMemo(() => layoutsFor(Math.max(1, mediaCount)), [mediaCount]);
  const layout = findLayout(page.layoutId);
  const captionEl = page.elements.find((e) => e.type === 'text' && e.data.role === 'caption');
  const caption = typeof captionEl?.data.text === 'string' ? captionEl.data.text : '';

  // --- Edits ---

  /** Add photos/videos (from the camera or the roll). Stays in the same family. */
  const addMedia = useCallback(
    (items: PendingMedia[]) => {
      if (!items.length) return;
      commit((prev) => {
        const room = Math.max(0, DAILY_SCRAPBOOK_MEDIA_LIMIT - countMediaElements(prev));
        const take = items.slice(0, room);
        if (!take.length) return prev;
        const nextCount = countMediaElements(prev) + take.length;
        return relayoutForCount(prev, nextCount, take);
      });
    },
    [commit]
  );

  const removeMedia = useCallback(
    (elementId: string) => {
      commit((prev) => {
        const without = { ...prev, elements: prev.elements.filter((e) => e.id !== elementId) };
        const count = countMediaElements(without);
        if (count === 0) return without;
        return relayoutForCount(without, count);
      });
    },
    [commit]
  );

  const replaceMedia = useCallback(
    (elementId: string, item: PendingMedia) => {
      commit((prev) => ({
        ...prev,
        elements: prev.elements.map((e) =>
          e.id === elementId
            ? {
                ...e,
                type: item.kind,
                uri: item.uri,
                mediaId: item.mediaId,
                source: item.source,
                data: { ...e.data, durationMs: item.durationMs, crop: undefined }
              }
            : e
        )
      }));
    },
    [commit]
  );

  const setLayout = useCallback(
    (template: LayoutTemplate) => {
      commit((prev) => applyLayout(prev, template));
    },
    [commit]
  );

  const setCaption = useCallback(
    (text: string) => {
      commit((prev) => {
        const has = prev.elements.some((e) => e.type === 'text' && e.data.role === 'caption');
        if (!has) {
          // A caption slot should always exist after applyLayout; be safe anyway.
          const t = layoutForFamily(Math.max(1, countMediaElements(prev)), prev.layoutFamily);
          return applyLayout({ ...prev, elements: [...prev.elements] }, t);
        }
        return {
          ...prev,
          elements: prev.elements.map((e) =>
            e.type === 'text' && e.data.role === 'caption' ? { ...e, data: { ...e.data, text } } : e
          )
        };
      });
    },
    [commit]
  );

  const setBackground = useCallback(
    (color: string) => {
      commit((prev) => ({ ...prev, background: { kind: 'solid', color } }));
    },
    [commit]
  );

  const setAudience = useCallback((next: PostAudience) => {
    setAudienceState(next);
    void AsyncStorage.setItem(LAST_AUDIENCE_KEY, next);
  }, []);

  /** Start over with an empty page (after posting, or Discard). */
  const reset = useCallback(() => {
    undoStack.current = [];
    setUndoDepth(0);
    setPage(emptyPage());
    setPostId(undefined);
    setThemeSlug(undefined);
    setEventId(undefined);
    void AsyncStorage.removeItem(todayKey());
  }, []);

  /** Open a page you already posted today so you can add to it. */
  const loadFromPost = useCallback((post: StoryPost) => {
    undoStack.current = [];
    setUndoDepth(0);
    const base: ScrapbookPage = post.page
      ? { ...post.page }
      : {
          ...emptyPage(),
          elements: []
        };
    // A legacy one-photo post opens as a proper 1-photo page.
    const hydratedPage =
      countMediaElements(base) > 0
        ? base
        : applyLayout(base, layoutForFamily(1, 'simple'), [
            {
              kind: post.type,
              uri: typeof post.media === 'object' && post.media && 'uri' in post.media ? post.media.uri : undefined,
              source: 'bridger_camera'
            }
          ]);
    // Caption lives on the post; mirror it into the caption slot.
    const withCaption = post.caption
      ? {
          ...hydratedPage,
          elements: hydratedPage.elements.map((e) =>
            e.type === 'text' && e.data.role === 'caption'
              ? { ...e, data: { ...e.data, text: post.caption } }
              : e
          )
        }
      : hydratedPage;
    setPage(withCaption);
    setPostId(post.id);
    setAudienceState(tierToAudience(post.visibleToTier));
    setThemeSlug(post.themeSlug);
    setEventId(post.eventId);
  }, []);

  // --- Posting ---

  /**
   * Post (new page) or save (page you posted earlier today). `previewUri` is
   * the flattened page image the caller rendered; it becomes what the feed
   * shows. Returns the saved post. Clears the draft on success.
   */
  const post = useCallback(
    async (opts: { previewUri?: string }): Promise<{ post: StoryPost; wasUpdate: boolean }> => {
      const type: 'photo' | 'video' = pageHasVideo(page) ? 'video' : 'photo';
      let saved: StoryPost;
      if (postId) {
        saved = await updatePostPage({
          postId,
          page,
          caption: caption.trim(),
          audience,
          previewUri: opts.previewUri
        });
      } else {
        saved = await createPost({
          type,
          caption: caption.trim() || undefined,
          audience,
          themeSlug,
          eventId,
          uri: opts.previewUri ?? page.elements.find((e) => e.type === 'photo')?.uri,
          page
        });
      }
      const wasUpdate = !!postId;
      reset();
      await refreshToday();
      return { post: saved, wasUpdate };
    },
    [page, postId, caption, audience, themeSlug, eventId, reset, refreshToday]
  );

  /**
   * Move one photo from this page onto another page today ("consolidate"), or
   * onto a brand-new page ("split"). The other page is saved right away; this
   * page is saved too when it was already posted, or deleted when it empties.
   */
  const moveMediaTo = useCallback(
    async (elementId: string, target: MoveTarget): Promise<void> => {
      const el = page.elements.find((e) => e.id === elementId);
      if (!el || (el.type !== 'photo' && el.type !== 'video')) return;
      const moving: PendingMedia = {
        id: newElementId(),
        kind: el.type,
        uri: el.uri,
        mediaId: el.mediaId,
        source: el.source ?? 'bridger_camera',
        durationMs: typeof el.data.durationMs === 'number' ? el.data.durationMs : undefined
      };

      // 1) Put it on the target page.
      if (target === 'new') {
        const fresh = applyLayout(emptyPage(), layoutForFamily(1, page.layoutFamily ?? 'caption'), [moving]);
        await createPost({
          type: moving.kind,
          audience,
          // Preview = the photo itself (a video has no still yet; the tile shows the emoji).
          uri: moving.kind === 'photo' ? moving.uri : undefined,
          page: fresh
        });
      } else {
        const targetPost = todayPosts.find((p) => p.id === target.postId);
        if (!targetPost) throw new Error('That page is gone');
        const targetPage = targetPost.page ?? emptyPage();
        const nextCount = countMediaElements(targetPage) + 1;
        if (nextCount > DAILY_SCRAPBOOK_MEDIA_LIMIT) throw new Error('That page is full');
        const merged = relayoutForCount(targetPage, nextCount, [moving]);
        await updatePostPage({
          postId: targetPost.id,
          page: merged,
          previewUri: undefined
        });
      }

      // 2) Take it off this page.
      const without = { ...page, elements: page.elements.filter((e) => e.id !== elementId) };
      const remaining = countMediaElements(without);
      if (remaining === 0) {
        if (postId) await deletePost(postId);
        reset();
      } else {
        const relaid = relayoutForCount(without, remaining);
        if (postId) {
          await updatePostPage({ postId, page: relaid, caption: caption.trim(), audience });
        }
        commit(relaid);
      }
      await refreshToday();
    },
    [page, postId, audience, caption, todayPosts, commit, reset, refreshToday]
  );

  /**
   * Put EVERY photo on this (new, unposted) page onto another page from today,
   * then clear this draft. One save, so the target page re-lays out once.
   */
  const mergeInto = useCallback(
    async (targetPostId: string): Promise<void> => {
      const targetPost = todayPosts.find((p) => p.id === targetPostId);
      if (!targetPost) throw new Error('That page is gone');
      const moving: PendingMedia[] = page.elements
        .filter((e) => e.type === 'photo' || e.type === 'video')
        .map((el) => ({
          id: newElementId(),
          kind: el.type as 'photo' | 'video',
          uri: el.uri,
          mediaId: el.mediaId,
          source: el.source ?? 'bridger_camera',
          durationMs: typeof el.data.durationMs === 'number' ? el.data.durationMs : undefined
        }));
      if (!moving.length) return;
      const targetPage = targetPost.page ?? emptyPage();
      const nextCount = countMediaElements(targetPage) + moving.length;
      if (nextCount > DAILY_SCRAPBOOK_MEDIA_LIMIT) throw new Error('That page is full');
      const merged = relayoutForCount(targetPage, nextCount, moving);
      await updatePostPage({ postId: targetPost.id, page: merged });
      if (postId) await deletePost(postId);
      reset();
      await refreshToday();
    },
    [page, postId, todayPosts, reset, refreshToday]
  );

  return {
    hydrated,
    page,
    postId,
    isEditingPosted: !!postId,
    layout,
    layouts,
    caption,
    audience,
    themeSlug,
    eventId,
    mediaCount,
    usedToday,
    left,
    cap: quota.cap,
    atCap,
    todayPosts,
    canUndo: undoDepth > 0,
    hasVideo: pageHasVideo(page),
    // edits
    addMedia,
    removeMedia,
    replaceMedia,
    setLayout,
    setCaption,
    setBackground,
    setAudience,
    setThemeSlug,
    setEventId,
    undo,
    reset,
    loadFromPost,
    moveMediaTo,
    mergeInto,
    post,
    refreshToday,
    /** Elements you can tap on the page that are photos/videos. */
    mediaElements: page.elements.filter(
      (e): e is ScrapbookElement => e.type === 'photo' || e.type === 'video'
    )
  };
}
