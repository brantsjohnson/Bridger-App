// ============================================
// WHAT THIS FILE DOES (plain English):
// The Co-op Portal on the server: ideas (what we build), mission support,
// open books (economics), volunteer roles, dues preference votes, and beta
// voting. Anyone can read; only members can write.
//
// PRIVACY: idea emails never include more than title + opaque ids. Resend is
// best-effort — missing API key skips send without failing the write.
// ============================================
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { CoopService } from './coop.service';

const IDEA_AUTO_APPROVE_MS = 48 * 60 * 60 * 1000;
const BETA_SALT = 'bridger-beta-salt';

@Injectable()
export class PortalService {
  private readonly log = new Logger(PortalService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly coop: CoopService,
    private readonly config: ConfigService
  ) {}

  private hashCode(code: string): string {
    return createHash('sha256')
      .update(`${BETA_SALT}:${code.trim()}`)
      .digest('hex');
  }

  /** Lazy: approve submitted ideas older than 48h. */
  private async lazyApproveIdeas(): Promise<void> {
    const cutoff = new Date(Date.now() - IDEA_AUTO_APPROVE_MS).toISOString();
    await this.supabase.admin
      .from('coop_ideas')
      .update({
        status: 'community_discussion',
        public: true,
        approved_at: new Date().toISOString()
      } as never)
      .eq('status', 'submitted')
      .eq('public', false)
      .lt('created_at', cutoff);
  }

