// ============================================
// WHAT THIS FILE DOES (plain English):
// Creates co-op polls, lists polls a signed-in person may see, and records one
// vote per person. Poll text is returned to the app but never put in analytics
// or notification payloads. The service-role database client bypasses RLS, so
// this file repeats the audience check before returning or changing a poll.
// ============================================
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Tier } from "@bridger/shared";
import { SupabaseService } from "../supabase/supabase.service";

const TIER_RANK: Record<Tier, number> = {
  none: 0,
  acquaintance: 1,
  friend: 2,
  close: 3,
};

type PollAudience = "close" | "friend" | "acquaintance";

type CreatePollBody = {
  question?: string;
  prompt?: string;
  options?: string[];
  audience?: string;
};

@Injectable()
export class PollsService {
  constructor(private readonly supabase: SupabaseService) {}

  // --- CREATE: validate first, then save the poll and its two-to-four choices. ---
  async create(userId: string, body: CreatePollBody) {
    const question = (body.question ?? body.prompt ?? "").trim();
    const options = Array.isArray(body.options)
      ? body.options.map((option) => option.trim()).filter(Boolean)
      : [];
    const audience = this.normalizeAudience(body.audience);

    if (!question || question.length > 240) {
      throw new BadRequestException(
        "Poll question must be 1 to 240 characters",
      );
    }
    if (options.length < 2 || options.length > 4) {
      throw new BadRequestException("Polls need 2 to 4 options");
    }
    if (options.some((option) => option.length > 80)) {
      throw new BadRequestException(
        "Poll options must be 80 characters or less",
      );
    }
    if (
      new Set(options.map((option) => option.toLocaleLowerCase())).size !==
      options.length
    ) {
      throw new BadRequestException("Poll options must be different");
    }

    const closesAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: poll, error } = await this.supabase.admin
      .from("polls")
      .insert({
        author_id: userId,
        question,
        closes_at: closesAt,
        audience_tier: audience,
      } as never)
      .select("*")
      .single();
    if (error) throw error;

    const { data: optionRows, error: optionError } = await this.supabase.admin
      .from("poll_options")
      .insert(options.map((label) => ({ poll_id: poll.id, label })))
      .select("id, label, poll_id");
    if (optionError) {
      // Keep a partial create from leaving a poll with no choices.
      await this.supabase.admin.from("polls").delete().eq("id", poll.id);
      throw optionError;
    }

