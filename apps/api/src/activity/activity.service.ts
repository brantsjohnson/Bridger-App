// ============================================
// WHAT THIS FILE DOES (plain English):
// Weekly activity helpers for the app: fetch the active challenge + posts,
// let someone contribute a post, and heart / un-heart a post.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import type { ActivityPost, Cover, WeeklyActivity } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

/** Read a jsonb cover column safely. */
function asCover(value: unknown): Cover | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const kind = (value as { kind?: string }).kind;
  if (
    kind === 'photo' ||
    kind === 'emoji' ||
    kind === 'text' ||
    kind === 'color' ||
    kind === 'sticker'
  ) {
    return value as Cover;
  }
  return undefined;
}

@Injectable()
export class ActivityService {
  constructor(private readonly supabase: SupabaseService) {}

  // --- Active weekly challenge + its collage posts ---

  async getCurrent(): Promise<{
    activity: WeeklyActivity | null;
    posts: ActivityPost[];
  }> {
    const { data: activity, error } = await this.supabase.admin
      .from('weekly_activities')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    if (!activity) {
      return { activity: null, posts: [] };
    }

    const { data: posts, error: pErr } = await this.supabase.admin
      .from('activity_posts')
      .select('*')
      .eq('activity_id', activity.id)
      .order('created_at', { ascending: false });
    if (pErr) throw pErr;

    const postIds = (posts ?? []).map((p) => p.id);
    const heartsByPost = new Map<string, number>();

    if (postIds.length) {
      const { data: hearts, error: hErr } = await this.supabase.admin
        .from('activity_hearts')
        .select('post_id')
        .in('post_id', postIds);
      if (hErr) throw hErr;
      for (const h of hearts ?? []) {
        heartsByPost.set(h.post_id, (heartsByPost.get(h.post_id) ?? 0) + 1);
      }
    }

    const mappedActivity: WeeklyActivity = {
      id: activity.id,
      title: activity.title,
      prompt: activity.prompt ?? '',
      active: activity.active,
      startsAt: activity.starts_at ?? undefined,
      endsAt: activity.ends_at ?? undefined,
      closesIn: activity.closes_in ?? undefined,
      emoji: activity.emoji ?? undefined,
      cover: asCover(activity.cover)
    };

    const mappedPosts: ActivityPost[] = (posts ?? []).map((p) => ({
      id: p.id,
      activityId: p.activity_id,
      authorId: p.author_id,
      mediaId: p.media_id ?? undefined,
      heartsCount: heartsByPost.get(p.id) ?? 0,
      createdAt: p.created_at
    }));

    return { activity: mappedActivity, posts: mappedPosts };
  }

  // --- Post to the weekly activity ---

  async createPost(
    userId: string,
    activityId: string,
    body: { mediaId?: string; emoji?: string; caption?: string }
  ): Promise<ActivityPost> {
    const { data: activity, error: aErr } = await this.supabase.admin
      .from('weekly_activities')
      .select('id, active')
      .eq('id', activityId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!activity) throw new NotFoundException('Activity not found');
    if (!activity.active) {
      throw new BadRequestException('This activity is not active');
    }

    // TODO: activity_posts needs caption / emoji / visible_to_tier columns
    // (HOME.md audience + collage captions). Until then we only persist
    // author + optional media; clients keep caption/emoji in demo session memory.
    const { data: post, error } = await this.supabase.admin
      .from('activity_posts')
      .insert({
        activity_id: activityId,
        author_id: userId,
        media_id: body.mediaId ?? null
      })
      .select('*')
      .single();
    if (error) throw error;

    return {
      id: post.id,
      activityId: post.activity_id,
      authorId: post.author_id,
      mediaId: post.media_id ?? undefined,
      heartsCount: 0,
      createdAt: post.created_at,
      // Echo back for display; not stored until columns exist.
      emoji: body.emoji,
      caption: body.caption
    };
  }

  // --- Heart / un-heart ---

  async addHeart(userId: string, activityId: string, postId: string) {
    await this.assertPostOnActivity(activityId, postId);

    const { error } = await this.supabase.admin.from('activity_hearts').upsert(
      { post_id: postId, user_id: userId },
      { onConflict: 'post_id,user_id' }
    );
    if (error) throw error;

    return { ok: true, postId, hearted: true };
  }

  async removeHeart(userId: string, activityId: string, postId: string) {
    await this.assertPostOnActivity(activityId, postId);

    const { error } = await this.supabase.admin
      .from('activity_hearts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;

    return { ok: true, postId, hearted: false };
  }

  private async assertPostOnActivity(activityId: string, postId: string) {
    const { data, error } = await this.supabase.admin
      .from('activity_posts')
      .select('id')
      .eq('id', postId)
      .eq('activity_id', activityId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Post not found on this activity');
  }
}