  private async sendReviewEmail(ideaTitle: string, authorId: string): Promise<void> {
    const key = this.config.get<string>('RESEND_API_KEY');
    const to =
      this.config.get<string>('COOP_IDEA_REVIEW_EMAIL') ?? 'hello@bridger.social';
    if (!key) {
      this.log.warn('RESEND_API_KEY missing — skipped idea review email');
      return;
    }
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Bridger Co-op <onboarding@resend.dev>',
          to: [to],
          subject: 'New co-op idea submitted',
          text: `A member submitted an idea.\nTitle: ${ideaTitle}\nAuthor: ${authorId}\nAuto-approves in 48h if untouched.`
        })
      });
    } catch (e) {
      this.log.warn(`Idea review email failed: ${String(e)}`);
    }
  }

  async overview(userId?: string) {
    const member = userId ? await this.coop.isMember(userId) : false;
    const members = await this.coop.memberCount();
    const membership = userId
      ? await this.coop.getMembership(userId)
      : { member: false, dues: '$24/year', cancelAtPeriodEnd: false };
    return {
      member,
      members,
      dues: '$24/year',
      since: membership.since,
      renews: membership.renews,
      cancelAtPeriodEnd: membership.cancelAtPeriodEnd ?? false
    };
  }

  /** Portal DTO: no tallies, no author ids (privacy + no vanity metrics). */
  private mapIdeaPublic(
    i: {
      id: string;
      title: string;
      problem: string | null;
      category: string;
      status: string;
      evidence: string | null;
      drawbacks: string | null;
      urgency: string | null;
      impact: string | null;
      cost_guess: string | null;
      funding_model: string | null;
      created_at: string;
    },
    supportedByMe: boolean
  ) {
    return {
      id: i.id,
      title: i.title,
      body: i.problem ?? undefined,
      category: i.category,
      status: i.status,
      supportedByMe,
      createdAt: i.created_at,
      evidence: i.evidence ?? undefined,
      drawbacks: i.drawbacks ?? undefined,
      urgency: i.urgency ?? undefined,
      impact: i.impact ?? undefined,
      costGuess: i.cost_guess ?? undefined,
      fundingModel: i.funding_model ?? undefined
    };
  }

  async listIdeas(userId?: string) {
    await this.lazyApproveIdeas();
    const { data, error } = await this.supabase.admin
      .from('coop_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const rows = (data ?? []).filter(
      (i) => i.public || (userId && i.author_id === userId)
    );

    let supported = new Set<string>();
    if (userId && rows.length) {
      const { data: supports } = await this.supabase.admin
        .from('coop_idea_supports')
        .select('idea_id')
        .eq('user_id', userId)
        .in(
          'idea_id',
          rows.map((r) => r.id)
        );
      supported = new Set((supports ?? []).map((s) => s.idea_id));
    }

    return rows.map((i) => this.mapIdeaPublic(i, supported.has(i.id)));
  }

  async createIdea(
    userId: string,
    body: {
      title: string;
      problem?: string;
      category?: string;
      evidence?: string;
      drawbacks?: string;
      urgency?: string;
      impact?: string;
      costGuess?: string;
      fundingModel?: string;
    }
  ) {
    const title = (body.title ?? '').trim();
    if (!title) throw new BadRequestException('Title required');
    const { data, error } = await this.supabase.admin
      .from('coop_ideas')
      .insert({
        author_id: userId,
        title: title.slice(0, 200),
        problem: body.problem?.trim() || null,
        category: body.category?.trim() || 'other',
        evidence: body.evidence?.trim() || null,
        drawbacks: body.drawbacks?.trim() || null,
        urgency: body.urgency?.trim() || null,
        impact: body.impact?.trim() || null,
        cost_guess: body.costGuess?.trim() || null,
        funding_model: body.fundingModel?.trim() || null,
        status: 'submitted',
        public: false
      })
      .select('*')
      .single();
    if (error) throw error;
    void this.sendReviewEmail(data.title, userId);
    return this.mapIdeaPublic(data, false);
  }

  async getIdea(id: string, userId?: string) {
    await this.lazyApproveIdeas();
    const { data, error } = await this.supabase.admin
      .from('coop_ideas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Idea not found');
    if (!data.public && data.author_id !== userId) {
      throw new NotFoundException('Idea not found');
    }
    let supportedByMe = false;
    if (userId) {
      const { data: s } = await this.supabase.admin
        .from('coop_idea_supports')
        .select('idea_id')
        .eq('idea_id', id)
        .eq('user_id', userId)
        .maybeSingle();
      supportedByMe = !!s;
    }
    const { data: comments } = await this.supabase.admin
      .from('coop_idea_comments')
      .select('id, body, created_at')
      .eq('idea_id', id)
      .order('created_at', { ascending: true });
    return {
      ...this.mapIdeaPublic(data, supportedByMe),
      comments: (comments ?? []).map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        authorLabel: 'A member'
      }))
    };
  }

  async toggleSupport(userId: string, ideaId: string) {
    const { data: existing } = await this.supabase.admin
      .from('coop_idea_supports')
      .select('idea_id')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await this.supabase.admin
        .from('coop_idea_supports')
        .delete()
        .eq('idea_id', ideaId)
        .eq('user_id', userId);
      const { data: idea } = await this.supabase.admin
        .from('coop_ideas')
        .select('support_count')
        .eq('id', ideaId)
        .single();
      const next = Math.max(0, (idea?.support_count ?? 1) - 1);
      await this.supabase.admin
        .from('coop_ideas')
        .update({ support_count: next })
        .eq('id', ideaId);
      return { supported: false };
    }

    await this.supabase.admin.from('coop_idea_supports').insert({
      idea_id: ideaId,
      user_id: userId
    });
    const { data: idea } = await this.supabase.admin
      .from('coop_ideas')
      .select('support_count')
      .eq('id', ideaId)
      .single();
    const next = (idea?.support_count ?? 0) + 1;
    await this.supabase.admin
      .from('coop_ideas')
      .update({ support_count: next })
      .eq('id', ideaId);
    return { supported: true };
  }

  async addComment(userId: string, ideaId: string, body: string) {
    const text = (body ?? '').trim();
    if (!text) throw new BadRequestException('Comment required');
    const { data, error } = await this.supabase.admin
      .from('coop_idea_comments')
      .insert({
        idea_id: ideaId,
        author_id: userId,
        body: text.slice(0, 2000)
      })
      .select('id, body, created_at')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      body: data.body,
      createdAt: data.created_at,
      authorLabel: 'A member'
    };
  }

  async listMission(userId?: string) {
    const { data, error } = await this.supabase.admin
      .from('coop_mission_principles')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    let supported = new Set<string>();
    if (userId) {
      const { data: s } = await this.supabase.admin
        .from('coop_mission_supports')
        .select('principle_id')
        .eq('user_id', userId);
      supported = new Set((s ?? []).map((x) => x.principle_id));
    }
    return (data ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      body: p.body,
      supportedByMe: supported.has(p.id)
    }));
  }

  async toggleMission(userId: string, principleId: string) {
    const { data: existing } = await this.supabase.admin
      .from('coop_mission_supports')
      .select('principle_id')
      .eq('principle_id', principleId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) {
      await this.supabase.admin
        .from('coop_mission_supports')
        .delete()
        .eq('principle_id', principleId)
        .eq('user_id', userId);
      return { supported: false };
    }
    await this.supabase.admin.from('coop_mission_supports').insert({
      principle_id: principleId,
      user_id: userId
    });
    return { supported: true };
  }

  async listEconomics() {
    const { data, error } = await this.supabase.admin
      .from('coop_economics_assumptions')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      category: r.category,
      label: r.label,
      monthlyCents: r.monthly_cents,
      notes: r.notes ?? undefined
    }));
  }

  async listRoles() {
    const { data, error } = await this.supabase.admin
      .from('coop_roles')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      responsibilities: r.responsibilities ?? undefined,
      hoursWeek: r.hours_week ?? undefined,
      risks: r.risks ?? undefined
    }));
  }

  /** Admin-only tallies (member route gated by AdminGuard). Legacy dues preference poll. */
  async duesSummary(userId?: string) {
    const { data, error } = await this.supabase.admin
      .from('coop_dues_votes')
      .select('amount_cents');
    if (error) throw error;
    const votes = data ?? [];
    const buckets: Record<number, number> = {};
    for (const v of votes) {
      buckets[v.amount_cents] = (buckets[v.amount_cents] ?? 0) + 1;
    }
    let myVote: number | undefined;
    if (userId) {
      const { data: mine } = await this.supabase.admin
        .from('coop_dues_votes')
        .select('amount_cents')
        .eq('user_id', userId)
        .maybeSingle();
      myVote = mine?.amount_cents;
    }
    return {
      displayDues: '$24/year',
      suggestedCents: 2400,
      histogram: Object.entries(buckets).map(([cents, count]) => ({
        amountCents: Number(cents),
        count
      })),
      myVote
    };
  }

  async voteDues(userId: string, amountCents: number) {
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      throw new BadRequestException('Invalid amount');
    }
    const { error } = await this.supabase.admin.from('coop_dues_votes').upsert({
      user_id: userId,
      amount_cents: Math.floor(amountCents)
    });
    if (error) throw error;
    return this.duesSummary(userId);
  }

  async betaCurrent(userId?: string) {
    const { data, error } = await this.supabase.admin
      .from('coop_beta_versions')
      .select(
        'id, label, release_notes, known_issues, unfinished, test_url, status, round_ends_at'
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    let myVote: 'yes' | 'no' | 'extend' | undefined;
    let unlocked = false;
    if (userId) {
      const [{ data: unlock }, { data: vote }] = await Promise.all([
        this.supabase.admin
          .from('coop_beta_unlocks')
          .select('version_id')
          .eq('version_id', data.id)
          .eq('user_id', userId)
          .maybeSingle(),
        this.supabase.admin
          .from('coop_beta_votes')
          .select('choice')
          .eq('version_id', data.id)
          .eq('user_id', userId)
          .maybeSingle()
      ]);
      unlocked = !!unlock;
      if (vote?.choice === 'yes' || vote?.choice === 'no' || vote?.choice === 'extend') {
        myVote = vote.choice;
      }
    }

    return {
      id: data.id,
      label: data.label,
      releaseNotes: data.release_notes ?? undefined,
      knownIssues: data.known_issues ?? undefined,
      unfinished: data.unfinished ?? undefined,
      testUrl: data.test_url ?? undefined,
      status: data.status,
      roundEndsAt: data.round_ends_at ?? undefined,
      unlocked,
      myVote
    };
  }

  async betaVerify(userId: string, accessCode: string) {
    const current = await this.betaCurrent();
    if (!current) throw new NotFoundException('No open beta');
    const { data: ver } = await this.supabase.admin
      .from('coop_beta_versions')
      .select('id, access_code_hash')
      .eq('id', current.id)
      .single();
    if (!ver || ver.access_code_hash !== this.hashCode(accessCode)) {
      throw new ForbiddenException('Invalid access code');
    }
    await this.supabase.admin.from('coop_beta_unlocks').upsert({
      version_id: ver.id,
      user_id: userId
    });
    return { ok: true };
  }

  async betaVote(userId: string, choice: 'yes' | 'no' | 'extend') {
    const current = await this.betaCurrent();
    if (!current) throw new NotFoundException('No open beta');
    const { data: unlock } = await this.supabase.admin
      .from('coop_beta_unlocks')
      .select('version_id')
      .eq('version_id', current.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!unlock) {
      throw new ForbiddenException('Verify the beta access code first');
    }
    if (!['yes', 'no', 'extend'].includes(choice)) {
      throw new BadRequestException('Invalid choice');
    }
    await this.supabase.admin.from('coop_beta_votes').upsert({
      version_id: current.id,
      user_id: userId,
      choice
    });
    return { ok: true, myVote: choice };
  }

  async joinWaitlist(
    userId: string | undefined,
    body: { interest?: string }
  ) {
    await this.supabase.admin.from('coop_waitlist').insert({
      user_id: userId ?? null,
      interest: body.interest ?? 'interested'
    });
    return { ok: true };
  }

  async participation(userId: string) {
    const [{ count: ideas }, { count: supports }, { count: dues }] =
      await Promise.all([
        this.supabase.admin
          .from('coop_ideas')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId),
        this.supabase.admin
          .from('coop_idea_supports')
          .select('idea_id', { count: 'exact', head: true })
          .eq('user_id', userId),
        this.supabase.admin
          .from('coop_dues_votes')
          .select('user_id', { count: 'exact', head: true })
          .eq('user_id', userId)
      ]);
    return {
      ideas: ideas ?? 0,
      supports: supports ?? 0,
      duesVoted: (dues ?? 0) > 0
    };
  }

  async adminSetIdeaStatus(
    ideaId: string,
    status: string,
    makePublic?: boolean
  ) {
    const patch: Record<string, unknown> = { status };
    if (makePublic || status === 'community_discussion' || status === 'planned') {
      patch.public = true;
      patch.approved_at = new Date().toISOString();
    }
    if (status === 'declined') {
      patch.public = false;
    }
    const { error } = await this.supabase.admin
      .from('coop_ideas')
      .update(patch as never)
      .eq('id', ideaId);
    if (error) throw error;
    return { ok: true };
  }

  // --- Admin CRM (tallies + opaque author ids OK here) ---

  async adminListIdeas(status?: string) {
    await this.lazyApproveIdeas();
    let q = this.supabase.admin
      .from('coop_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (status === 'pending') {
      q = q.in('status', ['submitted', 'under_review', 'needs_more_detail']);
    } else if (status) {
      q = q.eq('status', status);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((i) => ({
      id: i.id,
      title: i.title,
      body: i.problem ?? undefined,
      category: i.category,
      status: i.status,
      supportCount: i.support_count,
      authorId: i.author_id,
      public: i.public,
      createdAt: i.created_at
    }));
  }

  async adminGetIdea(id: string) {
    const { data, error } = await this.supabase.admin
      .from('coop_ideas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Idea not found');
    const { data: comments } = await this.supabase.admin
      .from('coop_idea_comments')
      .select('id, author_id, body, created_at')
      .eq('idea_id', id)
      .order('created_at', { ascending: true });
    return {
      id: data.id,
      title: data.title,
      body: data.problem ?? undefined,
      evidence: data.evidence ?? undefined,
      drawbacks: data.drawbacks ?? undefined,
      category: data.category,
      status: data.status,
      supportCount: data.support_count,
      authorId: data.author_id,
      public: data.public,
      createdAt: data.created_at,
      comments: (comments ?? []).map((c) => ({
        id: c.id,
        authorId: c.author_id,
        body: c.body,
        createdAt: c.created_at
      }))
    };
  }

  async adminVotesSummary() {
    const [{ data: ideas }, { data: betaVotes }, { data: mission }, beta] =
      await Promise.all([
        this.supabase.admin
          .from('coop_ideas')
          .select('id, title, support_count, status')
          .order('support_count', { ascending: false })
          .limit(50),
        this.supabase.admin.from('coop_beta_votes').select('choice, version_id'),
        this.supabase.admin
          .from('coop_mission_supports')
          .select('principle_id'),
        this.betaCurrent()
      ]);

    const betaTally = { yes: 0, no: 0, extend: 0 };
    for (const v of betaVotes ?? []) {
      if (v.choice === 'yes' || v.choice === 'no' || v.choice === 'extend') {
        betaTally[v.choice] += 1;
      }
    }

    const missionCounts: Record<string, number> = {};
    for (const m of mission ?? []) {
      missionCounts[m.principle_id] =
        (missionCounts[m.principle_id] ?? 0) + 1;
    }

    const { data: principles } = await this.supabase.admin
      .from('coop_mission_principles')
      .select('id, title')
      .order('sort_order', { ascending: true });

    const { count: pendingCount } = await this.supabase.admin
      .from('coop_ideas')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'under_review', 'needs_more_detail']);

    return {
      pendingIdeas: pendingCount ?? 0,
      topIdeas: (ideas ?? []).map((i) => ({
        id: i.id,
        title: i.title,
        supportCount: i.support_count,
        status: i.status
      })),
      beta: beta
        ? { versionId: beta.id, label: beta.label, tally: betaTally }
        : null,
      missionSupportCounts: (principles ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        count: missionCounts[p.id] ?? 0
      }))
    };
  }

  async adminPendingIdeaCount(): Promise<number> {
    const { count } = await this.supabase.admin
      .from('coop_ideas')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'under_review', 'needs_more_detail']);
    return count ?? 0;
  }
}