    await this.notifyAudience(userId, audience, poll.id);
    return this.toPoll(poll, optionRows ?? [], []);
  }

  // --- LIST: "mine" is authored polls; the main list also includes visible circles. ---
  async list(userId: string, mineOnly = false) {
    const { data: polls, error } = await this.supabase.admin
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const visible = mineOnly
      ? (polls ?? []).filter((poll) => poll.author_id === userId)
      : await this.filterVisible(userId, polls ?? []);
    if (visible.length === 0) return [];

    const pollIds = visible.map((poll) => poll.id);
    const [
      { data: options, error: optionError },
      { data: votes, error: voteError },
    ] = await Promise.all([
      this.supabase.admin
        .from("poll_options")
        .select("id, label, poll_id")
        .in("poll_id", pollIds),
      this.supabase.admin
        .from("poll_votes")
        .select("poll_id, option_id, user_id")
        .in("poll_id", pollIds),
    ]);
    if (optionError) throw optionError;
    if (voteError) throw voteError;

    return visible.map((poll) =>
      this.toPoll(
        poll,
        (options ?? []).filter((option) => option.poll_id === poll.id),
        (votes ?? []).filter((vote) => vote.poll_id === poll.id),
        userId,
      ),
    );
  }

  // --- VOTE: the primary key enforces one vote per person per poll. ---
  async vote(userId: string, pollId: string, optionId: string) {
    if (!optionId) throw new BadRequestException("Choose a poll option");
    const poll = await this.requireVisiblePoll(userId, pollId);
    if (poll.closes_at && new Date(poll.closes_at).getTime() <= Date.now()) {
      throw new BadRequestException("This poll is closed");
    }

    const { data: option, error: optionError } = await this.supabase.admin
      .from("poll_options")
      .select("id")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .maybeSingle();
    if (optionError) throw optionError;
    if (!option)
      throw new BadRequestException("That option does not belong to this poll");

    const { error } = await this.supabase.admin.from("poll_votes").insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    });
    if (error?.code === "23505") {
      throw new ConflictException("You already voted in this poll");
    }
    if (error) throw error;

    if (poll.author_id !== userId) {
      const { error: notificationError } = await this.supabase.admin
        .from("notifications")
        .insert({
          user_id: poll.author_id,
          kind: "poll_activity",
          payload: {
            action: "answered",
            poll_id: pollId,
            from: userId,
          } as never,
        });
      if (notificationError) throw notificationError;
    }

    return { ok: true };
  }

  // --- PRIVACY: decide visibility from the author's tier for this viewer. ---
  private async filterVisible(userId: string, polls: any[]) {
    const authorIds = Array.from(
      new Set(
        polls
          .filter((poll) => poll.author_id !== userId)
          .map((poll) => poll.author_id),
      ),
    );
    if (authorIds.length === 0) return polls;

    const { data: tiers, error } = await this.supabase.admin
      .from("tiers")
      .select("user_id, tier")
      .in("user_id", authorIds)
      .eq("other_id", userId);
    if (error) throw error;

    const byAuthor = new Map(
      (tiers ?? []).map((row) => [row.user_id, row.tier as Tier]),
    );
    return polls.filter((poll) => {
      if (poll.author_id === userId) return true;
      const viewerTier = byAuthor.get(poll.author_id);
      return (
        !!viewerTier &&
        TIER_RANK[viewerTier] >= TIER_RANK[poll.audience_tier as PollAudience]
      );
    });
  }

  private async requireVisiblePoll(userId: string, pollId: string) {
    const { data, error } = await this.supabase.admin
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException("Poll not found");
    const [visible] = await this.filterVisible(userId, [data]);
    if (!visible) throw new NotFoundException("Poll not found");
    return visible;
  }

  // --- NOTIFICATIONS: tell the chosen circle a new poll is ready to answer. ---
  private async notifyAudience(
    authorId: string,
    audience: PollAudience,
    pollId: string,
  ): Promise<void> {
    const { data: tiers, error } = await this.supabase.admin
      .from("tiers")
      .select("other_id, tier")
      .eq("user_id", authorId);
    if (error) throw error;

    const recipients = (tiers ?? [])
      .filter((row) => TIER_RANK[row.tier as Tier] >= TIER_RANK[audience])
      .map((row) => row.other_id);
    if (recipients.length === 0) return;

    const { error: notificationError } = await this.supabase.admin
      .from("notifications")
      .insert(
        recipients.map((userId) => ({
          user_id: userId,
          kind: "poll_activity",
          payload: {
            action: "created",
            poll_id: pollId,
            from: authorId,
          } as never,
        })),
      );
    if (notificationError) throw notificationError;
  }

  private normalizeAudience(audience?: string): PollAudience {
    if (audience === "close") return "close";
    if (audience === "everyone" || audience === "acquaintance")
      return "acquaintance";
    return "friend";
  }

  // --- RESPONSE SHAPE: counts help answer the poll; no public voter list is exposed. ---
  private toPoll(
    poll: any,
    options: Array<{ id: string; label: string; poll_id: string }>,
    votes: Array<{ option_id: string; user_id: string }>,
    userId?: string,
  ) {
    const myVote = userId
      ? votes.find((vote) => vote.user_id === userId)?.option_id
      : undefined;
    return {
      id: poll.id,
      authorId: poll.author_id,
      question: poll.question,
      audience: poll.audience_tier,
      closesAt: poll.closes_at,
      createdAt: poll.created_at,
      myVote,
      options: options.map((option) => ({
        id: option.id,
        label: option.label,
        votes: votes.filter((vote) => vote.option_id === option.id).length,
      })),
    };
  }
}
