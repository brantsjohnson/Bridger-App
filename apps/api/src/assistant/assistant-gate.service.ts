// ============================================
// WHAT THIS FILE DOES (plain English):
// Decides who may even see the Assistant, and who may use it right now.
// Three gates: admin access flag, co-op (when required), personal opt-in.
//
// --- SECURITY ---
// Non-eligible users get no feature leak beyond a hidden Settings row.
// ============================================
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_ASSISTANT_ADMIN,
  type AssistantAdminConfig,
  type AssistantAccess,
  type AssistantToolName
} from '@bridger/shared';
import { CoopService } from '../coop/coop.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AssistantGateService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly coop: CoopService,
    private readonly config: ConfigService
  ) {}

  async getAdminConfig(): Promise<AssistantAdminConfig> {
    const { data } = await this.supabase.admin
      .from('admin_config')
      .select('assistant')
      .limit(1)
      .maybeSingle();
    return mergeAssistantConfig(data?.assistant);
  }

  async putAdminConfig(
    patch: Partial<AssistantAdminConfig>
  ): Promise<AssistantAdminConfig> {
    const current = await this.getAdminConfig();
    const next: AssistantAdminConfig = {
      access: patch.access ?? current.access,
      tools: { ...current.tools, ...(patch.tools ?? {}) },
      allowlist: patch.allowlist ?? current.allowlist
    };
    const { data: row } = await this.supabase.admin
      .from('admin_config')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (row?.id) {
      await this.supabase.admin
        .from('admin_config')
        .update({ assistant: next as never })
        .eq('id', row.id);
    } else {
      await this.supabase.admin.from('admin_config').insert({
        assistant: next as never
      });
    }
    return next;
  }

  async isEligible(userId: string): Promise<boolean> {
    const cfg = await this.getAdminConfig();
    return this.checkAccess(userId, cfg.access, cfg.allowlist);
  }

  async isEnabled(userId: string): Promise<boolean> {
    const { data } = await this.supabase.admin
      .from('user_settings')
      .select('assistant_enabled')
      .eq('user_id', userId)
      .maybeSingle();
    return Boolean(data?.assistant_enabled);
  }

  /** Eligible and personally opted in. */
  async canUse(userId: string): Promise<boolean> {
    return (await this.isEligible(userId)) && (await this.isEnabled(userId));
  }

  async isToolEnabled(tool: AssistantToolName): Promise<boolean> {
    const cfg = await this.getAdminConfig();
    return Boolean(cfg.tools[tool]);
  }

  async visibility(userId: string): Promise<{
    assistantEligible: boolean;
    assistantEnabled: boolean;
    assistantVisible: boolean;
  }> {
    const eligible = await this.isEligible(userId);
    const enabled = await this.isEnabled(userId);
    return {
      assistantEligible: eligible,
      assistantEnabled: enabled,
      // Show the quiet Settings row when eligible, or if they somehow still have it on.
      assistantVisible: eligible || enabled
    };
  }

  private async checkAccess(
    userId: string,
    access: AssistantAccess,
    allowlist: string[]
  ): Promise<boolean> {
    if (access === 'off') return false;
    if (access === 'everyone') return true;
    if (access === 'allowlist') return allowlist.includes(userId);
    if (access === 'coop') return this.coop.isMember(userId);
    if (access === 'founder_only') {
      const founders = (this.config.get<string>('ASSISTANT_FOUNDER_USER_IDS') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (founders.includes(userId)) return true;
      // LOCALHOST: empty founder list + non-production (or ASSISTANT_DEV_OPEN=1)
      // opens the gate so you can try Assistant without pasting your UUID.
      // Production with an empty list stays closed (safe default).
      const devOpen =
        this.config.get<string>('ASSISTANT_DEV_OPEN') === '1' ||
        process.env.NODE_ENV !== 'production';
      if (devOpen && !founders.length) return true;
      // Fall back: co-op admin emails from env (same people who run admin).
      const adminEmails = (this.config.get<string>('COOP_ADMIN_EMAILS') ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (!adminEmails.length && !founders.length) {
        return false;
      }
      const { data: identity } = await this.supabase.admin
        .from('user_identity')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      void identity;
      // Match auth email via admin users if available.
      const { data: authUser } = await this.supabase.admin.auth.admin.getUserById(
        userId
      );
      const email = authUser?.user?.email?.toLowerCase();
      if (email && adminEmails.includes(email)) return true;
      return false;
    }
    return false;
  }
}

function mergeAssistantConfig(raw: unknown): AssistantAdminConfig {
  const base = DEFAULT_ASSISTANT_ADMIN;
  if (!raw || typeof raw !== 'object') return { ...base, tools: { ...base.tools } };
  const obj = raw as Partial<AssistantAdminConfig>;
  return {
    access: obj.access ?? base.access,
    tools: { ...base.tools, ...(obj.tools ?? {}) },
    allowlist: Array.isArray(obj.allowlist) ? obj.allowlist : []
  };
}
